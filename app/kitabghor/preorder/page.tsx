"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Star, Zap } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { BookCard } from "@/components/ecommarce/BookCard";

interface PreorderProduct {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  discount: number;
  stock: number;
  image: string | null;
  writer: { id: number; name: string } | null;
  publisher: { id: number; name: string } | null;
  category: { id: number; name: string } | null;
  isPreorder: boolean;
  preorderEndAt: string | null;
  preorderNote: string | null;
  available: boolean;
  deleted: boolean;
}

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

export default function PreorderPage() {
  const [products, setProducts] = useState<PreorderProduct[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchPreorderProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products first
        const res = await fetch("/api/products", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const allProducts = await res.json();

        // 🔥 Filter ONLY products where isPreorder is true
        const preorderProducts = allProducts.filter(
          (product: PreorderProduct) => product.isPreorder === true,
        );

        setProducts(preorderProducts);

        // Fetch ratings for preorder products
        if (preorderProducts.length > 0) {
          await fetchRatings(preorderProducts);
        }
      } catch (error) {
        console.error("Error fetching preorder products:", error);
        toast.error("প্রি-অর্ডার বই লোড করতে সমস্যা হয়েছে");
      } finally {
        setLoading(false);
      }
    };

    fetchPreorderProducts();
  }, []);

  const fetchRatings = async (products: PreorderProduct[]) => {
    try {
      const ids = products.map((p) => Number(p.id)).filter((id) => !isNaN(id));

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(
              `/api/reviews?productId=${id}&page=1&limit=1`,
              {
                cache: "force-cache",
              },
            );
            if (!res.ok) return { id, avg: 0, total: 0 };
            const data = await res.json();
            return {
              id,
              avg: Number(data.averageRating ?? 0),
              total: Number(data.pagination?.total ?? 0),
            };
          } catch {
            return { id, avg: 0, total: 0 };
          }
        }),
      );

      const map: Record<string, RatingInfo> = {};
      for (const r of results) {
        map[String(r.id)] = {
          averageRating: r.avg,
          totalReviews: r.total,
        };
      }
      setRatings(map);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const toggleWishlist = async (product: PreorderProduct) => {
    try {
      if (!session?.user) {
        toast.error("উইশলিস্ট ব্যবহার করতে আগে লগইন করুন");
        return;
      }

      const numericId = Number(product.id);
      if (!numericId || isNaN(numericId)) {
        toast.error("পণ্যের তথ্য সঠিক নয়");
        return;
      }

      const alreadyInWishlist = isInWishlist(product.id);

      if (alreadyInWishlist) {
        const res = await fetch(`/api/wishlist?productId=${numericId}`, {
          method: "DELETE",
        });

        if (res.status === 401) {
          toast.error("উইশলিস্ট থেকে সরাতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          toast.error("উইশলিস্ট থেকে সরানো যায়নি");
          return;
        }

        removeFromWishlist(product.id);
        toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: numericId }),
        });

        if (res.status === 401) {
          toast.error("উইশলিস্টে যোগ করতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          toast.error("উইশলিস্টে যোগ করা যায়নি");
          return;
        }

        addToWishlist(product.id);
        toast.success("উইশলিস্টে যোগ করা হয়েছে");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("উইশলিস্ট হালনাগাদ করতে সমস্যা হয়েছে");
    }
  };

  const handleAddToCart = (book: PreorderProduct) => {
    try {
      addToCart(book.id);
      toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);

      if (session?.user) {
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: Number(book.id),
            quantity: 1,
          }),
        }).catch((error) => {
          console.error("Failed to sync cart with backend:", error);
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("কার্টে যোগ করতে সমস্যা হয়েছে");
    }
  };

  // Skeleton Loader for Preorder Page
  const PreorderSkeleton = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
        <div
          key={index}
          className="border-0 shadow-sm bg-gradient-to-br from-white to-[#F4F8F7] rounded-2xl overflow-hidden"
        >
          <div className="relative h-72 w-full bg-gray-200 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-300/20 to-transparent"></div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-1 mb-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="h-3 w-3 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse ml-1" />
            </div>
            <div className="space-y-2 mb-3">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
            <div className="flex items-center mb-3">
              <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="p-5 pt-0">
            <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F8F7] px-4 py-10">
        <div className="container mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-[#0E4B4B] md:text-4xl animate-pulse bg-gray-200 inline-block px-8 py-2 rounded-lg">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </h1>
            <p className="text-[#5FA3A3] animate-pulse bg-gray-200 inline-block px-6 py-1 rounded-md mt-4">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </p>
          </div>
          <PreorderSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F8F7] px-4 py-10">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-2 h-10 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
            <h1 className="text-3xl font-bold text-[#0E4B4B] md:text-5xl">
              প্রি-অর্ডার বইসমূহ
            </h1>
            <div className="w-2 h-10 bg-gradient-to-b from-[#5FA3A3] to-[#0E4B4B] rounded-full"></div>
          </div>
          <p className="mt-3 text-lg text-[#5FA3A3] max-w-2xl mx-auto">
            নতুন প্রকাশিতব্য বই আগে থেকেই অর্ডার করুন এবং স্পেশাল ডিসকাউন্ট পান
          </p>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-lg">
            <div className="mb-4">
              <div className="w-24 h-24 bg-[#C0704D]/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-12 w-12 text-[#C0704D]" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-[#0E4B4B] mb-2">
              বর্তমানে কোনো প্রি-অর্ডার বই নেই
            </h2>
            <p className="text-[#5FA3A3] mb-6">
              নতুন বই আসার সাথে সাথে প্রি-অর্ডার দেওয়া যাবে। অনুগ্রহ করে আবার
              দেখুন।
            </p>
            <Link href="/kitabghor/books">
              <Button className="rounded-full bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white hover:from-[#0E4B4B] hover:to-[#5FA3A3] px-8">
                সকল বই দেখুন
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
              <div>
                <span className="text-[#0E4B4B] font-semibold">
                  মোট প্রি-অর্ডার বই:
                </span>
                <span className="text-2xl font-bold text-[#C0704D] ml-2">
                  {products.length}
                </span>
              </div>
              <div className="text-sm text-[#5FA3A3]">
                <Zap className="inline h-4 w-4 mr-1" />
                সীমিত সময়ের অফার
              </div>
            </div>

            {/* Books Grid with BookCard Component */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <BookCard
                  key={product.id}
                  book={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    original_price: product.original_price,
                    discount: product.discount,
                    stock: product.stock,
                    writer: product.writer,
                    publisher: product.publisher,
                    image: product.image || "/placeholder.svg",
                    isPreOrder: product.isPreorder,
                    preOrderEndDate: product.preorderEndAt || undefined,
                    preOrderDiscount: product.discount,
                  }}
                  ratingInfo={ratings[String(product.id)]}
                  isWishlisted={isInWishlist(product.id)}
                  onWishlistToggle={toggleWishlist}
                  onAddToCart={handleAddToCart}
                  variant="default"
                  showBadges={true}
                  showRating={true}
                  showAuthor={true}
                />
              ))}
            </div>

            {/* Additional Info Section */}
            <div className="mt-12 bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">প্রি-অর্ডার সুবিধা</h3>
              <p className="mb-4">
                প্রি-অর্ডার করলে আপনি পাবেন স্পেশাল ডিসকাউন্ট এবং বই হাতে
                পাওয়ার আগেই নিশ্চিত অর্ডার
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/20 rounded-full px-4 py-2 text-sm">
                  🚚 ফ্রি ডেলিভারি
                </div>
                <div className="bg-white/20 rounded-full px-4 py-2 text-sm">
                  💰 স্পেশাল প্রাইস
                </div>
                <div className="bg-white/20 rounded-full px-4 py-2 text-sm">
                  📚 প্রথমে পাবেন
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
