"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  ShoppingCart,
  Star,
  BookOpen,
  CuboidIcon as Cube,
  X,
  ArrowLeft,
  User,
  Building,
  Tag,
  Shield,
  Truck,
  BookText,
  Share2,
} from "lucide-react";
import BookModel from "@/components/ecommarce/book-model";
import PdfViewer from "@/components/ecommarce/pdf-viewer";
import RelatedBooks from "@/components/ecommarce/related-books";
import BookReviews from "@/components/ecommarce/book-reviews";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";
// 🔹 auth-client theke useSession
import { useSession } from "@/lib/auth-client";

interface Product {
  id: string | number;
  name: string;
  category: {
    id: string | number;
    name: string;
  };
  price: number;
  original_price: number;
  discount: number;
  writer: {
    id: string | number;
    name: string;
  };
  publisher: {
    id: string | number;
    name: string;
  };
  image: string;
  description: string;
  stock: number;
  modelUrl?: string;
  pdf?: string;
}

// 🔹 review summary er jonno ছোট টাইপ
interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export default function BookDetail() {
  const params = useParams();
  const bookId = params.id as string;

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [book, setBook] = useState<Product | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Product[]>([]);
  const [showModel, setShowModel] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 review summary state
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(
    null
  );
  const [reviewLoading, setReviewLoading] = useState(false);

  // ✅ API theke book + related books load
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) single book
        const res = await fetch(`/api/products/${bookId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setBook(null);
            setError("বই পাওয়া যায়নি");
            return;
          }
          throw new Error("Failed to fetch product");
        }

        const data: Product = await res.json();
        setBook(data);

        // 2) all products -> related books
        const resAll = await fetch("/api/products");
        if (resAll.ok) {
          const allProducts: Product[] = await resAll.json();
          const related = allProducts
            .filter(
              (p) =>
                p.id.toString() !== data.id.toString() &&
                p.category.id.toString() === data.category.id.toString()
            )
            .slice(0, 4);
          setRelatedBooks(related);
        }
      } catch (err) {
        console.error(err);
        setError("ডাটা লোড করতে সমস্যা হচ্ছে");
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [bookId]);

  // ✅ /api/reviews theke rating + totalReviews আনছি
  useEffect(() => {
    const fetchReviewSummary = async () => {
      try {
        setReviewLoading(true);
        const res = await fetch(
          `/api/reviews?productId=${bookId}&page=1&limit=1`
        );
        if (!res.ok) {
          return;
        }

        const data: any = await res.json();
        const avg =
          typeof data.averageRating === "number" ? data.averageRating : 0;
        const total =
          data?.pagination?.total ??
          (Array.isArray(data.reviews) ? data.reviews.length : 0);

        setReviewSummary({
          averageRating: avg,
          totalReviews: total,
        });
      } catch (err) {
        console.error("Error fetching review summary:", err);
      } finally {
        setReviewLoading(false);
      }
    };

    if (bookId) {
      fetchReviewSummary();
    }
  }, [bookId]);

  const handleQuantityChange = (value: number) => {
    if (!book) return;
    if (value >= 1 && value <= book.stock) {
      setQuantity(value);
    }
  };

  const toggleWishlist = () => {
    if (!book) return;

    if (isInWishlist(book.id)) {
      removeFromWishlist(book.id);
      toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
    } else {
      addToWishlist(book.id);
      toast.success("উইশলিস্টে যোগ করা হয়েছে");
    }
  };

  // 🔥 Updated: login থাকলে API + Context, login না থাকলে শুধু Context
  const handleAddToCart = async () => {
    if (!book) return;

    try {
      // ✅ লগইন থাকলে server-side cart sync
      if (isAuthenticated) {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: Number(book.id),
            quantity,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message = data?.error || "কার্টে যোগ করতে সমস্যা হয়েছে";
          throw new Error(message);
        }
      }

      // ✅ সব حالتেই local cart context update (localStorage)
      addToCart(book.id, quantity);

      toast.success(`${quantity} টি "${book.name}" কার্টে যোগ করা হয়েছে`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(
        err instanceof Error ? err.message : "কার্টে যোগ করতে সমস্যা হয়েছে"
      );
    }
  };

  // ⭐ rating summary values
  const avgRating = reviewSummary?.averageRating ?? 0;
  const totalReviews = reviewSummary?.totalReviews ?? 0;
  const filledStars = Math.round(avgRating); // 0–5

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <p className="text-[#5FA3A3]">ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  // ❌ Not found / error state
  if (!book || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <BookText className="h-16 w-16 text-[#5FA3A3]/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0D1414] mb-2">
            বই পাওয়া যায়নি
          </h2>
          <p className="text-[#5FA3A3] mb-6">
            আপনার অনুসন্ধানকৃত বইটি খুঁজে পাওয়া যায়নি
          </p>
          <Link href="/kitabghor/books">
            <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
              সকল বই দেখুন
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/kitabghor/books"
            className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors	duration-300 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>সকল বই</span>
          </Link>
          <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Book Image Section */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-0">
              <div className="relative h-[400px] lg:h-[500px] w-full rounded-xl overflow-hidden group">
                <Image
                  src={book.image}
                  alt={book.name}
                  fill
                  className="object-cover transition-transform	duration-700 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Discount Badge */}
                {book.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-10">
                    {book.discount}% ছাড়
                  </div>
                )}

                {/* Stock Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#0D1414] text-sm font-semibold px-3 py-1 rounded-full shadow-lg z-10 border border-[#5FA3A3]/30">
                  {book.stock} পিস উপলব্ধ
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowModel(true)}
                  className="rounded-xl bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white font-semibold py-3 border-0 shadow-md hover:shadow-lg transition-all duration-300 group/model"
                >
                  <Cube className="mr-2 h-4 w-4 group-hover/model:scale-110 transition-transform" />
                  3D মডেল
                </Button>
                <Button
                  onClick={() => setShowPdf(true)}
                  className="rounded-xl bg-gradient-to-r from-[#F4F8F7] to-[#5FA3A3]/30 hover:from-[#5FA3A3]/30 hover:to-[#F4F8F7] text-[#0E4B4B] font-semibold py-3 border border-[#5FA3A3]/30 shadow-md hover:shadow-lg transition-all duration-300 group/pdf"
                >
                  <BookOpen className="mr-2 h-4 w-4 group-hover/pdf:scale-110 transition-transform" />
                  PDF প্রিভিউ
                </Button>
              </div>
            </div>
          </div>

          {/* Book Details Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border-0">
            {/* Category */}
            <Link
              href={`/kitabghor/categories/${book.category.id}`}
              className="inline-flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 text-sm font-medium mb-4 group"
            >
              <Tag className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {book.category.name}
            </Link>

            {/* Book Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0D1414] mb-4 leading-tight">
              {book.name}
            </h1>

            {/* Rating (dynamic) */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= filledStars
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-[#5FA3A3]">
                {reviewLoading
                  ? "রিভিউ লোড হচ্ছে..."
                  : totalReviews > 0
                  ? `(${totalReviews} রিভিউ, গড় ${avgRating.toFixed(1)})`
                  : "(এখনও কোন রিভিউ নেই)"}
              </span>
              <div className="w-1 h-1 bg-[#5FA3A3] rounded-full"></div>
              {book.stock > 0 ? (
                <span className="text-sm text-[#5FA3A3]">{`${book.stock} পিস স্টকে`}</span>
              ) : (
                <span className="text-sm font-semibold bg-rose-600 text-white px-2 py-1 rounded-full">
                  Stock Out
                </span>
              )}
            </div>

            {/* Price Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-[#F4F8F7] to-[#5FA3A3]/20 rounded-xl border border-[#5FA3A3]/30">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#0E4B4B]">
                  ৳{book.price}
                </span>
                {book.discount > 0 && (
                  <>
                    <span className="text-xl text-[#5FA3A3]/60 line-through">
                      ৳{book.original_price}
                    </span>
                    <span className="ml-auto bg-[#0E4B4B] text-white px-3 py-1 rounded-full text-sm font-bold">
                      {book.discount}% সাশ্রয়
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Author & Publisher */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-[#F4F8F7] rounded-xl border border-[#5FA3A3]/30">
                <User className="h-5 w-5 text-[#0E4B4B]" />
                <div>
                  <span className="text-sm text-[#5FA3A3]">লেখক:</span>
                  <Link
                    href={`/kitabghor/authors/${book.writer.id}`}
                    className="ml-2 font-medium text-[#0D1414] hover:text-[#0E4B4B] transition-colors"
                  >
                    {book.writer.name}
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#F4F8F7] rounded-xl border border-[#5FA3A3]/30">
                <Building className="h-5 w-5 text-[#0E4B4B]" />
                <div>
                  <span className="text-sm text-[#5FA3A3]">প্রকাশক:</span>
                  <Link
                    href={`/kitabghor/publishers/${book.publisher.id}`}
                    className="ml-2 font-medium text-[#0D1414] hover:text-[#0E4B4B] transition-colors"
                  >
                    {book.publisher.name}
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Description */}
            <div className="mb-6">
              <p className="text-[#5FA3A3] leading-relaxed line-clamp-3">
                {book.description}
              </p>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between p-4 bg-[#F4F8F7] rounded-xl border border-[#5FA3A3]/30">
                <span className="font-medium text-[#0D1414]">পরিমাণ:</span>
                <div className="flex items-center border border-[#5FA3A3]/30 rounded-lg overflow-hidden">
                  <button
                    className="px-4 py-2 hover:bg-[#0E4B4B] hover:text:white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(Number.parseInt(e.target.value))
                    }
                    className="w-16 text-center py-2 border-none focus:outline-none bg-white font-semibold"
                    min={1}
                    max={book.stock}
                  />
                  <button
                    className="px-4 py-2 hover:bg-[#0E4B4B] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= book.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="rounded-xl py-3 bg-gradient-to-r from-[#187a7a] to-[#5b9b9b] hover:from-[#0E4B4B] hover:to-[#42a8a8] text-white font-semibold border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/cart"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5 group-hover/cart:scale-110 transition-transform" />
                  কার্টে যোগ করুন
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleWishlist}
                    className={`flex-1 rounded-xl border-2 ${
                      isInWishlist(book.id)
                        ? "border-red-300 bg-red-50 text-red-500"
                        : "border-[#5FA3A3]/30 text-[#5FA3A3] hover:border-[#0E4B4B] hover:text-[#0E4B4B]"
                    } transition-all duration-300 group/wishlist`}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isInWishlist(book.id)
                          ? "fill-current scale-110"
                          : "group-hover/wishlist:scale-110"
                      } transition-transform`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-[#5FA3A3]/30 text-[#5FA3A3] hover:border-[#0E4B4B] hover:text-[#0E4B4B] transition-all duration-300 group/share"
                  >
                    <Share2 className="h-5 w-5 group-hover/share:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Features */}
            <div className="mt-6 pt-6 border-t border-[#5FA3A3]/30">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 text-[#5FA3A3]">
                  <Truck className="h-4 w-4 text-[#0E4B4B]" />
                  <span>দ্রুত ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-2 text-[#5FA3A3]">
                  <Shield className="h-4 w-4 text-[#0E4B4B]" />
                  <span>সুরক্ষিত কেনাকাটা</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs Section */}
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#F4F8F7] p-2 border border-[#5FA3A3]/30">
              <TabsTrigger
                value="description"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0E4B4B] data-[state=active]:to-[#5FA3A3] data-[state=active]:text-white transition-all duration-300"
              >
                বিস্তারিত বিবরণ
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0E4B4B] data-[state=active]:to-[#5FA3A3] data-[state=active]:text-white transition-all duration-300"
              >
                রিভিউ ও রেটিং
              </TabsTrigger>
              <TabsTrigger
                value="related"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0E4B4B] data-[state=active]:to-[#5FA3A3] data-[state=active]:text-white transition-all duration-300"
              >
                সম্পর্কিত বই
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="p-6 lg:p-8">
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold text-[#0D1414] mb-4">
                  বই সম্পর্কে
                </h3>
                <p className="text-[#5FA3A3] leading-relaxed mb-4">
                  {book.description}
                </p>
                <p className="text-[#5FA3A3] leading-relaxed">
                  এই বইটি <strong>{book.writer.name}</strong> দ্বারা লিখিত এবং{" "}
                  <strong>{book.publisher.name}</strong> দ্বারা প্রকাশিত। এটি{" "}
                  <strong>{book.category.name}</strong> বিভাগের অন্তর্গত একটি
                  উৎকৃষ্ট সাহিত্যকর্ম।
                </p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="p-6 lg:p-8">
              <BookReviews bookId={bookId} />
            </TabsContent>

            <TabsContent value="related" className="p-6 lg:p-8">
              <RelatedBooks books={relatedBooks} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal Overlays */}
        {showModel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl w-full max-w-4xl h:[80vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] items-center p-6 border-b border-[#5FA3A3]/30">
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                  <Cube className="h-5 w-5 text-[#ffffff]" />
                  3D মডেল ( Demo ) - {book.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowModel(false)} 
                  className="rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="h-[calc(80vh-80px)]">
                <BookModel modelUrl="/assets/3dmodel/1.glb" />
              </div>
            </div>
          </div>
        )}

        {showPdf && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg:white rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-[#5FA3A3]/30">
                <h3 className="font-bold text-xl text-[#0D1414] flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#0E4B4B]" />
                  PDF প্রিভিউ - {book.name}
                </h3>
              </div>
              <div className="h-[calc(80vh-80px)]">
                <PdfViewer pdfUrl={book.pdf} />
              </div>
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPdf(false)}
                  className="rounded-xl bg:white/80 hover:bg-red-50 hover:text-red-500 transition-colors shadow-md"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
