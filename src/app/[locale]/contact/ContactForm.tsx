"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { submitContactForm } from "./contactActions";

interface ContactFormProps {
  locale: string;
  t: {
    name: string;
    email: string;
    message: string;
    submit: string;
    submitting: string;
  };
}

export default function ContactForm({ locale, t }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSubmitting(true);
        try {
          await submitContactForm(formData);
          trackEvent("contact_form_submit", { locale });
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="name">
          {t.name}
        </label>
        <input
          id="name"
          name="name"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          {t.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="message">
          {t.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="rounded-md border border-input bg-muted p-3 text-xs text-muted-foreground" aria-label="hCaptcha placeholder">
        hCaptcha verification will be added here
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}

