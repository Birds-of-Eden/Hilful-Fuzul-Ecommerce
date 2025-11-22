"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Heart,
  ShoppingCart,
  BookOpen,
  ArrowLeft,
  Star,
  User,
  PenTool,
} from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";

type Writer = {
  id: number;
  name: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
};

type Book = {
  id: number;
  name: string;
  image: string | null;
  price: number;
  original_price: number;
  discount: number;
  stock: number;
  writer: {
    id: number;
    name: string;
  };
};

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

export default function AuthorBooksPage() {
  const rawId = useParams().id;
  const authorId = parseInt(
    Array.isArray(rawId) ? rawId[0] : (rawId ?? "0"),
    10
  );

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [author, setAuthor] = useState<Writer | null>(null);
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ writer + তার books + rating load
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) writer info
        const resWriter = await fetch(`/api/writers/${authorId}`);
        if (!resWriter.ok) {
          if (resWriter.status === 404) {
            setAuthor(null);
            setAuthorBooks([]);
            setError("লেখক পাওয়া যায়নি");
            return;
          }
          throw new Error("Failed to fetch writer");
        }

        const writerData: Writer = await resWriter.json();
        setAuthor(writerData);

        // 2) সব product -> filter by writer
        const resProducts = await fetch("/api/products");
        if (resProducts.ok) {
          const allProducts: Book[] = await resProducts.json();
          const booksOfAuthor = allProducts.filter(
            (book) => Number(book.writer.id) === writerData.id
          );
          setAuthorBooks(booksOfAuthor);

          // 3) এই লেখকের বইগুলোর rating লোড
          const ids = Array.from(
            new Set(
              booksOfAuthor
                .map((b) => Number(b.id))
                .filter((id) => !!id && !Number.isNaN(id))
            )
          );

          if (ids.length > 0) {
            const results = await Promise.all(
              ids.map(async (id) => {
                try {
                  const r = await fetch(
                    `/api/reviews?productId=${id}&page=1&limit=1`
                  );

                  if (!r.ok) {
                    return { id, avg: 0, total: 0 };
                  }

                  const rdata = await r.json();
                  return {
                    id,
                    avg: Number(rdata.averageRating ?? 0),
                    total: Number(rdata.pagination?.total ?? 0),
                  };
                } catch (err) {
                  console.error("Error fetching rating for product:", id, err);
                  return { id, avg: 0, total: 0 };
                }
              })
            );

            const map: Record<string, RatingInfo> = {};
            for (const r of results) {
              map[String(r.id)] = {
                averageRating: r.avg,
                totalReviews: r.total,
              };
            }
            setRatings(map);
          } else {
            setRatings({});
          }
        } else {
          // products না পেলেও writer show করব
          console.error("Failed to fetch products");
        }
      } catch (err) {
        console.error(err);
        setError("ডাটা লোড করতে সমস্যা হচ্ছে");
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(authorId)) {
      fetchAuthorData();
    } else {
      setLoading(false);
      setError("ভুল লেখক আইডি");
    }
  }, [authorId]);

  const toggleWishlist = (bookId: number) => {
    if (isInWishlist(bookId)) {
      removeFromWishlist(bookId);
      toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
    } else {
      addToWishlist(bookId);
      toast.success("উইশলিস্টে যোগ করা হয়েছে");
    }
  };

  // ✅ এখানে /api/cart + local cart দুটোই ব্যবহার করছি
  const handleAddToCart = async (book: Book) => {
    try {
      // ১) server-side cart এ যোগ করার চেষ্টা (login থাকলে OK)
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: book.id,
          quantity: 1,
        }),
      });

      // 401 মানে user লগইন না, তখন error দেখাবো না, শুধু লোকাল cart এ রাখব
      if (!res.ok && res.status !== 401) {
        const data = await res.json().catch(() => null);
        const message = data?.error || "কার্টে যোগ করতে সমস্যা হয়েছে";
        throw new Error(message);
      }

      // ২) সবসময় local cart context update (login থাকুক/না থাকুক)
      addToCart(book.id, 1);

      toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error(
        err instanceof Error ? err.message : "কার্টে যোগ করতে সমস্যা হয়েছে"
      );
    }
  };

  // শুধু badge গুলোর জন্য
  const getBookWithEnhancements = (book: Book, index: number) => ({
    ...book,
    isBestseller: index % 3 === 0,
    isNew: index % 4 === 0,
  });

  const authorName = author?.name;
  const totalBooks = authorBooks.length;

  // 🔄 Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <p className="text-[#5FA3A3]">ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  // ❌ Error / no author / no books
  if (!author || totalBooks === 0 || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-[#5FA3A3]/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0D1414] mb-2">
            কোন বই পাওয়া যায়নি
          </h2>
          <p className="text-[#5FA3A3] mb-6">
            এই লেখকের কোন বই খুঁজে পাওয়া যায়নি
          </p>
          <Link href="/kitabghor/authors">
            <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
              সকল লেখক দেখুন
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/kitabghor/authors"
              className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>সকল লেখক</span>
            </Link>
            <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
          </div>

          <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Author Avatar */}
              <div className="relative">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/30 overflow-hidden">
                    {author.image ? (
                      <Image
                        src={author.image}
                        alt={author.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 md:h-12 md:w-12 text-white" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white text-[#0E4B4B] p-2 rounded-full shadow-lg">
                  <PenTool className="h-4 w-4" />
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  {authorName}
                </h1>
                <p className="text-white/90 opacity-90 mb-4">
                  এই লেখকের সকল বইয়ের সংগ্রহ
                </p>

                <div className="flex flex-wrap gap-6 text-sm justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>মোট {totalBooks} টি বই</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>বিভিন্ন বিভাগ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>গুণগত রচনা</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {authorBooks.map((book, index) => {
            const enhancedBook = getBookWithEnhancements(book, index);
            const isWishlisted = isInWishlist(book.id);

            const ratingInfo = ratings[String(book.id)];
            const avgRating = ratingInfo?.averageRating ?? 0;
            const reviewCount = ratingInfo?.totalReviews ?? 0;

            return (
              <Card
                key={book.id}
                className="group overflow-hidden border-0 bg-gradient-to-br from-white to-[#F4F8F7] shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl relative"
              >
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                  {enhancedBook.discount > 0 && (
                    <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {enhancedBook.discount}% ছাড়
                    </div>
                  )}
                  {enhancedBook.isBestseller && (
                    <div className="bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      বেস্টসেলার
                    </div>
                  )}
                  {enhancedBook.isNew && (
                    <div className="bg-gradient-to-r from-[#5FA3A3] to-[#0E4B4B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      নতুন
                    </div>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={() => toggleWishlist(book.id)}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                    isWishlisted
                      ? "bg-red-500/20 text-red-500"
                      : "bg-white/80 text-gray-500 hover:bg-red-500/20 hover:text-red-500"
                  }`}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <Heart
                    className={`h-5 w-5 transition-all ${
                      isWishlisted
                        ? "scale-110 fill-current"
                        : "group-hover:scale-110"
                    }`}
                  />
                </button>

                {/* Book Image */}
                <Link href={`/kitabghor/books/${book.id}`}>
                  <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
                    <Image
                      src={book.image || "/placeholder.svg"}
                      alt={book.name}
                      fill
                      className="object-cover transition-transform	duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity	duration-300" />

                    {/* Quick View */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all	duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform	duration-300">
                        <BookOpen className="h-6 w-6 text-[#0E4B4B]" />
                      </div>
                    </div>
                  </div>
                </Link>

                <CardContent className="p-4 sm:p-5">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3 min-h-[18px]">
                    {reviewCount > 0 ? (
                      <>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= Math.round(avgRating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#5FA3A3] ml-1">
                          ({avgRating.toFixed(1)} · {reviewCount} রিভিউ)
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[#5FA3A3]/50">
                        এখনও কোন রিভিউ নেই
                      </span>
                    )}
                  </div>

                  {/* Book Title */}
                  <Link href={`/kitabghor/books/${book.id}`}>
                    <h4 className="font-bold text-lg mb-2 text-[#0D1414] hover:text-[#0E4B4B] duration-300 line-clamp-2 leading-tight group-hover:translate-x-1 transition-transform">
                      {book.name}
                    </h4>
                  </Link>

                  {/* Author */}
                  <p className="text-sm text-[#5FA3A3] mb-3 flex items-center">
                    <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
                    {book.writer.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xl text-[#0E4B4B]">
                        ৳{book.price}
                      </span>
                      {book.discount > 0 && (
                        <span className="text-sm text-[#5FA3A3]/60 line-through">
                          ৳{book.original_price}
                        </span>
                      )}
                    </div>
                    {book.stock > 0 ? (
                      <div className="text-xs font-semibold bg-[#F4F8F7] text-[#0E4B4B] px-2 py-1 rounded-full border border-[#5FA3A3]/30">
                        স্টকে আছে
                      </div>
                    ) : (
                      <div className="text-xs font-semibold bg-rose-50 text-rose-700 px-2 py-1 rounded-full">
                        স্টক নেই
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 sm:p-5 pt-0">
                  <Button
                    className="w-full rounded-xl py-3 sm:py-4 bg-gradient-to-r from-[#187a7a] to-[#5b9b9b] hover:from-[#0E4B4B] hover:to-[#42a8a8] text-white font-semibold border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group/btn"
                    onClick={() => handleAddToCart(book)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    কার্টে যোগ করুন
                  </Button>
                </CardFooter>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#5FA3A3]/20 transition-all	duration-500 pointer-events-none"></div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-[#5FA3A3]/30">
          <Link
            href="/kitabghor/authors"
            className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors	duration-300 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>সকল লেখকের বই দেখুন</span>
          </Link>

          <div className="text-sm text-[#5FA3A3]">
            মোট{" "}
            <span className="font-semibold text-[#0E4B4B]">
              {authorBooks.length}
            </span>{" "}
            টি বই
          </div>
        </div>
      </div>
    </div>
  );
}
