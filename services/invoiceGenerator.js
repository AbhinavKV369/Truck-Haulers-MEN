const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph } = require("docx");
const fs = require("fs");

async function generatePdfInvoice(order, user, filePath) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));


  doc
    .fillColor("#0d6efd")
    .fontSize(26)
    .text("INVOICE", { align: "center" })
    .moveDown();

  doc
    .fillColor("#000")
    .fontSize(10)
    .text("Truck Haulers Pvt. Ltd.", { align: "left" })
    .text("Caltex, Kannur")
    .text("Phone: +91-9999999999")
    .text("Email: support@truckhaulers.com")
    .moveDown();

  doc
    .fillColor("#212529")
    .fontSize(12)
    .text(`Invoice ID: ${order._id}`)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
    .text(`Customer: ${user.name}`)
    .text(`Email: ${user.email}`)
    .moveDown();

  doc
    .fillColor("#198754")
    .fontSize(14)
    .text("Order Details", { underline: true })
    .moveDown();

  order.items.forEach((item, index) => {
    if (item.product) {
      doc
        .fillColor("#000")
        .fontSize(12)
        .text(`${index + 1}. ${item.product.name}`)
        .fillColor("#6c757d")
        .text(`   Quantity: ${item.quantity}`)
        .text(`   Price: Rs${item.product.price}`)
        .moveDown();
    } else {
      doc.fillColor("red").text(`${index + 1}. Product no longer available`).moveDown();
    }
  });

  doc
    .moveDown()
    .fillColor("#0d6efd")
    .fontSize(16)
    .text(`Total Amount: Rs.${order.totalAmount}`, { align: "right" });
  doc
    .moveDown()
    .fontSize(20)
    .fillColor("#6c757d")
    .text("Thank you for shopping with us!", { align: "center" });

  doc.end();
}

async function generateDocxInvoice(order, user, filePath) {
  const paragraphs = [
    new Paragraph({ text: "INVOICE", heading: "Heading1" }),
    new Paragraph({ text: "Truck Haulers Pvt. Ltd.\nCaltex, Kannur\nPhone: +91-9999999999\nEmail: support@truckhaulers.com\n" }),
    new Paragraph({ text: `Invoice ID: ${order._id}` }),
    new Paragraph({ text: `Date: ${new Date(order.createdAt).toLocaleDateString()}` }),
    new Paragraph({ text: `Customer: ${user.name}` }),
    new Paragraph({ text: `Email: ${user.email}\n` }),
    new Paragraph({ text: "Order Details", heading: "Heading2" }),
  ];

  order.items.forEach((item, index) => {
    if (item.product) {
      paragraphs.push(
        new Paragraph({ text: `${index + 1}. ${item.product.name}` }),
        new Paragraph({ text: `   Quantity: ${item.quantity}` }),
        new Paragraph({ text: `   Price: Rs${item.product.price}\n` })
      );
    } else {
      paragraphs.push(new Paragraph({ text: `${index + 1}. Product no longer available` }));
    }
  });

  paragraphs.push(
    new Paragraph({ text: `\nTotal Amount: Rs.${order.totalAmount}` }),
    new Paragraph({ text: "\nThank you for shopping with us!" })
  );

  const doc = new Document({
    creator: "Truck Haulers Pvt. Ltd.",
    title: `Invoice - ${order._id}`,
    description: "Customer invoice document",
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
}

module.exports = {
  generatePdfInvoice,
  generateDocxInvoice,
};
