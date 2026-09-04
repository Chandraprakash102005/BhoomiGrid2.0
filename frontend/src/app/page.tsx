import Link from "next/link";

export default function Home() {
  return <main className="min-h-screen bg-slate-950 p-8 text-white">
    <h1 className="text-4xl font-bold">BhoomiGrid2.0</h1>
    <p className="mt-3 max-w-2xl text-slate-300">Maharashtra land governance on an interoperable geospatial public infrastructure.</p>
    <Link className="mt-8 inline-block rounded bg-emerald-500 px-5 py-3 font-semibold text-slate-950" href="/map">Open GIS viewer</Link>
  </main>;
}
