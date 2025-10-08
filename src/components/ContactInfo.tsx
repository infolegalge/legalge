'use client';

import { useTranslations } from "next-intl";
import { OFFICIAL_PHONE, phoneToTelHref } from "@/config/contact";
import { trackEvent } from "@/lib/analytics";

interface ContactInfoProps {
  className?: string;
}

export default function ContactInfo({ className = "" }: ContactInfoProps) {
  const t = useTranslations("contact");

  const contactDetails = {
    address: "Georgia, Tbilisi, Agmashnebeli alley N240, 0159",
    phone: OFFICIAL_PHONE,
    email: "contact@legal.ge",
    hours: "24/7",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-4">{t("office")}</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="font-medium text-sm">{t("address")}</p>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=41.80594854658469,44.767832572133464`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {contactDetails.address}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <p className="font-medium text-sm">{t("phone")}</p>
              <a
                href={phoneToTelHref(contactDetails.phone)}
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => trackEvent("contact_phone_click", { method: "tel", value: contactDetails.phone })}
              >
                {contactDetails.phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-medium text-sm">{t("email_contact")}</p>
              <a
                href={`mailto:${contactDetails.email}`}
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => trackEvent("contact_email_click", { method: "email", value: contactDetails.email })}
              >
                {contactDetails.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-sm">{t("hours")}</p>
              <p className="text-sm text-muted-foreground">{contactDetails.hours}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
