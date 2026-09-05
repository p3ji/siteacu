/**
 * Heritage Acupuncture & Chinese Herbal Center
 * Client-side interactions: filtering, modal, FAQs, appointment requests,
 * and Mandarin Chinese (Simplified / 简体中文) language switching.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initHeader();
  initMobileNav();
  initConditionsFilter();
  initFaqAccordion();
  initModals();
  initForms();
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
    'acupuncture': dict.optAcu,
    'herbal': dict.optHerbal,
    'cupping': dict.optCupping,
    'guasha': dict.optGuaSha,
    'massage': dict.optMassage,
    'general': dict.optGeneral
  };

  const timeMap = {
    'morning': dict.optMorning,
    'afternoon': dict.optAfternoon,
    'thursday-evening': dict.optThuEve,
    'saturday': dict.optSat
  };

  document.querySelectorAll('select#page-modality, select#modal-service').forEach(sel => {
    Array.from(sel.options).forEach(opt => {
      if (modalityMap[opt.value]) {
        opt.textContent = modalityMap[opt.value];
      }
    });
  });

  document.querySelectorAll('select#page-time, select#modal-time').forEach(sel => {
    Array.from(sel.options).forEach(opt => {
      if (timeMap[opt.value]) {
        opt.textContent = timeMap[opt.value];
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
   Modal Dialogs (Consultation / Booking Request)
   ========================================================================== */
function initModals() {
  const openButtons = document.querySelectorAll('[data-open-modal="booking-modal"]');
  const modal = document.getElementById('booking-modal');
  if (!modal) return;

  const closeButtons = modal.querySelectorAll('.modal-close-btn, [data-close-modal]');

  const openModal = (prefillService = '') => {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (prefillService) {
      const select = modal.querySelector('#modal-service');
      if (select) select.value = prefillService;
    }
  };

  const closeModal = () => {
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

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   Form Submissions (Validation & Client-side Confirmation)
   ========================================================================== */
function initForms() {
  const forms = [
    document.getElementById('booking-form-page'),
    document.getElementById('modal-booking-form')
  ];

  forms.forEach(form => {
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = (currentLang === 'zh' ? '正在提交...' : 'Sending Request...');
      }

      setTimeout(() => {
        const feedback = form.parentElement.querySelector('.form-feedback') || form.querySelector('.form-feedback');
        if (feedback) {
          feedback.style.display = 'block';
          feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }, 600);
    });
  });
}
