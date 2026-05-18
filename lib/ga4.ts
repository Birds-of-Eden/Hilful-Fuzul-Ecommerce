// lib/ga4.ts

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
  return (
    typeof window !== "undefined" &&
    Boolean(GA_ID) &&
    typeof window.gtag === "function"
  );
}

export function gaEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;

  // Prefer gtag() when available (direct GA4 install).
  if (canTrack()) {
    window.gtag!("event", eventName, params);
    return;
  }

  // Fallback for GTM-only installs: push a custom event object to dataLayer.
  // This allows you to verify events in `window.dataLayer` and map them in GTM.
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
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

// Ecommerce Events

export function trackViewItem(item: Ga4Item) {
  gaEcommerceEvent("view_item", {
    value: item.price || 0,
    items: [item],
  });
}

export function trackAddToCart(item: Ga4Item) {
  gaEcommerceEvent("add_to_cart", {
    value: (item.price || 0) * (item.quantity || 1),
    items: [item],
  });
}

export function trackBeginCheckout(items: Ga4Item[], value: number) {
  gaEcommerceEvent("begin_checkout", {
    value,
    items,
  });
}

export function trackAddShippingInfo(
  items: Ga4Item[],
  value: number,
  shippingTier: string,
) {
  gaEcommerceEvent("add_shipping_info", {
    value,
    shipping_tier: shippingTier,
    items,
  });
}

export function trackAddPaymentInfo(
  items: Ga4Item[],
  value: number,
  paymentType: string,
) {
  gaEcommerceEvent("add_payment_info", {
    value,
    payment_type: paymentType,
    items,
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  shipping?: number;
  tax?: number;
  items: Ga4Item[];
}) {
  gaEcommerceEvent("purchase", params);
}
