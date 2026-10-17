export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://www.shenye.xin"
).replace(/\/+$/, "");

export function getPublicLetterUrl(letterId: string | number): string {
  return `${PUBLIC_SITE_URL}/letter/${encodeURIComponent(String(letterId))}`;
}

export function getDailyQuoteUrl(quoteId: string | number = "today"): string {
  return `${PUBLIC_SITE_URL}/daily-quote?quote=${encodeURIComponent(String(quoteId))}`;
}
