import { v4 as uuidv4 } from "uuid";
import { generateCertificatePDF } from "./pdfGenerator.js";
import { uploadPdfToSupabase } from "./uploadToSupabase.js";
import { saveCertRecord } from "./saveCertRecord.js";

export async function createVaccinationCertificate(appointmentData) {

  try {
    const appointmentId = appointmentData._id.toString();

    // 1. Generate UUID
    const uuid = uuidv4();

    // 2. QR Payload
    const qrPayload = {
      uuid,
      appointmentId
    };

    // 3. Create PDF
    const pdfBuffer = await generateCertificatePDF(
      appointmentData,
      qrPayload
    );

    // 4. Upload PDF
    const docUrl = await uploadPdfToSupabase(
      pdfBuffer,
      appointmentId
    );

    // 5. Save in Supabase DB
    const record = await saveCertRecord({
      uuid,
      appointmentId,
      docUrl
    });

    return {
      success: true,
      uuid,
      url: docUrl,
      record
    };

  } catch (err) {

    console.log("Certificate Error:", err);

    return {
      success: false,
      error: err.message
    };
  }
}

