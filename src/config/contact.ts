export const OFFICIAL_PHONE = "+995 551 911 961";

export function phoneToTelHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

