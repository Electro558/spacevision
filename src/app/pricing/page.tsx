"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Star, Wrench, Zap, Users, ArrowRight, HelpCircle } from "lucide-react";
import Footer from "@/components/Footer";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const tiers = [
  {
    name: "Free", icon: Wrench, price: "$0", period: "forever",
    description: "Core 3D generation and editing for everyone. No credit card required.",
    features: [
      { text: "10 generations per day", included: true },
      { text: "Personal account", included: true },
      { text: "Save up to 10 models", included: true },
      { text: "STL export", included: true },
      { text: "Manual editing tools", included: true },
      { text: "Basic sharing links", included: true },
      { text: "OBJ / FBX / GLTF export", included: false },
      { text: "Priority generation", included: false },
      { text: "Collaboration", included: false },
    ],
    cta: "Get Started Free", href: "/generate", highlighted: false,
  },
  {
    name: "Creator", icon: Zap, price: "$12", period: "/month",
    description: "For power users who create often and need professional output.",
    features: [
      { text: "Unlimited generations", included: true },
      { text: "Personal account", included: true },
      { text: "Unlimited saved models", included: true },
      { text: "STL + OBJ + FBX + GLTF export", included: true },
      { text: "Advanced editing tools", included: true },
      { text: "Advanced sharing options", included: true },
      { text: "High quality output", included: true },
      { text: "Priority generation queue", included: true },
      { text: "Collaboration (up to 3 members)", included: false },
    ],
    cta: "Upgrade to Creator", href: "/generate", highlighted: true,
  },
  {
    name: "Studio", icon: Users, price: "$29", period: "/month",
    description: "Full collaboration features for teams and shared creative spaces.",
    features: [
      { text: "Unlimited generations", included: true },
      { text: "Team accounts", included: true },
      { text: "Unlimited saved models", included: true },
      { text: "All export formats", included: true },
      { text: "Full editing suite", included: true },
      { text: "Advanced sharing options", included: true },
      { text: "Highest quality output", included: true },
      { text: "Priority generation queue", included: true },
      { text: "Shared workspaces (up to 10 members)", included: true },
    ],
    cta: "Start with Studio", href: "/generate", highlighted: false,
  },
];

const faqs = [
  { q: "Is SpaceVision really free?", a: "Yes! SpaceVision is a non-profit platform. The free tier gives you full access to AI 3D generation, manual editing, and STL export. Paid tiers exist to fund compute costs and enable power features." },
  { q: "What 3D formats can I export?", a: "The free tier supports STL export. Creator and Studio plans add OBJ, FBX, and GLTF formats — compatible with Blender, Unity, Unreal Engine, and more." },
  { q: "Can I use generated models commercially?", a: "Yes. All models you generate are yours to use however you like, including for commercial projects and 3D printing." },
  { q: "How does collaboration work?", a: "Studio plan members can create shared workspaces, invite team members, and work on models together. Changes are synced across all members." },
  { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no commitments. Cancel anytime and you'll keep access until the end of your billing period. Your saved models are always yours." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-14 bg-surface-dark">
      <section className="py-20 relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-blue-300 text-sm mb-6">
              <Star className="w-4 h-4" />
              Non-profit pricing &mdash; Free forever tier
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold mb-4">
              Simple, <span className="text-brand">transparent</span> pricing
            </motion.h1>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start free. Upgrade when you need more power. Every dollar supports keeping 3D creation accessible to everyone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <motion.div
                key={tier.name} variants={fadeUp}
                className={`relative rounded-2xl p-8 ${tier.highlighted ? "bg-brand/10 border-2 border-brand/40 scale-[1.02]" : "bg-white/[0.02] border border-surface-border"}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tier.highlighted ? "bg-brand/20" : "bg-white/5"}`}>
                    <tier.icon className={`w-5 h-5 ${tier.highlighted ? "text-brand" : "text-gray-400"}`} />
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-500 text-sm">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-400 mb-6">{tier.description}</p>
                <Link
                  href={tier.href}
                  className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold transition-all text-sm mb-8 ${tier.highlighted ? "bg-brand hover:bg-brand-hover text-white" : "bg-white/5 hover:bg-white/10 text-white border border-surface-border"}`}
                >
                  {tier.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <ul className="space-y-3">
                  {tier.features.map((f) => (
                    <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.included ? "text-gray-300" : "text-gray-600"}`}>
                      {f.included ? <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" />}
                      {f.text}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 border-t border-surface-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-sm">Everything you need to know about SpaceVision pricing.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl bg-white/[0.02] border border-surface-border p-6">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-brand" /> {faq.q}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start <span className="text-brand">creating?</span></h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join the community and start generating 3D models for free. No credit card, no commitment.</p>
          <Link href="/generate" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-lg transition-all">
            <Wrench className="w-5 h-5" /> Start Creating Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
