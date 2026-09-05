# Heritage Acupuncture & Chinese Herbal Center (Modernized Web Presence)

A clean, modern, patient-focused web redesign for **Heritage Acupuncture & Chinese Herbal Center** (`acupuncturekanata.com`), led by **Linda Xiaochun Leng (冷晓春)**, Registered TCM Practitioner and Acupuncturist (CTCMPAO / CMAAC).

---

## Highlights of Modernization

1. **Anti-"AI Slop" Design Direction**:
   - **Grounded, Organic Palette**: Warm linen ivory (`#FDFBF7`), deep pine/jade (`#1F3F30`), warm terracotta (`#B25D34`), and subtle botanical sage (`#EFF4F1`).
   - **Authentic Medical Copy**: Preserves Linda Leng's 38+ years of clinical and hospital-trained practice since 1987, actual clinical indications, needle safety explanations ("Deqi" sensation, single-use surgical disposable needles), and real Ontario health insurance guidance.
   - **High-End Editorial Typography**: Elegant editorial serif headings (`Newsreader`) paired with crisp, accessible sans-serif (`Plus Jakarta Sans`).
   - **Genuine Patient Case Studies**: Retains authentic, unedited testimonials covering Bell's palsy, severe cervical osteoarthritis, chronic hepatitis B ALT normalization, ulcerative colitis/Crohn's, pediatric bedwetting, and IVF-alternative natural fertility.

2. **Interactive Clinical Features**:
   - **Interactive Condition Directory**: Live search input and filter chips (Pain & Orthopedics, Digestive Health, Neurological & Stress, Women's Health & Fertility, Autoimmune & Endocrine, Respiratory & Skin).
   - **Transparent Fee Schedule**: Fully transparent rates matching the clinic's fee structure ($30 assessment, $60 acupuncture treatment, $20–$30 cupping, $30 gua sha) alongside an extended insurance breakdown (Sun Life, Manulife, Canada Life, Blue Cross, Desjardins).
   - **Consultation & Booking System**: Dual intake via on-page visit planner and accessible modal drawer with service pre-selection and time-of-day preferences.
   - **Clinical Safety FAQ**: Accordion answering real patient questions regarding needle hygiene, pain levels, and herbal medicine customization.
   - **Mobile-First Responsive Layout**: Smooth drawer menu, sticky navigation, and tap-to-call integrations for `613-592-8838`.

---

## Directory Structure

```
heritage-acupuncture/
├── index.html                   # Complete semantic HTML5 clinic website
├── css/
│   └── styles.css               # Clean, responsive CSS with design tokens
├── js/
│   └── main.js                  # Search, category filter, modal, & accordion scripts
├── assets/
│   ├── data/
│   │   ├── services.json        # Structured modalities and pricing
│   │   └── testimonials.json    # Structured genuine patient testimonials
│   └── images/                  # Scraped original clinic assets
└── README.md                    # Project documentation
```

---

## How to Preview Locally

Because this project is built with vanilla modern web standards, it requires no build steps or heavy dependencies:

### Option 1: Python One-Liner (Recommended)
```bash
cd C:\Users\pushp\.gemini\antigravity\scratch\heritage-acupuncture
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

### Option 2: Direct Browser File Open
Simply double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Safari, or Firefox.

---

## Deployment Guide

- **Static Hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages)**:
  Directly push or drag-and-drop the folder. Deploys instantly with sub-second page loads.
- **WordPress / Existing Host**:
  Can be uploaded to an Apache/Nginx web root or integrated as a custom theme/template into WordPress or cPanel hosting.
