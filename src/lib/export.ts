import { toPng, toBlob } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function exportCardAsPng(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Export a card element as a Blob (PNG format at 2x resolution).
 * Useful for clipboard operations and sharing APIs that require Blob input.
 */
export async function exportCardAsBlob(element: HTMLElement): Promise<Blob> {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    cacheBust: true,
  });
  if (!blob) {
    throw new Error('Failed to generate image blob');
  }
  return blob;
}

/**
 * Draw crop marks on a jsPDF page.
 * Marks are 0.25pt gray (#999) lines at each corner indicating
 * where the 3mm bleed area ends.
 *
 * Page size: 97mm x 61mm (91x55mm card + 3mm bleed on each side)
 * Crop marks are 5mm lines (spanning from page edge to bleed boundary)
 * at each of the four corners.
 */
function drawCropMarks(doc: jsPDF): void {
  doc.setDrawColor(153, 153, 153); // #999
  doc.setLineWidth(0.25 * (25.4 / 72)); // 0.25pt converted to mm

  // Top-left corner
  doc.line(0, 3, 3, 3);   // horizontal
  doc.line(3, 0, 3, 3);   // vertical

  // Top-right corner
  doc.line(94, 3, 97, 3);  // horizontal
  doc.line(94, 0, 94, 3);  // vertical

  // Bottom-left corner
  doc.line(0, 58, 3, 58);  // horizontal
  doc.line(3, 58, 3, 61);  // vertical

  // Bottom-right corner
  doc.line(94, 58, 97, 58); // horizontal
  doc.line(94, 58, 94, 61); // vertical
}

/**
 * Export both card faces as a print-ready PDF with crop marks and bleed area.
 *
 * The PDF page size is 97mm x 61mm, which includes 3mm bleed on all sides
 * around a standard 91mm x 55mm business card. Crop marks indicate where
 * the card should be trimmed after printing.
 *
 * Page 1: Card front
 * Page 2: Card back
 */
export async function exportCardAsPrintPdf(
  frontElement: HTMLElement,
  backElement: HTMLElement,
  filename: string
): Promise<void> {
  // Capture both card faces at high resolution for print quality
  const [frontDataUrl, backDataUrl] = await Promise.all([
    toPng(frontElement, { pixelRatio: 4, cacheBust: true }),
    toPng(backElement, { pixelRatio: 4, cacheBust: true }),
  ]);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [97, 61],
  });

  // Page 1: Front
  doc.addImage(frontDataUrl, 'PNG', 0, 0, 97, 61);
  drawCropMarks(doc);

  // Page 2: Back
  doc.addPage([97, 61], 'landscape');
  doc.addImage(backDataUrl, 'PNG', 0, 0, 97, 61);
  drawCropMarks(doc);

  doc.save(filename);
}
