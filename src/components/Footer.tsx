"use client";

import Link from "next/link";
import { Box, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <Box className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                Space<span className="text-brand">Vision</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              AI-assisted 3D modeling for everyone. A non-profit CAD platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-4">Product</h4>
            <div className="space-y-2">
              {[
                { label: "Workspace", href: "/generate" },
                { label: "Gallery", href: "/gallery" },
                { label: "Pricing", href: "/pricing" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-gray-500 hover:text-brand transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-4">Resources</h4>
            <div className="space-y-2">
              {["Documentation", "API", "Community", "Blog"].map((item) => (
                <span key={item} className="block text-sm text-gray-500 cursor-default">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-300 mb-4">Legal</h4>
            <div className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <span key={item} className="block text-sm text-gray-500 cursor-default">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-surface-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} SpaceVision. Non-profit, open for everyone.
          </p>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-brand transition-colors">
              <Github className="w-4 h-4" />
            </button>
            <button className="text-gray-600 hover:text-brand transition-colors">
              <Twitter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
