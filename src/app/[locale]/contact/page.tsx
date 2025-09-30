import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/locales";
import ContactInfo from "@/components/ContactInfo";
import OpenStreetMap from "@/components/OpenStreetMap";
import { sendContactEmail } from "@/lib/email";

async function send(data: FormData): Promise<void> {
  "use server";
  
  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const message = data.get("message") as string;

  if (!name || !email || !message) {
    throw new Error("All fields are required");
  }

  try {
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    
    // Redirect to a success page or show success message
    // For now, we'll just log success
    console.log("Contact form submitted successfully");
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return;
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  
    // Tbilisi, Georgia coordinates (Agmashnebeli alley N240, 0159) - Exact Google Maps location
    const officeLocation = {
      latitude: 41.80594854658469,
      longitude: 44.767832572133464,
      address: "Georgia, Tbilisi, Agmashnebeli alley N240, 0159"
    };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">{t("contact.title")}</h1>
        <p className="mt-2 text-foreground/70">{t("contact.description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("contact.description")}</h2>
            <form action={send} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="name">
                  {t("contact.name")}
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
                  {t("contact.email")}
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
                  {t("contact.message")}
                </label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={6} 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                />
              </div>
              {/* hCaptcha placeholder */}
              <div className="rounded-md border border-input bg-muted p-3 text-xs text-muted-foreground" aria-label="hCaptcha placeholder">
                hCaptcha verification will be added here
              </div>
              <button 
                type="submit" 
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {t("contact.submit")}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Information & Map */}
        <div className="space-y-6">
          <ContactInfo />
          
          <div>
            <OpenStreetMap
              latitude={officeLocation.latitude}
              longitude={officeLocation.longitude}
              address={officeLocation.address}
              companyName="LLC Legal Sandbox Georgia"
              getDirectionsText={t("contact.get_directions")}
              viewOnOsmText={t("contact.view_on_osm")}
              className="h-80 w-full rounded-lg border"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


