import { supabase } from "../config/supabase.js";
export async function saveCertRecord({
  uuid,
  appointmentId,
  docUrl
}) {

  const { data, error } = await supabase
    .from("vaccination_certs")
    .insert([
      {
        uuid,
        appointment_id: appointmentId,
        doc_url: docUrl,
        status: "ACTIVE"
      }
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

