import { supabase } from "../config/supabase.js";
export async function uploadPdfToSupabase(buffer, appointmentId) {

  const fileName = `${appointmentId}.pdf`;

  const { error } = await supabase.storage
    .from("certificates")
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: true
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("certificates")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

