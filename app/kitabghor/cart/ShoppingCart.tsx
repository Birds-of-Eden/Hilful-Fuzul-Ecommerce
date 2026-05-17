"use client";

import { useCart } from "@/components/ecommarce/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowRight,
  Tag,
  Truck,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ✅ NextAuth client hooks/helpers
import { useSession, signIn } from "@/lib/auth-client";

// সার্ভার থেকে আসা কার্ট আইটেমকে লোকালভাবে এমন শেপে রাখব
interface LocalCartItem {
  id: number | string; // cartItem id (DB)
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

  // ✅ NextAuth session
  const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"
  const isAuthenticated = status === "authenticated";

  const router = useRouter();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // সার্ভার কার্ট আইটেম
  const [serverCartItems, setServerCartItems] = useState<
    LocalCartItem[] | null
  >(null);
  const [loadingServerCart, setLoadingServerCart] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ✅ লগইন করা থাকলে সার্ভার থেকে কার্ট লোড করো
  useEffect(() => {
    if (!hasMounted) return;
    if (!isAuthenticated) {
      setServerCartItems(null);
      return;
    }

    const fetchServerCart = async () => {
      try {
        setLoadingServerCart(true);
        const res = await fetch("/api/cart", { cache: "no-store" });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Failed to load server cart:", data || res.statusText);
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        const mapped: LocalCartItem[] = items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name ?? "অজানা বই",
          price: Number(item.product?.price ?? 0),
          image: item.product?.image ?? "/placeholder.svg",
          quantity: Number(item.quantity ?? 1),
        }));

        // Only update if there are actual changes to prevent unnecessary re-renders
        setServerCartItems((prev) => {
          const prevStr = JSON.stringify(prev || []);
          const newStr = JSON.stringify(mapped);
          return prevStr === newStr ? prev : mapped;
        });
      } catch (err) {
        console.error("Error loading server cart:", err);
      } finally {
        setLoadingServerCart(false);
      }
    };

    // ✅ Sync guest cart to server after login
    const syncGuestCartToServer = async () => {
      // If no items in local cart, just fetch server cart
      if (cartItems.length === 0) {
        await fetchServerCart();
        return;
      }

      try {
        setLoadingServerCart(true);

        // Get current server cart first
        const serverRes = await fetch("/api/cart", { cache: "no-store" });
        if (!serverRes.ok) throw new Error("Failed to fetch server cart");

        const serverData = await serverRes.json();
        const existingItems = Array.isArray(serverData.items)
          ? serverData.items
          : [];

        // Find items that need to be added/updated (avoid duplicates)
        const itemsToSync = cartItems.filter(
          (localItem) =>
            !existingItems.some(
              (serverItem: any) =>
                String(serverItem.productId) === String(localItem.productId),
            ),
        );

        // Only add items that don't exist on server
        for (const item of itemsToSync) {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity,
            }),
          });
        }

        // Clear local cart after successful sync
        clearCart();

        // Fetch updated server cart
        await fetchServerCart();
      } catch (err) {
        console.error("Error syncing guest cart to server:", err);
        // Fallback to just fetch server cart
        await fetchServerCart();
      }
    };

    syncGuestCartToServer();
  }, [isAuthenticated, hasMounted, cartItems, clearCart]);

  // Listen for server-side cart cleared events (dispatched after order placement)
  useEffect(() => {
    const handler = () => setServerCartItems([]);
    window.addEventListener("serverCartCleared", handler);
    return () => window.removeEventListener("serverCartCleared", handler);
  }, []);

  if (!hasMounted) return null;

  // ✅ UI তে যে লিস্ট দেখাবো: লগইন + serverCart থাকলে সেটা, নইলে context
  const itemsToRender: LocalCartItem[] =
    isAuthenticated && serverCartItems ? serverCartItems : (cartItems as any);

  // ✅ Checkout -> login if needed
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // guest কার্ট pendingCheckout এ রাখছো, চাইলে এখানেও sync করতে পারো
      sessionStorage.setItem("pendingCheckout", JSON.stringify(cartItems));
      sessionStorage.setItem("redirectAfterLogin", "/kitabghor/checkout");
      toast.info("চেকআউট করতে লগইন করুন");

      await signIn(undefined, { callbackUrl: "/kitabghor/checkout" });
      return;
    }

    router.push("/kitabghor/checkout");
  };

  // ✅ Clear cart -> API + context + local server state
  const handleClearCart = async () => {
    if (itemsToRender.length === 0) return;

    try {
      if (isAuthenticated) {
        const res = await fetch("/api/cart", {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Clear cart failed:", data || res.statusText);
          toast.error("কার্ট খালি করতে সমস্যা হয়েছে");
          return;
        }

        setServerCartItems([]); // সার্ভার কার্ট খালি
      }

      clearCart(); // context খালি
      toast.success("কার্ট খালি করা হয়েছে");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("কার্ট খালি করতে সমস্যা হয়েছে");
    }
  };

  // ✅ Remove single item -> API + context + local server state
  const handleRemoveItem = async (itemId: string | number) => {
    try {
      if (isAuthenticated) {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "DELETE",
        });

        // 404 holeo local theke remove kore dibo (desync fix)
        if (!res.ok && res.status !== 404) {
          const data = await res.json().catch(() => null);
          console.error("Remove cart item failed:", data || res.statusText);
          toast.error("কার্ট থেকে বই সরাতে সমস্যা হয়েছে");
          return;
        }

        setServerCartItems((prev) =>
          prev ? prev.filter((i) => i.id !== itemId) : prev,
        );
      }

      removeFromCart(Number(itemId));
      toast.success("কার্ট থেকে বই সরানো হয়েছে");
    } catch (error) {
      console.error("Error removing cart item:", error);
      toast.error("কার্ট থেকে বই সরাতে সমস্যা হয়েছে");
    }
  };

  // ✅ Quantity update -> API + context + local server state
  const handleUpdateQuantity = async (
    itemId: string | number,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    try {
      if (isAuthenticated) {
        const res = await fetch(`/api/cart/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error("Update quantity failed:", data || res.statusText);
          toast.error("পরিমাণ পরিবর্তনে সমস্যা হয়েছে");
          return;
        }

        setServerCartItems((prev) =>
          prev
            ? prev.map((i) =>
                i.id === itemId ? { ...i, quantity: newQuantity } : i,
              )
            : prev,
        );
      }

      updateQuantity(Number(itemId), newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("পরিমাণ পরিবর্তনে সমস্যা হয়েছে");
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("কুপন কোড লিখুন");
      return;
    }

    try {
      console.log(
        "Applying coupon:",
        couponCode.trim(),
        "with subtotal:",
        subtotal,
      );

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: subtotal,
        }),
      });

      const data = await response.json();
      console.log("Coupon API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "কুপন প্রয়োগে সমস্যা হয়েছে");
      }

      if (data.success) {
        setDiscountAmount(data.coupon.discountAmount);
        setDiscount(
          data.coupon.discountType === "percentage"
            ? data.coupon.discountValue
            : (data.coupon.discountAmount / subtotal) * 100,
        );
        setAppliedCoupon(data.coupon);
        toast.success("কুপন প্রয়োগ করা হয়েছে!");
        setCouponCode("");
      }
    } catch (error) {
      console.error("Coupon application error:", error);
      toast.error(error instanceof Error ? error.message : "কুপন কোড অবৈধ!");
      setDiscount(0);
      setDiscountAmount(0);
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("কুপন সরানো হয়েছে");
  };

  const subtotal = itemsToRender.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const shippingCost = subtotal > 500 ? 0 : 60;
  const total = subtotal - discountAmount + shippingCost;

  const isCartEmpty = itemsToRender.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4F8F7]/30 to-white py-8 md:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#0E4B4B] hover:text-[#5FA3A3] transition-colors duration-300 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>শপিং চালিয়ে যান</span>
            </Link>
            <div className="w-1 h-8 bg-gradient-to-b from-[#0E4B4B] to-[#5FA3A3] rounded-full"></div>
          </div>

          <div className="bg-gradient-to-r from-[#0E4B4B] to-[#5FA3A3] rounded-2xl p-6 md:p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                  আপনার কার্ট
                </h1>
                <p className="text-white/90 opacity-90">
                  আপনার নির্বাচিত বইসমূহ এবং অর্ডার বিবরণ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Server cart loading indicator (optional) */}
        {isAuthenticated && loadingServerCart && (
          <div className="mb-4 text-sm text-gray-500">
            সার্ভার থেকে কার্ট লোড হচ্ছে...
          </div>
        )}

        {isCartEmpty ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              আপনার কার্ট খালি
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              আপনার কার্টে কোন পণ্য নেই। কিছু পণ্য যোগ করতে শপিং চালিয়ে যান।
            </p>
            <Link href="/">
              <Button className="rounded-full bg-gradient-to-r from-[#C0704D] to-[#A85D3F] text-white px-8 py-6 text-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                শপিং চালিয়ে যান
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#5FA3A3]/30">
                  <h2 className="text-xl font-bold text-[#0D1414] flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[#0E4B4B]" />
                    কার্ট আইটেম ({itemsToRender.length})
                  </h2>
                  <Button
                    variant="outline"
                    className="rounded-full border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                    onClick={handleClearCart}
                  >
                    কার্ট খালি করুন
                  </Button>
                </div>

                <div className="space-y-4">
                  {itemsToRender.map((item) => (
                    <div
                      key={item.id}
                      className="group bg-gradient-to-br from-white to-[#F4F8F7] rounded-2xl p-4 border border-[#5FA3A3]/30 hover:border-[#0E4B4B]/30 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Book Image */}
                        <div className="flex-shrink-0">
                          <div className="relative h-32 w-24 rounded-xl overflow-hidden shadow-lg">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                            <div className="flex-1">
                              <Link href={`/kitabghor/books/${item.productId}`}>
                                <h3 className="font-bold text-lg text-[#0D1414] hover:text-[#0E4B4B] transition-colors duration-300 line-clamp-2">
                                  {item.name}
                                </h3>
                              </Link>
                              <p className="text-[#0E4B4B] font-semibold text-lg mt-1">
                                ৳{item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xl text-[#0E4B4B]">
                                ৳{(item.price * item.quantity).toFixed(2)}
                              </p>
                              <p className="text-sm text-[#5FA3A3] mt-1">
                                {item.quantity} × ৳{item.price}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center border border-[#5FA3A3]/30 rounded-xl overflow-hidden">
                              <button
                                className="p-2 hover:bg-[#0E4B4B] hover:text-white transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 font-semibold min-w-12 text-center bg-white">
                                {item.quantity}
                              </span>
                              <button
                                className="p-2 hover:bg-[#0E4B4B] hover:text-white transition-all duration-300"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                  )
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              className="p-2 text-[#5FA3A3] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 group/delete"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-5 w-5 group-hover/delete:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border-0 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-[#0D1414] mb-6 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#0E4B4B]" />
                  অর্ডার সারাংশ
                </h2>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#5FA3A3]">সাবটোটাল</span>
                    <span className="font-semibold">
                      ৳{subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center py-2 text-green-600 bg-green-50 rounded-xl px-3">
                      <span className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#C0704D]" />
                        ডিসকাউন্ট
                        {appliedCoupon?.discountType === "percentage" &&
                          ` (${appliedCoupon.discountValue}%)`}
                      </span>
                      <span className="font-semibold">
                        -৳{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {shippingCost === 0 && subtotal > 0 && (
                    <div className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 text-center">
                      🎉 ৫০০৳+ অর্ডারে বিনামূল্যে ডেলিভারি
                    </div>
                  )}

                  <div className="border-t border-[#5FA3A3]/30 pt-3 mt-2">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span className="text-[#0D1414]">মোট</span>
                      <span className="text-[#0E4B4B]">
                        ৳{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="mb-6">
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800">
                            {appliedCoupon.code}
                          </span>
                          {appliedCoupon.discountType === "percentage" && (
                            <span className="text-sm text-green-600">
                              ({appliedCoupon.discountValue}% off)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          সরান
                        </button>
                      </div>
                      <div className="text-sm text-green-600">
                        সফলভাবে প্রয়োগ করা হয়েছে!
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="কুপন কোড"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="rounded-xl border-[#5FA3A3]/30 focus:border-[#0E4B4B]"
                      />
                      <Button
                        onClick={applyCoupon}
                        className="rounded-xl bg-[#F4F8F7] text-[#0D1414] hover:bg-[#C0704D] hover:text-white transition-all duration-300 whitespace-nowrap"
                      >
                        প্রয়োগ করুন
                      </Button>
                    </div>
                  )}
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full rounded-xl py-6 bg-gradient-to-r from-[#C0704D] to-[#A85D3F] hover:from-[#0E4B4B] hover:to-[#5FA3A3] text-white font-bold text-lg border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group/checkout"
                  onClick={handleCheckout}
                  disabled={isCartEmpty}
                >
                  <Shield className="mr-2 h-5 w-5 group-hover/checkout:scale-110 transition-transform" />
                  সুরক্ষিত চেকআউট
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/checkout:translate-x-1 transition-transform" />
                </Button>

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-[#5FA3A3]/30">
                  <div className="flex justify-center gap-4 text-xs text-[#5FA3A3]">
                    <div className="text-center">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Shield className="h-3 w-3 text-green-600" />
                      </div>
                      সুরক্ষিত
                    </div>
                    <div className="text-center">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Truck className="h-3 w-3 text-blue-600" />
                      </div>
                      দ্রুত ডেলিভারি
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
