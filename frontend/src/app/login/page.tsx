"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);
    setSubmitted(true);
    localStorage.setItem("bhoomigrid_admin_session", "demo-admin");
    window.setTimeout(() => router.push("/map"), 500);
  }

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
      <section className="hidden bg-emerald-600 p-10 text-white md:block">
        <Link href="/" className="text-sm font-semibold text-emerald-50">← BhoomiGrid2.0</Link>
        <div className="mt-28"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">Maharashtra State</p><h1 className="mt-4 text-4xl font-bold leading-tight">Secure access to land governance.</h1><p className="mt-5 leading-7 text-emerald-50">Manage ULPIN-linked parcels, 7/12 Satbara extracts, and Ferfar mutation workflows from one trusted workspace.</p></div>
        <div className="mt-20 rounded-xl border border-emerald-400/50 bg-emerald-700/30 p-4 text-sm"><b>Prototype environment</b><p className="mt-1 text-emerald-100">Identity verification and role-based access are ready to connect to your state SSO.</p></div>
      </section>
      <section className="p-8 sm:p-12">
        <Link href="/" className="text-sm font-semibold text-emerald-700 md:hidden">← BhoomiGrid2.0</Link>
        <div className="mt-8 md:mt-16"><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Administrator sign in</p><h2 className="mt-2 text-3xl font-bold text-slate-900">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to access the land records administration portal.</p></div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div><label htmlFor="email" className="text-sm font-semibold text-slate-700">Official email</label><input id="email" name="email" type="email" required placeholder="admin@maharashtra.gov.in" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></div>
          <div><div className="flex justify-between"><label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label><button type="button" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900">Forgot password?</button></div><input id="password" name="password" type="password" required placeholder="Enter your password" className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></div>
          <button type="submit" disabled={isSigningIn} className="w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70">{isSigningIn ? "Signing in..." : "Sign in to Admin Portal"}</button>
          {submitted && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Signed in to the prototype admin session. Opening the land records workspace...</p>}
        </form>
        <p className="mt-8 text-center text-xs text-slate-400">Authorized Maharashtra land administration personnel only.</p>
      </section>
    </div>
  </main>;
}
