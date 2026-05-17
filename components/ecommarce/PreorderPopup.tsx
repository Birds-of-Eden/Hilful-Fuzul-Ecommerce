"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Gift,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreorderPopupItem {
  title?: string;
  description?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
}

interface PreorderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  items?: PreorderPopupItem[];
}

export function PreorderPopup({
  isOpen,
  onClose,
  title = "নতুন বই প্রি-অর্ডার চলছে",
  description = "প্রকাশের আগেই আপনার পছন্দের বইটি অর্ডার করুন এবং বিশেষ সুবিধা পান।",
  image,
  buttonText = "এখনই প্রি-অর্ডার করুন",
  buttonLink = "https://docs.google.com/forms/d/e/1FAIpQLSd9deli8ciK4SWm5OFE-jdobk3VQ5O2BeOy6Zfh9HUUyExBiA/viewform",
  items = [],
}: PreorderPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const popupItems = useMemo<PreorderPopupItem[]>(() => {
    if (items.length > 0) return items;
    return [{ title, description, image, buttonText, buttonLink }];
  }, [items, title, description, image, buttonText, buttonLink]);

  const activeItem = popupItems[activeIndex] ?? popupItems[0];
  const hasMultiple = popupItems.length > 1;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [isOpen, popupItems.length]);

  useEffect(() => {
    if (!isOpen || !hasMultiple) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % popupItems.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isOpen, hasMultiple, popupItems.length]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => onClose(), 250);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % popupItems.length);
  };

  const goPrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + popupItems.length) % popupItems.length,
    );
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-opacity duration-300",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative flex items-center justify-center w-[90vw] h-[80vh] overflow-hidden rounded-3xl transition-all duration-300",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-110"
          aria-label="Close preorder popup"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-5 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-110"
              aria-label="Previous preorder"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-5 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 hover:scale-110"
              aria-label="Next preorder"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Main Content - Full Size Image */}
        <div className="relative w-full h-full">
          {/* Background Image */}
          {activeItem?.image ? (
            <Image
              src={activeItem.image}
              alt={activeItem?.title || "Preorder book"}
              fill
              className="object-contain"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0E4B4B] to-[#5FA3A3]" />
          )}

          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Text Content - Bottom Right */}
          <div className="absolute bottom-0 right-0 z-20 w-full max-w-2xl p-8 text-right md:p-12">
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#C0704D] px-4 py-2 shadow-lg">
              <Zap className="h-4 w-4 text-white" />
              <span className="text-sm font-bold text-white">
                সীমিত সময়ের অফার
              </span>
            </div>
            <div className="hidden md:block">
              {/* Title */}
              <h2 className="mb-3 text-4xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
                {activeItem?.title || title}
              </h2>

              {/* Description - with line-clamp-2 */}
              <p className="line-clamp-2 text-base leading-relaxed text-white/90 drop-shadow-md md:text-lg">
                {activeItem?.description || description}
              </p>

              {/* Features Grid */}
              <div className="mb-6 mt-4 flex flex-wrap justify-end gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  <Gift className="h-4 w-4" />
                  বিশেষ ছাড়
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  <Truck className="h-4 w-4" />
                  দ্রুত ডেলিভারি
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4" />
                  নিরাপদ অর্ডার
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={activeItem?.buttonLink || buttonLink}
              onClick={handleClose}
            >
              <Button className="h-14 rounded-2xl bg-gradient-to-r from-[#C0704D] to-[#A85D3F] px-8 text-base font-bold text-white shadow-lg transition-all hover:scale-105 hover:from-[#0E4B4B] hover:to-[#5FA3A3]">
                {activeItem?.buttonText || buttonText}
              </Button>
            </Link>

            {/* Later Link */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-white/80 underline-offset-2 transition hover:text-white hover:underline"
              >
                পরে দেখব
              </button>
            </div>
          </div>

          {/* Dots Navigation - Bottom Center */}
          {hasMultiple && (
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-sm">
              {popupItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    idx === activeIndex
                      ? "w-8 bg-[#C0704D]"
                      : "w-2 bg-white/60 hover:bg-white/80",
                  )}
                  aria-label={`Go to preorder ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
