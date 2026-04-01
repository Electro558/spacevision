"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, HelpCircle, Loader2, Crown } from "lucide-react";
import Footer from "@/components/Footer";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with 3D modeling",
    features: [
      "10 AI generations per day",
      "Save up to 5 models",
      "STL export",
      "Basic composition recipes",
      "Simple & advanced editing modes",
    ],
    cta: "Get Started",
    href: "/generate",
    highlighted: false,
    plan: "FREE" as const,
  },
  {
    name: "Premium",
    price: "$12",
    period: "/month",
    description: "Unlimited creativity and exports",
    features: [
      "Unlimited AI generations",
      "Unlimited saved models",
      "All export formats (STL, OBJ, GLTF)",
      "Advanced composition recipes",
      "Priority support",
    ],
    cta: "Upgrade Now",
    href: null,
    highlighted: true,
    plan: "PREMIUM" as const,
  },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes, cancel anytime from your dashboard. You keep Premium until the end of your billing period." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards via Stripe." },
  { q: "Is there a free trial?", a: "The free tier is always free with generous limits. Try it out before upgrading." },
  { q: "Can I use generated models commercially?", a: "Yes. All models you generate are yours to use however you like, including for commercial projects and 3D printing." },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const currentPlan = session?.user?.plan || "FREE";

  return (
    <div className="min-h-screen pt-14 bg-surface-dark">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, <span className="text-brand">transparent</span> pricing
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start for free. Upgrade when you need unlimited AI generations and all export formats.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="pb-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto px-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? "bg-brand/10 border-2 border-brand/40"
                  : "bg-white/[0.02] border border-surface-border"
              }`}
            >
              {currentPlan === tier.plan && (
                <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                  Current Plan
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{tier.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{tier.description}</p>
              <div className="flex items-baseline gap-1 mt-4 mb-6">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-gray-400">{tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-brand flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.plan === "FREE" ? (
                <Link
                  href={tier.href!}
                  className="block w-full text-center py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-surface-border"
                >
                  {currentPlan === "FREE" ? "Open Workspace" : tier.cta}
                </Link>
              ) : currentPlan === "PREMIUM" ? (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe/portal", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-surface-border"
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Crown className="w-4 h-4" />
                  {tier.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon: Studio */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl p-8 bg-white/[0.01] border border-surface-border/50 opacity-60">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Studio</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Coming Soon</span>
            </div>
            <p className="text-gray-500 text-sm">Team collaboration for up to 10 members, shared workspaces, and more.</p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">
              <HelpCircle className="inline w-6 h-6 mr-2" />
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-xl bg-white/[0.02] border border-surface-border p-6">
                <h3 className="font-semibold text-sm text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
