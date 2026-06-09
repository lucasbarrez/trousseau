import { cn } from "@/lib/utils";

export function StepHeader({
  eyebrow,
  title,
  description,
  icon,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-7", className)}>
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-[var(--color-accent)] mb-2">
          {eyebrow}
        </p>
      )}
      <div className="flex items-start gap-4">
        {icon && (
          <div className="hidden sm:grid mt-1 w-11 h-11 rounded-[12px] bg-[var(--color-accent-soft)] text-[var(--color-accent-active)] place-items-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-[28px] sm:text-[32px] leading-tight tracking-tight text-[var(--color-fg)]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-fg-muted)] max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
