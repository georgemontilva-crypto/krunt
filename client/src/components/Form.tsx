import { US_STATES } from "@shared/const";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="label mb-2 block text-smoke">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-smoke">{hint}</span>}
    </label>
  );
}

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn("field", p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cn("field min-h-32", p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn("field pr-10", p.className)} />;

export function StateSelect(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select {...p}>
      <option value="">State</option>
      {US_STATES.map(s => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}

/** Reads a form into a plain object of trimmed strings. */
export function formObject(form: HTMLFormElement) {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    out[k] = typeof v === "string" ? v.trim() : "";
  });
  return out;
}
