import PDFDocument from "pdfkit";
import QRCode from "qrcode";
export async function generateCertificatePDF(data, qrPayload) {

  const qrString = JSON.stringify(qrPayload);
  const qrImage = await QRCode.toDataURL(qrString);

  return new Promise((resolve) => {

    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    // ===== CONTENT =====
    doc.fontSize(22).text("Vaccination Certificate", {
      align: "center"
    });

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Appointment ID: ${data._id}`);
    doc.text(`Hospital: ${data.hospitalData.name}`);
    doc.text(`Vaccine: ${data.vaccineName}`);
    doc.text(`Price: ₹${data.vaccinePrice}`);

    doc.moveDown();
 const istTime = new Date(data.slotDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata"
    });
    doc.text(`Date: ${istTime}`);
    doc.text(`Time: ${data.slotTime}`);

    doc.moveDown();

    doc.text("Beneficiary Details");
   
    doc.text(`Name: ${data.userData?.name}`);
    doc.text(`Address: ${data.userData?.address?.line1}`);
    doc.text(`       : ${data.userData?.address?.line2}`);

    doc.moveDown();
    doc.text("Status: Vaccination Completed");

    // ===== QR =====
    doc.moveDown();
    doc.text("Scan to Verify", { align: "center" });

    doc.image(qrImage, 220, doc.y, {
      width: 150,
      height: 150
    });

    doc.end();
  });
}

