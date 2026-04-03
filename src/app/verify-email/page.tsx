"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendStatus(null);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResendStatus({ type: "error", message: data.error || "Failed to resend" });
      } else {
        setResendStatus({ type: "success", message: data.message || "Email sent!" });
      }
    } catch {
      setResendStatus({ type: "error", message: "Something went wrong" });
    }

    setResending(false);
  };

  return (
    <div className="w-full max-w-md text-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-gray-400 mb-2">
          We sent a verification link to{" "}
          {email ? (
            <span className="text-white font-medium">{email}</span>
          ) : (
            "your email address"
          )}
          .
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Click the link to activate your account. Check your spam folder if you don&apos;t see it.
          The link expires in 24 hours.
        </p>

        {/* Resend Status */}
        {resendStatus && (
          <div
            className={`flex items-center gap-2 justify-center p-3 rounded-lg mb-4 text-sm ${
              resendStatus.type === "success"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {resendStatus.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {resendStatus.message}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors mb-4"
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Resend Verification Email
            </>
          )}
        </button>

        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 text-sm"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
