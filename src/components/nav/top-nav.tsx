"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function TopNav() {
  const pathname = usePathname();
  const links = [
    { href: "/customer", label: "مشتری" },
    { href: "/provider", label: "تعمیرکار" },
    { href: "/admin", label: "مدیر" },
  ];
  return (
    <header className="hidden border-b bg-white/80 backdrop-blur sm:block">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold">
          مکانیکو
        </Link>
        <nav className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-md px-3 py-1 text-sm text-gray-700 hover:bg-gray-50",
                pathname?.startsWith(l.href) && "bg-gray-100 text-gray-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}