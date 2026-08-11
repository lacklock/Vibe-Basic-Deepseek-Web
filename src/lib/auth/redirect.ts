const FALLBACK_PATH = "/";

export function getSafeRedirect(value: string | null | undefined, fallback = FALLBACK_PATH) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const base = new URL("http://app.local");
    const target = new URL(value, base);

    if (target.origin !== base.origin) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
