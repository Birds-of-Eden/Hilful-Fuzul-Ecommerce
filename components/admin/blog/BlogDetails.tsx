// components/blog/BlogDetails.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import RecentBlogs from "./RecentBlogs"; // Assuming this is the correct path

interface Blog {
  id: number;
  slug: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  date: string | Date;
  image?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ----------------------------------------------------------------
// 💡 Add Placeholder for Google AdSense
// Replace the content inside this component with your actual AdSense code (e.g., <ins class="adsbygoogle" ... />>)
// ----------------------------------------------------------------
const AdPlaceholder = ({
  title,
  widthClass,
}: {
  title: string;
  widthClass: string;
}) => (
  <div className={`${widthClass} h-full hidden lg:block`}>
    <div className="sticky top-6 p-4 border border-dashed border-[#D1D8BE]/50 rounded-2xl bg-gradient-to-br from-[#F4F8F7]/30 to-white/50 backdrop-blur-sm h-[600px] flex items-center justify-center text-center text-sm text-[#819A91] shadow-lg">
      <div className="space-y-2">
        <svg
          className="w-8 h-8 mx-auto text-[#819A91]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="font-medium">{title}</p>
      </div>
    </div>
  </div>
);
// ----------------------------------------------------------------

export default function BlogDetails() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const blogSlug = params?.slug;

