import { pdflib, memoryStreams } from 'common_layer/services/packageExport.js';

const lambdaHandler = async () => {
  const merge = async (buffers) => {
    const doc = await pdflib.PDFDocument.create();
    for (const buffer of buffers) {
      const pdfDoc = await pdflib.PDFDocument.load(buffer);
      const pages = await pdfDoc.getPages();
      doc.addPage(...pages);
    }
    const mergedBuffer = await doc.save();
    return mergedBuffer;
  };

  async function createPDFWithText(text) {
    const pdfDoc = await pdflib.PDFDocument.create();
    const page = pdfDoc.addPage();

    const { width, height } = page.getSize();
    const fontSize = 30;

    page.drawText(text, { x: width / 2, y: height / 2, color: pdflib.rgb(0, 0, 0), fontSize });

    return pdfDoc.save();
  }

  // Usage example
  const buffer1 = await createPDFWithText('Page 1');
  const buffer2 = await createPDFWithText('Page 2');

  const resultBuffer = await merge([buffer1, buffer2]);
  console.log('resultBuffer', resultBuffer);

}
lambdaHandler()