"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  BookOpen,
  LibraryBig,
  Layers,
  Archive,
  Book,
  Pen,
  School,
  BookType,
  AudioLines,
  MessageSquareQuote,
  House,
  Tag,
  User,
  Store,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Search,
  LogOut,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/ecommarce/CartContext";
import { useWishlist } from "@/components/ecommarce/WishlistContext";

// শুধু সার্চের জন্য মিনিমাল প্রোডাক্ট টাইপ
interface ProductSummary {
  id: number | string;
  name: string;
  writer?: {
    name: string;
  } | null;
  image?: string | null;
}

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cartItems } = useCart();
  const { wishlistCount } = useWishlist();
  const [hasMounted, setHasMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🔢 কার্ট কাউন্ট স্টেট
  const [cartCount, setCartCount] = useState(0);

  // 🔍 সার্চ স্টেটগুলো
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);

  const handleAuthClick = async () => {
    if (status === "authenticated") {
      setIsPending(true);
      try {
        await signOut();
        router.push("/");
        router.refresh();
      } catch (error) {
        console.error("Error signing out:", error);
      } finally {
        setIsPending(false);
      }
    } else {
      router.push("/signin");
    }
  };

  useEffect(() => {
    setHasMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ cartItems বদলালেই লোকালি count আপডেট (guest + logged in দুজনের জন্য)
  useEffect(() => {
    const total =
      cartItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    setCartCount(total);
  }, [cartItems]);

  // ✅ যদি লগইন করা থাকে এবং context খালি থাকে → /api/cart থেকে count hydrate করো (refresh scenario)
  useEffect(() => {
    const syncServerCartCount = async () => {
      if (status !== "authenticated") return;
      if (cartItems && cartItems.length > 0) return; // context এ ডাটা আছে, আর sync লাগবে না

      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const serverCount =
          items.reduce(
            (sum: number, item: any) => sum + Number(item.quantity || 0),
            0
          ) || 0;

        setCartCount(serverCount);
      } catch (err) {
        console.error("Failed to sync server cart count:", err);
      }
    };

    syncServerCartCount();
  }, [status, cartItems]);

  // 🔁 হেডার মাউন্ট হলে একবারই /api/products থেকে সব বই লোড
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setSearchLoading(true);
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) {
          console.error("Failed to load products for search");
          return;
        }
        const data = await res.json();
        const mapped: ProductSummary[] = Array.isArray(data)
          ? data.map((p: any) => ({
              id: p.id,
              name: p.name,
              writer: p.writer ?? null,
              image: p.image ?? null,
            }))
          : [];
        setAllProducts(mapped);
        setHasLoadedProducts(true);
      } catch (err) {
        console.error("Error loading products for search:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    loadProducts();
  }, []);

  // 🔎 searchTerm পরিবর্তন হলে লোকাল ফিল্টার
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2 || !hasLoadedProducts) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allProducts
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 8); // সর্বোচ্চ ৮টা সাজেশন

    setSearchResults(filtered);
    setShowSearchDropdown(filtered.length > 0);
  }, [searchTerm, allProducts, hasLoadedProducts]);

  // 🔁 বাইরে ক্লিক করলে ড্রপডাউন হাইড (optional simple version)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.(".header-search-wrapper")) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSelectProduct = (product: ProductSummary) => {
    setSearchTerm("");
    setShowSearchDropdown(false);
    setIsMenuOpen(false);
    router.push(`/kitabghor/books/${product.id}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSelectProduct(searchResults[0]);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const navItems = [
    { name: "হোম", href: "/", icon: House },
    { name: "সকল বইসমূহ", href: "/kitabghor/books", icon: Book },
    { name: "বিষয়সমূহ", href: "/kitabghor/categories", icon: Tag },
    { name: "লেখক", href: "/kitabghor/authors", icon: User },
    { name: "প্রকাশক", href: "/kitabghor/publishers", icon: Store },
    {
      name: "কওমী পাঠ্য কিতাব",
      icon: LibraryBig,
      children: [
        { name: "দাওরায়ে হাদীস", href: "/kowmi/daura", icon: BookOpen },
        { name: "মাদানী নেসাব", href: "/kowmi/madani", icon: Layers },
        { name: "মকতব বিভাগ", href: "/kowmi/maktab", icon: School },
        { name: "হিফজ বিভাগ", href: "/kowmi/hifz", icon: Book },
        { name: "তাকমীল বিভাগ", href: "/kowmi/takmil", icon: Pen },
        { name: "ফতওয়া বিভাগ", href: "/kowmi/fatwa", icon: Archive },
        { name: "জামাতে তাফসীর", href: "/kowmi/tafsir", icon: Book },
        { name: "জামাতে কিরাত", href: "/kowmi/qirat", icon: AudioLines },
        { name: "জামাতে নাহব", href: "/kowmi/nahw", icon: MessageSquareQuote },
        { name: "জামাতে হাদীস", href: "/kowmi/hadith", icon: BookType },
        { name: "জামাতে শরহে বেকায়া", href: "/kowmi/bekaya", icon: School },
        { name: "জামাতে মেশকাত", href: "/kowmi/meshkat", icon: BookOpen },
      ],
    },
    { name: "বইমেলা ২০২৫", href: "/kitabghor/book-fair", icon: CalendarCheck },
    { name: "ব্লগ", href: "/kitabghor/blogs", icon: Tag },
  ];

  const userName = (session?.user as any)?.name || "ব্যবহারকারী";
  const userRole = (session?.user as any)?.role || "user";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#819A91] shadow-lg backdrop-blur-sm bg-opacity-35"
          : "bg-gradient-to-r from-[#819A91] to-[#A7C1A8]"
      }`}
    >
      {/* Top Bar */}
      <div className="bg-[#819A91] text-[#EEEFE0] py-1 px-4 text-sm">
        <div className="container mx-auto text-center">
          বিনামূল্যে ডেলিভারি - ৫০০৳
        </div>
      </div>

      <div
        className={`container mx-auto px-4 transition-all duration-300 ${
          isScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-[#EEEFE0] p-2 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-gradient-to-br from-[#2C4A3B] to-[#819A91] rounded-md flex items-center justify-center">
                <Book className="h-5 w-5 text-[#EEEFE0]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span
                className={`font-bold transition-all duration-300 ${
                  isScrolled
                    ? "text-lg text-[#EEEFE0]"
                    : "text-xl text-[#EEEFE0]"
                }`}
              >
                হিলফুল-ফুযুল প্রকাশনী
              </span>
              <span className="text-xs text-[#D1D8BE]">
                বইয়ের জন্য বিশ্বস্ত সঙ্গী
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 header-search-wrapper relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchDropdown(true)
                }
                placeholder="বই, লেখক বা বিষয় অনুসন্ধান করুন..."
                className="w-full px-4 py-2 pl-10 rounded-full border border-[#D1D8BE] focus:outline-none focus:ring-2 focus:ring-[#2C4A3B] focus:border-transparent bg-[#EEEFE0] text-gray-800 placeholder-gray-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />

              {/* 🔽 সার্চ ড্রপডাউন */}
              {showSearchDropdown && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-[#D1D8BE] max-h-80 overflow-auto z-50">
                  {searchLoading && !hasLoadedProducts ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      লোড হচ্ছে...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      কোন বই পাওয়া যায়নি
                    </div>
                  ) : (
                    searchResults.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectProduct(book)}
                        className="w-full flex items-center px-4 py-2 text-left hover:bg-[#EEEFE0] transition-colors text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">
                            {book.name}
                          </span>
                          {book.writer?.name && (
                            <span className="text-xs text-gray-500">
                              লেখক: {book.writer.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/kitabghor/wishlist" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-[#EEEFE0] bg-opacity-80 hover:bg-[#2C4A3B] hover:text-[#EEEFE0] text-[#819A91] transition-all duration-300 hover:scale-105"
              >
                <Heart className="h-5 w-5" />
                {hasMounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/kitabghor/cart" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-[#EEEFE0] bg-opacity-80 hover:bg-[#2C4A3B] hover:text-[#EEEFE0] text-[#819A91] transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                {hasMounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User name & role (desktop) */}
            {hasMounted && session && (
              <div className="flex flex-col items-end mr-1 leading-tight">
                <span className="text-sm font-semibold text-[#EEEFE0]">
                  {userName}
                </span>
                <span className="text-[11px] text-[#D1D8BE]">{userRole}</span>
              </div>
            )}

            {hasMounted && session && (
              <Link href={userRole === "admin" ? "/admin" : "/kitabghor/user/"}>
                <Button
                  variant="ghost"
                  className="rounded-full bg-[#EEEFE0] bg-opacity-80 hover:bg-[#2C4A3B] hover:text-[#EEEFE0] text-[#819A91] transition-all duration-300 hover:scale-105 px-4"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  ড্যাশবোর্ড
                </Button>
              </Link>
            )}

            <Button
              onClick={handleAuthClick}
              disabled={isPending}
              className="rounded-full bg-[#2C4A3B] hover:bg-[#1A3325] text-[#EEEFE0] font-semibold px-6 transition-all duration-300 border border-[#2C4A3B] hover:border-[#1A3325] hover:shadow-lg flex items-center space-x-2 hover:scale-105"
            >
              {isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : hasMounted && session ? (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>লগআউট</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>লগইন</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full bg-[#EEEFE0] bg-opacity-80 hover:bg-[#2C4A3B] hover:text-[#EEEFE0] text-[#819A91] transition-all"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-1 mt-4">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.name} className="relative group">
                <button
                  className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                    item.children.some((child) => child.href === pathname)
                      ? "bg-[#EEEFE0] text-[#2C4A3B] font-semibold shadow-sm"
                      : "text-[#EEEFE0] hover:bg-[#2C4A3B] hover:text-[#EEEFE0] hover:font-semibold"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
                <div className="absolute top-full left-0 mt-2 bg-[#EEEFE0] shadow-xl border border-[#D1D8BE] rounded-lg w-64 hidden group-hover:block z-50 overflow-hidden">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`flex items-center px-4 py-3 hover:bg-[#2C4A3B] hover:text-[#EEEFE0] transition-all duration-300 border-b border-[#D1D8BE] last:border-b-0 group/item ${
                        pathname === child.href
                          ? "bg-[#2C4A3B] text-[#EEEFE0] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      <child.icon className="h-4 w-4 mr-3 text-[#819A91] group-hover/item:text-[#EEEFE0] transition-colors" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                  pathname === item.href
                    ? "bg-[#EEEFE0] text-[#2C4A3B] font-semibold shadow-sm"
                    : "text-[#EEEFE0] hover:bg-[#2C4A3B] hover:text-[#EEEFE0] hover:font-semibold"
                }`}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            )
          )}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#EEEFE0] shadow-inner">
          {/* Mobile Search */}
          <div className="p-4 border-b border-[#D1D8BE] header-search-wrapper relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchDropdown(true)
                }
                placeholder="বই, লেখক বা বিষয় অনুসন্ধান করুন..."
                className="w-full px-4 py-2 pl-10 rounded-full border border-[#D1D8BE] focus:outline-none focus:ring-2 focus:ring-[#2C4A3B] bg-white text-gray-800"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />

              {/* 🔽 মোবাইল সার্চ ড্রপডাউন */}
              {showSearchDropdown && (
                <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-[#D1D8BE] max-h-80 overflow-auto z-50">
                  {searchLoading && !hasLoadedProducts ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      লোড হচ্ছে...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      কোন বই পাওয়া যায়নি
                    </div>
                  ) : (
                    searchResults.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => handleSelectProduct(book)}
                        className="w-full flex items-center px-4 py-2 text-left hover:bg-[#EEEFE0] transition-colors text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">
                            {book.name}
                          </span>
                          {book.writer?.name && (
                            <span className="text-xs text-gray-500">
                              লেখক: {book.writer.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="flex flex-col py-2">
            {navItems.map((item) =>
              item.children ? (
                <div key={item.name} className="border-b border-[#D1D8BE]">
                  <button
                    onClick={toggleDropdown}
                    className={`flex items-center justify-between w-full px-6 py-4 text-left font-semibold transition-all duration-300 ${
                      item.children.some((c) => c.href === pathname)
                        ? "text-[#2C4A3B] bg-[#D1D8BE] bg-opacity-50"
                        : "text-gray-700 hover:text-[#2C4A3B] hover:bg-[#D1D8BE] hover:bg-opacity-30"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-4 w-4 mr-3 text-[#2C4A3B]" />
                      {item.name}
                    </div>
                    {isDropdownOpen ? (
                      <ChevronDown className="h-4 w-4 text-[#2C4A3B]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#2C4A3B]" />
                    )}
                  </button>
                  {isDropdownOpen && (
                    <div className="bg-[#D1D8BE] bg-opacity-30">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`flex items-center px-10 py-3 border-t border-[#D1D8BE] border-opacity-50 transition-all duration-300 ${
                            pathname === child.href
                              ? "text-[#2C4A3B] font-semibold bg-white"
                              : "text-gray-700 hover:text-[#2C4A3B] hover:bg:white hover:font-semibold"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <child.icon className="h-4 w-4 mr-3 text-[#2C4A3B]" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-6 py-4 border-b border-[#D1D8BE] transition-all duration-300 ${
                    pathname === item.href
                      ? "text-[#2C4A3B] font-semibold bg-[#D1D8BE] bg-opacity-50"
                      : "text-gray-700 hover:text-[#2C4A3B] hover:bg-[#D1D8BE] hover:bg-opacity-30 hover:font-semibold"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-3 text-[#2C4A3B]" />
                  {item.name}
                </Link>
              )
            )}

            {/* Cart & Wishlist (mobile) */}
            <div className="flex items-center justify-around p-4 border-t border-[#D1D8BE] bg-[#EEEFE0]">
              <Link
                href="/kitabghor/wishlist"
                className="relative"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-[#2C4A3B] hover:bg-[#1A3325] text-[#EEEFE0] transition-all duration-300 hover:scale-105"
                >
                  <Heart className="h-5 w-5" />
                  {hasMounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
                <span className="text-xs text-[#2C4A3B] mt-1 block">
                  উইশলিস্ট
                </span>
              </Link>

              <Link
                href="/kitabghor/cart"
                className="relative"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-[#2C4A3B] hover:bg-[#1A3325] text-[#EEEFE0] transition-all duration-300 hover:scale-105"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {hasMounted && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                      {cartCount}
                    </span>
                  )}
                </Button>
                <span className="text-xs text-[#2C4A3B] mt-1 block">কার্ট </span>
              </Link>
            </div>

            {/* User info (mobile) */}
            {hasMounted && session && (
              <div className="px-6 py-3 border-t border-[#D1D8BE] bg-[#EEEFE0] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2C4A3B]">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-600">{userRole}</p>
                </div>
              </div>
            )}

            {hasMounted && session && (
              <div className="p-4 border-t border-[#D1D8BE]">
                <Link
                  href={userRole === "admin" ? "/admin" : "/kitabghor/user/"}
                  className="block w-full"
                >
                  <Button className="w-full rounded-full bg-[#2C4A3B] hover:bg-[#1A3325] text-[#EEEFE0] font-semibold py-3 transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>ড্যাশবোর্ড</span>
                  </Button>
                </Link>
              </div>
            )}

            <div className="p-4 border-t border-[#D1D8BE]">
              <Button
                onClick={handleAuthClick}
                disabled={isPending}
                className="w-full rounded-full bg-[#2C4A3B] hover:bg-[#1A3325] text-[#EEEFE0] font-semibold py-3 transition-all duration-300 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : hasMounted && session ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>লগআউট</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>লগইন</span>
                  </>
                )}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
