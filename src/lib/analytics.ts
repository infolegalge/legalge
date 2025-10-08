export function trackEvent(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  if (!(window as any).gtag) return;

  (window as any).gtag("event", event, params || {});
}

