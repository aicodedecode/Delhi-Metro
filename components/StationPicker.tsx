"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Station } from "@/types";
import { searchStations } from "@/lib/search";
import { LineBadge } from "./LineBadge";

interface Props {
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
  placeholder: string;
  accentColor: string;
}

export default function StationPicker({ label, value, onChange, placeholder, accentColor }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useRef("list-" + Math.random().toString(36).slice(2, 8)).current;

  useEffect(() => { const t = setTimeout(() => setDebounced(query), 120); return () => clearTimeout(t); }, [query]);
  const results = useMemo(() => (debounced.trim() ? searchStations(debounced, 8) : []), [debounced]);
  useEffect(() => { setHighlight(0); }, [results]);

  function pick(station: Station) { onChange(station); setQuery(""); setOpen(false); }
  function clear() { onChange(null); setQuery(""); inputRef.current?.focus(); }

  return (
    <div className="relative">
      <label htmlFor={label} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-offset-1" style={{ borderColor: value ? accentColor : "#cbd5e1" }}>
        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/20" style={{ backgroundColor: value ? accentColor : "#94a3b8" }} />
        <input
          ref={inputRef}
          id={label}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={results[highlight] ? `${listId}-${results[highlight].id}` : undefined}
          autoComplete="off"
          className="min-h-[44px] w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
          placeholder={value ? value.name : placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            if (e.key === "Enter" && results[highlight]) { e.preventDefault(); pick(results[highlight]); }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {value ? (
          <button type="button" onClick={clear} aria-label={`Clear ${label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-slate-500 hover:bg-slate-100">×</button>
        ) : null}
      </div>
      {value && !query ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1">
          {value.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}
          {value.isInterchange ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">🔄 Interchange</span> : null}
        </p>
      ) : null}
      {open && results.length > 0 ? (
        <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.map((st, i) => (
            <li key={st.id} id={`${listId}-${st.id}`} role="option" aria-selected={i === highlight}>
              <button type="button" onClick={() => pick(st)} onMouseEnter={() => setHighlight(i)}
                className={`flex min-h-[48px] w-full items-center justify-between gap-2 px-3 py-2 text-left ${i === highlight ? "bg-sky-50" : "bg-white"}`}>
                <span className="font-medium text-slate-900">{st.name}
                  {st.isInterchange ? <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">🔄 Interchange</span> : null}
                </span>
                <span className="flex shrink-0 flex-wrap justify-end gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && debounced.trim().length >= 2 && results.length === 0 ? (
        <p className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-xl">No station found. Check the spelling or try a shorter name.</p>
      ) : null}
    </div>
  );
}
