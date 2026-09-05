/**
 * Heritage Acupuncture & TCM - Practitioner & Owner Portal Controller
 * Powered by BookingAPI
 */

(function () {
    'use strict';

    // State
    const state = {
        filterStatus: 'all',
        filterDateRange: 'all',
        searchQuery: '',
        activeModal: null,
        selectedAptId: null,
        selectedRescheduleSlot: null
    };

    // DOM Elements
    const elements = {
        appointmentsList: document.getElementById('appointmentsList'),
        emptyState: document.getElementById('emptyState'),
        metricToday: document.getElementById('metricToday'),
        metricPending: document.getElementById('metricPending'),
        metricConfirmed: document.getElementById('metricConfirmed'),
        metricCompleted: document.getElementById('metricCompleted'),
        currentDateDisplay: document.getElementById('currentDateDisplay'),
        statusTabs: document.querySelectorAll('.status-tab-btn'),
        searchInput: document.getElementById('searchInput'),
        dateRangeFilter: document.getElementById('dateRangeFilter'),
        toastContainer: document.getElementById('toastContainer'),
        
        // Modals
        clinicalNotesModal: document.getElementById('clinicalNotesModal'),
        rescheduleModal: document.getElementById('rescheduleModal'),
        blockDateModal: document.getElementById('blockDateModal'),
        newAptModal: document.getElementById('newAptModal')
    };

    /**
     * Show temporary toast notification
     */
    function showToast(message, type = 'success') {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    /**
     * Format friendly date string (e.g. "Monday, Oct 14, 2026")
     */
    function formatFriendlyDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-CA', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Refresh metrics cards and tab badges
     */
    function refreshMetrics() {
        const metrics = BookingAPI.getMetrics();
        if (elements.metricToday) elements.metricToday.textContent = metrics.today;
        if (elements.metricPending) elements.metricPending.textContent = metrics.pending;
        if (elements.metricConfirmed) elements.metricConfirmed.textContent = metrics.confirmed;
        if (elements.metricCompleted) elements.metricCompleted.textContent = metrics.completed;

        // Update tab pills
        document.querySelectorAll('.status-tab-btn').forEach(btn => {
            const st = btn.dataset.status;
            const pill = btn.querySelector('.count-pill');
            if (pill) {
                if (st === 'all') pill.textContent = metrics.total;
                else if (st === 'pending') pill.textContent = metrics.pending;
                else if (st === 'confirmed') pill.textContent = metrics.confirmed;
                else if (st === 'completed') pill.textContent = metrics.completed;
            }
        });
    }

    /**
     * Render the list of appointments
     */
    function renderAppointments() {
        refreshMetrics();

        const filter = {
            status: state.filterStatus,
            dateRange: state.filterDateRange,
            search: state.searchQuery
        };

        const appointments = BookingAPI.getAllAppointments(filter);

        if (!appointments || appointments.length === 0) {
            elements.appointmentsList.innerHTML = '';
            elements.emptyState.style.display = 'block';
            return;
        }

        elements.emptyState.style.display = 'none';

        elements.appointmentsList.innerHTML = appointments.map(apt => {
            const isPending = apt.status === 'pending';
            const isConfirmed = apt.status === 'confirmed';
            const isCompleted = apt.status === 'completed';
            const isCancelled = apt.status === 'cancelled';

            const contactMethodLabel = apt.preferredContact === 'sms' ? 'SMS Preferred' : (apt.preferredContact === 'phone' ? 'Phone Call' : 'Email');

            return `
                <article class="appointment-card status-${apt.status}" data-id="${apt.id}">
                    <!-- Date, Time, Status Column -->
                    <div class="apt-col-datetime">
                        <div class="apt-reference">${apt.reference}</div>
                        <div class="apt-date">${formatFriendlyDate(apt.date)}</div>
                        <div class="apt-time-slot">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            ${apt.timeLabel || apt.time} (${apt.durationMinutes || 45} min)
                        </div>
                        <span class="status-badge ${apt.status}">${apt.status}</span>
                    </div>

                    <!-- Patient and Clinical Details -->
                    <div class="apt-col-patient">
                        <div class="apt-patient-header">
                            <span class="apt-patient-name">${apt.patientName}</span>
                            ${apt.isFirstVisit ? '<span class="tag-new-patient">★ New Patient</span>' : ''}
                            <span class="pref-contact-tag">Prefers ${contactMethodLabel}</span>
                        </div>

                        <div class="apt-service-title">
                            ${apt.serviceName}
                        </div>

                        <div class="apt-contacts">
                            <a href="tel:${apt.patientPhone}" class="apt-contact-link" title="Call Patient">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                ${apt.patientPhone}
                            </a>
                            <a href="sms:${apt.patientPhone}" class="apt-contact-link" title="Send SMS">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Text (SMS)
                            </a>
                            ${apt.patientEmail ? `
                                <a href="mailto:${apt.patientEmail}" class="apt-contact-link" title="Send Email">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    ${apt.patientEmail}
                                </a>
                            ` : ''}
                        </div>

                        ${apt.chiefComplaint ? `
                            <div class="apt-chief-complaint">
                                <div class="apt-complaint-label">Patient's Health Note / Concern:</div>
                                “${apt.chiefComplaint}”
                            </div>
                        ` : ''}

                        ${apt.clinicalNotes ? `
                            <div class="apt-clinical-notes-preview">
                                <strong>Clinical Note:</strong> ${apt.clinicalNotes}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Action Buttons -->
                    <div class="apt-col-actions">
                        ${isPending ? `
                            <button class="btn btn-primary btn-sm btn-action-confirm" data-id="${apt.id}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Confirm Request
                            </button>
                            <button class="btn btn-secondary btn-sm btn-action-reschedule" data-id="${apt.id}">
                                Reschedule
                            </button>
                            <button class="btn btn-secondary btn-sm btn-action-cancel" data-id="${apt.id}" style="color: var(--color-danger);">
                                Decline
                            </button>
                        ` : ''}

                        ${isConfirmed ? `
                            <button class="btn btn-primary btn-sm btn-action-complete" data-id="${apt.id}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                Mark Completed
                            </button>
                            <button class="btn btn-secondary btn-sm btn-action-notes" data-id="${apt.id}">
                                ${apt.clinicalNotes ? 'Edit Clinical Note' : '+ Add Clinical Note'}
                            </button>
                            <button class="btn btn-secondary btn-sm btn-action-reschedule" data-id="${apt.id}">
                                Reschedule
                            </button>
                        ` : ''}

                        ${isCompleted ? `
                            <button class="btn btn-secondary btn-sm btn-action-notes" data-id="${apt.id}">
                                View / Edit Notes
                            </button>
                        ` : ''}

                        ${isCancelled ? `
                            <button class="btn btn-secondary btn-sm btn-action-reopen" data-id="${apt.id}">
                                Reopen Booking
                            </button>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    /**
     * Setup Event Listeners
     */
    function initListeners() {
        // Status Tabs
        elements.statusTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.statusTabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.filterStatus = btn.dataset.status;
                renderAppointments();
            });
        });

        // Search Input
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                renderAppointments();
            });
        }

        // Date Range Selector
        if (elements.dateRangeFilter) {
            elements.dateRangeFilter.addEventListener('change', (e) => {
                state.filterDateRange = e.target.value;
                renderAppointments();
            });
        }

        // Delegate Appointment Card Actions
        if (elements.appointmentsList) {
            elements.appointmentsList.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                const id = target.dataset.id;
                if (!id) return;

                if (target.classList.contains('btn-action-confirm')) {
                    BookingAPI.updateStatus(id, 'confirmed');
                    showToast('Appointment confirmed! Patient notified.');
                    renderAppointments();
                } else if (target.classList.contains('btn-action-complete')) {
                    BookingAPI.updateStatus(id, 'completed');
                    showToast('Appointment marked as completed.');
                    renderAppointments();
                } else if (target.classList.contains('btn-action-cancel')) {
                    if (confirm('Are you sure you want to decline / cancel this appointment?')) {
                        BookingAPI.updateStatus(id, 'cancelled');
                        showToast('Appointment cancelled.');
                        renderAppointments();
                    }
                } else if (target.classList.contains('btn-action-reopen')) {
                    BookingAPI.updateStatus(id, 'pending');
                    showToast('Appointment reopened as pending.');
                    renderAppointments();
                } else if (target.classList.contains('btn-action-notes')) {
                    openClinicalNotesModal(id);
                } else if (target.classList.contains('btn-action-reschedule')) {
                    openRescheduleModal(id);
                }
            });
        }

        // Open Block Date Modal
        const btnOpenBlockDate = document.getElementById('btnOpenBlockDate');
        if (btnOpenBlockDate) {
            btnOpenBlockDate.addEventListener('click', openBlockDateModal);
        }

        // Open Walk-in Modal
        const btnOpenWalkIn = document.getElementById('btnOpenWalkIn');
        if (btnOpenWalkIn) {
            btnOpenWalkIn.addEventListener('click', openWalkInModal);
        }

        // Reset Demo Data
        const btnResetDemo = document.getElementById('btnResetDemo');
        if (btnResetDemo) {
            btnResetDemo.addEventListener('click', () => {
                if (confirm('Reset appointments and blocked dates to clean demonstration dataset?')) {
                    BookingAPI.resetToDemoData();
                    showToast('Demo dataset restored.');
                    renderAppointments();
                }
            });
        }

        // Modal Close Buttons
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.closest('.modal-close-btn') || e.target.closest('.btn-close-modal')) {
                    closeModal(modal);
                }
            });
        });

        // Clinical Notes Form Submit
        const clinicalNotesForm = document.getElementById('clinicalNotesForm');
        if (clinicalNotesForm) {
            clinicalNotesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const notes = document.getElementById('modalClinicalNotes').value;
                const internal = document.getElementById('modalInternalNotes').value;
                if (state.selectedAptId) {
                    BookingAPI.saveClinicalNotes(state.selectedAptId, notes, internal);
                    showToast('Clinical notes saved securely.');
                    closeModal(elements.clinicalNotesModal);
                    renderAppointments();
                }
            });
        }

        // Reschedule Form Submit
        const rescheduleForm = document.getElementById('rescheduleForm');
        if (rescheduleForm) {
            rescheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newDate = document.getElementById('rescheduleDate').value;
                const newTime = state.selectedRescheduleSlot;
                if (!newDate || !newTime) {
                    alert('Please select both a date and an available time slot.');
                    return;
                }
                try {
                    BookingAPI.reschedule(state.selectedAptId, newDate, newTime);
                    showToast(`Appointment rescheduled to ${newDate} at ${newTime}`);
                    closeModal(elements.rescheduleModal);
                    renderAppointments();
                } catch (err) {
                    alert(err.message || 'Failed to reschedule.');
                }
            });
        }

        // Reschedule Date Input change -> refresh slot grid
        const rescheduleDateInput = document.getElementById('rescheduleDate');
        if (rescheduleDateInput) {
            rescheduleDateInput.addEventListener('change', () => {
                updateRescheduleSlots(rescheduleDateInput.value);
            });
        }

        // Block Date Form Submit
        const blockDateForm = document.getElementById('blockDateForm');
        if (blockDateForm) {
            blockDateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const dateVal = document.getElementById('blockDateInput').value;
                const reasonVal = document.getElementById('blockReasonInput').value;
                if (!dateVal) return;
                BookingAPI.addBlockedDate(dateVal, reasonVal);
                showToast(`Clinic date ${dateVal} blocked.`);
                renderBlockedDatesList();
                blockDateForm.reset();
                renderAppointments();
            });
        }

        // Walk-in Form Submit
        const newAptForm = document.getElementById('newAptForm');
        if (newAptForm) {
            newAptForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('walkinName').value;
                const phone = document.getElementById('walkinPhone').value;
                const email = document.getElementById('walkinEmail').value;
                const service = document.getElementById('walkinService').value;
                const date = document.getElementById('walkinDate').value;
                const time = document.getElementById('walkinTime').value;
                const notes = document.getElementById('walkinNotes').value;

                try {
                    BookingAPI.createAppointment({
                        patientName: name,
                        patientPhone: phone,
                        patientEmail: email,
                        service: service,
                        date: date,
                        time: time,
                        chiefComplaint: notes,
                        preferredContact: 'phone',
                        isFirstVisit: true
                    });
                    showToast('New appointment created!');
                    closeModal(elements.newAptModal);
                    newAptForm.reset();
                    renderAppointments();
                } catch (err) {
                    alert(err.message || 'Error booking appointment');
                }
            });
        }

        // Live sync across tabs / windows
        window.addEventListener('storage', () => {
            renderAppointments();
        });
        window.addEventListener('heritage_appointment_created', () => {
            showToast('New online booking received!');
            renderAppointments();
        });
    }

    /**
     * Open Clinical Notes Modal
     */
    function openClinicalNotesModal(id) {
        state.selectedAptId = id;
        const apt = BookingAPI.getAppointmentById(id);
        if (!apt) return;

        document.getElementById('modalNotesPatientName').textContent = apt.patientName;
        document.getElementById('modalNotesRef').textContent = `${apt.reference} • ${apt.serviceName}`;
        document.getElementById('modalClinicalNotes').value = apt.clinicalNotes || '';
        document.getElementById('modalInternalNotes').value = apt.internalNotes || '';

        openModal(elements.clinicalNotesModal);
    }

    /**
     * Open Reschedule Modal
     */
    function openRescheduleModal(id) {
        state.selectedAptId = id;
        state.selectedRescheduleSlot = null;
        const apt = BookingAPI.getAppointmentById(id);
        if (!apt) return;

        document.getElementById('reschedulePatientName').textContent = apt.patientName;
        document.getElementById('rescheduleCurrentInfo').textContent = `Currently booked: ${formatFriendlyDate(apt.date)} at ${apt.timeLabel || apt.time}`;
        
        const dateInput = document.getElementById('rescheduleDate');
        dateInput.value = apt.date;
        dateInput.min = new Date().toISOString().split('T')[0];
        
        updateRescheduleSlots(apt.date);
        openModal(elements.rescheduleModal);
    }

    function updateRescheduleSlots(dateStr) {
        const slotGrid = document.getElementById('rescheduleSlotGrid');
        slotGrid.innerHTML = '';
        state.selectedRescheduleSlot = null;

        const openStatus = BookingAPI.isClinicOpen(dateStr);
        if (!openStatus.open) {
            slotGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-danger); font-size: 0.85rem; padding: 0.5rem;">Clinic Closed (${openStatus.reason})</div>`;
            return;
        }

        const slots = BookingAPI.getAvailableSlots(dateStr);
        if (!slots || slots.length === 0) {
            slotGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-text-muted); font-size: 0.85rem;">No open slots on this day.</div>`;
            return;
        }

        slots.forEach(slot => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'modal-slot-btn';
            btn.textContent = slot.label;
            if (!slot.available) {
                btn.disabled = true;
                btn.title = slot.reason;
            } else {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#rescheduleSlotGrid .modal-slot-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    state.selectedRescheduleSlot = slot.time;
                });
            }
            slotGrid.appendChild(btn);
        });
    }

    /**
     * Open Block Date Modal
     */
    function openBlockDateModal() {
        const input = document.getElementById('blockDateInput');
        input.min = new Date().toISOString().split('T')[0];
        renderBlockedDatesList();
        openModal(elements.blockDateModal);
    }

    function renderBlockedDatesList() {
        const container = document.getElementById('blockedDatesList');
        const blocked = BookingAPI.getBlockedDates();
        if (!blocked || blocked.length === 0) {
            container.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem;">No dates currently blocked.</div>';
            return;
        }

        container.innerHTML = blocked.map(b => `
            <div class="blocked-date-item">
                <div>
                    <strong>${formatFriendlyDate(b.date)} (${b.date})</strong>
                    <div style="font-size: 0.78rem; color: var(--color-text-muted);">${b.reason}</div>
                </div>
                <button type="button" class="btn btn-sm btn-secondary btn-remove-block" data-date="${b.date}" style="color: var(--color-danger);">
                    Remove
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-remove-block').forEach(btn => {
            btn.addEventListener('click', () => {
                BookingAPI.removeBlockedDate(btn.dataset.date);
                showToast(`Removed block on ${btn.dataset.date}`);
                renderBlockedDatesList();
                renderAppointments();
            });
        });
    }

    /**
     * Open Walk-in Modal
     */
    function openWalkInModal() {
        const dateInput = document.getElementById('walkinDate');
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.min = new Date().toISOString().split('T')[0];
        openModal(elements.newAptModal);
    }

    function openModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.add('is-open');
        state.activeModal = modalEl;
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('is-open');
        state.activeModal = null;
        document.body.style.overflow = '';
    }

    // Set header date
    function initDateDisplay() {
        if (elements.currentDateDisplay) {
            const today = new Date();
            elements.currentDateDisplay.textContent = today.toLocaleDateString('en-CA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Init
    document.addEventListener('DOMContentLoaded', () => {
        initDateDisplay();
        initListeners();
        renderAppointments();
    });
})();
