"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Users, Download, Clock, BookOpen, ListOrdered } from "lucide-react";

interface SessionRow {
  id: number;
  productId: number;
  product: { id: number; name: string };
  user: { id: string; name: string | null; email: string } | null;
  guestId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  maxPage: number;
  totalPages: number | null;
  downloaded: boolean;
  downloadedAt: string | null;
  downloaderName: string | null;
  downloaderPhone: string | null;
  downloaderEmail: string | null;
}

interface SummaryRow {
  productId: number;
  productName: string;
  uniqueReaders: number;
  totalSessions: number;
  avgDurationSec: number;
  avgMaxPage: number;
  downloadCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ReportData {
  sessions: SessionRow[];
  pagination: Pagination;
  summary: SummaryRow[];
}

const bnNumber = new Intl.NumberFormat("bn-BD");

function formatDuration(sec: number | null) {
  if (sec === null || Number.isNaN(sec)) return "-";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PdfReportManager() {
  const [activeTab, setActiveTab] = useState<"summary" | "sessions" | "downloads">("summary");
  const [page, setPage] = useState(1);
  const [readerType, setReaderType] = useState<"all" | "user" | "guest">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, ReportData>>(new Map());

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      if (readerType !== "all") params.set("readerType", readerType);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (productIdFilter) params.set("productId", productIdFilter);
      if (activeTab === "downloads") params.set("downloadedOnly", "true");

      const cacheKey = params.toString();
      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey)!);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/pdf-reports?${cacheKey}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "রিপোর্ট লোড করতে সমস্যা হয়েছে");
      }

      const result: ReportData = await res.json();
      setCache((prev) => new Map(prev).set(cacheKey, result));
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "রিপোর্ট লোড করতে সমস্যা হয়েছে";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, readerType, dateFrom, dateTo, productIdFilter, activeTab, cache]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const resetPageAnd = (fn: () => void) => {
    setPage(1);
    fn();
  };

  const totalReaders = data?.summary.reduce((sum, s) => sum + s.uniqueReaders, 0) ?? 0;
  const totalDownloads = data?.summary.reduce((sum, s) => sum + s.downloadCount, 0) ?? 0;
  const totalSessions = data?.pagination.total ?? 0;

  return (
    <div className="min-h-screen w-full bg-[#F4F7ED] px-4 py-10">
      <div className="flex-col gap-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#1D3B2A]">
            | পিডিএফ রিডিং রিপোর্ট |
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            কে কোন বই কতক্ষণ পড়েছে, কত পৃষ্ঠা পর্যন্ত পড়েছে এবং ডাউনলোড করেছে কিনা তা দেখুন
          </p>
        </div>

        {/* top stat cards */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm md:w-1/4">
            <div>
              <p className="text-xs text-gray-500">মোট সেশন</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">
                {bnNumber.format(totalSessions)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D3B2A] text-white">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="flex w-full items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm md:w-1/4">
            <div>
              <p className="text-xs text-gray-500">মোট পাঠক (এই পাতার বইসমূহ)</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">
                {bnNumber.format(totalReaders)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D3B2A] text-white">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="flex w-full items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-sm md:w-1/4">
            <div>
              <p className="text-xs text-gray-500">মোট ডাউনলোড</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">
                {bnNumber.format(totalDownloads)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1D3B2A] text-white">
              <Download className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
          <select
            value={readerType}
            onChange={(e) =>
              resetPageAnd(() => setReaderType(e.target.value as "all" | "user" | "guest"))
            }
            className="rounded-full border border-gray-200 bg-[#1D3B2A] px-4 py-2 text-sm text-white shadow-sm"
          >
            <option value="all">সব পাঠক</option>
            <option value="user">শুধু লগইনকৃত</option>
            <option value="guest">শুধু গেস্ট</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => resetPageAnd(() => setDateFrom(e.target.value))}
            className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none"
          />
          <span className="text-xs text-gray-400">থেকে</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => resetPageAnd(() => setDateTo(e.target.value))}
            className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none"
          />
          <span className="text-xs text-gray-400">পর্যন্ত</span>

          <input
            value={productIdFilter}
            onChange={(e) => resetPageAnd(() => setProductIdFilter(e.target.value))}
            placeholder="Product ID দিয়ে ফিল্টার..."
            className="flex-1 min-w-[160px] rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 text-center text-sm text-gray-500">লোড হচ্ছে...</div>
        )}

        {/* tabs */}
        <div className="mt-8 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => {
              setPage(1);
              setActiveTab("summary");
            }}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === "summary"
                ? "bg-white text-[#1D3B2A] shadow-sm border border-b-0 border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="h-4 w-4" /> বই অনুযায়ী সারসংক্ষেপ
          </button>
          <button
            onClick={() => {
              setPage(1);
              setActiveTab("sessions");
            }}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === "sessions"
                ? "bg-white text-[#1D3B2A] shadow-sm border border-b-0 border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListOrdered className="h-4 w-4" /> পঠন সেশন লগ
          </button>
          <button
            onClick={() => {
              setPage(1);
              setActiveTab("downloads");
            }}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === "downloads"
                ? "bg-white text-[#1D3B2A] shadow-sm border border-b-0 border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Download className="h-4 w-4" /> ডাউনলোড তথ্য
          </button>
        </div>

        {!loading && !error && data && (
          <>
            {/* per-book summary */}
            {activeTab === "summary" && (
            <div className="mt-0 rounded-b-2xl rounded-tr-2xl bg-white p-4 shadow-sm">
              {data.summary.length === 0 ? (
                <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm">
                  এখনও কোন পঠন সেশন রেকর্ড হয়নি।
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500">
                        <th className="px-4 py-3">বই</th>
                        <th className="px-4 py-3">ইউনিক পাঠক</th>
                        <th className="px-4 py-3">মোট সেশন</th>
                        <th className="px-4 py-3">গড় সময়</th>
                        <th className="px-4 py-3">গড় সর্বোচ্চ পৃষ্ঠা</th>
                        <th className="px-4 py-3">ডাউনলোড</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.summary.map((s) => (
                        <tr key={s.productId} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {s.productName}
                          </td>
                          <td className="px-4 py-3">{bnNumber.format(s.uniqueReaders)}</td>
                          <td className="px-4 py-3">{bnNumber.format(s.totalSessions)}</td>
                          <td className="px-4 py-3 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDuration(s.avgDurationSec)}
                          </td>
                          <td className="px-4 py-3">{s.avgMaxPage.toFixed(1)}</td>
                          <td className="px-4 py-3">{bnNumber.format(s.downloadCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}

            {/* session log */}
            {activeTab === "sessions" && (
            <div className="mt-0 rounded-b-2xl rounded-tr-2xl bg-white p-4 shadow-sm">
              {data.sessions.length === 0 ? (
                <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm">
                  কোন সেশন পাওয়া যায়নি।
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500">
                        <th className="px-4 py-3">বই</th>
                        <th className="px-4 py-3">পাঠক</th>
                        <th className="px-4 py-3">শুরু</th>
                        <th className="px-4 py-3">শেষ</th>
                        <th className="px-4 py-3">সময়</th>
                        <th className="px-4 py-3">পৃষ্ঠা</th>
                        <th className="px-4 py-3">ডাউনলোড</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((s) => (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {s.product.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.user
                              ? s.user.name || s.user.email
                              : `Guest${s.guestId ? `-${s.guestId.slice(0, 8)}` : ""}`}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(s.startedAt)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.endedAt ? (
                              formatDate(s.endedAt)
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                চলমান
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDuration(s.durationSec)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.maxPage}
                            {s.totalPages ? ` / ${s.totalPages}` : ""}
                          </td>
                          <td className="px-4 py-3">
                            {s.downloaded ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                হ্যাঁ
                              </span>
                            ) : (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                                না
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {data.pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    পূর্বের
                  </button>
                  <span className="text-gray-600">
                    পেজ {data.pagination.page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.pages, p + 1))
                    }
                    disabled={page === data.pagination.pages}
                    className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    পরের
                  </button>
                </div>
              )}
            </div>
            )}

            {/* download info */}
            {activeTab === "downloads" && (
            <div className="mt-0 rounded-b-2xl rounded-tr-2xl bg-white p-4 shadow-sm">
              {data.sessions.length === 0 ? (
                <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-sm">
                  এখনও কেউ ডাউনলোড করেনি।
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-xs text-gray-500">
                        <th className="px-4 py-3">বই</th>
                        <th className="px-4 py-3">নাম</th>
                        <th className="px-4 py-3">মোবাইল</th>
                        <th className="px-4 py-3">ইমেইল</th>
                        <th className="px-4 py-3">ডাউনলোডের সময়</th>
                        <th className="px-4 py-3">পাঠক</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((s) => (
                        <tr key={s.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {s.product.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.downloaderName || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.downloaderPhone || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.downloaderEmail || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.downloadedAt ? formatDate(s.downloadedAt) : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.user
                              ? s.user.name || s.user.email
                              : `Guest${s.guestId ? `-${s.guestId.slice(0, 8)}` : ""}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {data.pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    পূর্বের
                  </button>
                  <span className="text-gray-600">
                    পেজ {data.pagination.page} / {data.pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.pages, p + 1))
                    }
                    disabled={page === data.pagination.pages}
                    className="rounded-full bg-white px-4 py-2 text-gray-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    পরের
                  </button>
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
