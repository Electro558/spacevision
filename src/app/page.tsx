"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Box,
  Users,
  Zap,
  Share2,
  Layers,
  Download,
  GraduationCap,
  Palette,
  Lightbulb,
  Check,
  Star,
  Wrench,
  Send,
  Loader2,
} from "lucide-react";
import Footer from "@/components/Footer";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <Scene3D />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/40 via-transparent to-surface-dark" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/60 via-transparent to-surface-dark/60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-blue-300 text-sm mb-8"
          >
            <Wrench className="w-4 h-4" />
            AI-Assisted CAD &mdash; Free to use
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            From description
            <br />
            <span className="text-brand">to 3D model</span> &mdash; instantly.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-10 max-w-2xl"
          >
            SpaceVision turns your ideas into real 3D models using AI. Describe, generate,
            edit manually, and export as STL &mdash; all in one workspace.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold transition-all text-lg"
            >
              <Wrench className="w-5 h-5" />
              Open Workspace
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10 text-lg"
            >
              View Gallery
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand" /> Free forever</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand" /> STL export</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand" /> Manual editing</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Zap, title: "AI Generation", description: "Describe your idea and get a 3D model in seconds. Iterate through variations quickly." },
    { icon: Wrench, title: "Manual Editing", description: "Move, rotate, scale objects. Add primitives. Toggle wireframe. Full CAD-style controls." },
    { icon: Download, title: "STL Export", description: "Export your models as STL files — ready for 3D printing, Blender, or any CAD software." },
    { icon: Users, title: "Collaboration", description: "Work together in shared project spaces with your team, friends, or classmates." },
    { icon: Share2, title: "Share & Discover", description: "Share your creations with the community. Get inspired by what others are building." },
    { icon: Layers, title: "Project Library", description: "Save, organize, and manage all your models. Build your personal 3D library." },
  ];

  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 cad-grid opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need to <span className="text-brand">model in 3D</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered generation meets hands-on CAD tools. Design, iterate, and export — all in your browser.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title} variants={fadeUp}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-surface-border hover:border-brand/30 hover:bg-white/[0.04] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/20 transition-colors">
                <f.icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function BeneficiariesSection() {
  const groups = [
    { icon: Wrench, title: "Beginners", description: "Interested in 3D but overwhelmed by traditional CAD software" },
    { icon: GraduationCap, title: "Students & Educators", description: "Visual models for learning, assignments, and presentations" },
    { icon: Palette, title: "Makers & Creators", description: "Prototype ideas and export for 3D printing" },
    { icon: Lightbulb, title: "Innovators", description: "Explore early prototypes and product concepts" },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="text-brand">everyone</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
            You don&apos;t need to be an expert. If you can describe it, SpaceVision can help you build it.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {groups.map((g) => (
            <motion.div
              key={g.title} variants={fadeUp}
              className="text-center p-8 rounded-2xl bg-white/[0.02] border border-surface-border hover:border-brand/20 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <g.icon className="w-7 h-7 text-brand" />
              </div>
              <h3 className="font-semibold mb-2">{g.title}</h3>
              <p className="text-gray-400 text-sm">{g.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

function DemoSection() {
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const examples = ["simple house with a red roof", "gold trophy", "rocket ship with fins", "cat sitting down"];

  const handleGenerate = (text?: string) => {
    const p = text || prompt;
    if (!p.trim() || isGenerating) return;
    setPrompt(p);
    setIsGenerating(true);
    setTimeout(() => {
      setActivePrompt(p);
      setIsGenerating(false);
      setHasGenerated(true);
    }, 1200);
  };

  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 cad-grid opacity-30" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="text-center mb-12"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
            See it in <span className="text-brand">action</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg">
            Type a prompt and watch SpaceVision generate a 3D model — right here.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="rounded-2xl bg-surface/50 border border-surface-border overflow-hidden"
        >
          {/* Mini workspace header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-surface">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Wrench className="w-3.5 h-3.5 text-brand" />
              <span className="font-medium text-gray-300">Live Demo</span>
              {activePrompt && (
                <>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-400 truncate max-w-[200px]">{activePrompt}</span>
                </>
              )}
            </div>
            {hasGenerated && (
              <Link
                href={`/generate?prompt=${encodeURIComponent(activePrompt)}`}
                className="text-[11px] text-brand hover:text-brand-hover transition-colors font-medium flex items-center gap-1"
              >
                Open in Workspace <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* 3D Viewport */}
          <div className="relative h-[350px] sm:h-[400px] cad-grid">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-dark/60 z-10">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-sm text-gray-400">Generating 3D model...</p>
              </div>
            ) : hasGenerated ? (
              <ModelViewer prompt={activePrompt} className="w-full h-full" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-lighter/30 border border-surface-border flex items-center justify-center">
                  <Box className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Enter a prompt below to generate a 3D model</p>
              </div>
            )}
          </div>

          {/* Prompt bar */}
          <div className="p-4 border-t border-surface-border bg-surface">
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                placeholder="Describe a 3D model... (e.g. 'a red sports car')"
                className="flex-1 px-4 py-3 rounded-xl bg-surface-lighter border border-surface-border text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 transition-all text-sm"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold transition-all flex items-center gap-2 whitespace-nowrap text-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Generate
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleGenerate(ex)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-surface-lighter hover:bg-surface-border hover:text-white transition-all border border-surface-border"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.p
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="text-center text-gray-500 text-sm mt-6"
        >
          Rotate the model by dragging · Zoom with scroll · Pan with right-click ·{" "}
          <Link href="/generate" className="text-brand hover:underline">Open full workspace</Link>
        </motion.p>
      </div>
    </section>
  );
}

function PricingPreview() {
  const tiers = [
    {
      name: "Free", price: "$0", description: "Core 3D generation for everyone",
      features: ["AI 3D generation", "Manual editing tools", "STL export", "Save up to 10 models"],
      cta: "Get Started", highlighted: false,
    },
    {
      name: "Creator", price: "$12", period: "/month",
      description: "For power users who create often",
      features: ["Unlimited generations", "OBJ / FBX / GLTF export", "Priority generation", "Unlimited saves"],
      cta: "Upgrade to Creator", highlighted: true,
    },
    {
      name: "Studio", price: "$29", period: "/month",
      description: "Team collaboration & shared spaces",
      features: ["Everything in Creator", "Shared workspaces", "Team collaboration", "Up to 10 members"],
      cta: "Start with Studio", highlighted: false,
    },
  ];

  return (
    <section className="py-32 relative">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
            Free for everyone, <span className="text-brand">powerful for creators</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start modeling for free. Upgrade when you need unlimited power and collaboration.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
          variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name} variants={fadeUp}
              className={`relative rounded-2xl p-8 ${
                tier.highlighted
                  ? "bg-brand/10 border-2 border-brand/40"
                  : "bg-white/[0.02] border border-surface-border"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-xs font-semibold">
                  <Star className="w-3 h-3 inline mr-1" /> Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-gray-500 text-sm">{tier.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-brand shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.highlighted ? "/pricing" : "/generate"}
                className={`block text-center px-6 py-3 rounded-xl font-semibold transition-all text-sm ${
                  tier.highlighted
                    ? "bg-brand hover:bg-brand-hover text-white"
                    : "bg-white/5 hover:bg-white/10 text-white border border-surface-border"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to start
            <br />
            <span className="text-brand">modeling in 3D?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join the community and start creating 3D models for free.
            No experience needed — just describe what you want to build.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-lg transition-all"
            >
              <Wrench className="w-5 h-5" />
              Open Workspace &mdash; It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <BeneficiariesSection />
      <DemoSection />
      <PricingPreview />
      <CTASection />
      <Footer />
    </>
  );
}
