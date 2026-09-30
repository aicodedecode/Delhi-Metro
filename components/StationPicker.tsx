"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Station } from "@/types";
import { searchStations } from "@/lib/search";
import { LineBadge, InterchangeChip } from "./LineBadge";
import { IconClose, IconSearch } from "@/components/icons";

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
      <label htmlFor={label} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-mute">{label}</label>
      <div
        className="flex items-center gap-2.5 rounded-xl border bg-surface px-3 transition-colors focus-within:border-ink"
        style={{ borderWidth: value ? 2 : 1, borderColor: value ? accentColor : undefined }}
      >
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink/20"
          style={{ backgroundColor: value ? accentColor : "#b8b3a4" }}
        />
        <input
          ref={inputRef}
          id={label}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={results[highlight] ? `${listId}-${results[highlight].id}` : undefined}
          autoComplete="off"
          className="min-h-[48px] w-full bg-transparent text-base font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-mute/70"
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
          <button type="button" onClick={clear} aria-label={`Clear ${label}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-paper">
            <IconClose size={18} />
          </button>
        ) : (
          <span className="shrink-0 text-ink-mute/60" aria-hidden="true"><IconSearch size={18} /></span>
        )}
      </div>
      {value && !query ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
          {value.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}
          {value.isInterchange ? <InterchangeChip /> : null}
        </p>
      ) : null}
      {open && results.length > 0 ? (
        <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-line-soft bg-surface shadow-[0_8px_30px_rgb(10_42_94/0.12)]">
          {results.map((st, i) => (
            <li
              key={st.id}
              id={`${listId}-${st.id}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => { e.preventDefault(); pick(st); }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${i === highlight ? "bg-paper" : "bg-surface"}`}
            >
              <span className="font-medium text-ink">{st.name}
                {st.isInterchange ? <span className="ml-2"><InterchangeChip /></span> : null}
              </span>
              <span className="flex shrink-0 flex-wrap justify-end gap-x-2">{st.lines.map((l) => <LineBadge key={l} lineId={l} size="sm" />)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {open && debounced.trim().length >= 2 && results.length === 0 ? (
        <p className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-line-soft bg-surface px-3 py-2 text-sm text-ink-mute shadow-[0_8px_30px_rgb(10_42_94/0.12)]">No station found. Check the spelling or try a shorter name.</p>
      ) : null}
    </div>
  );
}
