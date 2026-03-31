"use client";

import { useState } from "react";
import { X, Crown, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Upgrade to Premium</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {feature && (
          <p className="text-gray-400 text-sm mb-4">
            <span className="text-white font-medium">{feature}</span> is a premium feature.
          </p>
        )}

        <ul className="space-y-2 mb-6 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Unlimited AI generations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Unlimited saved models
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> All export formats (STL, OBJ, GLTF)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Advanced composition recipes
          </li>
        </ul>

        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-3xl font-bold text-white">$12</span>
          <span className="text-gray-400">/month</span>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
