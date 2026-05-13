"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Heart, ShoppingCart, Star, Zap, BookOpen } from "lucide-react";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { BookCard } from "./BookCard";

// Skeleton Loader Component
const BookCardSkeleton = () => (
  <div className="border-0 shadow-sm bg-gradient-to-br from-white to-[#F4F8F7] rounded-2xl overflow-hidden">
    {/* Skeleton Image */}
    <div className="relative h-72 w-full bg-gray-200 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-300/20 to-transparent"></div>
    </div>

    {/* Skeleton Content */}
    <div className="p-5">
      {/* Skeleton Rating */}
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

      {/* Skeleton Title */}
      <div className="space-y-2 mb-3">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>

      {/* Skeleton Author */}
      <div className="flex items-center mb-3">
        <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Skeleton Price */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>

    {/* Skeleton Button */}
    <div className="p-5 pt-0">
      <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  </div>
);

const CategoryHeaderSkeleton = () => (
  <div className="flex justify-between items-center mb-8">
    <div className="flex items-center gap-4">
      <div className="w-1 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
  </div>
);

interface Category {
  id: string | number;
  name: string;
}

interface Product {
  id: string | number;
  name: string;
  category: { id: string | number } | null;
  price: number;
  original_price: number | null;
  discount: number;
  writer: { id: string | number; name: string } | null;
  publisher: { id: string | number; name: string } | null;
  image: string;
  stock?: number;
  available?: boolean;
  deleted?: boolean;
  // Preorder (UI alias + Prisma field fallback)
  isPreOrder?: boolean;
  preOrderEndDate?: string | Date | null;
  preOrderDiscount?: number | null;
  isPreorder?: boolean;
  preorderEndAt?: string | Date | null;
}

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

