"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export interface DownloaderInfo {
  name: string;
  phone: string;
  email: string;
}

interface PdfViewerProps {
  pdfUrl?: string;
  fileName?: string;
  onClose?: () => void;
  onLoadSuccess?: (numPages: number) => void;
  onPageChange?: (pageNumber: number) => void;
  onDownload?: (info: DownloaderInfo) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const SPREAD_BREAKPOINT = 760;

const MessageOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#f5f0e6]/85 p-4 backdrop-blur-sm">
    <div className="max-w-sm rounded-2xl border border-[#d9d0c0] bg-white p-6 text-center shadow-xl sm:p-8">
      {children}
    </div>
  </div>
);

export default function PdfViewer({
  pdfUrl,
  fileName,
  onClose,
  onLoadSuccess,
  onPageChange,
  onDownload,
}: PdfViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [turnDirection, setTurnDirection] = useState<1 | -1>(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [downloaderName, setDownloaderName] = useState("");
  const [downloaderPhone, setDownloaderPhone] = useState("");
  const [downloaderEmail, setDownloaderEmail] = useState("");
  const [downloadFormError, setDownloadFormError] = useState<string | null>(
    null,
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const pointerStartX = useRef<number | null>(null);
  const panStart = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const isSpread =
    viewportWidth >= SPREAD_BREAKPOINT && rotation % 180 === 0;

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setNumPages(0);
    setPageNumber(1);
    setPageInput("1");
    setScale(1);
    setRotation(0);
  }, [pdfUrl]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isClient]);

  useEffect(() => {
    if (isSpread && pageNumber > 1 && pageNumber % 2 !== 0) {
      const spreadStart = pageNumber - 1;
      setPageNumber(spreadStart);
      setPageInput(String(spreadStart));
    }
  }, [isSpread, pageNumber]);

  const goToPage = useCallback(
    (requestedPage: number, direction?: 1 | -1) => {
      if (!numPages) return;

      let nextPage = Math.min(numPages, Math.max(1, requestedPage));
      if (isSpread && nextPage > 1 && nextPage % 2 !== 0) {
        nextPage -= 1;
      }

      setTurnDirection(direction ?? (nextPage >= pageNumber ? 1 : -1));
      setPageNumber(nextPage);
      setPageInput(String(nextPage));
      onPageChange?.(nextPage);
    },
    [isSpread, numPages, onPageChange, pageNumber],
  );

  const prevPage = useCallback(() => {
    const previous = isSpread
      ? pageNumber <= 2
        ? 1
        : pageNumber - 2
      : pageNumber - 1;
    goToPage(previous, -1);
  }, [goToPage, isSpread, pageNumber]);

  const nextPage = useCallback(() => {
    const next = isSpread
      ? pageNumber === 1
        ? 2
        : pageNumber + 2
      : pageNumber + 1;
    goToPage(next, 1);
  }, [goToPage, isSpread, pageNumber]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showDownloadForm) return;

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prevPage();
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        nextPage();
      }
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, onClose, prevPage, showDownloadForm]);

  const handleLoadSuccess = useCallback(
    ({ numPages: loadedPages }: { numPages: number }) => {
      setNumPages(loadedPages);
      setIsLoading(false);
      onLoadSuccess?.(loadedPages);
    },
    [onLoadSuccess],
  );

  const handleLoadError = useCallback(() => {
    setError("PDF ফাইলটি লোড করা যায়নি। ফাইলের লিংকটি যাচাই করুন।");
    setIsLoading(false);
  }, []);

  const visiblePages = useMemo(() => {
    if (!numPages) return [];
    if (!isSpread || pageNumber === 1) return [pageNumber];
    return [pageNumber, pageNumber + 1].filter((page) => page <= numPages);
  }, [isSpread, numPages, pageNumber]);

  const basePageWidth = Math.max(
    260,
    Math.floor(
      isSpread ? (Math.max(viewportWidth, 640) - 68) / 2 : viewportWidth - 28,
    ),
  );

  const isAtEnd = isSpread
    ? pageNumber >= numPages || pageNumber + 1 >= numPages
    : pageNumber >= numPages;

  const pageLabel =
    visiblePages.length === 2
      ? `${visiblePages[0]}–${visiblePages[1]} / ${numPages}`
      : `${pageNumber} / ${numPages || "…"}`;

  const commitPageInput = () => {
    const requestedPage = Number(pageInput);
    if (Number.isFinite(requestedPage)) goToPage(requestedPage);
    else setPageInput(String(pageNumber));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scale > 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
      panStart.current = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: event.currentTarget.scrollLeft,
        scrollTop: event.currentTarget.scrollTop,
      };
      return;
    }

    if (event.pointerType === "touch") pointerStartX.current = event.clientX;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panStart.current) return;
    event.preventDefault();
    event.currentTarget.scrollLeft =
      panStart.current.scrollLeft - (event.clientX - panStart.current.x);
    event.currentTarget.scrollTop =
      panStart.current.scrollTop - (event.clientY - panStart.current.y);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panStart.current) {
      panStart.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (distance > 55) prevPage();
    if (distance < -55) nextPage();
  };

  const changeZoom = (nextScale: number) => {
    const viewport = viewportRef.current;
    const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));

    if (!viewport || clampedScale === scale) {
      setScale(clampedScale);
      return;
    }

    const contentCenterX = viewport.scrollLeft + viewport.clientWidth / 2;
    const contentCenterY = viewport.scrollTop + viewport.clientHeight / 2;
    const ratio = clampedScale / scale;

    setScale(clampedScale);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        viewport.scrollLeft = contentCenterX * ratio - viewport.clientWidth / 2;
        viewport.scrollTop = contentCenterY * ratio - viewport.clientHeight / 2;
      });
    });
  };

  const zoomIn = () => changeZoom(+(scale + SCALE_STEP).toFixed(2));
  const zoomOut = () => changeZoom(+(scale - SCALE_STEP).toFixed(2));

  const openDownloadForm = () => {
    setDownloadFormError(null);
    setShowDownloadForm(true);
  };

  const closeDownloadForm = () => {
    setShowDownloadForm(false);
    setDownloadFormError(null);
  };

  const handleDownloadSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = downloaderName.trim();
    const phone = downloaderPhone.trim();
    const email = downloaderEmail.trim();

    if (!name || !phone || !email) {
      setDownloadFormError("নাম, মোবাইল ও ইমেইল—সব তথ্য পূরণ করুন।");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDownloadFormError("সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }

    onDownload?.({ name, phone, email });
    setShowDownloadForm(false);
    downloadLinkRef.current?.click();
  };

  if (!isClient) {
    return (
      <MessageOverlay>
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0E4B4B]" />
      </MessageOverlay>
    );
  }

  if (!pdfUrl) {
    return (
      <MessageOverlay>
        <BookOpen className="mx-auto mb-3 h-9 w-9 text-red-500" />
        <p className="font-semibold text-red-600">PDF URL পাওয়া যায়নি</p>
        <p className="mt-1 text-sm text-gray-500">
          অনুগ্রহ করে বইটির সঠিক PDF ফাইল যোগ করুন।
        </p>
        {onClose && (
          <Button variant="outline" className="mt-5" onClick={onClose}>
            বন্ধ করুন
          </Button>
        )}
      </MessageOverlay>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#e7e0d3]">
      <div className="z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#d3c8b7] bg-white/95 px-2 py-2 shadow-sm backdrop-blur sm:px-4">
        <div className="flex items-center gap-1 rounded-xl bg-[#f2f6f6] p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#0E4B4B]"
            onClick={prevPage}
            disabled={pageNumber <= 1}
            aria-label="আগের পাতা"
            title="আগের পাতা (←)"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex h-9 items-center rounded-lg border border-[#cddada] bg-white px-2 text-sm font-medium text-[#173d3d]">
            <input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              inputMode="numeric"
              aria-label="পাতার নম্বর"
              className="w-8 bg-transparent text-center outline-none"
            />
            <span className="whitespace-nowrap text-gray-400">
              / {numPages || "…"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#0E4B4B]"
            onClick={nextPage}
            disabled={isAtEnd}
            aria-label="পরের পাতা"
            title="পরের পাতা (→)"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            aria-label="ছোট করুন"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            type="button"
            className="min-w-12 text-center text-xs font-semibold text-gray-600"
            onClick={() => changeZoom(1)}
            title="স্ক্রিনের সঙ্গে মানানসই করুন"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            aria-label="বড় করুন"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setRotation((current) => (current + 90) % 360)}
            aria-label="পাতা ঘোরান"
            title="পাতা ঘোরান"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#0E4B4B]"
            onClick={openDownloadForm}
            aria-label="PDF ডাউনলোড করুন"
            title="PDF ডাউনলোড করুন"
          >
            <Download className="h-4 w-4" />
          </Button>
          <a
            ref={downloadLinkRef}
            href={pdfUrl}
            download={fileName || true}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-6 ${
          scale > 1
            ? "touch-none cursor-grab select-none active:cursor-grabbing"
            : "touch-pan-y"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => changeZoom(scale === 1 ? 1.75 : 1)}
        onPointerCancel={() => {
          panStart.current = null;
          pointerStartX.current = null;
        }}
      >
        {isLoading && (
          <MessageOverlay>
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#0E4B4B]" />
            <p className="mt-3 font-medium text-gray-700">বইটি খোলা হচ্ছে…</p>
          </MessageOverlay>
        )}

        {error && (
          <MessageOverlay>
            <p className="font-semibold text-red-600">{error}</p>
            <Button
              className="mt-4 bg-[#0E4B4B] hover:bg-[#0b3c3c]"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setReloadKey((key) => key + 1);
              }}
            >
              আবার চেষ্টা করুন
            </Button>
          </MessageOverlay>
        )}

        <Document
          key={reloadKey}
          file={pdfUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
          className="flex min-h-full w-max min-w-full items-start justify-center"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${pageNumber}-${isSpread}-${rotation}`}
              initial={{
                opacity: 0.45,
                x: turnDirection > 0 ? 36 : -36,
                rotateY: turnDirection > 0 ? -8 : 8,
              }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{
                opacity: 0.35,
                x: turnDirection > 0 ? -30 : 30,
                rotateY: turnDirection > 0 ? 7 : -7,
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex w-max shrink-0 items-stretch justify-center [perspective:1800px]"
            >
              {visiblePages.map((visiblePage, index) => (
                <div
                  key={visiblePage}
                  className={`relative overflow-hidden bg-white shadow-[0_16px_40px_rgba(50,38,20,0.22)] ${
                    visiblePages.length === 2
                      ? index === 0
                        ? "rounded-l-md border-r border-black/10"
                        : "rounded-r-md"
                      : "rounded-md"
                  }`}
                >
                  <Page
                    pageNumber={visiblePage}
                    width={basePageWidth}
                    scale={scale}
                    rotate={rotation}
                    loading={null}
                    className="bg-white"
                  />
                  {visiblePages.length === 2 && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 z-10 w-5 ${
                        index === 0
                          ? "right-0 bg-gradient-to-l from-black/15 to-transparent"
                          : "left-0 bg-gradient-to-r from-black/15 to-transparent"
                      }`}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </Document>

        {!isLoading && !error && (
          <>
            <button
              type="button"
              onClick={prevPage}
              disabled={pageNumber <= 1}
              aria-label="আগের পাতা"
              className="fixed left-2 top-1/2 z-10 hidden h-14 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#0E4B4B] shadow-lg backdrop-blur transition hover:bg-white disabled:hidden sm:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={isAtEnd}
              aria-label="পরের পাতা"
              className="fixed right-2 top-1/2 z-10 hidden h-14 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#0E4B4B] shadow-lg backdrop-blur transition hover:bg-white disabled:hidden sm:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="z-20 shrink-0 border-t border-[#d3c8b7] bg-white px-3 py-2 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="hidden min-w-24 text-xs font-semibold text-[#315b5b] sm:block">
            {pageLabel}
          </span>
          <input
            type="range"
            min={1}
            max={Math.max(1, numPages)}
            value={pageNumber}
            onChange={(event) => goToPage(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer accent-[#0E4B4B]"
            aria-label="পাতা নির্বাচন করুন"
          />
          <span className="whitespace-nowrap text-[11px] text-gray-500">
            <span className="sm:hidden">{pageLabel}</span>
            <span className="hidden sm:inline">
              {isSpread ? "দুই পাতার বই" : "এক পাতা"}
            </span>
          </span>
        </div>
        <p className="mt-1 text-center text-[10px] text-gray-400">
          {scale > 1
            ? "পাতা ধরে টেনে চারদিকে দেখুন • উপরের zoom শতাংশে চাপলে ফিট হবে"
            : "ডাবল ট্যাপ করে বড় করুন • ডানে-বামে সোয়াইপ করে পাতা উল্টান"}
        </p>
      </div>

      {showDownloadForm && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-download-form-title"
        >
          <form
            onSubmit={handleDownloadSubmit}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-1 flex items-start justify-between gap-3">
              <h3
                id="pdf-download-form-title"
                className="text-lg font-bold text-[#0D1414]"
              >
                ডাউনলোডের তথ্য
              </h3>
              <button
                type="button"
                onClick={closeDownloadForm}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                aria-label="বন্ধ করুন"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              PDF ডাউনলোড করতে নিচের তথ্যগুলো পূরণ করুন।
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                নাম
                <input
                  type="text"
                  value={downloaderName}
                  onChange={(event) => setDownloaderName(event.target.value)}
                  placeholder="আপনার নাম"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#5FA3A3] focus:ring-2 focus:ring-[#5FA3A3]/20"
                  autoFocus
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                মোবাইল নম্বর
                <input
                  type="tel"
                  value={downloaderPhone}
                  onChange={(event) => setDownloaderPhone(event.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#5FA3A3] focus:ring-2 focus:ring-[#5FA3A3]/20"
                />
              </label>
              <label className="block text-xs font-medium text-gray-600">
                ইমেইল
                <input
                  type="email"
                  value={downloaderEmail}
                  onChange={(event) => setDownloaderEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#5FA3A3] focus:ring-2 focus:ring-[#5FA3A3]/20"
                />
              </label>
            </div>

            {downloadFormError && (
              <p className="mt-3 text-xs font-medium text-red-600">
                {downloadFormError}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeDownloadForm}
              >
                বাতিল
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#0E4B4B] hover:bg-[#0b3c3c]"
              >
                <Download className="mr-2 h-4 w-4" />
                ডাউনলোড
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
