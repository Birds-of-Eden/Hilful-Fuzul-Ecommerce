"use client";

import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  pdfUrl?: string;
  fileName?: string;
  onClose?: () => void;
}

const MessageOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 bg-gray-50/70 backdrop-blur-sm flex items-center justify-center p-4 z-10">
    <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      {children}
    </div>
  </div>
);

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

export default function PdfViewer({ pdfUrl, fileName, onClose }: PdfViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setNumPages(0);
    setPageNumber(1);
    setScale(1);
    setRotation(0);
  }, [pdfUrl]);

  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const handleLoadError = useCallback(() => {
    setError("পিডিএফ ফাইল লোড করা যায়নি। ফাইল লিঙ্ক যাচাই করুন।");
    setIsLoading(false);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  const rotate = () => setRotation((r) => (r + 90) % 360);
  const prevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNumber((p) => Math.min(numPages, p + 1));

  if (!isClient) {
    return (
      <MessageOverlay>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </MessageOverlay>
    );
  }

  if (!pdfUrl) {
    return (
      <MessageOverlay>
        <div className="relative">
          <div className="flex flex-col gap-2 mr-2">
            <p className="text-red-600 font-semibold">পিডিএফ URL পাওয়া যায়নি</p>
            <p className="text-gray-500 text-sm mt-1">
              অনুগ্রহ করে একটি সঠিক ফাইল লিঙ্ক দিন।
            </p>
          </div>
          <div
            onClick={onClose}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 p-2 shadow-md rounded-full cursor-pointer"
            aria-label="Close PDF viewer"
          >
            <X className="h-4 w-4 text-white" />
          </div>
        </div>
      </MessageOverlay>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 rounded-lg shadow-inner overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center p-2 bg-white rounded-t-lg shadow-md border-b border-gray-200 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevPage}
          disabled={pageNumber <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-gray-700 font-medium min-w-[70px] text-center select-none">
          {numPages ? `${pageNumber} / ${numPages}` : "..."}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextPage}
          disabled={pageNumber >= numPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <span className="text-sm text-gray-700 font-medium min-w-[48px] text-center select-none">
          {Math.round(scale * 100)}%
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button variant="ghost" size="icon" onClick={rotate} aria-label="Rotate page">
          <RotateCw className="h-4 w-4" />
        </Button>

        <a
          href={pdfUrl}
          download={fileName || true}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-gray-100 transition-colors text-[#0E4B4B]"
          aria-label="Download PDF"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>

      {/* Viewer */}
      <div className="flex-1 relative overflow-auto w-full flex justify-center items-start p-4 custom-scrollbar">
        {isLoading && (
          <MessageOverlay>
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-3 text-gray-700 font-medium">পিডিএফ লোড হচ্ছে...</p>
            </div>
          </MessageOverlay>
        )}

        {error && (
          <MessageOverlay>
            <div className="text-center text-red-600">
              <p className="font-semibold mb-2">{error}</p>
              <Button
                className="mt-2 bg-red-500 hover:bg-red-600"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                }}
              >
                আবার চেষ্টা করুন
              </Button>
            </div>
          </MessageOverlay>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            className="shadow-xl"
            loading={null}
          />
        </Document>
      </div>
    </div>
  );
}
