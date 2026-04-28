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
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] active:scale-[0.97] cursor-pointer";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]",
    outline:
      "bg-transparent text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]",
    ghost:
      "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
    danger:
      "bg-[var(--color-danger)] text-white hover:opacity-90 shadow-sm",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-2.5 text-xs md:h-10 md:px-3",
    md: "h-10 px-3 text-sm md:h-11 md:px-4",
    lg: "h-11 px-4 text-sm md:h-12 md:px-5",
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
      "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base md:text-sm outline-none transition-all duration-150",
      "placeholder:text-[var(--color-text-dim)]",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/20 focus:shadow-[0_0_0_1px_rgba(46,109,180,0.3)]",
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
      "w-full appearance-none rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2.5 pr-9 text-base md:text-sm outline-none transition-all duration-150",
      "[&>option]:bg-[var(--color-surface)] [&>option]:text-[var(--color-text)] [&>optgroup]:bg-[var(--color-surface)]",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px] bg-[right_0.625rem_center] bg-no-repeat",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/20",
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
      "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-all duration-150 resize-y",
      "placeholder:text-[var(--color-text-dim)]",
      "hover:border-[var(--color-border-strong)]",
      "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/20",
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
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5",
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
    <div className="mb-4 flex items-end justify-between gap-3 md:mb-8 md:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:items-start md:gap-3">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary)]/10 md:h-9 md:w-9">
            <Icon className="h-4 w-4 text-[var(--color-primary)] md:h-5 md:w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)] md:mt-1 md:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 gap-1.5 md:gap-2">{actions}</div>
      )}
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
    brand: "bg-[color:var(--color-primary)]/10 text-[var(--color-primary)] border-[color:var(--color-primary)]/20",
    info: "bg-[color:var(--color-accent)]/10 text-[var(--color-accent)] border-[color:var(--color-accent)]/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
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
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[600px] text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[var(--color-surface-2)]/60 text-left text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
      {children}
    </thead>
  );
}

export function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
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
        "border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]/40",
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
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-14 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]">
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
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-[var(--color-bg)]",
        sizes[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 60% 50%), hsl(${(hue + 50) % 360} 60% 40%))`,
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

/* ============= SEARCH INPUT ============= */

export function SearchInput({
  value,
  defaultValue,
  onChange,
  placeholder = "Buscar...",
  className,
}: {
  value?: string;
  defaultValue?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        {...(value !== undefined ? { value } : { defaultValue })}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 py-2 text-sm outline-none transition-all duration-150",
          "placeholder:text-[var(--color-text-dim)]",
          "hover:border-[var(--color-border-strong)]",
          "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
        )}
      />
    </div>
  );
}

/* ============= CONFIRM DIALOG ============= */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  danger = false,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============= SKELETON ROWS ============= */

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-5 flex-1 skeleton" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============= PAGINATION ============= */

export function Pagination({
  total,
  page,
  perPage,
  onChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-xs text-[var(--color-text-muted)]">
        {total} registro(s) · Pagina {page} de {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
        >
          Anterior
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                p === page
                  ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-40"
        >
          Proximo
        </button>
      </div>
    </div>
  );
}

/* ============= STATUS FILTER ============= */

export function StatusFilter({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string; tone?: BadgeTone }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onChange("")}
        className={cn(
          "shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
          !value
            ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
        )}
      >
        Todos
      </button>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id === value ? "" : o.id)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === o.id
              ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
