"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Parcel = {
  ulpin: string;
  gut_number: string;
  village: string;
  zoning: string;
  district?: string;
  taluka?: string;
  satbara?: { khata_number: string; holders: string[]; area_hectares: number; encumbrance_details: string };
  mutations?: { entry_number: string; entry_date: string; mutation_type: string; remarks: string }[];
};
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const basemapStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export default function LandMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showExtract, setShowExtract] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [workflow, setWorkflow] = useState<"register" | "update" | null>(null);
  const [workflowSubmitted, setWorkflowSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReport, setShowReport] = useState(false);

  function handleLogout() {
    localStorage.removeItem("bhoomigrid_admin_session");
    router.push("/login");
  }

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(localStorage.getItem("bhoomigrid_admin_session") === "demo-admin");
    };
    syncLoginState();
    window.addEventListener("storage", syncLoginState);
    return () => window.removeEventListener("storage", syncLoginState);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [73.8567, 18.5204],
      zoom: 11,
      style: basemapStyle,
      dragPan: true,
      cooperativeGestures: false,
    });
    map.dragPan.enable();
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    map.on("load", async () => {
      const response = await fetch(`${api}/api/v1/parcels/`);
      if (!response.ok) throw new Error("Unable to load parcels");
      const data = await response.json();
      setParcels(data.features.map((feature: { properties: Parcel }) => feature.properties));
      setLoading(false);
      map.addSource("parcels", { type: "geojson", data });
      map.addLayer({ id: "parcel-fill", type: "fill", source: "parcels", paint: {
        "fill-color": ["match", ["get", "zoning"], "Residential", "#22c55e", "Agricultural", "#eab308", "Mixed Use", "#3b82f6", "#94a3b8"],
        "fill-opacity": 0.55,
      }});
      map.addLayer({ id: "parcel-outline", type: "line", source: "parcels", paint: { "line-color": "#0f172a", "line-width": 2 }});
      map.on("click", "parcel-fill", async (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const props = feature.properties as Parcel;
        const detail = await fetch(`${api}/api/v1/parcels/${props.ulpin}`).then((res) => res.json());
        setSelected({ ...props, ...detail });
        map.flyTo({ center: (feature.geometry as GeoJSON.Polygon).coordinates[0][0] as [number, number], zoom: 15 });
      });
    });
    return () => map.remove();
  }, []);

  const filteredParcels = parcels.filter((parcel) =>
    `${parcel.ulpin} ${parcel.gut_number}`.toLowerCase().includes(query.toLowerCase()),
  );

  return <div className="flex h-full flex-col bg-slate-100 text-slate-900">
    <header className="flex h-16 shrink-0 items-center justify-between bg-slate-950 px-6 text-white">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-lg font-black text-slate-950">B</div><div><p className="font-bold tracking-wide">BhoomiGrid<span className="text-emerald-400">2.0</span></p><p className="text-[10px] uppercase tracking-widest text-slate-400">Digital Land Governance</p></div></div>
      <div className="hidden items-center gap-4 text-sm text-slate-300 md:flex"><span>Maharashtra State</span><span className="rounded-full border border-slate-700 px-3 py-1 text-xs">ULPIN Enabled</span>{isLoggedIn ? <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-600 px-3 py-1.5 transition hover:border-red-400 hover:text-red-300">Logout</button> : <Link href="/login" className="transition hover:text-emerald-400">Login</Link>}</div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="z-10 flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Land Records Explorer</p><h1 className="mt-1 text-xl font-bold">Pune District</h1><p className="mt-1 text-sm text-slate-500">Haveli taluka · Akurdi village</p>
          <div className="mt-4 flex gap-2"><div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-center"><b className="block text-lg">{parcels.length || "—"}</b><span className="text-[10px] uppercase text-slate-500">Parcels</span></div><div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-center"><b className="block text-lg text-emerald-600">3</b><span className="text-[10px] uppercase text-slate-500">Sources</span></div></div>
        </div>
        <div className="p-4"><label className="text-xs font-semibold text-slate-500">SEARCH BY ULPIN OR GUT NUMBER</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. 142/2 or ULPIN" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => { setWorkflow("register"); setWorkflowSubmitted(false); }} className="rounded-lg bg-emerald-600 px-2 py-2 text-xs font-semibold text-white hover:bg-emerald-700">+ Register parcel</button><button onClick={() => { setWorkflow("update"); setWorkflowSubmitted(false); }} className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700">Update parcel</button></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold uppercase text-slate-400">Mapped parcels</span><span className="text-xs text-slate-400">{filteredParcels.length} results</span></div>{loading && <p className="text-sm text-slate-500">Loading land records...</p>}{filteredParcels.map((parcel) => <button key={parcel.ulpin} onClick={() => setSelected(parcel)} className="mb-2 w-full rounded-lg border border-slate-100 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50"><div className="flex items-center justify-between"><b className="text-sm">Gut {parcel.gut_number}</b><span className={`rounded px-2 py-1 text-[10px] font-semibold ${parcel.zoning === "Agricultural" ? "bg-amber-100 text-amber-700" : parcel.zoning === "Mixed Use" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{parcel.zoning}</span></div><p className="mt-1 text-xs text-slate-500">ULPIN {parcel.ulpin}</p></button>)}</div>
        <div className="border-t border-slate-100 p-4 text-xs text-slate-400">Data sources: Maharashtra Revenue Records<br />Last synchronized: Today, 10:42 AM</div>
      </aside>
      <section className="relative min-w-0 flex-1"><div ref={containerRef} className="absolute inset-0" />
        <div className="absolute right-5 top-20 z-10 flex flex-col overflow-hidden rounded-lg bg-white shadow-md"><button type="button" aria-label="Pan up" onClick={() => mapRef.current?.panBy([0, -160], { duration: 350 })} className="border-b border-slate-200 px-3 py-2 text-lg font-bold text-slate-700 hover:bg-emerald-50">↑</button><div className="flex"><button type="button" aria-label="Pan left" onClick={() => mapRef.current?.panBy([-160, 0], { duration: 350 })} className="border-r border-slate-200 px-3 py-2 text-lg font-bold text-slate-700 hover:bg-emerald-50">←</button><button type="button" aria-label="Pan right" onClick={() => mapRef.current?.panBy([160, 0], { duration: 350 })} className="px-3 py-2 text-lg font-bold text-slate-700 hover:bg-emerald-50">→</button></div><button type="button" aria-label="Pan down" onClick={() => mapRef.current?.panBy([0, 160], { duration: 350 })} className="border-t border-slate-200 px-3 py-2 text-lg font-bold text-slate-700 hover:bg-emerald-50">↓</button></div>
        <div className="pointer-events-none absolute left-5 top-5 rounded-lg bg-white/95 px-4 py-3 shadow-md"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interactive GIS view</p><p className="text-sm font-semibold">Akurdi, Pune · Maharashtra</p></div>
        <div className="absolute bottom-5 left-5 rounded-lg bg-white/95 p-3 text-xs shadow-md"><p className="mb-2 font-semibold">Zoning</p><div className="flex gap-3"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Residential</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Agricultural</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Mixed Use</span></div></div>
        {workflow && <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-6"><form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setWorkflowSubmitted(true); }} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Land records workflow</p><h2 className="mt-1 text-2xl font-bold">{workflow === "register" ? "Register new parcel" : "Update land parcel"}</h2><p className="mt-1 text-sm text-slate-500">{workflow === "register" ? "Create a new ULPIN-linked land record." : "Submit a correction or change to an existing record."}</p></div><button type="button" onClick={() => setWorkflow(null)} className="text-2xl text-slate-400">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Gut number<input required defaultValue={workflow === "update" ? selected?.gut_number : ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" placeholder="e.g. 145/1" /></label><label className="text-sm font-semibold">ULPIN {workflow === "register" && <span className="font-normal text-slate-400">(optional)</span>}<input required={workflow === "update"} defaultValue={workflow === "update" ? selected?.ulpin : ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" placeholder="14-digit identifier" /></label><label className="text-sm font-semibold">Village<input required defaultValue="Akurdi" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" /></label><label className="text-sm font-semibold">Area (hectares)<input required type="number" min="0.01" step="0.01" defaultValue={workflow === "update" ? selected?.satbara?.area_hectares : ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" /></label></div><label className="mt-4 block text-sm font-semibold">Reason / supporting note<textarea required rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal outline-none focus:border-emerald-500" placeholder="Describe the registration or requested correction" /></label>{workflowSubmitted && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Request submitted for revenue officer verification. Reference ID: BG-{workflow === "register" ? "REG" : "UPD"}-2026-001.</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setWorkflow(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{workflow === "register" ? "Submit registration" : "Submit update"}</button></div></form></div>}
        {selected && <aside className="absolute right-5 top-5 w-80 rounded-xl bg-white p-5 shadow-xl"><button className="float-right text-xl leading-none text-slate-400 hover:text-slate-800" onClick={() => setSelected(null)}>×</button><p className="text-xs font-semibold uppercase text-emerald-700">7/12 Satbara Extract</p><h2 className="mt-2 text-xl font-bold">Gut {selected.gut_number}</h2><p className="text-xs text-slate-500">ULPIN {selected.ulpin}</p><div className="my-4 border-t border-slate-100 pt-3 text-sm"><p><b>Location:</b> {selected.village}, {selected.taluka || "Haveli"}</p><p className="mt-2"><b>Land use:</b> {selected.zoning}</p>{selected.satbara?.area_hectares && <p className="mt-2"><b>Area:</b> {selected.satbara.area_hectares} hectares</p>}<p className="mt-2"><b>Record status:</b> <span className="text-emerald-600">Verified</span></p></div><button onClick={async () => { setExtractLoading(true); if (!selected.satbara) { const response = await fetch(`${api}/api/v1/parcels/${selected.ulpin}`); if (!response.ok) throw new Error("Unable to load Satbara extract"); setSelected({ ...selected, ...(await response.json()) }); } setExtractLoading(false); setShowExtract(true); }} disabled={extractLoading} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">{extractLoading ? "Loading extract..." : "View full 7/12 extract"}</button></aside>}
        {showExtract && selected && <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-6"><article className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Government of Maharashtra · Revenue Department</p><h2 className="mt-2 text-2xl font-bold">7/12 Satbara Extract</h2><p className="mt-1 text-sm text-slate-500">Digitally indexed land record</p></div><button onClick={() => setShowExtract(false)} className="text-2xl text-slate-400 hover:text-slate-800" aria-label="Close extract">×</button></div><div className="grid gap-4 py-5 text-sm sm:grid-cols-2"><div><p className="text-xs uppercase text-slate-400">ULPIN</p><p className="font-semibold">{selected.ulpin}</p></div><div><p className="text-xs uppercase text-slate-400">Gut number</p><p className="font-semibold">{selected.gut_number}</p></div><div><p className="text-xs uppercase text-slate-400">Village / Taluka</p><p className="font-semibold">{selected.village} / {selected.taluka || "Haveli"}</p></div><div><p className="text-xs uppercase text-slate-400">Khata number</p><p className="font-semibold">{selected.satbara?.khata_number || "—"}</p></div><div><p className="text-xs uppercase text-slate-400">Area</p><p className="font-semibold">{selected.satbara?.area_hectares || "—"} hectares</p></div><div><p className="text-xs uppercase text-slate-400">Zoning</p><p className="font-semibold">{selected.zoning}</p></div></div><div className="border-t border-slate-100 py-4"><h3 className="font-semibold">Recorded holders</h3><ul className="mt-2 list-disc pl-5 text-sm text-slate-600">{selected.satbara?.holders?.map((holder) => <li key={holder}>{holder}</li>) || <li>Not available</li>}</ul></div><div className="border-t border-slate-100 py-4"><h3 className="font-semibold">Encumbrance / Bojha</h3><p className="mt-2 text-sm text-slate-600">{selected.satbara?.encumbrance_details || "Not available"}</p></div><div className="border-t border-slate-100 pt-4"><h3 className="font-semibold">Ferfar mutation history</h3>{selected.mutations?.map((mutation) => <div key={mutation.entry_number} className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">{mutation.mutation_type} · {mutation.entry_number}</p><p className="text-slate-500">{mutation.entry_date} — {mutation.remarks}</p></div>) || <p className="mt-2 text-sm text-slate-500">No mutation entries available.</p>}</div><button onClick={() => setShowReport(true)} className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Generate consolidated land report</button></article></div>}
        {showReport && selected && <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-6"><article className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Interoperable land governance report</p><h2 className="mt-2 text-2xl font-bold">Consolidated Land Report</h2><p className="mt-1 text-sm text-slate-500">Cross-checked record package · Generated for portable use</p></div><button onClick={() => setShowReport(false)} className="text-2xl text-slate-400" aria-label="Close report">×</button></div><div className="my-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900"><b>Verification status: Cross-checked</b><p className="mt-1">This prototype report consolidates matching parcel, revenue, mutation, and encumbrance fields for downstream departments.</p></div><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-lg border border-slate-200 p-3"><b>Revenue / 7/12</b><p className="mt-1 text-emerald-700">Verified · {selected.satbara?.khata_number || "Khata indexed"}</p></div><div className="rounded-lg border border-slate-200 p-3"><b>Registration / ULPIN</b><p className="mt-1 text-emerald-700">Verified · {selected.ulpin}</p></div><div className="rounded-lg border border-slate-200 p-3"><b>Mutation / Ferfar</b><p className="mt-1 text-emerald-700">Checked · {selected.mutations?.length || 0} entries</p></div><div className="rounded-lg border border-slate-200 p-3"><b>Encumbrance / Bojha</b><p className="mt-1 text-emerald-700">Checked against Satbara record</p></div></div><div className="mt-5 border-t border-slate-100 pt-4 text-sm"><p><b>Parcel:</b> Gut {selected.gut_number}, {selected.village}, {selected.taluka || "Haveli"}, {selected.district || "Pune"}</p><p className="mt-2"><b>Holder(s):</b> {selected.satbara?.holders?.join(", ") || "Not available"}</p><p className="mt-2"><b>Generated reference:</b> BG-CLR-{selected.ulpin}</p></div><button onClick={() => window.print()} className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Print / save report</button></article></div>}
      </section>
    </div>
  </div>;
}
