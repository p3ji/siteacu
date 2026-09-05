/**
 * Heritage Acupuncture & Chinese Herbal Center
 * Client-side interactions: filtering, interactive booking engine, FAQs,
 * and Mandarin Chinese (Simplified / 简体中文) language switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initHeader();
  initMobileNav();
  initConditionsFilter();
  initFaqAccordion();
  initInteractiveBooking();
  initSampleSiteNotice();
});

/* ==========================================================================
   Language Switcher (Internationalization - i18n)
   ========================================================================== */
let currentLang = 'en';

function initLanguage() {
  const savedLang = localStorage.getItem('siteLanguage') || 'en';
  setLanguage(savedLang);

  // Bind click handlers to all lang buttons
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang');
      if (lang && lang !== currentLang) {
        setLanguage(lang);
      }
    });
  });
}

function setLanguage(lang) {
  if (typeof siteTranslations === 'undefined' || !siteTranslations[lang]) return;
  currentLang = lang;
  localStorage.setItem('siteLanguage', lang);

  const dict = siteTranslations[lang];

  // 1. Update HTML document lang attribute
  document.documentElement.lang = (lang === 'zh' ? 'zh-CN' : 'en');

  // 2. Update document title
  if (dict.docTitle) {
    document.title = dict.docTitle;
  }

  // 3. Update all toggle button active states
  const allLangBtns = document.querySelectorAll('.lang-btn');
  allLangBtns.forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // 4. Update elements with data-i18n
  const translatableElements = document.querySelectorAll('[data-i18n]');
  translatableElements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      // If the translation contains HTML tags (like <em>, <strong>, etc.)
      if (dict[key].includes('<')) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // 5. Update input placeholders with data-i18n-placeholder
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // 6. Update Condition Tags
  const conditionTags = document.querySelectorAll('.condition-tag');
  conditionTags.forEach(tag => {
    if (lang === 'zh') {
      const zhVal = tag.getAttribute('data-zh');
      if (zhVal) tag.textContent = zhVal;
    } else {
      const enVal = tag.getAttribute('data-en');
      if (enVal) tag.textContent = enVal;
    }
  });

  // 7. Update Select Options (Modality and Times)
  updateSelectOptions(lang);
}

function updateSelectOptions(lang) {
  const dict = siteTranslations[lang];
  if (!dict) return;

  const modalityMap = {
    'initial-acupuncture': dict.optInitialAcu || dict.optAcu,
    'follow-up-acupuncture': dict.optFollowUpAcu,
    'herbal-consultation': dict.optHerbalConsult || dict.optHerbal,
    'cupping-guasha': dict.optCuppingGuaSha || dict.optCupping,
    'massage-therapy': dict.optMassageTherapy || dict.optMassage,
    // legacy values fallback
    'acupuncture': dict.optInitialAcu || dict.optAcu,
    'herbal': dict.optHerbalConsult || dict.optHerbal,
    'cupping': dict.optCuppingGuaSha || dict.optCupping,
    'guasha': dict.optCuppingGuaSha || dict.optGuaSha,
    'massage': dict.optMassageTherapy || dict.optMassage,
    'general': dict.optInitialAcu || dict.optGeneral
  };

  document.querySelectorAll('select#page-modality, select#modal-service').forEach(sel => {
    Array.from(sel.options).forEach(opt => {
      if (modalityMap[opt.value]) {
        opt.textContent = modalityMap[opt.value];
      }
    });
  });
}

/* ==========================================================================
   Header Scroll State
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ==========================================================================
   Mobile Navigation Drawer
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const closeBtn = document.querySelector('.mobile-nav-close');
  const navLinks = document.querySelectorAll('.mobile-nav-links a');

  if (!toggleBtn || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  navLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* ==========================================================================
   Interactive Conditions Filter & Dual-Language Search
   ========================================================================== */
