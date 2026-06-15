/**
 * Minimal Google Analytics 4 helper.
 *
 * Tracking is OPT-IN: the gtag('consent', 'default', ...) call in index.html
 * blocks everything by default. Consent flips ON via the CookieConsent banner.
 *
 * To enable GA4, replace {{GA4_MEASUREMENT_ID}} in index.html with your own
 * G-XXXXXXXXXX measurement id and uncomment the gtag('config', ...) line.
 */

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function trackPageView(path: string): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

export function grantAnalyticsConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    security_storage: 'granted',
  });
}

export function denyAnalyticsConsent(): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
  });
}