export default function CategoryBooks({
  category,
  allProducts,
  ratings,
}: {
  category: Category;
  allProducts?: Product[];
  ratings?: Record<string, RatingInfo>;
}) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();

  // Use shared data if provided, otherwise fall back to local fetching
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [localRatings, setLocalRatings] = useState<Record<string, RatingInfo>>(
    {},
  );
  const [loadingProducts, setLoadingProducts] = useState(!allProducts);

  // 🔹 Use shared products or fetch locally if not provided
  const products = allProducts || localProducts;
  const reviewRatings = ratings || localRatings;

  // 🔹 Only fetch locally if shared data is not provided
  useEffect(() => {
    if (allProducts) {
      setLoadingProducts(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await fetch("/api/products", {
          cache: "force-cache",
          next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (!res.ok) {
          console.error(
            "Failed to fetch products for CategoryBooks:",
            res.statusText,
          );
          setLocalProducts([]);
          return;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error("Invalid products response for CategoryBooks:", data);
          setLocalProducts([]);
          return;
        }

        const mapped = data.map((p: any) => ({
          id: Number(p.id),
          name: p.name,
          category: {
            id: Number(p.category?.id ?? 0),
            name: p.category?.name ?? "Uncategorized",
          },
          price: Number(p.price ?? 0),
          original_price: Number(p.original_price ?? p.price ?? 0),
          discount: Number(p.discount ?? 0),
          stock: Number(p.stock ?? 0),
          writer: {
            id: Number(p.writer?.id ?? 0),
            name: p.writer?.name ?? "অজ্ঞাত লেখক",
          },
          publisher: {
            id: Number(p.publisher?.id ?? 0),
            name: p.publisher?.name ?? "অজ্ঞাত প্রকাশক",
          },
          image: p.image ?? "/placeholder.svg",
        }));

        setLocalProducts(mapped);
      } catch (err) {
        console.error("Error fetching products for CategoryBooks:", err);
        setLocalProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [allProducts]);

  // 🔹 Only fetch ratings locally if shared data is not provided
  useEffect(() => {
    if (ratings) {
      return;
    }

    const fetchRatings = async () => {
      try {
        const categoryBooks =
          category.id === "all"
            ? products
            : products.filter(
                (product: Product) =>
                  product.category &&
                  String(product.category.id) === String(category.id),
              );

        const displayBooks = categoryBooks.slice(0, 8);

        const ids = Array.from(
          new Set(
            displayBooks
              .map((b) => Number(b.id))
              .filter((id) => !!id && !Number.isNaN(id)),
          ),
        );

        if (ids.length === 0) {
          setLocalRatings({});
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(
                `/api/reviews?productId=${id}&page=1&limit=1`,
                { cache: "force-cache" },
              );

              if (!res.ok) {
                return { id, avg: 0, total: 0 };
              }

              const data = await res.json();
              return {
                id,
                avg: Number(data.averageRating ?? 0),
                total: Number(data.pagination?.total ?? 0),
              };
            } catch (err) {
              console.error("Error fetching rating for product:", id, err);
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
        setLocalRatings(map);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRatings();
  }, [products, category.id, ratings]);

  // 🔹 Filter products based on category and ensure all required relations exist
  const categoryBooks = products.filter((product: Product) => {
    // Skip products that are marked as deleted or not available
    if (product.deleted || product.available === false) {
      return false;
    }

    // If we're not filtering by a specific category, just check for required relations
    if (category.id === "all") {
      return (
        product.category !== null &&
        product.writer !== null &&
        product.publisher !== null
      );
    }

    // If filtering by a specific category, check category match and required relations
    return (
      product.category !== null &&
      String(product.category.id) === String(category.id) &&
      product.writer !== null &&
      product.publisher !== null
    );
  });

  const displayBooks = categoryBooks.slice(0, 8);

  // 🔹 Wishlist toggle (with API) - শুধু wishlist-এ login required
  const toggleWishlist = async (product: Product) => {
    try {
      if (!session?.user) {
        toast.error("উইশলিস্ট ব্যবহার করতে আগে লগইন করুন");
        return;
      }

      const numericId = Number(product.id);
      if (!numericId || Number.isNaN(numericId)) {
        console.error("Invalid product id for wishlist:", product.id);
        toast.error("পণ্যের তথ্য সঠিক নয়");
        return;
      }

      const alreadyInWishlist = isInWishlist(product.id);

      if (alreadyInWishlist) {
        // ✅ Remove from wishlist (DELETE)
        const res = await fetch(`/api/wishlist?productId=${numericId}`, {
          method: "DELETE",
        });

        if (res.status === 401) {
          toast.error("উইশলিস্ট থেকে সরাতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Remove from wishlist failed:", data || res.statusText);
          toast.error("উইশলিস্ট থেকে সরানো যায়নি");
          return;
        }

        removeFromWishlist(product.id);
        toast.success("উইশলিস্ট থেকে সরানো হয়েছে");
      } else {
        // ✅ Add to wishlist (POST)
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: numericId }),
        });

        if (res.status === 401) {
          toast.error("উইশলিস্টে যোগ করতে আগে লগইন করুন");
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Add to wishlist failed:", data || res.statusText);
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

  // 🔹 Cart-এ add করতে login এর requirement নেই - localStorage/cart context ব্যবহার
  const handleAddToCart = (book: Product) => {
    try {
      addToCart(book.id);
      toast.success(`"${book.name}" কার্টে যোগ করা হয়েছে`);

      // Optional: logged-in অবস্থায় backend sync
      if (session?.user) {
        fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  // ⛔ এই ক্যাটাগরিতে যদি কোনো প্রোডাক্ট না থাকে, তাহলে কিছুই দেখাব না
  if (!loadingProducts && categoryBooks.length === 0) {
    return null;
  }

  // Show skeleton loader when loading
  if (loadingProducts) {
    return (
      <div className="mb-16">
        {/* Skeleton Header */}
        <CategoryHeaderSkeleton />

        {/* Skeleton Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <BookCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
          <div>
            <h3 className="text-3xl font-bold text-[#0D1414]">
              {category.name}
            </h3>
            <p className="text-[#5FA3A3] mt-1">
              {categoryBooks.length}টি বই পাওয়া যাচ্ছে
            </p>
          </div>
        </div>
        {categoryBooks.length > 8 && (
          <Link href={`/kitabghor/categories/${category.id}`}>
            <Button
              variant="outline"
              className="rounded-full border-[#5FA3A3] text-[#5FA3A3] hover:bg-[#5FA3A3] hover:text-white transition-all duration-300 px-6 group"
            >
              সব দেখুন
              <Zap className="ml-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
            </Button>
          </Link>
        )}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {displayBooks.map((book: Product, index) => {
          const ratingInfo = reviewRatings[String(book.id)];
          const isWishlisted = isInWishlist(book.id);
          const isBestseller = index % 3 === 0;
          const isNew = index % 4 === 0;

          return (
            <BookCard
              key={book.id}
              book={{
                ...book,
                isPreOrder: Boolean(
                  (book as any).isPreOrder ?? (book as any).isPreorder
                ),
                preOrderEndDate:
                  (book as any).preOrderEndDate ?? (book as any).preorderEndAt,
                preOrderDiscount:
                  (book as any).preOrderDiscount ??
                  (Boolean((book as any).isPreOrder ?? (book as any).isPreorder)
                    ? Number((book as any).discount ?? 0)
                    : 0),
              }}
              ratingInfo={ratingInfo}
              isWishlisted={isWishlisted}
              onWishlistToggle={toggleWishlist}
              onAddToCart={handleAddToCart}
              variant="default"
              showBadges={true}
              showRating={true}
              showAuthor={true}
            />
          );
        })}
      </div>

      {/* View All Bottom CTA */}
      {categoryBooks.length > 8 && (
        <div className="text-center mt-10">
          <Link href={`/kitabghor/categories/${category.id}`}>
            <Button
              variant="ghost"
              className="rounded-full bg-[#F4F8F7] hover:bg-[#C0704D] text-[#0D1414] hover:text-white transition-all duration-300 px-8 py-6 group"
            >
              <span className="mr-2">
                {categoryBooks.length - 8}+ আরও বই দেখুন
              </span>
              <Zap className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
