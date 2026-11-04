import PDFDocument from "pdfkit";
import { Writable } from "stream";

export interface CertificateData {
  certificateNo: string;
  adopterName: string;
  animalName: string;
  species: string;
  adoptedOn: Date;
}

export const buildCertificate = (data: CertificateData, output: Writable): void => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
  doc.pipe(output);

  const w = doc.page.width;
  const h = doc.page.height;
  const date = data.adoptedOn.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Double border
  doc.lineWidth(4).strokeColor("#1B7A5F").rect(25, 25, w - 50, h - 50).stroke();
  doc.lineWidth(1).strokeColor("#F5A524").rect(35, 35, w - 70, h - 70).stroke();

  doc.fillColor("#1B7A5F").font("Helvetica-Bold").fontSize(18)
    .text("STRAYCARE", 0, 70, { width: w, align: "center", characterSpacing: 4 });

  doc.fillColor("#12332B").font("Times-Bold").fontSize(40)
    .text("Certificate of Adoption", 0, 110, { width: w, align: "center" });

  doc.fillColor("#3F5A50").font("Helvetica").fontSize(16)
    .text("This certifies that", 0, 190, { width: w, align: "center" });

  doc.fillColor("#12332B").font("Times-BoldItalic").fontSize(34)
    .text(data.adopterName, 0, 220, { width: w, align: "center" });

  doc.fillColor("#3F5A50").font("Helvetica").fontSize(16)
    .text("has given a loving home to", 0, 275, { width: w, align: "center" });

  doc.fillColor("#1B7A5F").font("Times-BoldItalic").fontSize(34)
    .text(data.animalName, 0, 305, { width: w, align: "center" });

  doc.fillColor("#3F5A50").font("Helvetica").fontSize(14)
    .text(`${data.species}  |  Adopted on ${date}`, 0, 355, { width: w, align: "center" });

  // Signature lines
  doc.lineWidth(1).strokeColor("#12332B");
  doc.moveTo(120, 450).lineTo(320, 450).stroke();
  doc.moveTo(w - 320, 450).lineTo(w - 120, 450).stroke();
  doc.fillColor("#3F5A50").fontSize(12)
    .text("Rescue Coordinator", 120, 458, { width: 200, align: "center" })
    .text("Adopter", w - 320, 458, { width: 200, align: "center" });

  doc.fontSize(10)
    .text(`Certificate No: ${data.certificateNo}`, 0, 505, { width: w, align: "center" });

  doc.end();
};