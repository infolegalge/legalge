"use server";

import { sendContactEmail } from "@/lib/email";

export async function submitContactForm(formData: FormData) {
  const name = (formData.get("name") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim();
  const message = (formData.get("message") || "").toString().trim();

  if (!name || !email || !message) {
    return;
  }

  await sendContactEmail({ name, email, message });
}
