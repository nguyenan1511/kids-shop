"use client";

const TONES = { teal: "bg-teal", ink: "bg-ink", sun: "bg-sun" } as const;

export function Toggle({
  label,
  on,
  onChange,
  disabled,
  tone = "teal",
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  tone?: keyof typeof TONES;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1 select-none">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 rounded-full ${on ? TONES[tone] : "bg-line"} disabled:opacity-60`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span className="text-ink-soft">{label}</span>
    </label>
  );
}
