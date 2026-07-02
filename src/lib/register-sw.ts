// Guarded service-worker registration. Never register in dev, iframe, or
// Lovable preview hosts. Supports ?sw=off kill switch.
export async function registerServiceWorker() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isProd = import.meta.env.PROD;
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const isPreviewHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  const killSwitch = new URL(window.location.href).searchParams.get("sw") === "off";

  const shouldRefuse = !isProd || inIframe || isPreviewHost || killSwitch;

  if (shouldRefuse) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (r.active?.scriptURL?.endsWith("/sw.js")) await r.unregister();
      }
    } catch {
      /* noop */
    }
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.warn("SW registration failed", err);
  }
}
