"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Plus,
  X,
  Lock,
  Loader2,
} from "lucide-react";

const SUPER_ADMIN = "coolbanana558@gmail.com";

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/settings/admins").then((r) => r.json()),
    ]).then(([settingsData, adminsData]) => {
      setSettings(settingsData.settings || {});
      setAdmins(adminsData.emails || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: string) => {
    const current = settings[key] === "true";
    updateSetting(key, String(!current));
  };

  const addAdmin = async () => {
    if (!newAdmin.includes("@")) return;
    const res = await fetch("/api/admin/settings/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newAdmin }),
    });
    const data = await res.json();
    if (data.emails) setAdmins(data.emails);
    setNewAdmin("");
  };

  const removeAdmin = async (email: string) => {
    const res = await fetch("/api/admin/settings/admins/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.emails) setAdmins(data.emails);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const limits = [
    { key: "free_model_limit", label: "Free Plan Model Limit", placeholder: "5" },
    { key: "free_generation_limit", label: "Free Plan Daily Generation Limit", placeholder: "10" },
    { key: "premium_model_limit", label: "Premium Plan Model Limit", placeholder: "null = unlimited" },
    { key: "premium_generation_limit", label: "Premium Plan Daily Generation Limit", placeholder: "null = unlimited" },
  ];

  const toggles = [
    { key: "disable_registration", label: "Disable New Registrations", description: "Block new account creation" },
    { key: "maintenance_mode", label: "Maintenance Mode", description: "Show maintenance page to non-admins" },
    { key: "disable_ai_generation", label: "Disable AI Generation", description: "Disable AI generation globally" },
    { key: "disable_credentials_auth", label: "Disable Email/Password Auth", description: "Only allow OAuth sign-in" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Feature Limits */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Limits</h2>
        <div className="space-y-4">
          {limits.map((limit) => (
            <div key={limit.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-surface-border rounded-lg">
              <label className="text-sm text-gray-300">{limit.label}</label>
              <input
                value={settings[limit.key] || ""}
                onChange={(e) => updateSetting(limit.key, e.target.value)}
                placeholder={limit.placeholder}
                className="w-32 px-3 py-1.5 bg-gray-900 border border-surface-border rounded-lg text-sm text-white text-right focus:outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Feature Toggles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Toggles</h2>
        <div className="space-y-3">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-surface-border rounded-lg">
              <div>
                <p className="text-sm text-white font-medium">{toggle.label}</p>
                <p className="text-xs text-gray-500">{toggle.description}</p>
              </div>
              <button
                onClick={() => toggleSetting(toggle.key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings[toggle.key] === "true" ? "bg-red-500" : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings[toggle.key] === "true" ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Emails */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Admin Emails</h2>
        <div className="space-y-2 mb-4">
          {admins.map((email) => (
            <div key={email} className="flex items-center justify-between p-3 bg-white/[0.02] border border-surface-border rounded-lg">
              <span className="text-sm text-gray-300">{email}</span>
              {email === SUPER_ADMIN ? (
                <Lock className="w-4 h-4 text-gray-600" />
              ) : email === session?.user?.email ? (
                <span className="text-xs text-gray-600">You</span>
              ) : (
                <button
                  onClick={() => removeAdmin(email)}
                  className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAdmin()}
            placeholder="email@example.com"
            className="flex-1 px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
          <button
            onClick={addAdmin}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
