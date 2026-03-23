"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ── Extract tokens from URL hash on mount ── */
  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove leading #
    if (!hash) {
      setReady(true);
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (accessToken && refreshToken && type === "invite") {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            setError("Invalid or expired invite link. Please contact your administrator.");
          }
          setReady(true);
        });
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Validation helpers ── */
  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Sign out so the user must log in manually
      await supabase.auth.signOut();
      setSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  /* ── Eye icon component ── */
  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    );

  /* ── Loading state ── */
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))]">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-stone-500">Verifying invite link…</p>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(217,119,6,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_30%,rgba(59,130,246,0.14),transparent_55%),linear-gradient(to_bottom,rgba(250,250,249,1),rgba(255,252,248,1))]">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white/70 p-8 shadow-soft backdrop-blur text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-900">Password Set Successfully</h2>
            <p className="mt-2 text-sm text-stone-600">
              Redirecting you to the login page…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(217,119,6,0.18),transparent_55%),radial-gradient(900px_circle_at_80%_30%,rgba(59,130,246,0.14),transparent_55%),linear-gradient(to_bottom,rgba(250,250,249,1),rgba(255,252,248,1))]">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        {/* Brand header */}
        <div className="mb-8 space-y-2 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-xs text-stone-700 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Prosecution Studio
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Create Your Password
          </h1>
          <p className="text-sm text-stone-600">
            Set a secure password to activate your account
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white/70 p-8 shadow-soft backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label
                htmlFor="set-password"
                className="mb-1.5 block text-sm font-semibold text-stone-900"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="set-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-11 text-sm text-stone-900 outline-none transition-all focus:border-stone-300 focus:ring-2 focus:ring-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {passwordTooShort && (
                <p className="mt-1.5 text-xs text-amber-600">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-semibold text-stone-900"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-11 text-sm text-stone-900 outline-none transition-all focus:border-stone-300 focus:ring-2 focus:ring-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {passwordsMismatch && (
                <p className="mt-1.5 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || passwordTooShort || passwordsMismatch}
              className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow transition-all hover:bg-stone-800 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Setting password…
                </span>
              ) : (
                "Set Password →"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-xs text-stone-500">
          Authorized users only · Invite-based access
        </p>
        <p className="mt-2 text-xs text-stone-500">
          A Product of Lextria Research
        </p>
      </div>
    </div>
  );
}
