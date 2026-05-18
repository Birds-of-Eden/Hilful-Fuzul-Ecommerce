"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/components/ecommarce/CartContext";
import { Button } from "@/components/ui/button";
import { LabeledInput } from "@/components/ui/labeled-input";
import { toast } from "sonner";
import {
  Check,
  ArrowLeft,
  Truck,
  Shield,
  CreditCard,
  BookOpen,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trackAddPaymentInfo, trackPurchase } from "@/lib/ga4";

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<"details" | "payment" | "confirm">(
    "details",
  );
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<
    "inside_dhaka" | "outside_dhaka" | ""
  >("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();
  const [prefilled, setPrefilled] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);

  // ✅ NextAuth session
  const isAuthenticated = !!session;

  // সার্ভার কার্ট আইটেম
  const [serverCartItems, setServerCartItems] = useState<any[] | null>(null);
  const [loadingServerCart, setLoadingServerCart] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ লগইন করা থাকলে সার্ভার থেকে কার্ট লোড করো
  useEffect(() => {
    if (!isMounted) return;
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

        const mapped = items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name ?? "অজানা বই",
          price: Number(item.product?.price ?? 0),
          image: item.product?.image ?? "/placeholder.svg",
          quantity: Number(item.quantity ?? 1),
        }));

        setServerCartItems(mapped);
      } catch (err) {
        console.error("Error loading server cart:", err);
      } finally {
        setLoadingServerCart(false);
      }
    };

    // ✅ Sync guest cart to server after login
    const syncGuestCartToServer = async () => {
      if (cartItems.length === 0) {
        fetchServerCart();
        return;
      }

      try {
        setLoadingServerCart(true);

        // Add each guest cart item to server
        for (const item of cartItems) {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: item.productId,
              quantity: item.quantity,
            }),
          });

          if (!res.ok) {
            console.error("Failed to sync cart item:", item.productId);
          }
        }

        // Clear guest cart after successful sync
        clearCart();

        // Fetch updated server cart
        fetchServerCart();
      } catch (err) {
        console.error("Error syncing guest cart to server:", err);
        // Fallback to fetch server cart even if sync fails
        fetchServerCart();
      }
    };

    syncGuestCartToServer();
  }, [isAuthenticated, isMounted, cartItems, clearCart]);

  // ✅ UI তে যে লিস্ট দেখাবো: লগইন + serverCart থাকলে সেটা, নইলে context
  const itemsToRender =
    isAuthenticated && serverCartItems ? serverCartItems : cartItems;

  // 🔹 payment screenshot
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<
    string | null
  >(null);
  // 🔹 uploaded URL (from /api/upload)
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<
    string | null
  >(null);
  // 🔹 upload progress
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load payment gateways from API
  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const res = await fetch("/api/payment", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setPaymentGateways(Array.isArray(data.payments) ? data.payments : []);
      } catch {
        // silent
      }
    };

    fetchGateways();
  }, []);

  // Prefill from logged-in user
  useEffect(() => {
    if (!session || prefilled || !(session.user as any)?.id) return;

    const loadUser = async () => {
      try {
        const userId = (session.user as any).id as string;
        const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
        if (!res.ok) return;

        const current = await res.json();

        if (current) {
          // Basic fields
          setName(current.name || "");
          setMobile(current.phone || "");
          setEmail(current.email || "");

          // Address is stored as JSON; try to normalize into a single string
          let addr = "";
          const address = current.address as
            | { addresses?: string[] }
            | string
            | null
            | undefined;

          if (Array.isArray((address as any)?.addresses)) {
            addr = (address as any).addresses.join(", ");
          } else if (typeof address === "string") {
            addr = address;
          }

          if (addr) {
            setLocation(addr);
            setDeliveryAddress(addr);
          }

          setPrefilled(true);
        }
      } catch {
        /* silent */
      }
    };

    loadUser();
  }, [session, prefilled]);

  // 🔹 screenshot handler (now uploads to /api/upload)
  const folder = "paymentScreenshot";

  const handleScreenshotChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 👀 Local preview (instant UI feedback)
    const previewUrl = URL.createObjectURL(file);
    setPaymentScreenshot(file);
    setPaymentScreenshotPreview(previewUrl);

    try {
      setIsUploadingScreenshot(true);

      // 1) File type check (image / pdf logic)
      if (folder.includes("image") && !file.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file");
      }
      if (folder.includes("pdf") && file.type !== "application/pdf") {
        throw new Error("Please upload a valid PDF file");
      }

      // 2) File size check (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size should be less than 5MB");
      }
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/upload/${folder}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("Screenshot upload failed:", data || res.statusText);
        throw new Error(data?.message || "স্ক্রিনশট আপলোড করতে সমস্যা হয়েছে");
      }

      const data = await res.json();

      const uploadedUrl =
        (typeof data === "string" && data) ||
        data?.url ||
        data?.fileUrl ||
        data?.path ||
        data?.location ||
        null;

      if (!uploadedUrl) {
        console.error("Upload response does not contain URL:", data);
        throw new Error("স্ক্রিনশটের URL পাওয়া যায়নি");
      }

      console.log("Uploaded screenshot URL:", uploadedUrl);
      setPaymentScreenshotUrl(uploadedUrl);
      // toast.success("স্ক্রিনশট আপলোড সম্পন্ন হয়েছে");
    } catch (err) {
      console.error("Screenshot upload error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "স্ক্রিনশট আপলোড করতে সমস্যা হয়েছে";
      toast.error(message);
      setPaymentScreenshotUrl(null);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const getPaymentStatusFromMethod = (method: string) => {
    if (!method) return "Unknown";
    return method === "CashOnDelivery" ? "Unpaid" : "Paid";
  };

  const subtotal = itemsToRender.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shipping =
    deliveryZone === "inside_dhaka"
      ? 80
      : deliveryZone === "outside_dhaka"
        ? 120
        : 0;

  const total = subtotal + shipping;

  // Helper function to generate initials from channel name
  const getChannelInitials = (channel: string): string => {
    const words = channel.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return words.map((word) => word.charAt(0).toUpperCase()).join("");
  };

  // Currently selected non-COD gateway based on paymentMethod
  const selectedGateway = paymentGateways.find((p) => {
    if (!paymentMethod || paymentMethod === "CashOnDelivery") return false;
    const channel = (p as any)?.paymentGatewayData?.channel as
      | string
      | undefined;
    if (!channel) return false;
    const slug = channel.toLowerCase().replace(/\s+/g, "");
    return slug === paymentMethod;
  });

  const selectedGatewayAccounts =
    ((selectedGateway as any)?.paymentGatewayData?.accountNumbers as
      | string[]
      | undefined) || [];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2">
      {["details", "payment", "confirm"].map((s, i) => (
        <div key={s} className="flex items-center gap-1 sm:gap-2 min-w-fit">
          <div
            className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all duration-300 ${
              step === s
                ? "bg-[#819A91] border-[#819A91] text-white shadow-lg shadow-[#819A91]/30"
                : i < ["details", "payment", "confirm"].indexOf(step) ||
                    (s === "confirm" && orderConfirmed)
                  ? "bg-[#A7C1A8] border-[#A7C1A8] text-white"
                  : "border-[#D1D8BE] text-[#2D4A3C]"
            }`}
          >
            {step === s ? (
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
            ) : i < ["details", "payment", "confirm"].indexOf(step) ||
              (s === "confirm" && orderConfirmed) ? (
              <Check className="w-3 h-3 sm:w-4 sm:h-5" />
            ) : (
              <span className="text-xs sm:text-sm font-medium">{i + 1}</span>
            )}
          </div>
          <span
            className={`text-xs sm:text-sm font-medium capitalize transition-colors duration-300 hidden lg:block ${
              step === s
                ? "text-[#2D4A3C]"
                : i < ["details", "payment", "confirm"].indexOf(step) ||
                    (s === "confirm" && orderConfirmed)
                  ? "text-[#3D5A4C]"
                  : "text-[#2D4A3C]"
            }`}
          >
            {s === "details"
              ? "ব্যক্তিগত তথ্য"
              : s === "payment"
                ? "পেমেন্ট"
                : "নিশ্চিতকরণ"}
          </span>
          {i < 2 && (
            <div
              className={`w-4 sm:w-6 lg:w-12 h-0.5 ml-0.5 sm:ml-1 lg:ml-3 transition-colors duration-300 ${
                i < ["details", "payment", "confirm"].indexOf(step)
                  ? "bg-[#A7C1A8]"
                  : "bg-[#D1D8BE]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // ✅ Orders API call
  const handlePlaceOrder = async () => {
    if (itemsToRender.length === 0) {
      toast.error("আপনার কার্ট খালি");
      return;
    }

    if (
      !name ||
      !mobile ||
      !location ||
      (paymentMethod !== "CashOnDelivery" && !transactionId)
    ) {
      toast.error("সব প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }

    // যদি অনলাইন পেমেন্ট হয় এবং স্ক্রিনশট দেওয়া হয় কিন্তু upload এখনও শেষ না হয়
    if (
      paymentMethod !== "CashOnDelivery" &&
      // require screenshot URL for non-COD payments
      (!paymentScreenshotUrl || isUploadingScreenshot)
    ) {
      // If upload is still in progress
      if (isUploadingScreenshot) {
        toast.error("স্ক্রিনশট আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন");
        return;
      }

      // If not uploaded at all, require screenshot
      toast.error("পেমেন্ট স্ক্রিনশট আবশ্যক");
      return;
    }

    const computedPaymentStatus =
      paymentMethod === "CashOnDelivery" ? "UNPAID" : "PAID";

    const localInvoiceId = uuidv4();

    // GA4: user has provided payment info when placing the order (selected payment method + transaction details).
    trackAddPaymentInfo(
      itemsToRender.map((item: any) => ({
        item_id: String(item.productId ?? item.id),
        item_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        item_category: "Books",
      })),
      total,
      paymentMethod,
    );

    const uiOrderData = {
      invoiceId: localInvoiceId,
      customer: {
        name,
        mobile,
        email,
        address: location,
        deliveryAddress: deliveryAddress || location,
      },
      itemsToRender,
      paymentMethod,
      transactionId: paymentMethod !== "CashOnDelivery" ? transactionId : null,
      total,
      createdAt: new Date().toISOString(),
      paymentStatus: computedPaymentStatus,
    };

    const items = itemsToRender.map((item) => ({
      productId: item.productId ?? item.id,
      quantity: item.quantity,
    }));

    const payload = {
      name,
      email: email || null,
      phone_number: mobile,
      alt_phone_number: null,
      country: "Bangladesh",
      district: location || "N/A",
      area: deliveryAddress || location || "N/A",
      address_details: deliveryAddress || location || "N/A",
      delivery_charge: shipping,
      delivery_zone: deliveryZone,
      payment_method: paymentMethod,
      items,
      transactionId: paymentMethod !== "CashOnDelivery" ? transactionId : null,
      paymentStatus: computedPaymentStatus,
      image: paymentScreenshotUrl || null,
    };

    console.log("Order payload:", payload);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error("Order create failed:", data || res.statusText);
        toast.error(
          data?.error || "অর্ডার করতে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন",
        );
        return;
      }

      const createdOrder = await res.json();

      const uiWithOrderId = {
        ...uiOrderData,
        orderId: createdOrder.id,
      };

      setPlacedOrder(uiWithOrderId);
      // Clear the cart on successful order creation so the UI reflects the empty cart
      // If user is authenticated, also clear server-side cart and notify other components
      try {
        if ((session as any)?.user) {
          await fetch("/api/cart", { method: "DELETE" });
          // notify ShoppingCart instances to refresh serverCartItems
          window.dispatchEvent(new Event("serverCartCleared"));
        }
      } catch (err) {
        // non-fatal
        console.warn("Failed to clear server cart after order:", err);
      }

      clearCart();
      setInvoiceId(localInvoiceId);
      setStep("confirm");
      toast.success("অর্ডার তৈরি হয়েছে, এখন নিশ্চিত করুন");
    } catch (err) {
      console.error("Error placing order:", err);
      toast.error("অর্ডার করতে সমস্যা হয়েছে");
    }
  };

  const handleConfirmOrder = async () => {
    // Add email to newsletter subscribers
    if (email) {
      try {
        const response = await fetch("/api/newsletter/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          console.log("Email added to newsletter subscribers successfully");
        } else {
          const result = await response.json();
          if (response.status !== 409) {
            // Don't show error for already subscribed
            console.warn("Failed to add to newsletter:", result.error);
          }
        }
      } catch (error) {
        console.warn("Error adding to newsletter:", error);
      }
    }

    // GA4: purchase should fire only after final confirmation.
    const purchaseItems =
      placedOrder?.itemsToRender?.length > 0
        ? placedOrder.itemsToRender
        : itemsToRender;
    trackPurchase({
      transaction_id: invoiceId || placedOrder?.invoiceId || uuidv4(),
      value: total,
      shipping,
      tax: 0,
      items: purchaseItems.map((item: any) => ({
        item_id: String(item.productId ?? item.id),
        item_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        item_category: "Books",
      })),
    });

    clearCart();
    setOrderConfirmed(true);
    setShowModal(true);
    toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
  };

  const handleGoToPaymentStep = () => {
    if (!location.trim()) {
      toast.error("প্রাথমিক ঠিকানা পূরণ করুন");
      return;
    }

    if (!deliveryZone) {
      toast.error("ডেলিভারি এলাকা নির্বাচন করুন");
      return;
    }

    setStep("payment");
  };

  if (!isMounted || (isAuthenticated && loadingServerCart)) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEEFE0] to-[#D1D8BE] py-6 sm:py-8 lg:py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#819A91] rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2D4A3C]">
              চেকআউট
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-[#2D4A3C] max-w-2xl mx-auto px-4">
            আপনার বইয়ের অর্ডার সম্পূর্ণ করতে নিচের ধাপগুলো অনুসরণ করুন
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-[#D1D8BE] p-4 sm:p-6 lg:p-8">
              {renderStepIndicator()}

              {/* Step 1: Personal Details */}
              {step === "details" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 bg-[#819A91] rounded-full"></div>
                    <h2 className="text-2xl font-bold text-[#2D4A3C]">
                      ব্যক্তিগত তথ্য
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <LabeledInput
                      id="name"
                      label="আপনার নাম *"
                      placeholder="আপনার সম্পূর্ণ নাম"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setName(e.target.value)
                      }
                      className="bg-[#EEEFE0] border-[#D1D8BE] focus:border-[#819A91] text-[#2D4A3C] placeholder-[#2D4A3C]/50 transition-colors duration-300"
                    />
                    <LabeledInput
                      id="mobile"
                      label="মোবাইল নম্বর *"
                      placeholder="০১XXXXXXXXX"
                      value={mobile}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMobile(e.target.value)
                      }
                      className="bg-[#EEEFE0] border-[#D1D8BE] focus:border-[#819A91] text-[#2D4A3C] placeholder-[#2D4A3C]/50 transition-colors duration-300"
                    />
                    <LabeledInput
                      id="email"
                      label="ইমেইল (ঐচ্ছিক)"
                      placeholder="আপনার ইমেইল ঠিকানা"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmail(e.target.value)
                      }
                      className="bg-[#EEEFE0] border-[#D1D8BE] focus:border-[#819A91] text-[#2D4A3C] placeholder-[#2D4A3C]/50 transition-colors duration-300 sm:col-span-2"
                    />
                    <LabeledInput
                      id="location"
                      label="প্রাথমিক ঠিকানা *"
                      placeholder="বাড়ি নং, রোড নং, এলাকা"
                      value={location}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLocation(e.target.value)
                      }
                      className="bg-[#EEEFE0] border-[#D1D8BE] focus:border-[#819A91] text-[#2D4A3C] placeholder-[#2D4A3C]/50 transition-colors duration-300 sm:col-span-2"
                    />
                    <div className="space-y-2 sm:col-span-2">
                      <label
                        htmlFor="deliveryAddress"
                        className="text-sm font-medium text-[#2D4A3C]"
                      >
                        ডেলিভারি ঠিকানা (ঐচ্ছিক)
                      </label>
                      <textarea
                        id="deliveryAddress"
                        className="w-full h-24 sm:h-32 p-3 sm:p-4 border border-[#D1D8BE] rounded-lg sm:rounded-xl bg-[#EEEFE0] focus:border-[#819A91] focus:ring-2 focus:ring-[#819A91]/20 text-[#2D4A3C] placeholder-[#2D4A3C]/50 transition-all duration-300 resize-none text-sm"
                        placeholder="যদি প্রাথমিক ঠিকানা থেকে ভিন্ন হয়"
                        value={deliveryAddress}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setDeliveryAddress(e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-[#2D4A3C]">
                        ডেলিভারি এলাকা *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryZone("inside_dhaka")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            deliveryZone === "inside_dhaka"
                              ? "border-[#819A91] bg-[#819A91]/10"
                              : "border-[#D1D8BE] bg-[#EEEFE0] hover:border-[#A7C1A8]"
                          }`}
                        >
                          <p className="font-semibold text-[#2D4A3C]">
                            ঢাকার মধ্যে
                          </p>
                          <p className="text-sm text-[#2D4A3C]/70">
                            ডেলিভারি চার্জ ৳80
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeliveryZone("outside_dhaka")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            deliveryZone === "outside_dhaka"
                              ? "border-[#819A91] bg-[#819A91]/10"
                              : "border-[#D1D8BE] bg-[#EEEFE0] hover:border-[#A7C1A8]"
                          }`}
                        >
                          <p className="font-semibold text-[#2D4A3C]">
                            ঢাকার বাইরে
                          </p>
                          <p className="text-sm text-[#2D4A3C]/70">
                            ডেলিভারি চার্জ ৳120
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#819A91] hover:bg-[#819A91]/90 text-white py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-4 sm:mt-6"
                    onClick={handleGoToPaymentStep}
                  >
                    পরবর্তী ধাপ
                  </Button>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === "payment" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-6 sm:h-8 bg-[#819A91] rounded-full"></div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#2D4A3C]">
                        পেমেন্ট পদ্ধতি
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setStep("details")}
                      className="text-[#2D4A3C]/80 hover:text-[#2D4A3C] text-white hover:bg-[#EEEFE0] text-sm sm:text-base p-2 sm:p-auto"
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">পূর্ববর্তী</span>
                      <span className="sm:hidden">←</span>
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {[
                      // Dynamic gateways from API
                      ...paymentGateways
                        .map((p) => {
                          const channel = (p as any)?.paymentGatewayData
                            ?.channel as string | undefined;
                          if (!channel) return null;
                          const slug = channel
                            .toLowerCase()
                            .replace(/\s+/g, "");
                          return {
                            id: slug,
                            name: channel,
                            color:
                              "bg-gradient-to-r from-emerald-500 to-green-500",
                          };
                        })
                        .filter(Boolean),
                      // Always keep Cash On Delivery option
                      {
                        id: "CashOnDelivery",
                        name: "ক্যাশ অন ডেলিভারি",
                        color: "bg-gradient-to-r from-[#A7C1A8] to-[#819A91]",
                      },
                    ].map((method: any) => (
                      <div
                        key={method.id}
                        className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 ${
                          paymentMethod === method.id
                            ? "border-[#819A91] bg-[#819A91]/5 shadow-md"
                            : "border-[#D1D8BE] hover:border-[#A7C1A8] hover:bg-[#EEEFE0]"
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${method.color} flex items-center justify-center shadow-md`}
                            >
                              <span className="text-white font-bold text-sm sm:text-lg">
                                {method.id === "CashOnDelivery"
                                  ? "COD"
                                  : getChannelInitials(method.name)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-[#2D4A3C] text-sm sm:text-base block truncate">
                                {method.name}
                              </span>
                              {method.id === "CashOnDelivery" && (
                                <p className="text-xs sm:text-sm text-[#2D4A3C]/70 mt-1">
                                  ডেলিভারির সময় পেমেন্ট করুন
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                              paymentMethod === method.id
                                ? "border-[#819A91] bg-[#819A91]"
                                : "border-[#D1D8BE]"
                            }`}
                          >
                            {paymentMethod === method.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {paymentMethod && paymentMethod !== "CashOnDelivery" && (
                    <div className="bg-[#EEEFE0] rounded-lg sm:rounded-xl p-4 sm:p-6 mt-4 sm:mt-6 border border-[#D1D8BE]">
                      <div className="flex items-center gap-3 mb-4">
                        <CreditCard className="w-5 h-5 text-[#819A91]" />
                        <h3 className="font-semibold text-[#2D4A3C]">
                          পেমেন্ট নির্দেশনা
                        </h3>
                      </div>
                      <p className="text-sm text-[#2D4A3C] mb-2">
                        পেমেন্ট করুন এই নাম্বারে:
                      </p>
                      {selectedGatewayAccounts.length > 0 ? (
                        <ul className="text-sm text-[#2D4A3C] mb-4 list-disc list-inside space-y-1">
                          {selectedGatewayAccounts.map((acc, idx) => (
                            <li key={idx}>
                              <strong className="text-[#2D4A3C]">{acc}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#2D4A3C]/70 mb-4">
                          কোনো অ্যাকাউন্ট নাম্বার পাওয়া যায়নি।
                        </p>
                      )}
                      {/* Transaction ID input */}
                      <LabeledInput
                        id="transactionId"
                        label="ট্রান্স্যাকশন আইডি *"
                        placeholder="আপনার ট্রান্স্যাকশন আইডি লিখুন"
                        value={transactionId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTransactionId(e.target.value)
                        }
                        className="bg-white border-[#D1D8BE] focus:border-[#819A91] text-[#2D4A3C] placeholder-[#2D4A3C]/50 mt-4 text-sm"
                      />

                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-[#2D4A3C]">
                          পেমেন্ট স্ক্রিনশট
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="w-full text-sm text-[#2D4A3C] file:mr-2 file:py-1 file:px-2 sm:file:mr-4 sm:file:py-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#819A91] file:text-white hover:file:bg-[#819A91]/90 cursor-pointer"
                        />
                        {(paymentScreenshotUrl || paymentScreenshotPreview) && (
                          <div className="mt-3">
                            <p className="text-xs text-[#2D4A3C]/70 mb-2">
                              প্রিভিউ:
                            </p>
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 border border-[#D1D8BE] rounded-lg sm:rounded-xl overflow-hidden bg-white">
                              <Image
                                src={
                                  paymentScreenshotUrl ||
                                  paymentScreenshotPreview!
                                }
                                alt="Payment screenshot preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}
                        {isUploadingScreenshot && (
                          <p className="text-xs text-[#2D4A3C]/60 mt-1">
                            স্ক্রিনশট আপলোড হচ্ছে...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod && (
                    <Button
                      className="w-full bg-[#819A91] hover:bg-[#819A91]/90 text-white py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-4 sm:mt-6"
                      onClick={handlePlaceOrder}
                      disabled={isUploadingScreenshot}
                    >
                      {isUploadingScreenshot
                        ? "স্ক্রিনশট আপলোড হচ্ছে..."
                        : "অর্ডার প্লেস করুন"}
                    </Button>
                  )}
                </div>
              )}

              {/* Step 3: Order Confirmation */}
              {step === "confirm" && placedOrder && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-6 sm:h-8 bg-[#819A91] rounded-full"></div>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#2D4A3C]">
                        অর্ডার নিশ্চিতকরণ
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setStep("payment")}
                      className="text-[#2D4A3C]/80 hover:text-[#2D4A3C] text-white hover:bg-[#EEEFE0] text-sm sm:text-base p-2 sm:p-auto"
                    >
                      <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">পূর্ববর্তী</span>
                      <span className="sm:hidden">←</span>
                    </Button>
                  </div>

                  <div className="bg-[#A7C1A8]/20 border border-[#A7C1A8] rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#A7C1A8] rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#2D4A3C]">
                        অর্ডার সফলভাবে তৈরি হয়েছে!
                      </h3>
                    </div>
                    <p className="text-[#2D4A3C]">
                      Invoice ID:{" "}
                      <strong className="text-[#2D4A3C]">{invoiceId}</strong>
                    </p>
                    {placedOrder?.orderId && (
                      <p className="text-[#2D4A3C] mt-1 text-sm">
                        Order ID (DB): <strong>{placedOrder.orderId}</strong>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#2D4A3C]">
                        গ্রাহক তথ্য
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-[#2D4A3C]/80">নাম:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {placedOrder.customer.name}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">মোবাইল:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {placedOrder.customer.mobile}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">ইমেইল:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {placedOrder.customer.email || "N/A"}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">ঠিকানা:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {placedOrder.customer.address}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-[#2D4A3C]">
                        অর্ডার বিবরণ
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-[#2D4A3C]/80">তারিখ:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {new Date(placedOrder.createdAt).toLocaleDateString(
                              "bn-BD",
                            )}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">সময়:</span>{" "}
                          <span className="text-[#2D4A3C]">
                            {new Date(placedOrder.createdAt).toLocaleTimeString(
                              "bn-BD",
                            )}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">
                            পেমেন্ট পদ্ধতি:
                          </span>{" "}
                          <span className="text-[#2D4A3C]">
                            {placedOrder.paymentMethod}
                          </span>
                        </p>
                        <p>
                          <span className="text-[#2D4A3C]/80">
                            পেমেন্ট স্ট্যাটাস:
                          </span>{" "}
                          <span className="text-[#2D4A3C] font-semibold">
                            {getPaymentStatusFromMethod(
                              placedOrder.paymentMethod,
                            )}
                          </span>
                        </p>
                        {placedOrder.transactionId && (
                          <p>
                            <span className="text-[#2D4A3C]/80">
                              ট্রান্স্যাকশন:
                            </span>{" "}
                            <span className="text-[#2D4A3C]">
                              {placedOrder.transactionId}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(paymentScreenshotUrl || paymentScreenshotPreview) && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-[#2D4A3C] mb-2">
                        পেমেন্ট স্ক্রিনশট
                      </h4>
                      <div className="relative w-40 h-40 border border-[#D1D8BE] rounded-xl overflow-hidden bg-white">
                        <Image
                          src={
                            paymentScreenshotUrl || paymentScreenshotPreview!
                          }
                          alt="Payment screenshot preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-[#A7C1A8] hover:bg-[#A7C1A8]/90 text-white py-2 sm:py-3 text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 mt-4 sm:mt-6"
                    onClick={handleConfirmOrder}
                    disabled={orderConfirmed}
                  >
                    {orderConfirmed
                      ? "অর্ডার সম্পন্ন হয়েছে"
                      : "অর্ডার সম্পন্ন করুন"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-[#D1D8BE] p-4 sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#2D4A3C] mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#D1D8BE]">
                অর্ডার সারাংশ
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-64 sm:max-h-96 overflow-y-auto">
                {itemsToRender.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg bg-[#EEEFE0] border border-[#D1D8BE]"
                  >
                    <div className="relative w-12 h-16 sm:w-16 sm:h-20 flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="rounded-lg object-cover shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-[#819A91] text-white rounded-full text-xs flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2D4A3C] line-clamp-2 text-xs sm:text-sm leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[#2D4A3C] font-semibold text-xs sm:text-sm mt-1">
                        ৳{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 sm:space-y-3 border-t border-[#D1D8BE] pt-3 sm:pt-4">
                <div className="flex justify-between text-[#2D4A3C]">
                  <span>সাবটোটাল</span>
                  <span>৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#2D4A3C]">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base sm:text-lg text-[#2D4A3C] border-t border-[#D1D8BE] pt-2 sm:pt-3">
                  <span>মোট</span>
                  <span className="text-[#2D4A3C] font-bold">
                    ৳{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-6 border-t border-[#D1D8BE] space-y-2 sm:space-y-4">
                <div className="flex items-center gap-3 text-sm text-[#2D4A3C]">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#A7C1A8]" />
                  <span>সুরক্ষিত পেমেন্ট</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#2D4A3C]">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-[#819A91]" />
                  <span>২-৪ কর্মদিবসে ডেলিভারি</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 sm:space-y-6 shadow-2xl border border-[#D1D8BE]">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#A7C1A8] rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D4A3C]">
              🎉 অর্ডার সফল!
            </h2>
            <p className="text-sm sm:text-base text-[#2D4A3C] leading-relaxed px-2">
              আপনার অর্ডার সফলভাবে গৃহীত হয়েছে। অর্ডার ট্র্যাক করতে নিচের বাটনে
              ক্লিক করুন।
            </p>
            <div className="space-y-2 sm:space-y-3">
              <Link href="/kitabghor/user/orders" className="block">
                <Button className="w-full bg-[#819A91] hover:bg-[#819A91]/90 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base">
                  অর্ডার ট্র্যাক করুন
                </Button>
              </Link>
              <Link href="/kitabghor/books">
                <Button
                  variant="outline"
                  className="w-full border-[#D1D8BE] text-[#2D4A3C] hover:bg-[#EEEFE0] rounded-lg sm:rounded-xl text-sm sm:text-base"
                >
                  আরও বই দেখুন
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
