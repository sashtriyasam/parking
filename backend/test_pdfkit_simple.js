const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
const buffers = [];
doc.on('data', buffers.push.bind(buffers));
doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    console.log('PDF Length:', pdfData.length);
    fs.writeFileSync('test.pdf', pdfData);
});

doc.text('Hello World');
doc.end();
