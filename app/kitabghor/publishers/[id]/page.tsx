"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";

interface PublisherFromApi {
  id: number;
  name: string;
  image?: string | null;
}

interface BookFromApi {
  id: number;
  name: string;
  image: string | null;
  price: number;
  original_price?: number | null;
  discount: number;
  writer: {
    id: number;
    name: string;
  };
  publisher: {
    id: number;
    name: string;
  };
  stock?: number;
}

export default function PublisherBooksPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const publisherId = parseInt(rawId ?? "0", 10);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [publisher, setPublisher] = useState<PublisherFromApi | null>(null);
  const [booksByPublisher, setBooksByPublisher] = useState<BookFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 API থেকে publisher + তার সব বই লোড
  useEffect(() => {
    if (!publisherId || Number.isNaN(publisherId)) {
      setError("ভুল প্রকাশক আইডি প্রদান করা হয়েছে।");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) প্রকাশক ডেটা
        const resPublisher = await fetch(`/api/publishers/${publisherId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const publisherData = await resPublisher.json().catch(() => null);

        if (!resPublisher.ok) {
          console.error(
            "Failed to fetch publisher:",
            publisherData || resPublisher.statusText
          );

          if (resPublisher.status === 404) {
            setError("প্রকাশক পাওয়া যায়নি।");
          } else {
            setError("প্রকাশকের তথ্য লোড করতে সমস্যা হয়েছে।");
          }

          setPublisher(null);
          setBooksByPublisher([]);
          return;
        }

        setPublisher(publisherData as PublisherFromApi);

        // 2) সব প্রোডাক্ট নিয়ে আসি, তারপর publisherId দিয়ে filter করি
        const resProducts = await fetch("/api/products", { cache: "no-store" });

        if (!resProducts.ok) {
          console.error("Failed to fetch products:", resProducts.statusText);
          // পণ্য না পেলেও পেজ দেখাবো, শুধু বই শূন্য হবে
          setBooksByPublisher([]);
          return;
        }

        const allProducts: BookFromApi[] = await resProducts
          .json()
          .catch(() => []);

        if (!Array.isArray(allProducts)) {
          console.error("Invalid products response:", allProducts);
          setBooksByPublisher([]);
          return;
        }

        const filtered = allProducts.filter(
          (book) => Number(book.publisher?.id) === Number(publisherId)
        );

        setBooksByPublisher(filtered);
      } catch (err) {
        console.error("Error fetching publisher/books:", err);
        setError("ডাটা লোড করতে সমস্যা হয়েছে।");
        setPublisher(null);
        setBooksByPublisher([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publisherId]);

  const toggleWishlist = (bookId: number) => {
    if (isInWishlist(bookId)) {
      removeFromWishlist(bookId);
      toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
    } else {
      addToWishlist(bookId);
      toast.success("উইশলিস্টে যোগ করা হয়েছে");
    }
  };

  const handleAddToCart = (book: BookFromApi) => {
    // শুধু context এ যোগ হচ্ছে (guest + logged-in দুই কেসেই কাজ করবে)
    addToCart(book.id);
    toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);
  };

  // 🔹 লোডিং স্টেট
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <p className="text-[#5FA3A3]">প্রকাশকের তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // 🔹 error স্টেট
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5FA3A3] mb-4">{error}</p>
          <Button
            className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white"
            onClick={() => location.reload()}
          >
            আবার চেষ্টা করুন
          </Button>
        </div>
      </div>
    );
  }

  // 🔹 publisher না পেলে
  if (!publisher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0D1414] mb-2">
            প্রকাশক পাওয়া যায়নি
          </h2>
          <p className="text-[#5FA3A3] mb-6">
            অনুসন্ধানকৃত প্রকাশকটি খুঁজে পাওয়া যায়নি
          </p>
          <Link href="/kitabghor/publishers">
            <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
              সকল প্রকাশক দেখুন
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 🔹 কোনো বই নাই
  if (booksByPublisher.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/kitabghor/publishers"
                className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
              >
                <span className="text-sm">←</span>
                <span>সকল প্রকাশক</span>
              </Link>
              <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
            </div>
            <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                প্রকাশক: {publisher.name}
              </h1>
              <p className="text-white/90 opacity-90">
                এই প্রকাশকের সকল বইয়ের সংগ্রহ
              </p>
            </div>
          </div>

          {/* Empty State */}
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-[#0D1414] mb-2">
              কোন বই পাওয়া যায়নি
            </h3>
            <p className="text-[#5FA3A3] mb-6">
              এই প্রকাশকের অধীনে কোনো বই পাওয়া যায়নি।
            </p>
            <Link href="/kitabghor/publishers">
              <Button className="rounded-full bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] hover:from-[#5FA3A3] hover:to-[#0E4B4B] text-white px-8">
                অন্যান্য প্রকাশক দেখুন
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/kitabghor/publishers"
              className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
            >
              <span className="text-sm">←</span>
              <span>সকল প্রকাশক</span>
            </Link>
            <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
          </div>
          <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              প্রকাশক: {publisher.name} — {booksByPublisher.length} টি বই
            </h1>
            <p className="text-white/90 opacity-90">
              এই প্রকাশকের সকল বইয়ের সংগ্রহ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {booksByPublisher.map((book) => (
            <Card
              key={book.id}
              className="group overflow-hidden border-0 bg-gradient-to-br from-white to-[#F4F8F7] shadow-lg hover:shadow-2xl transition-all duration-500 rounded-2xl relative"
            >
              {/* Badges */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                {book.discount > 0 && (
                  <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {book.discount}% ছাড়
                  </div>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(book.id)}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isInWishlist(book.id)
                    ? "bg-red-500/20 text-red-500"
                    : "bg-white/80 text-gray-500 hover:bg-red-500/20 hover:text-red-500"
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart
                  className={`h-5 w-5 transition-all ${
                    isInWishlist(book.id)
                      ? "scale-110 fill-current"
                      : "group-hover:scale-110"
                  }`}
                />
              </button>

              <Link href={`/kitabghor/books/${book.id}`}>
                <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
                  <Image
                    src={book.image || "/placeholder.svg"}
                    alt={book.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
              <CardContent className="p-4 sm:p-5">
                <Link href={`/kitabghor/books/${book.id}`}>
                  <h4 className="font-bold text-lg mb-2 text-[#0D1414] hover:text-[#0E4B4B] duration-300 line-clamp-2 leading-tight group-hover:translate-x-1 transition-transform">
                    {book.name}
                  </h4>
                </Link>
                <p className="text-sm text-[#5FA3A3] mb-3 flex items-center">
                  <span className="w-1 h-1 bg-[#0E4B4B] rounded-full mr-2"></span>
                  {book.writer?.name}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-xl text-[#0E4B4B]">
                      ৳{book.price}
                    </span>
                    {book.discount > 0 && book.original_price && (
                      <span className="text-sm text-[#5FA3A3]/60 line-through">
                        ৳{book.original_price}
                      </span>
                    )}
                  </div>
                  {book.stock === 0 ? (
                    <div className="text-xs font-semibold bg-rose-600 text-white px-2 py-1 rounded-full">
                      Stock Out
                    </div>
                  ) : (
                    book.discount > 0 && (
                      <div className="text-xs font-semibold bg-[#F4F8F7] text-[#0E4B4B] px-2 py-1 rounded-full border border-[#5FA3A3]/30">
                        সাশ্রয় করুন
                      </div>
                    )
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-5 pt-0">
                <Button
                  disabled={book.stock === 0}
                  className={`w-full rounded-xl py-3 sm:py-4 font-semibold border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group/btn ${
                    book.stock === 0
                      ? "bg-gray-400 cursor-not-allowed opacity-60"
                      : "bg-gradient-to-r from-[#187a7a] to-[#5b9b9b] hover:from-[#0E4B4B] hover:to-[#42a8a8] text-white"
                  }`}
                  onClick={() => handleAddToCart(book)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                  {book.stock === 0 ? "স্টক শেষ" : "কার্টে যোগ করুন"}
                </Button>
              </CardFooter>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#5FA3A3]/20 transition-all duration-500 pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-[#5FA3A3]/30">
          <Link
            href="/kitabghor/publishers"
            className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
          >
            <span className="text-sm">←</span>
            <span>সকল প্রকাশকে ফিরে যান</span>
          </Link>

          <div className="text-sm text-[#5FA3A3]">
            মোট{" "}
            <span className="font-semibold text-[#0E4B4B]">
              {booksByPublisher.length}
            </span>{" "}
            টি বই
          </div>
        </div>
      </div>
    </div>
  );
}
