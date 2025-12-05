"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Map as MapIcon, ClipboardList } from "lucide-react";
import clsx from "clsx";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/customer", label: "خانه", icon: MapIcon },
    { href: "/customer/bookings", label: "سفارش‌ها", icon: ClipboardList },
    { href: "/customer/profile", label: "پروفایل", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 py-2 safe-area-bottom backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {tabs.map((t) => {
          const active = pathname === t.href;
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-1 text-xs",
                  active ? "text-blue-600" : "text-gray-600",
                )}
              >
                <Icon size={20} />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}