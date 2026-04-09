"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Menu, X, LogOut, User, ChevronDown, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session, status } = useSession();

  const links = [
    { label: "Workspace", href: "/generate" },
    { label: "CAD", href: "/cad" },
    { label: "Mesh Gen", href: "/mesh" },
    { label: "Gallery", href: "/gallery" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Space<span className="text-brand">Vision</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">
                      {session.user.name?.[0] || session.user.email?.[0] || "?"}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-dark border border-surface-border rounded-lg shadow-xl py-1">
                    <div className="px-3 py-2 border-b border-surface-border">
                      <p className="text-sm text-white font-medium truncate">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.user.email}
                      </p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                        {session.user.plan === "PREMIUM" ? "Premium" : "Free"}
                      </span>
                    </div>
                    {session.user.email === "coolbanana558@gmail.com" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-lighter"
                      >
                        <ShieldCheck className="w-4 h-4 text-brand" />
                        Admin
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-lighter"
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-lighter"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm bg-brand hover:bg-brand-hover text-white transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-surface-border bg-surface-dark/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-surface-border">
                {session?.user ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all text-left"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm text-brand hover:text-brand-hover transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