function initConditionsFilter() {
  const searchInput = document.getElementById('condition-search');
  const chips = document.querySelectorAll('.chip-btn');
  const cards = document.querySelectorAll('.condition-group-card');

  if (!cards.length) return;

  let activeCategory = 'all';
  let searchTerm = '';

  function applyFilter() {
    const term = searchTerm.toLowerCase().trim();

    cards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const tags = Array.from(card.querySelectorAll('.condition-tag'));
      const cardTitle = card.querySelector('h4')?.textContent.toLowerCase() || '';
      
      const matchesCategory = (activeCategory === 'all' || cardCategory === activeCategory);

      // Check tag matches & highlight (searches current text, English name, and Chinese name)
      let hasMatchingTag = false;
      tags.forEach(tag => {
        const currentText = tag.textContent.toLowerCase();
        const enText = (tag.getAttribute('data-en') || '').toLowerCase();
        const zhText = (tag.getAttribute('data-zh') || '').toLowerCase();

        if (term && (currentText.includes(term) || enText.includes(term) || zhText.includes(term))) {
          tag.classList.add('highlight');
          hasMatchingTag = true;
        } else {
          tag.classList.remove('highlight');
        }
      });

      const matchesSearch = !term || cardTitle.includes(term) || hasMatchingTag;

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  // Category chip clicks
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-filter') || 'all';
      applyFilter();
    });
  });

  // Search input typing
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      applyFilter();
    });
  }
}

/* ==========================================================================
   Clinical Safety & FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close other open accordions
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('active')) {
          other.classList.remove('active');
          const otherContent = other.querySelector('.faq-content');
          if (otherContent) otherContent.style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('active');
        content.style.maxHeight = null;
      } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   Interactive Booking Engine (Powered by BookingAPI)
   ========================================================================== */
