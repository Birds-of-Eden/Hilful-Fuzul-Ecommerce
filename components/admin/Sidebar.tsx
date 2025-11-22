"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";

// Updated menuItems (Using the provided structure)
const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Orders", href: "/admin/orders", icon: FileText },
  {
    name: "Management",
    icon: ClipboardList,
    subItems: [
      { name: "Writers", href: "/admin/management/writers" },
      { name: "Categories", href: "/admin/management/categories" },
      { name: "Publishers", href: "/admin/management/publishers" },
    ],
  },
  { name: "Blog", href: "/admin/blogs", icon: BookOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface MenuItemProps {
  item: (typeof menuItems)[0];
  pathname: string;
  onClose?: () => void;
}

const MenuItem = ({ item, pathname, onClose }: MenuItemProps) => {
  const isManagementActive = pathname.startsWith("/admin/management");
  const initialOpenState = item.name === "Management" && isManagementActive;

  const [isOpen, setIsOpen] = useState(initialOpenState);
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // Determine active state for parent links
  const isActive = item.href
    ? pathname === item.href ||
      (item.href !== "/admin" && pathname.startsWith(item.href))
    : isManagementActive;

  useEffect(() => {
    if (item.name === "Management" && isManagementActive) {
      setIsOpen(true);
    }
  }, [isManagementActive, item.name]);

  // --- Professional Theme Classes ---
  const baseClasses =
    "flex items-center gap-3 px-6 py-3 transition duration-150 ease-in-out text-sm font-medium";

  // Base link colors
  const defaultLinkClasses =
    "text-gray-200 hover:text-white hover:bg-[#1f5651]";

  // Active link colors: Emerald green background with a light gold border
  const activeLinkClasses =
    "text-white bg-[#34D399] font-semibold border-l-4 border-[#34D399]";

  // Dropdown button colors
  const buttonActiveClasses = "text-white bg-[#1f5651] font-semibold";
  const buttonDefaultClasses =
    "text-gray-200 hover:text-white hover:bg-[#1f5651]";

  return (
    <div>
      {hasSubItems ? (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full justify-between",
              baseClasses,
              isOpen ? buttonActiveClasses : buttonDefaultClasses
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {item.name}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isOpen && (
            // Sub-menu border changed to a contrasting light color
            <div className="ml-5 my-1 border-l border-gray-500 space-y-1">
              {item.subItems?.map((subItem) => {
                const isSubItemActive = pathname === subItem.href;
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    onClick={
                      hasSubItems ? () => onClose && onClose() : undefined
                    }
                    className={cn(
                      "block pl-7 pr-3 py-2 text-xs transition duration-150 ease-in-out rounded-r",
                      isSubItemActive
                        ? "text-[#34D399] font-medium" // Sub-item active color: Gold
                        : "text-gray-400 hover:text-white hover:bg-[#15534c]" // Sub-item hover
                    )}
                  >
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.href || "#"}
          onClick={onClose ? () => onClose() : undefined}
          className={cn(
            baseClasses,
            "w-full",
            isActive ? activeLinkClasses : defaultLinkClasses
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <item.icon className="h-5 w-5" />
            {item.name}
          </div>
        </Link>
      )}
    </div>
  );
};

// Sidebar Content wrapper
const SidebarContent = ({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) => (
  <nav className="mt-6 pb-8 space-y-1">
    {menuItems.map((item) => (
      <MenuItem
        key={item.name}
        item={item}
        pathname={pathname}
        onClose={onClose}
      />
    ))}
  </nav>
);

export default function Sidebar({
  isMobile = false,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const themeBg = "bg-[#10403C]"; // Deep Forest/Emerald Green
  const themeAccent = "text-[#34D399]"; // Light Gold/Amber

  if (isMobile) {
    return (
      <div className={cn("h-full flex flex-col text-white", themeBg)}>
        <div
          className={cn(
            "h-16 flex items-center justify-center border-b border-gray-700 font-extrabold text-2xl",
            themeAccent
          )}
        >
          Admin
        </div>
        <div className="flex-1 overflow-y-auto" onClick={onClose}>
          <SidebarContent pathname={pathname} onClose={onClose} />
        </div>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        "w-64 shadow-xl h-screen fixed left-0 top-0 overflow-y-auto",
        themeBg
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center justify-center border-b border-gray-700 font-extrabold text-2xl sticky top-0 z-10",
          themeAccent,
          themeBg
        )}
      >
        Admin
      </div>
      <SidebarContent pathname={pathname} />
    </aside>
  );
}
