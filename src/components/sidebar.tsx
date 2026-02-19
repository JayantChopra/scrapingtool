"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Map,
  Settings,
  TreePine,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: List, label: "Lists", href: "/lists" },
  { icon: Map, label: "Geography", href: "/geography" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-end -space-x-1.5 text-blue-400">
            <TreePine className="w-3.5 h-4" />
            <TreePine className="w-4 h-6" />
            <TreePine className="w-3.5 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white tracking-tight whitespace-nowrap">
              Doug&apos;s Personal Scraper
            </h1>
            <p className="text-xs text-gray-500 whitespace-nowrap">Made with ❤️ by Polarity Labs</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
