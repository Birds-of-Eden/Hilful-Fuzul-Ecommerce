"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Zap } from "lucide-react";

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

interface PanelItem {
  title: string;
  description: string;
  image?: string;
  buttonText: string;
  buttonLink: string;
}

export default function PreorderHeroPanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [items, setItems] = useState<PanelItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (hidden) return;

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

        const panelItems: PanelItem[] = [];

        panelItems.push({
          title: data.preorderPopupTitle || "নতুন বই প্রি-অর্ডার চলছে",
          description:
            data.preorderPopupText ||
            "প্রকাশের আগেই আপনার পছন্দের বইটি প্রি-অর্ডার করুন",
          image: data.preorderPopupImage || undefined,
          buttonText: data.preorderButtonText || "প্রি-অর্ডার করুন",
          buttonLink: "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform",
        });

        if (productsRes.ok) {
          const products: PreorderProduct[] = await productsRes.json();

          const preorderProducts = products.filter((product) =>
            Boolean(product.isPreOrder ?? product.isPreorder)
          );

          panelItems.push(
            ...preorderProducts.map((product) => ({
              title: product.name,
              description:
                product.description?.replace(/<[^>]*>/g, "").trim() ||
                "এই বইটি এখন প্রি-অর্ডারে পাওয়া যাচ্ছে",
              image: product.image || undefined,
              buttonText: "প্রি-অর্ডার দেখুন",
              buttonLink: "/kitabghor/preorder",
            }))
          );
        }

        const deduped = panelItems.filter((item, index, arr) => {
          const key = `${item.title}::${item.image || ""}`;
          return (
            index ===
            arr.findIndex(
              (candidate) => `${candidate.title}::${candidate.image || ""}` === key
            )
          );
        });

        setItems(deduped);
      } catch (error) {
        console.error("Failed to load preorder hero panel:", error);
      }
    };

    fetchData();
  }, [hidden]);

  const hasMultiple = items.length > 1;

  useEffect(() => {
    if (hidden || !hasMultiple) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [hidden, hasMultiple, items.length]);

  const activeItem = useMemo(() => items[activeIndex], [items, activeIndex]);

  const close = () => setHidden(true);

  if (
    hidden ||
    !settings?.preorderPopupEnabled ||
    items.length === 0 ||
    !activeItem
  ) {
    return null;
  }

  return (
    <aside className="hidden lg:block">
      <div className="relative rounded-[32px] bg-white/20 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/30">
        <div className="relative overflow-hidden rounded-[26px] bg-white shadow-2xl">
          <Link href={activeItem.buttonLink || "#"} className="block">
            <div className="relative h-[450px] w-[420px] max-w-full bg-[#EEF3F2]">
              {activeItem.image ? (
                <Image
                  src={activeItem.image}
                  alt={activeItem.title}
                  fill
                  className="object-contain p-5"
                  sizes="420px"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#0E4B4B] to-[#5FA3A3]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0E4B4B]/95 via-[#0E4B4B]/35 to-transparent" />

              <div className="absolute bottom-0 right-0 z-20 w-full p-6 text-right text-white">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <Zap className="h-4 w-4 text-[#F6B26B]" />
                  প্রি-অর্ডার
                </div>

                <h3 className="ml-auto line-clamp-2 max-w-[340px] text-2xl font-extrabold leading-snug">
                  {activeItem.title}
                </h3>

                <p className="ml-auto mt-2 line-clamp-2 max-w-[330px] text-sm leading-6 text-white/90">
                  {activeItem.description}
                </p>

                <div className="mt-4 inline-flex rounded-full bg-[#C0704D] px-6 py-3 text-sm font-bold text-white shadow-lg">
                  {activeItem.buttonText}
                </div>
              </div>
            </div>
          </Link>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex(
                    (prev) => (prev - 1 + items.length) % items.length
                  )
                }
                className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#0E4B4B] shadow hover:bg-white"
                aria-label="Previous preorder"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev + 1) % items.length)
                }
                className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-[#0E4B4B] shadow hover:bg-white"
                aria-label="Next preorder"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/20 px-3 py-2 backdrop-blur">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeIndex ? "w-7 bg-white" : "w-2 bg-white/50"
                    }`}
                    aria-label={`Go to preorder ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
