---
type: project
created: 2026-10-04
---

# Chronos Reports Manager - Architecture & Decisions

## Context
Official incident report generator for the National Platform for Electronic Monitoring (المنصة الوطنية للمراقبة الإلكترونية - DGAPR Morocco).

## Decisions
1. **Data Source:** Excel workbook containing `peine alternative` and `mesure alternative` sheets. The application pre-bundles initial surveillance records and supports drag-and-drop Excel upload for updates.
2. **Platform:** Local Web Application built with React, Vite, TypeScript, Tailwind CSS with full Arabic RTL support.
3. **Export Formats:** Dual export — Pixel-perfect official PDF (matching the DGAPR Moroccan kingdom letterhead and emblem) and editable Microsoft Word (`.docx`).
4. **Sections 2 & 3 Input:** Pure manual input (free-form text areas) for both Section 2 (ملخص الإشعار) and Section 3 (الإجراءات المتخذة بالتفصيل). No hardcoded presets. In future iterations, when consistently recurring report patterns emerge from real usage, presets will be suggested and added.
5. **Excel File Immutability (STRICT):** NEVER modify or write to the master Excel file. Every day, create a dated copy (e.g. `data/daily_copies/chronos_YYYY-MM-DD.xlsx`), and use the copy to update the application data. The master file remains strictly untouched.
6. **Active Only (Exclusion of 'منتهية'):** Strictly exclude individuals with status `منتهية`. Only currently monitored active individuals (`مراقب`) are parsed, listed, and selectable in the application.
