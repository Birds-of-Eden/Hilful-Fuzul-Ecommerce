export type Ga4Item = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GA_ID ||
  "";

function canTrack() {
  return typeof window !== "undefined" && Boolean(GA_ID) && typeof window.gtag === "function";
}

export function gaEvent(eventName: string, params: Record<string, any> = {}) {
  if (!canTrack()) return;
  window.gtag!("event", eventName, params);
}

export function gaEcommerceEvent(
  eventName: string,
  params: {
    currency?: string;
    value?: number;
    items?: Ga4Item[];
    [key: string]: any;
  },
) {
  gaEvent(eventName, {
    currency: "BDT",
    ...params,
  });
}

