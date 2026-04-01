import { Mail } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 mb-6">
            We sent a verification link to your email address. Click the link to activate your account.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </p>
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
