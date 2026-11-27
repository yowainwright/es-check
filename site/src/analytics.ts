import type { RegisteredRouter } from "@tanstack/react-router";

const measurementId = "G-5BH1F8XBX5";

declare global {
  interface Window {
    dataLayer: IArguments[];
  }
}

export function startAnalytics(router: RegisteredRouter) {
  const isProductionSite = import.meta.env.PROD && window.location.origin === "https://jeffry.in";
  if (!isProductionSite) return;
  window.dataLayer ??= [];
  gtag("js", new Date());
  gtag("config", measurementId, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
  return router.subscribe("onResolved", ({ pathChanged, fromLocation }) => {
    if (!pathChanged) return;
    const previous = fromLocation?.publicHref;
    const referrer = previous ? new URL(previous, window.location.origin).href : document.referrer;
    gtag("event", "page_view", { page_location: window.location.href, page_referrer: referrer });
  });
}

function gtag(..._command: unknown[]) {
  // Google Tag intercepts push on the original dataLayer array.
  // oxlint-disable-next-line legibility/no-standalone-array-mutations
  window.dataLayer.push(arguments);
}
