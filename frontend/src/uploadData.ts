import { supabase, isSupabaseConfigured } from "./supabase";

const evidenceData = [
  {
    title: "Phishing Email",
    timestamp: "09:00",
    order: 1,
    type: "Email"
  },
  {
    title: "PowerShell Execution",
    timestamp: "09:05",
    order: 2,
    type: "Execution"
  },
  {
    title: "Malware Download",
    timestamp: "09:08",
    order: 3,
    type: "Network"
  }
];

export async function uploadEvidence() {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
    return;
  }

  const { data, error } = await supabase.from("evidence").insert(evidenceData);
  if (error) {
    console.error("Error uploading evidence to Supabase:", error);
  } else {
    console.log("Evidence uploaded to Supabase successfully:", data);
  }
}
