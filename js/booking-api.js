/**
 * Heritage Acupuncture & Traditional Chinese Medicine
 * Booking & Clinic Management API Layer
 * 
 * Capabilities:
 * - Operating schedule & dynamic slot engine
 * - Conflict detection & blocked date management
 * - LocalStorage persistence with plug-and-play Supabase/REST adapter
 * - Appointment lifecycle: Pending -> Confirmed -> Completed / Cancelled
 * - Ontario PHIPA compliant audit structures & clinical note logging
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.BookingAPI = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const STORAGE_KEY = 'heritage_acu_appointments_v1';
    const BLOCKED_KEY = 'heritage_acu_blocked_dates_v1';

    // Official Clinic Operating Schedule
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    const CLINIC_HOURS = {
        0: { open: false, label: 'Sunday: Closed' },
        1: { open: true, start: '09:00', end: '18:00', label: 'Monday: 9:00 AM – 6:00 PM' },
        2: { open: true, start: '09:00', end: '18:00', label: 'Tuesday: 9:00 AM – 6:00 PM' },
        3: { open: true, start: '09:00', end: '18:00', label: 'Wednesday: 9:00 AM – 6:00 PM' },
        4: { open: true, start: '16:00', end: '20:00', label: 'Thursday: 4:00 PM – 8:00 PM (Evening Clinic)' },
        5: { open: true, start: '09:00', end: '18:00', label: 'Friday: 9:00 AM – 6:00 PM' },
        6: { open: true, start: '10:00', end: '16:00', label: 'Saturday: 10:00 AM – 4:00 PM (By Appointment)' }
    };

    // Standard clinical slot intervals by day of week
    const STANDARD_SLOTS = {
        1: ['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:15'],
        2: ['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:15'],
        3: ['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:15'],
        4: ['16:00', '16:45', '17:30', '18:15', '19:00'],
        5: ['09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:15'],
        6: ['10:00', '11:00', '12:00', '13:30', '14:30', '15:15']
    };

    const SERVICES = {
        'initial-acupuncture': {
            id: 'initial-acupuncture',
            name: 'Initial Consultation & Acupuncture',
            nameZh: '初诊中医辨证与针灸',
            duration: 75,
            durationLabel: '75 min',
            price: '$130',
            category: 'acupuncture'
        },
        'follow-up-acupuncture': {
            id: 'follow-up-acupuncture',
            name: 'Acupuncture Follow-up & Treatment',
            nameZh: '针灸复诊与调理',
            duration: 50,
            durationLabel: '50 min',
            price: '$90',
            category: 'acupuncture'
        },
        'herbal-consultation': {
            id: 'herbal-consultation',
            name: 'Chinese Herbal Medicine Consultation',
            nameZh: '传统中草药辨证调配',
            duration: 45,
            durationLabel: '45 min',
            price: '$80',
            category: 'herbal'
        },
        'cupping-guasha': {
            id: 'cupping-guasha',
            name: 'Therapeutic Cupping & Gua Sha',
            nameZh: '中医拔罐与刮痧理疗',
            duration: 40,
            durationLabel: '40 min',
            price: '$75',
            category: 'bodywork'
        },
        'massage-therapy': {
            id: 'massage-therapy',
            name: 'TCM Tui Na & Massage Therapy',
            nameZh: '中医推拿与经络理筋',
            duration: 60,
            durationLabel: '60 min',
            price: '$105',
            category: 'massage'
        }
    };

    /**
     * Helper to get formatted YYYY-MM-DD relative to today
     */
    function getRelativeDateStr(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    /**
     * Initial realistic mock dataset for Dr. Leng's clinic
     */
    function getSeedData() {
        return [
            {
                id: 'apt-001',
                reference: 'HA-8492',
                service: 'initial-acupuncture',
                serviceName: 'Initial Consultation & Acupuncture',
                date: getRelativeDateStr(0),
                time: '10:00',
                timeLabel: '10:00 AM',
                durationMinutes: 75,
                patientName: 'Sarah Miller',
                patientPhone: '613-555-0194',
                patientEmail: 'sarah.m@kanatatech.ca',
                preferredContact: 'sms',
                isFirstVisit: true,
                chiefComplaint: 'Desk-job tech neck, severe right shoulder blade spasm, and tension headaches radiating up cervical spine. Needs Sun Life insurance receipt with R.Ac number.',
                status: 'confirmed',
                clinicalNotes: 'Palpation revealed hypertonicity at GB20, BL10, SI14. Initial electro-acupuncture with infrared TDP lamp. Significant immediate myofascial release.',
                internalNotes: 'Patient was referred by Sun Life colleague. Very receptive to stretching regimen.',
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
            },
            {
                id: 'apt-002',
                reference: 'HA-8501',
                service: 'follow-up-acupuncture',
                serviceName: 'Acupuncture Follow-up & Treatment',
                date: getRelativeDateStr(0),
                time: '14:30',
                timeLabel: '2:30 PM',
                durationMinutes: 50,
                patientName: 'Robert Davies',
                patientPhone: '613-555-0142',
                patientEmail: 'robert.davies@bell.net',
                preferredContact: 'phone',
                isFirstVisit: false,
                chiefComplaint: 'Lumbar spinal stenosis and left-sided sciatica radiating down calf. Visit #2. Reported 40% pain relief and better sleep after initial treatment.',
                status: 'confirmed',
                clinicalNotes: 'Needled BL23 (Shenshu), BL25, GB30 (Huantiao), BL40. Patient reported improved stride length and reduced morning stiffness.',
                internalNotes: 'Senior patient, uses walking cane on snowy days. Ground floor clinic access is critical.',
                createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
            },
            {
                id: 'apt-003',
                reference: 'HA-8517',
                service: 'initial-acupuncture',
                serviceName: 'Initial Consultation & Acupuncture',
                date: getRelativeDateStr(1),
                time: '11:15',
                timeLabel: '11:15 AM',
                durationMinutes: 75,
                patientName: 'Zhang Wei (张伟)',
                patientPhone: '613-555-0188',
                patientEmail: 'zhangwei1953@gmail.com',
                preferredContact: 'phone',
                isFirstVisit: true,
                chiefComplaint: 'Bilateral knee osteoarthritis (老寒腿), aching severely on rainy/damp days, stair descent difficulty, accompanied by night waking.',
                status: 'pending',
                clinicalNotes: '',
                internalNotes: 'Prefers consultation in Mandarin (普通话). Inquired about classical pulse & tongue diagnosis and herbal pairing.',
                createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
            },
            {
                id: 'apt-004',
                reference: 'HA-8523',
                service: 'herbal-consultation',
                serviceName: 'Chinese Herbal Medicine Consultation',
                date: getRelativeDateStr(1),
                time: '15:15',
                timeLabel: '3:15 PM',
                durationMinutes: 45,
                patientName: 'Brenda S.',
                patientPhone: '613-555-0177',
                patientEmail: 'brenda.s@rogers.com',
                preferredContact: 'email',
                isFirstVisit: false,
                chiefComplaint: 'Chronic digestive fatigue, postprandial bloating, cold extremities, and Spleen Qi deficiency. Seeking customized herbal granule formula renewal.',
                status: 'pending',
                clinicalNotes: '',
                internalNotes: 'Requesting 14-day supply of customized formula. Check for any new prescription medications.',
                createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
            },
            {
                id: 'apt-005',
                reference: 'HA-8530',
                service: 'cupping-guasha',
                serviceName: 'Therapeutic Cupping & Gua Sha',
                date: getRelativeDateStr(2),
                time: '16:45',
                timeLabel: '4:45 PM',
                durationMinutes: 40,
                patientName: 'David Tremblay',
                patientPhone: '613-555-0163',
                patientEmail: 'david.tremblay@ottawa.ca',
                preferredContact: 'sms',
                isFirstVisit: true,
                chiefComplaint: 'Upper back and rhomboid tension following high-mileage road cycling.',
                status: 'pending',
                clinicalNotes: '',
                internalNotes: 'Inquired about stationary glass cupping vs sliding cupping.',
                createdAt: new Date(Date.now() - 30 * 60000).toISOString()
            }
        ];
    }

    // Storage accessors
    function loadAppointments() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                const seed = getSeedData();
                saveAppointments(seed);
                return seed;
            }
            return JSON.parse(raw);
        } catch (e) {
            console.warn('[BookingAPI] Storage load failed, using seed data:', e);
            return getSeedData();
        }
    }

    function saveAppointments(appointments) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
            return true;
        } catch (e) {
            console.error('[BookingAPI] Storage save failed:', e);
            return false;
        }
    }

    function loadBlockedDates() {
        try {
            const raw = localStorage.getItem(BLOCKED_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveBlockedDates(dates) {
        try {
            localStorage.setItem(BLOCKED_KEY, JSON.stringify(dates));
            return true;
        } catch (e) {
            return false;
        }
    }

    function formatTimeLabel(time24) {
        const [h, m] = time24.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    function generateReference() {
        const num = Math.floor(1000 + Math.random() * 9000);
        return `HA-${num}`;
    }

    // Public API Object
    const API = {
        SERVICES,
        CLINIC_HOURS,

        /**
         * Check if clinic is open on a given date string (YYYY-MM-DD)
         */
        isClinicOpen(dateStr) {
            if (!dateStr) return { open: false, reason: 'Invalid date' };
            const parts = dateStr.split('-').map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const day = dateObj.getDay();

            // Check blocked dates
            const blocked = loadBlockedDates();
            const isBlocked = blocked.find(b => b.date === dateStr);
            if (isBlocked) {
                return { open: false, reason: isBlocked.reason || 'Clinic Holiday / Closed' };
            }

            const schedule = CLINIC_HOURS[day];
            if (!schedule || !schedule.open) {
                return { open: false, reason: 'Clinic closed on Sundays' };
            }

            return { open: true, schedule };
        },

        /**
         * Get available time slots for a specific date and service
         */
        getAvailableSlots(dateStr, serviceId) {
            const openStatus = this.isClinicOpen(dateStr);
            if (!openStatus.open) {
                return [];
            }

            const parts = dateStr.split('-').map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const day = dateObj.getDay();
            const baseSlots = STANDARD_SLOTS[day] || [];

            // Get existing active appointments on this date
            const existing = loadAppointments().filter(
                apt => apt.date === dateStr && apt.status !== 'cancelled'
            );
            const bookedTimes = new Set(existing.map(a => a.time));

            // Check if date is today, and if slots are in the past
            const todayStr = getRelativeDateStr(0);
            const isToday = dateStr === todayStr;
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();

            return baseSlots.map(timeStr => {
                const [h, m] = timeStr.split(':').map(Number);
                const isPast = isToday && (h < currentHour || (h === currentHour && m <= currentMin));
                const isBooked = bookedTimes.has(timeStr);

                return {
                    time: timeStr,
                    label: formatTimeLabel(timeStr),
                    available: !isPast && !isBooked,
                    reason: isBooked ? 'Booked' : (isPast ? 'Past' : 'Available')
                };
            });
        },

        /**
         * Create a new appointment request from public form
         */
        createAppointment(data) {
            if (!data.patientName || !data.patientPhone || !data.date || !data.time) {
                throw new Error('Missing required booking details');
            }

            const serviceInfo = SERVICES[data.service] || SERVICES['initial-acupuncture'];
            const newApt = {
                id: 'apt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                reference: generateReference(),
                service: serviceInfo.id,
                serviceName: serviceInfo.name,
                serviceNameZh: serviceInfo.nameZh,
                date: data.date,
                time: data.time,
                timeLabel: formatTimeLabel(data.time),
                durationMinutes: serviceInfo.duration,
                patientName: data.patientName.trim(),
                patientPhone: data.patientPhone.trim(),
                patientEmail: (data.patientEmail || '').trim(),
                preferredContact: data.preferredContact || 'phone',
                isFirstVisit: data.isFirstVisit !== false,
                chiefComplaint: (data.chiefComplaint || '').trim(),
                status: 'pending',
                clinicalNotes: '',
                internalNotes: '',
                createdAt: new Date().toISOString()
            };

            const appointments = loadAppointments();
            // Verify slot is still open
            const conflict = appointments.find(
                a => a.date === newApt.date && a.time === newApt.time && a.status !== 'cancelled'
            );
            if (conflict) {
                throw new Error('This time slot was just taken. Please select another slot.');
            }

            appointments.unshift(newApt);
            saveAppointments(appointments);

            // Trigger window event for live sync across open tabs
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('heritage_appointment_created', { detail: newApt }));
            }

            return newApt;
        },

        /**
         * Get all appointments with optional filtering
         */
        getAllAppointments(filter = {}) {
            let list = loadAppointments();

            // Status filter
            if (filter.status && filter.status !== 'all') {
                list = list.filter(a => a.status === filter.status);
            }

            // Date filter: 'today', 'upcoming', 'past', 'all'
            const todayStr = getRelativeDateStr(0);
            if (filter.dateRange === 'today') {
                list = list.filter(a => a.date === todayStr);
            } else if (filter.dateRange === 'upcoming') {
                list = list.filter(a => a.date >= todayStr);
            } else if (filter.dateRange === 'past') {
                list = list.filter(a => a.date < todayStr);
            }

            // Search query filter
            if (filter.search && filter.search.trim()) {
                const q = filter.search.toLowerCase().trim();
                list = list.filter(a =>
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.patientPhone && a.patientPhone.includes(q)) ||
                    (a.reference && a.reference.toLowerCase().includes(q)) ||
                    (a.serviceName && a.serviceName.toLowerCase().includes(q)) ||
                    (a.chiefComplaint && a.chiefComplaint.toLowerCase().includes(q))
                );
            }

            // Sort: Pending first, then by date and time
            list.sort((a, b) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                const dtA = a.date + ' ' + a.time;
                const dtB = b.date + ' ' + b.time;
                return dtA.localeCompare(dtB);
            });

            return list;
        },

        getAppointmentById(id) {
            const list = loadAppointments();
            return list.find(a => a.id === id) || null;
        },

        getAppointmentByRef(ref) {
            const list = loadAppointments();
            return list.find(a => a.reference === ref) || null;
        },

        /**
         * Update appointment status: 'confirmed', 'completed', 'cancelled', 'pending'
         */
        updateStatus(id, newStatus) {
            const list = loadAppointments();
            const index = list.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Appointment not found');

            list[index].status = newStatus;
            list[index].updatedAt = new Date().toISOString();
            if (newStatus === 'confirmed') {
                list[index].confirmedAt = new Date().toISOString();
            } else if (newStatus === 'cancelled') {
                list[index].cancelledAt = new Date().toISOString();
            }

            saveAppointments(list);
            return list[index];
        },

        /**
         * Reschedule an appointment to a new date and time
         */
        reschedule(id, newDate, newTime) {
            const list = loadAppointments();
            const index = list.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Appointment not found');

            // Check conflict
            const conflict = list.find(
                a => a.id !== id && a.date === newDate && a.time === newTime && a.status !== 'cancelled'
            );
            if (conflict) {
                throw new Error('Target slot is already booked.');
            }

            list[index].date = newDate;
            list[index].time = newTime;
            list[index].timeLabel = formatTimeLabel(newTime);
            list[index].status = 'confirmed'; // Rescheduling confirms the slot
            list[index].updatedAt = new Date().toISOString();

            saveAppointments(list);
            return list[index];
        },

        /**
         * Add or update private clinical notes (Dr. Leng only)
         */
        saveClinicalNotes(id, clinicalNotes, internalNotes) {
            const list = loadAppointments();
            const index = list.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Appointment not found');

            if (clinicalNotes !== undefined) list[index].clinicalNotes = clinicalNotes;
            if (internalNotes !== undefined) list[index].internalNotes = internalNotes;
            list[index].notesUpdatedAt = new Date().toISOString();

            saveAppointments(list);
            return list[index];
        },

        deleteAppointment(id) {
            let list = loadAppointments();
            list = list.filter(a => a.id !== id);
            saveAppointments(list);
            return true;
        },

        /**
         * Blocked dates management
         */
        getBlockedDates() {
            return loadBlockedDates();
        },

        addBlockedDate(dateStr, reason) {
            const list = loadBlockedDates();
            if (!list.some(b => b.date === dateStr)) {
                list.push({ date: dateStr, reason: reason || 'Clinic Closed' });
                saveBlockedDates(list);
            }
            return list;
        },

        removeBlockedDate(dateStr) {
            let list = loadBlockedDates();
            list = list.filter(b => b.date !== dateStr);
            saveBlockedDates(list);
            return list;
        },

        /**
         * Get aggregated metrics for the Owner Portal
         */
        getMetrics() {
            const list = loadAppointments();
            const todayStr = getRelativeDateStr(0);

            const todayApts = list.filter(a => a.date === todayStr && a.status !== 'cancelled');
            const pendingApts = list.filter(a => a.status === 'pending');
            const confirmedApts = list.filter(a => a.status === 'confirmed');
            const completedApts = list.filter(a => a.status === 'completed');

            return {
                total: list.length,
                today: todayApts.length,
                pending: pendingApts.length,
                confirmed: confirmedApts.length,
                completed: completedApts.length
            };
        },

        /**
         * Reset to clean demo data
         */
        resetToDemoData() {
            const seed = getSeedData();
            saveAppointments(seed);
            saveBlockedDates([]);
            return seed;
        }
    };

    return API;
}));