  // State Hooks
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogCache, setBlogCache] = useState<Map<string, Blog>>(new Map());

  // Memoize the fetch function to prevent unnecessary re-creations
  const fetchBlogDetails = useCallback(async (slug: string) => {
    // Check cache first
    if (blogCache.has(slug)) {
      const cachedBlog = blogCache.get(slug);
      if (cachedBlog) {
        setBlog(cachedBlog);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // First try to fetch by slug
      let response = await fetch(`/api/blog/slug/${slug}`);

      // If slug-based fetch fails (404), try ID-based fetch for backward compatibility
      if (!response.ok) {
        response = await fetch(`/api/blog/${slug}`);
      }

      if (!response.ok) {
        throw new Error("Failed to fetch blog");
      }

      const data = await response.json();
      
      // Update cache
      setBlogCache(prev => new Map(prev).set(slug, data));
      setBlog(data);
    } catch (err) {
      console.error("Error fetching blog details:", err);
      setError("Failed to load blog. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [blogCache]);

  // Generate SEO metadata - memoized to prevent unnecessary recalculations
  const seoData = useMemo(() => {
    if (!blog) return null;

    const baseUrl = "https://hilfulfujulbd.com";
    const blogUrl = `${baseUrl}/kitabghor/blogs/${blog.slug}`;
    const imageUrl = blog.image
      ? `${baseUrl}${blog.image}`
      : `${baseUrl}/images/books-collection.jpg`;

    // Extract first 150 characters for description
    const description =
      blog.summary.length > 150
        ? blog.summary.substring(0, 150) + "..."
        : blog.summary;

    return {
      title: `${blog.title} - কিতাবঘর | হিলফুল ফুজুল`,
      description: description,
      keywords: [
        blog.title,
        "কিতাবঘর",
        "হিলফুল ফুজুল",
        "ইসলামিক ব্লগ",
        "ইসলামিক বই",
        "আধ্যাত্মিক জ্ঞান",
        blog.author,
        ...blog.title.split(" ").filter((word) => word.length > 3),
      ],
      canonical: blogUrl,
      openGraph: {
        title: blog.title,
        description: description,
        url: blogUrl,
        type: "article",
        siteName: "কিতাবঘর - হিলফুল ফুজুল",
        locale: "bn_BD",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: blog.title,
            type: "image/jpeg",
          },
        ],
        article: {
          publishedTime: new Date(blog.createdAt).toISOString(),
          modifiedTime: new Date(blog.updatedAt).toISOString(),
          authors: [blog.author],
          tags: ["ইসলামিক ব্লগ", "কিতাবঘর", "হিলফুল ফুজুল"],
        },
      },
      twitter: {
        card: "summary_large_image",
        title: blog.title,
        description: description,
        images: [imageUrl],
        creator: "@hilfulfujulbd",
        site: "@hilfulfujulbd",
      },
    };
  }, [blog]);

  // Memoize structured data to prevent unnecessary recalculations
  const structuredData = useMemo(() => {
    if (!blog || !seoData) return null;

    return {
      blogPosting: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": seoData.canonical,
        headline: blog.title,
        description: seoData.description,
        image: seoData.openGraph.images[0]?.url,
        url: seoData.canonical,
        datePublished: new Date(blog.createdAt).toISOString(),
        dateModified: new Date(blog.updatedAt).toISOString(),
        author: {
          "@type": "Person",
          name: blog.author,
        },
        publisher: {
          "@type": "Organization",
          name: "কিতাবঘর - হিলফুল ফুজুল",
          url: "https://hilfulfujulbd.com",
          logo: {
            "@type": "ImageObject",
            url: "https://hilfulfujulbd.com/logo.png",
            width: 512,
            height: 512,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": seoData.canonical,
        },
        inLanguage: "bn-BD",
        isPartOf: {
          "@type": "Blog",
          "@id": "https://hilfulfujulbd.com/kitabghor/blogs",
          name: "কিতাবঘর ব্লগ",
        },
        wordCount: blog.content ? blog.content.split(" ").length : 0,
        keywords: seoData.keywords.join(", "),
        articleSection: "ইসলামিক ব্লগ",
      },
      breadcrumb: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "হোম",
            item: "https://hilfulfujulbd.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "কিতাবঘর",
            item: "https://hilfulfujulbd.com/",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "ব্লগসমূহ",
            item: "https://hilfulfujulbd.com/kitabghor/blogs",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: blog.title,
            item: seoData.canonical,
          },
        ],
      },
    };
  }, [blog, seoData]);

  // Fetch blog data when slug changes
  useEffect(() => {
    if (!blogSlug) {
      setLoading(false);
      setError("Invalid blog slug");
      return;
    }

    fetchBlogDetails(blogSlug);
  }, [blogSlug, fetchBlogDetails]);

  // Loading and Error States (Enhanced)
  if (loading) {
    return (
      <>
        <Head>
          <title>লোড হচ্ছে... - কিতাবঘর</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0] py-12 px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 rounded-2xl shadow-lg border border-[#D1D8BE] w-32 h-12 animate-pulse"></div>
              <div className="h-px bg-gradient-to-r from-[#D1D8BE] to-transparent flex-1"></div>
            </div>
          </div>

          {/* Three-Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] xl:grid-cols-[250px_1fr_250px] gap-6 lg:gap-8">
            {/* Left Ad Column Skeleton */}
            <div className="hidden lg:block">
              <div className="sticky top-6 p-4 border border-dashed border-[#D1D8BE]/50 rounded-2xl bg-gradient-to-br from-[#F4F8F7]/30 to-white/50 h-[600px] flex items-center justify-center animate-pulse">
                <div className="text-center text-[#819A91]">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">Advertisement</p>
                </div>
              </div>
            </div>

            {/* Center Content Column Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 rounded-3xl shadow-2xl overflow-hidden border border-[#D1D8BE] mb-8">
                {/* Blog Header Skeleton */}
                <div className="relative">
                  {/* Blog Image Skeleton */}
                  <div className="h-96 lg:h-[500px] w-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>

                    {/* Blog Badge Skeleton */}
                    <div className="absolute top-6 right-6">
                      <div className="bg-gray-300 text-gray-300 text-sm font-bold px-4 py-2 rounded-full w-20 h-8 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Title Overlay Skeleton */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="h-12 bg-gray-300 rounded-lg w-3/4 mb-4 animate-pulse"></div>
                  </div>
                </div>

                {/* Content Body Skeleton */}
                <div className="p-8 md:p-12 lg:p-16">
                  {/* Meta Info Skeleton */}
                  <div className="flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-[#D1D8BE]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-20 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Summary Skeleton */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-[#F4F8F7]/50 to-[#EEEFE0]/50 rounded-2xl border border-[#D1D8BE]">
                    <div className="h-6 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                  </div>

                  {/* Main Content Skeleton */}
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Ad Column Skeleton */}
            <div className="hidden lg:block">
              <div className="sticky top-6 p-4 border border-dashed border-[#D1D8BE]/50 rounded-2xl bg-gradient-to-br from-[#F4F8F7]/30 to-white/50 h-[600px] flex items-center justify-center animate-pulse">
                <div className="text-center text-[#819A91]">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm">Advertisement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Blogs Skeleton */}
          <div className="mt-12">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 bg-gray-300 rounded w-48 mb-6 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-white/90 rounded-2xl shadow-lg p-6 animate-pulse"
                  >
                    <div className="h-32 bg-gray-300 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !blog) {
    return (
      <>
        <Head>
          <title>ব্লগ পাওয়া যায়নি - কিতাবঘর</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0] flex justify-center items-center p-4">
          <div className="text-center p-12 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-[#D1D8BE] max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-[#C0704D]/20 to-[#A85D3F]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-[#C0704D]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#0D1414] mb-3">
              ত্রুটি ঘটেছে!
            </h3>
            <p className="text-[#2D4A3C]/70 leading-relaxed mb-6">
              {error || "ব্লগটি খুঁজে পাওয়া যায়নি।"}
            </p>
            <button
              onClick={() => router.push("/kitabghor/blogs")}
              className="px-6 py-3 bg-gradient-to-r from-[#0E4B4B] to-[#086666] text-white font-medium rounded-2xl hover:from-[#0A3A3A] hover:to-[#065252] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              সব ব্লগ দেখুন
            </button>
          </div>
        </div>
      </>
    );
  }

  // Main Layout with SEO
  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{seoData?.title}</title>
        <meta name="description" content={seoData?.description} />
        <meta name="keywords" content={seoData?.keywords?.join(", ")} />
        <meta name="author" content={blog.author} />
        <meta name="publisher" content="কিতাবঘর - হিলফুল ফুজুল" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={seoData?.canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={seoData?.openGraph?.title} />
        <meta
          property="og:description"
          content={seoData?.openGraph?.description}
        />
        <meta property="og:url" content={seoData?.openGraph?.url} />
        <meta property="og:type" content={seoData?.openGraph?.type} />
        <meta property="og:site_name" content={seoData?.openGraph?.siteName} />
        <meta property="og:locale" content={seoData?.openGraph?.locale} />
        <meta
          property="og:image"
          content={seoData?.openGraph?.images?.[0]?.url}
        />
        <meta
          property="og:image:width"
          content={seoData?.openGraph?.images?.[0]?.width?.toString()}
        />
        <meta
          property="og:image:height"
          content={seoData?.openGraph?.images?.[0]?.height?.toString()}
        />
        <meta
          property="og:image:alt"
          content={seoData?.openGraph?.images?.[0]?.alt}
        />
        <meta
          property="article:published_time"
          content={seoData?.openGraph?.article?.publishedTime}
        />
        <meta
          property="article:modified_time"
          content={seoData?.openGraph?.article?.modifiedTime}
        />
        <meta property="article:author" content={blog.author} />
        <meta
          property="article:tag"
          content={seoData?.openGraph?.article?.tags?.join(", ")}
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content={seoData?.twitter?.card} />
        <meta name="twitter:title" content={seoData?.twitter?.title} />
        <meta
          name="twitter:description"
          content={seoData?.twitter?.description}
        />
        <meta name="twitter:image" content={seoData?.twitter?.images?.[0]} />
        <meta name="twitter:creator" content={seoData?.twitter?.creator} />
        <meta name="twitter:site" content={seoData?.twitter?.site} />

        {/* Additional SEO */}
        <meta name="theme-color" content="#0E4B4B" />
        <meta name="msapplication-TileColor" content="#0E4B4B" />
        <meta name="application-name" content="কিতাবঘর" />
        <meta name="apple-mobile-web-app-title" content="কিতাবঘর" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      {/* Structured Data */}
      {structuredData && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.blogPosting),
            }}
          />

          {/* Breadcrumb Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData.breadcrumb),
            }}
          />
        </>
      )}

      <main className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#EEEFE0] py-12 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <header className="mb-8">
          <nav className="flex items-center gap-4">
            <Link
              href="/kitabghor/blogs"
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-[#D1D8BE] text-[#0E4B4B] hover:text-[#086666] font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>ব্লগ সমূহ</span>
            </Link>
            <div className="h-px bg-gradient-to-r from-[#D1D8BE] to-transparent flex-1"></div>
          </nav>
        </header>

        {/* Three-Column Grid for Ad Layout on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] xl:grid-cols-[250px_1fr_250px] gap-6 lg:gap-8">
          {/* 1. Left Ad Column (Hidden on mobile) */}
          <AdPlaceholder
            title="Google Ad (Left Banner)"
            widthClass="lg:w-[200px] xl:w-[250px]"
          />

          {/* 2. Center Content Column */}
          <article className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-[#D1D8BE] mb-8">
              {/* Blog Header */}
              <header className="relative">
                {/* Blog Image */}
                <div className="h-96 lg:h-[500px] w-full overflow-hidden">
                  {blog.image ? (
                    <>
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                        loading="eager"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE] flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-3xl">📝</span>
                        </div>
                        <span className="text-[#819A91] font-medium">
                          No Image Available
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Blog Badge */}
                  <div className="absolute top-6 right-6">
                    <span className="bg-gradient-to-r from-[#0E4B4B] to-[#086666] text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
                      ব্লগ পোস্ট
                    </span>
                  </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                    {blog.title}
                  </h1>
                </div>
              </header>

              {/* Content Body */}
              <div className="p-8 md:p-12 lg:p-16">
                {/* Enhanced Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-[#2D4A3C]/70 mb-8 pb-6 border-b border-[#D1D8BE]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#0E4B4B] to-[#086666] rounded-full flex items-center justify-center text-white font-bold">
                      {blog.author?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1414]">
                        {blog.author}
                      </p>
                      <p className="text-xs text-[#2D4A3C]/50">লেখক</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#0E4B4B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <time
                      dateTime={new Date(blog.date).toISOString()}
                      className="font-medium"
                    >
                      {new Date(blog.date).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#0E4B4B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <time
                      dateTime={new Date(blog.createdAt).toISOString()}
                      className="font-medium"
                    >
                      {new Date(blog.createdAt).toLocaleTimeString("bn-BD", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>

                {/* Summary */}
                {blog.summary && (
                  <section className="mb-8 p-6 bg-gradient-to-r from-[#F4F8F7]/50 to-[#EEEFE0]/50 rounded-2xl border border-[#D1D8BE]">
                    <h2 className="text-lg font-semibold text-[#0D1414] mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#0E4B4B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      সারমর্ম
                    </h2>
                    <p className="text-[#0D1414] leading-relaxed">
                      {blog.summary}
                    </p>
                  </section>
                )}

                {/* Main Content */}
                <section
                  className="prose prose-lg max-w-none text-[#0D1414] leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: blog.content || "<p>সম্পূর্ণ লেখাটি এখানে নেই।</p>",
                  }}
                ></section>
              </div>
            </div>
          </article>

          {/* 3. Right Ad/Sidebar Column (Hidden on mobile) */}
          <aside className="lg:col-span-1">
            <div className="space-y-8">
              {/* Ad Placeholder (Right) */}
              <AdPlaceholder
                title="Advertisement"
                widthClass="lg:w-[200px] xl:w-[250px]"
              />
            </div>
          </aside>
        </div>

        {/* Recent Blogs - Below the post for all devices */}
        <section className="mt-12">
          <div className="max-w-7xl mx-auto">
            <RecentBlogs />
          </div>
        </section>
      </main>
    </>
  );
}
