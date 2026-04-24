import * as React from "react";
import { cn } from "@/lib/utils";

/* ============= BUTTON ============= */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] active:scale-[0.98]";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_0_0_1px_rgba(139,92,246,0.3)]",
    secondary:
      "bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] hover:border-[var(--color-border-strong)]",
    outline:
      "bg-transparent text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]",
    ghost:
      "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    danger:
      "bg-[var(--color-danger)] text-white hover:opacity-90",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-3.5 text-sm",
    lg: "h-11 px-5 text-sm",
  };
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
Button.displayName = "Button";

/* ============= INPUT ============= */

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors",
      "placeholder:text-[var(--color-text-dim)]",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/25",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ============= SELECT ============= */

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full appearance-none rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 pr-9 text-sm outline-none transition-colors",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%237a8296%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px] bg-[right_0.625rem_center] bg-no-repeat",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/25",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* ============= TEXTAREA ============= */

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors resize-y",
      "placeholder:text-[var(--color-text-dim)]",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/25",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ============= LABEL ============= */

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn(
        "mb-1.5 block text-xs font-medium text-[var(--color-text-muted)]",
        props.className
      )}
    />
  );
}

/* ============= CARD ============= */

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
        className
      )}
      {...props}
    />
  );
}

/* ============= PAGE HEADER ============= */

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-gradient-brand-subtle border border-[var(--color-border)]">
            <Icon className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

/* ============= BADGE ============= */

type BadgeTone = "default" | "success" | "warning" | "danger" | "brand" | "info";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    default: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]",
    brand: "bg-[color:var(--color-primary)]/12 text-[var(--color-primary)] border-[color:var(--color-primary)]/20",
    info: "bg-[color:var(--color-accent)]/12 text-[var(--color-accent)] border-[color:var(--color-accent)]/20",
    success: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/12 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/12 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ============= TABLE ============= */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[var(--color-surface-2)] text-left text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
      {children}
    </thead>
  );
}

export function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-medium", className)}>{children}</th>;
}

export function TR({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]/60",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

/* ============= EMPTY STATE ============= */

export function EmptyState({
  title,
  hint,
  icon: Icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ============= AVATAR ============= */

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };
  const init = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(name.length - 1) || 0) * 13) % 360;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 60) % 360} 70% 45%))`,
      }}
    >
      {init || "?"}
    </span>
  );
}

/* ============= KBD ============= */

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-1 text-[10px] font-mono text-[var(--color-text-muted)]">
      {children}
    </kbd>
  );
}
