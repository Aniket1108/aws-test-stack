import { PDFDocument, rgb } from 'pdf-lib';
import memoryStreams from 'memory-streams';

async function appendPDFPageFromPDFWithAnnotations(pdfDoc, sourceBuffer) {
  const sourcePdf = await PDFDocument.load(sourceBuffer);
  const [sourcePage] = sourcePdf.getPages();

  // Get the annotations from the source page
  const annotations = sourcePage.getAnnotations();

  if (annotations.length === 0) {
    // No annotations, append page directly
    pdfDoc.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);
    return;
  }

  // Save the page dictionary before copying
  const pageDict = sourcePage.getDictionary();

  // Copy the page without annotations
  const newPage = pdfDoc.addPage([sourcePage.getWidth(), sourcePage.getHeight()]);
  newPage.setContext(sourcePage.getContentStream());

  // Extract and copy annotations from the source page
  for (const annotation of annotations) {
    const copiedAnnotation = await annotation.copy();
    newPage.addAnnotation(copiedAnnotation);
  }

  // Write the modified page dictionary with annotations
  pdfDoc.context.updatePage(pdfDoc.getPageCount() - 1, {
    ...pageDict.asDict(),
    Annots: annotations.map((annot) => annot.ref),
  });
}

const merge = async (buffers) => {
  const [firstBuffer] = buffers;
  const firstPdf = await PDFDocument.load(firstBuffer);

  // Append pages with annotations
  for (const buffer of buffers.slice(1)) {
    await appendPDFPageFromPDFWithAnnotations(firstPdf, buffer);
  }

  const outputStream = new memoryStreams.WritableStream();
  await firstPdf.save({ stream: outputStream });

  return outputStream.toBuffer();
};

async function createPDFWithText(text) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const { width, height } = page.getSize();
  const fontSize = 30;

  page.drawText(text, { x: width / 2, y: height / 2, color: rgb(0, 0, 0), fontSize });

  return pdfDoc.save();
}

// Usage example
const buffer1 = await createPDFWithText('Page 1');
const buffer2 = await createPDFWithText('Page 2');

const resultBuffer = await merge([buffer1, buffer2]);
console.log(resultBuffer);
