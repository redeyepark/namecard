# SPEC-PRINT-001: Print-Ready PDF Export

## Overview

Add print-ready PDF export functionality to the Namecard Editor, allowing users to download business card designs as high-quality PDFs suitable for professional printing.

## Requirements (EARS Format)

### R1: PDF Generation
When a user clicks the "인쇄용 PDF 다운로드" button, the system SHALL generate a multi-page PDF containing the card front on page 1 and card back on page 2.

### R2: Print Specifications
The generated PDF SHALL use standard business card dimensions:
- Card size: 91mm × 55mm (Korean/international standard)
- Bleed area: 3mm on each side (total: 97mm × 61mm)
- Resolution: 300 DPI equivalent (high-quality rasterization)
- Color mode: RGB (converted to CMYK by print shop)

### R3: Crop Marks
The PDF SHALL include crop marks (재단선) at each corner of the card boundary to guide print cutting.

### R4: Theme Support
The PDF export SHALL work with all card themes:
- Standard themes (aspect-ratio 29:45): classic, pokemon, hearthstone, harrypotter, tarot
- Nametag theme (aspect-ratio 197:354)
- SNS Profile theme (aspect-ratio 1:1)

For non-standard aspect ratios (nametag, SNS), the PDF SHALL center the card on a standard page size.

### R5: UI Integration
The export menu SHALL include a new "인쇄용 PDF" download option in the download section, with a distinct printer icon.

### R6: Quality
The PDF SHALL render card elements at pixelRatio 4 (equivalent to ~300 DPI at print size) for crisp text and images.

## Technical Approach

### Library
- jsPDF v4.2 (already installed, currently unused)
- html-to-image (already used for PNG export)

### Implementation
1. `src/lib/export.ts`: Add `exportCardAsPrintPdf()` function
   - Capture front/back card elements at 4x resolution using html-to-image
   - Create jsPDF document with custom page size (97×61mm including bleed)
   - Add card images centered with 3mm bleed offset
   - Draw crop marks at card boundary corners
   - Save as PDF

2. `src/components/export/ExportPanel.tsx`: Add PDF download menu item
   - New handler `handleDownloadPrintPdf`
   - New menu item with printer icon in downloadItems array

### File Changes
- Modify: `src/lib/export.ts` (add PDF generation function)
- Modify: `src/components/export/ExportPanel.tsx` (add menu item + handler)

## Acceptance Criteria

- [ ] PDF downloads successfully with front/back pages
- [ ] PDF dimensions are 97mm × 61mm (with bleed)
- [ ] Crop marks visible at card boundary corners
- [ ] All 7 themes render correctly in PDF
- [ ] High resolution suitable for 300 DPI printing
- [ ] Loading indicator shown during PDF generation
- [ ] Error toast shown on failure