function getSuggestedBookingDate() {
  const now = new Date();
  const d = new Date();
  d.setDate(d.getDate() + 1); // Start with tomorrow

  // If tomorrow is Sunday, advance to Monday
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function initInteractiveBooking() {
  const modal = document.getElementById('booking-modal');
  const modalForm = document.getElementById('modal-booking-form');
  const modalConfirmCard = document.getElementById('modal-confirmation-card');
  const pageForm = document.getElementById('booking-form-page');
  const pageConfirmCard = document.getElementById('page-confirmation-card');

  // Setup Modal Trigger Buttons
  const openButtons = document.querySelectorAll('[data-open-modal="booking-modal"]');
  const closeButtons = modal ? modal.querySelectorAll('.modal-close-btn, #modal-confirm-close-btn') : [];

  const openModal = (prefillService = '') => {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Reset card views
    if (modalForm) modalForm.style.display = 'block';
    if (modalConfirmCard) modalConfirmCard.style.display = 'none';

    // Set service
    if (prefillService && modalForm) {
      const select = modalForm.querySelector('#modal-service');
      if (select) {
        // Map common shortcuts
        const s = prefillService.toLowerCase();
        if (s.includes('acu')) select.value = 'initial-acupuncture';
        else if (s.includes('herb')) select.value = 'herbal-consultation';
        else if (s.includes('cup') || s.includes('gua')) select.value = 'cupping-guasha';
        else if (s.includes('mass') || s.includes('tui')) select.value = 'massage-therapy';
        else select.value = prefillService;
      }
    }

    // Refresh slots
    setupBookingWidget('modal');
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openModal(service);
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // Setup In-Page Form Widget
  setupBookingWidget('page');

  // Setup Modal Widget
  setupBookingWidget('modal');
}

/**
 * Configure dynamic date, slot rendering, and submission for a form widget
 * prefix is 'modal' or 'page'
 */
function setupBookingWidget(prefix) {
  const form = document.getElementById(prefix === 'modal' ? 'modal-booking-form' : 'booking-form-page');
  const confirmCard = document.getElementById(prefix === 'modal' ? 'modal-confirmation-card' : 'page-confirmation-card');
  if (!form) return;

  const dateInput = document.getElementById(`${prefix}-date`);
  const serviceSelect = document.getElementById(prefix === 'modal' ? 'modal-service' : 'page-modality');
  const slotsGrid = document.getElementById(`${prefix}-slots-grid`);
  const statusLabel = document.getElementById(`${prefix}-slot-status`);
  const timeHiddenInput = document.getElementById(`${prefix}-selected-time`);
  const prefGroup = document.getElementById(`${prefix}-contact-pref-group`);
  const prefHiddenInput = document.getElementById(`${prefix}-contact-pref`);

  // Min date = today
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.min = todayStr;
    if (!dateInput.value) {
      dateInput.value = getSuggestedBookingDate();
    }
  }

  // Contact Preference Pills
  if (prefGroup && prefHiddenInput) {
    prefGroup.querySelectorAll('.contact-pref-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        prefGroup.querySelectorAll('.contact-pref-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        prefHiddenInput.value = btn.dataset.pref;
      });
    });
  }

  // Render Slots function
  function renderSlots() {
    if (!slotsGrid || !dateInput) return;
    slotsGrid.innerHTML = '';
    timeHiddenInput.value = '';

    const selectedDate = dateInput.value;
    if (!selectedDate) {
      if (statusLabel) statusLabel.textContent = 'Please choose a date.';
      return;
    }

    if (typeof BookingAPI === 'undefined') {
      console.warn('BookingAPI not found.');
      return;
    }

    const openStatus = BookingAPI.isClinicOpen(selectedDate);
    if (!openStatus.open) {
      const msg = currentLang === 'zh'
        ? `门诊休息 (${openStatus.reason})，请选择其他就诊日期。`
        : `Clinic Closed (${openStatus.reason}). Please select another date.`;
      slotsGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-danger, #c53030); font-size: 0.85rem; padding: 0.5rem 0;">${msg}</div>`;
      if (statusLabel) statusLabel.textContent = '';
      return;
    }

    const serviceId = serviceSelect ? serviceSelect.value : 'initial-acupuncture';
    const slots = BookingAPI.getAvailableSlots(selectedDate, serviceId);

    if (!slots || slots.length === 0) {
      const msg = currentLang === 'zh' ? '该日就诊名额已满' : 'No available slots on this date';
      slotsGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">${msg}</div>`;
      if (statusLabel) statusLabel.textContent = '';
      return;
    }

    let firstAvailableSet = false;

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-chip';
      btn.textContent = slot.label;

      if (!slot.available) {
        btn.disabled = true;
        btn.title = slot.reason;
      } else {
        // Auto-select first available slot
        if (!firstAvailableSet) {
          btn.classList.add('selected');
          timeHiddenInput.value = slot.time;
          firstAvailableSet = true;
          if (statusLabel) {
            statusLabel.textContent = currentLang === 'zh' ? `已选: ${slot.label}` : `Selected: ${slot.label}`;
          }
        }

        btn.addEventListener('click', () => {
          slotsGrid.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
          btn.classList.add('selected');
          timeHiddenInput.value = slot.time;
          if (statusLabel) {
            statusLabel.textContent = currentLang === 'zh' ? `已选: ${slot.label}` : `Selected: ${slot.label}`;
          }
        });
      }

      slotsGrid.appendChild(btn);
    });

    if (!firstAvailableSet && statusLabel) {
      statusLabel.textContent = currentLang === 'zh' ? '今日时段已过或已满' : 'All slots taken for this date';
    }
  }

  // Listeners for slot re-rendering
  if (dateInput) {
    dateInput.addEventListener('change', renderSlots);
  }
  if (serviceSelect) {
    serviceSelect.addEventListener('change', renderSlots);
  }

  // Initial render
  renderSlots();

  // Reset Booking handler (In-page)
  const resetBtn = document.getElementById('page-reset-booking-btn');
  if (resetBtn && prefix === 'page') {
    resetBtn.addEventListener('click', () => {
      if (form) form.style.display = 'block';
      if (confirmCard) confirmCard.style.display = 'none';
      form.reset();
      renderSlots();
    });
  }

  // Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!timeHiddenInput.value) {
      alert(currentLang === 'zh' ? '请选择一个可预约的时间段。' : 'Please select an available appointment time slot.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = currentLang === 'zh' ? '正在预约中...' : 'Securing Appointment...';
    }

    const patientName = (form.querySelector(`#${prefix}-name`)?.value || '').trim();
    const patientPhone = (form.querySelector(`#${prefix}-phone`)?.value || '').trim();
    const patientEmail = (form.querySelector(`#${prefix}-email`)?.value || '').trim();
    const service = serviceSelect ? serviceSelect.value : 'initial-acupuncture';
    const date = dateInput.value;
    const time = timeHiddenInput.value;
    const pref = prefHiddenInput ? prefHiddenInput.value : 'sms';
    const firstVisitEl = document.getElementById(`${prefix}-first-visit`);
    const isFirstVisit = firstVisitEl ? firstVisitEl.checked : true;
    const notes = (form.querySelector(`#${prefix}-notes`)?.value || '').trim();

    setTimeout(() => {
      try {
        const apt = BookingAPI.createAppointment({
          patientName,
          patientPhone,
          patientEmail,
          service,
          date,
          time,
          preferredContact: pref,
          isFirstVisit,
          chiefComplaint: notes
        });

        // Hide form, show confirmation card
        form.style.display = 'none';
        if (confirmCard) {
          confirmCard.style.display = 'block';
          
          const refEl = document.getElementById(`${prefix}-confirm-ref`);
          if (refEl) refEl.textContent = apt.reference;

          const srvEl = document.getElementById(`${prefix}-confirm-service`);
          if (srvEl) srvEl.textContent = currentLang === 'zh' ? (apt.serviceNameZh || apt.serviceName) : apt.serviceName;

          const dtEl = document.getElementById(`${prefix}-confirm-datetime`);
          if (dtEl) dtEl.textContent = `${formatDisplayDate(apt.date)} at ${apt.timeLabel || apt.time}`;

          const contEl = document.getElementById(`${prefix}-confirm-contact`);
          if (contEl) {
            const contactMap = {
              sms: currentLang === 'zh' ? '手机短信确认' : 'SMS Text Confirmation',
              phone: currentLang === 'zh' ? '电话回拨确认' : 'Direct Phone Call',
              email: currentLang === 'zh' ? '电子邮件确认' : 'Email Confirmation'
            };
            contEl.textContent = contactMap[pref] || pref;
          }

          confirmCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.reset();
      } catch (err) {
        alert(err.message || 'Error booking appointment. Please try again or call (613) 592-8838.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    }, 450);
  });
}

/* ==========================================================================
   Sample Demonstration Website Notice Modal
   ========================================================================== */
function initSampleSiteNotice() {
  const modal = document.getElementById('sample-site-modal');
  if (!modal) return;

  const closeX = document.getElementById('sample-modal-close-x');
  const confirmBtn = document.getElementById('sample-modal-confirm-btn');
  const rememberCheckbox = document.getElementById('sample-dismiss-session');
  const openButtons = document.querySelectorAll('.open-sample-notice-trigger');

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (rememberCheckbox && rememberCheckbox.checked) {
      sessionStorage.setItem('sample_site_notice_dismissed', 'true');
    }
  };

  const openModal = () => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  // Close triggers
  if (closeX) closeX.addEventListener('click', closeModal);
  if (confirmBtn) confirmBtn.addEventListener('click', closeModal);

  // Overlay click dismissal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape key dismissal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Open triggers across page
  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Auto-show when accessing the site unless dismissed in this session
  const isDismissed = sessionStorage.getItem('sample_site_notice_dismissed');
  if (!isDismissed) {
    setTimeout(() => {
      openModal();
    }, 250);
  }
}
