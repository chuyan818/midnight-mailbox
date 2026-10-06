import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS } from "@/lib/page-translations";

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGUAGE_OPTIONS.find((option) => option.code === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Select language" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-sm text-white hover:bg-white/10 transition">
        <span aria-hidden="true">{current.flag}</span>
        {!compact && <span className="hidden sm:inline">{current.label}</span>}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-36 overflow-hidden rounded-xl border border-white/15 bg-[#151a3d] p-1 shadow-2xl">
          {LANGUAGE_OPTIONS.map((option) => (
            <button key={option.code} type="button" onClick={() => { setLanguage(option.code); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10 ${option.code === language ? "bg-white/10 text-[#FFD580]" : "text-white/80"}`}>
              <span aria-hidden="true">{option.flag}</span>
              <span>{option.label}</span>
              {option.code === language && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
