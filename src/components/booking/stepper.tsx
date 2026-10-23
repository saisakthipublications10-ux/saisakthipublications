import { Check } from "lucide-react";

export function Stepper({
  stages, current, reached, onJump,
}: { stages: readonly string[]; current: number; reached: number; onJump: (i: number) => void }) {
  const n = stages.length;
  return (
    <div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:items-center md:gap-0" aria-label="Booking progress">
        {stages.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = i <= reached && !active;
          return (
            <li key={s} className="flex min-w-0 items-center md:flex-1 md:last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onJump(i)}
                aria-current={active ? "step" : undefined}
                className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-left disabled:cursor-default sm:gap-3 md:min-h-0 md:w-auto md:rounded-none md:px-0 ${
                  clickable ? "hover:bg-brand-bg md:hover:bg-transparent" : ""
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-all md:h-9 md:w-9 ${
                    active
                      ? "bg-brand-navy text-brand-gold ring-4 ring-brand-gold/30"
                      : done
                      ? "bg-brand-gold text-brand-navy"
                      : "border border-brand-border bg-white text-brand-muted"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  <span className="sr-only">{done ? " completed: " : active ? " current: " : ": "}{s}</span>
                </span>
                <span
                  aria-hidden
                  className={`truncate text-xs font-semibold sm:text-sm md:text-xs lg:text-sm ${
                    active ? "text-brand-navy" : done ? "text-brand-text" : "text-brand-muted"
                  }`}
                >
                  {s}
                </span>
              </button>
              {i < n - 1 && (
                <span aria-hidden className={`mx-3 hidden h-px flex-1 md:block ${done ? "bg-brand-gold" : "bg-brand-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}