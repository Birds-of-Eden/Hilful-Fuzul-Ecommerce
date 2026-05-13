"use client";

import { useEffect, useState } from "react";
import { PreorderPopup } from "@/components/ecommarce/PreorderPopup";
import { usePathname } from "next/navigation";

interface SiteSettings {
  preorderPopupEnabled: boolean;
  preorderPopupTitle: string | null;
  preorderPopupText: string | null;
  preorderPopupImage: string | null;
  preorderButtonText: string | null;
  preorderLink: string | null;
}

interface PreorderProduct {
  id: number | string;
  name: string;
  image?: string | null;
  description?: string | null;
  isPreOrder?: boolean;
  isPreorder?: boolean;
}

interface PopupItem {
  title?: string;
  description?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
}

// Helper functions for text truncation
const stripHtml = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
};

const truncateText = (value?: string | null, limit = 90) => {
  const cleanText = stripHtml(value);
  if (!cleanText) return "";
  return cleanText.length > limit
    ? `${cleanText.slice(0, limit)}...`
    : cleanText;
};

export function PreorderPopupWrapper() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [items, setItems] = useState<PopupItem[]>([]);

  useEffect(() => {
    if (pathname !== "/") {
      setIsOpen(false);
      return;
    }

    let timer: number | null = null;

    const fetchData = async () => {
      try {
        const [settingsRes, productsRes] = await Promise.all([
          fetch("/api/sitemanagement", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);

        if (!settingsRes.ok) return;

        const data: SiteSettings = await settingsRes.json();
        setSettings(data);

        if (!data.preorderPopupEnabled) return;

        const popupItems: PopupItem[] = [];

        if (data.preorderPopupTitle || data.preorderPopupImage || data.preorderPopupText) {
          popupItems.push({
            title: data.preorderPopupTitle || "নতুন বই প্রি-অর্ডার চলছে",
            description:
              truncateText(data.preorderPopupText, 90) ||
              "প্রকাশের আগেই আপনার পছন্দের বইটি প্রি-অর্ডার করুন",
            image: data.preorderPopupImage || undefined,
            buttonText: data.preorderButtonText || "প্রি-অর্ডার করুন",
            buttonLink: data.preorderLink || "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform",
          });
        }

        if (productsRes.ok) {
          const products: PreorderProduct[] = await productsRes.json();
          const preorderProducts = products.filter((product) =>
            Boolean(product.isPreOrder ?? product.isPreorder)
          );

          popupItems.push(
            ...preorderProducts.map((product) => ({
              title: product.name,
              description:
                truncateText(product.description, 90) ||
                "এই বইটি এখন প্রি-অর্ডারে পাওয়া যাচ্ছে",
              image: product.image || undefined,
              buttonText: "বিস্তারিত দেখুন",
              buttonLink: `/kitabghor/books/${product.id}`,
            }))
          );
        }

        if (popupItems.length === 0) {
          popupItems.push({
            title: "নতুন বই প্রি-অর্ডার চলছে",
            description: "প্রকাশের আগেই আপনার পছন্দের বইটি প্রি-অর্ডার করুন",
            image: data.preorderPopupImage || undefined,
            buttonText: data.preorderButtonText || "প্রি-অর্ডার করুন",
            buttonLink: data.preorderLink || "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform",
          });
        }

        const deduped = popupItems.filter((item, index, arr) => {
          const key = `${item.title || ""}::${item.buttonLink || ""}`;
          return (
            index ===
            arr.findIndex(
              (candidate) =>
                `${candidate.title || ""}::${candidate.buttonLink || ""}` === key
            )
          );
        });

        setItems(deduped);

        timer = window.setTimeout(() => setIsOpen(true), 800);
      } catch (error) {
        console.error("Failed to fetch preorder popup data:", error);
      }
    };

    fetchData();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname]);

  const handleClose = () => setIsOpen(false);

  if (pathname !== "/" || !settings?.preorderPopupEnabled) return null;

  return (
    <PreorderPopup
      isOpen={isOpen}
      onClose={handleClose}
      title={settings.preorderPopupTitle || "নতুন বই প্রি-অর্ডার চলছে"}
      description={
        truncateText(settings.preorderPopupText, 90) ||
        "প্রকাশের আগেই আপনার পছন্দের বইটি অর্ডার করুন"
      }
      image={settings.preorderPopupImage || undefined}
      buttonText={settings.preorderButtonText || "প্রি-অর্ডার করুন"}
      buttonLink={settings.preorderLink || "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform"}
      items={items}
    />
  );
}