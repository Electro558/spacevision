"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Menu, X, Wrench, User, LogIn } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const links = [
    { href: "/generate", label: "Workspace" },
    { href: "/gallery", label: "Gallery" },
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Space<span className="text-brand">Vision</span>
            </span>
          </Link>

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

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => setIsLoggedIn(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
              >
                <User className="w-4 h-4" />
                Account
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsLoggedIn(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <Link
                  href="/generate"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand hover:bg-brand-hover text-white transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Open Workspace
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
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
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-surface-lighter transition-all"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-surface-border">
                <Link
                  href="/generate"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm bg-brand hover:bg-brand-hover text-white transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Open Workspace
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
