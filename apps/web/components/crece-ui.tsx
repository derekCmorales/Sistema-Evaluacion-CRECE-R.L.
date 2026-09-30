"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconSquaresFour,
  IconUsers,
  IconUserPlus,
  IconFilePlus,
  IconCoins,
  IconSun,
  IconMoon,
  IconWarningCircle,
  IconInfo,
  IconCheckCircle,
} from "./icons";

// ---------------------------------------------------------------------------
// Shell & Navigation
// ---------------------------------------------------------------------------

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count?: number;
};

export function CreceAppShell({
  children,
  activeItem,
  breadcrumbs,
}: {
  children: React.ReactNode;
  activeItem?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("crece-theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("crece-theme", next);
  };

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Vista general", href: "/dashboard", icon: IconSquaresFour },
    { id: "persons", label: "Solicitantes", href: "/persons", icon: IconUsers },
    { id: "new-person", label: "Registrar solicitante", href: "/persons/new", icon: IconUserPlus },
    { id: "new-operation", label: "Apertura de solicitud", href: "/operations/new", icon: IconFilePlus },
    { id: "calc", label: "Simulador de crédito", href: "/calc", icon: IconCoins },
  ];

  return (
    <div className="cr-app-shell">
      {/* Sidebar */}
      <aside className="cr-sidebar">
        <div className="cr-sidebar__brand">
          <Link href="/" className="inline-flex flex-col gap-0.5 text-decoration-none">
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--brand)" }}>
              CRECE R.L.
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Evaluación de Crédito
            </span>
          </Link>
        </div>

        <div className="cr-sidebar__section">Módulos Operativos</div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeItem ? activeItem === item.id : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="cr-nav-item"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.count !== undefined && <span className="cr-count">{item.count}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="cr-card cr-card--flat p-3 flex items-center gap-3">
            <div className="cr-avatar cr-avatar--sm">M</div>
            <div className="min-w-0 flex-1">
              <strong className="block text-xs truncate" style={{ color: "var(--text-primary)" }}>
                Mario Ramos
              </strong>
              <small className="block text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                Jefe de Agencia · Xela
              </small>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="cr-app-shell__main">
        {/* TopBar */}
        <header className="cr-topbar justify-between">
          <div className="flex items-center gap-3">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="cr-breadcrumbs" aria-label="Migas de pan">
                {breadcrumbs.map((b, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="opacity-40">/</span>}
                    {b.href ? (
                      <Link href={b.href}>{b.label}</Link>
                    ) : (
                      <span aria-current="page">{b.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="cr-icon-btn cr-icon-btn--sm cr-icon-btn--outline"
              title="Cambiar tema claro/oscuro"
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{ background: "var(--bg-muted)", color: "var(--brand)" }}
            >
              Agencia Central · Xela
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="cr-app-shell__content">{children}</main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Header
// ---------------------------------------------------------------------------

export function CrecePageHeader({
  overline,
  title,
  description,
  actions,
}: {
  overline?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="cr-page-header">
      <div>
        {overline && <div className="cr-overline cr-overline--rule mb-1">{overline}</div>}
        <h1 className="cr-page-header__title">{title}</h1>
        {description && <p className="cr-page-header__desc">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function CreceCard({
  title,
  action,
  children,
  variant = "default",
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "flat" | "tinted" | "elevated" | "brand";
  className?: string;
}) {
  const variantClass = variant !== "default" ? `cr-card--${variant}` : "";
  return (
    <div className={`cr-card ${variantClass} ${className}`}>
      {(title || action) && (
        <div className="cr-card__head">
          {title && <h2 className="cr-card__title">{title}</h2>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export function CreceButton({
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  block,
  onClick,
  type = "button",
  icon: Icon,
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "accent" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  const classes = [
    "cr-btn",
    `cr-btn--${variant}`,
    size !== "md" ? `cr-btn--${size}` : "",
    block ? "cr-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled || loading}
      data-loading={loading ? "true" : undefined}
      onClick={onClick}
      className={classes}
    >
      {Icon && !loading && <Icon size={size === "sm" ? 14 : 18} />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export function CreceBadge({
  children,
  tone = "neutral",
  pill,
  dot,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "solid" | "accent";
  pill?: boolean;
  dot?: boolean;
}) {
  const classes = [
    "cr-badge",
    `cr-badge--${tone}`,
    pill ? "cr-badge--pill" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && <span className="cr-badge__dot" />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export function CreceAlert({
  tone = "info",
  title,
  children,
  actions,
  className = "",
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const iconMap = {
    info: IconInfo,
    warning: IconWarningCircle,
    danger: IconWarningCircle,
    success: IconCheckCircle,
  };
  const Icon = iconMap[tone];

  const toneBgMap = {
    info: "var(--info-bg)",
    warning: "var(--warning-bg)",
    danger: "var(--danger-bg)",
    success: "var(--success-bg)",
  };

  const toneColorMap = {
    info: "var(--info)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    success: "var(--success)",
  };

  return (
    <div
      className={`p-4 rounded-lg border flex gap-3.5 items-start ${className}`}
      style={{
        background: toneBgMap[tone],
        borderColor: toneColorMap[tone],
        color: "var(--text-body)",
      }}
    >
      <div style={{ color: toneColorMap[tone], flexShrink: 0, marginTop: "2px" }}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4
            className="font-bold text-sm mb-1"
            style={{ color: toneColorMap[tone] }}
          >
            {title}
          </h4>
        )}
        <div className="text-sm leading-relaxed">{children}</div>
        {actions && <div className="mt-3 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text Field
// ---------------------------------------------------------------------------

export function CreceTextField({
  label,
  help,
  error,
  optional,
  prefix,
  suffix,
  multiline,
  rows = 3,
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  name,
  id,
  type = "text",
  disabled,
  required,
  maxLength,
  inputMode,
  autoComplete,
}: {
  label?: string;
  help?: string;
  error?: string;
  optional?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
  autoComplete?: string;
}) {
  const inputId = id ?? name;
  return (
    <div className="cr-field">
      {label && (
        <label htmlFor={inputId} className="cr-field__label">
          <span>{label}</span>
          {optional && <em>(opcional)</em>}
        </label>
      )}

      {/* Mensaje de validación colocado por encima del texto / campo */}
      {error && (
        <div
          className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 rounded text-xs font-semibold"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
          role="alert"
          id={inputId ? `${inputId}-error` : undefined}
        >
          <IconWarningCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className={`cr-control ${multiline ? "cr-control--multiline" : ""}`}
        data-invalid={error ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
      >
        {prefix && <span className="cr-control__affix">{prefix}</span>}
        {multiline ? (
          <textarea
            id={inputId}
            name={name}
            rows={rows}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            inputMode={inputMode}
            autoComplete={autoComplete}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          />
        )}
        {suffix && <span className="cr-control__affix">{suffix}</span>}
      </div>


      {help && !error && (
        <span className="cr-field__help">{help}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export function CreceSelect({
  label,
  help,
  error,
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  disabled,
}: {
  label?: string;
  help?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
}) {
  const inputId = id ?? name;
  return (
    <div className="cr-field">
      {label && (
        <label htmlFor={inputId} className="cr-field__label">
          <span>{label}</span>
        </label>
      )}

      {/* Mensaje de validación colocado por encima del selector */}
      {error && (
        <div
          className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 rounded text-xs font-semibold"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
          role="alert"
          id={inputId ? `${inputId}-error` : undefined}
        >
          <IconWarningCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="cr-control cr-control--select"
        data-invalid={error ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
      >
        <select
          id={inputId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {help && !error && (
        <span className="cr-field__help">{help}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency Field
// ---------------------------------------------------------------------------

export function CreceCurrencyField({
  label,
  value,
  onChange,
  onBlur,
  help,
  error,
  name,
  id,
}: {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  help?: string;
  error?: string;
  name?: string;
  id?: string;
}) {
  const inputId = id ?? name;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, "");
    const parsed = parseFloat(raw);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="cr-field">
      {label && (
        <label htmlFor={inputId} className="cr-field__label">
          <span>{label}</span>
        </label>
      )}

      {/* Mensaje de validación colocado por encima del texto numérico */}
      {error && (
        <div
          className="cr-field__error flex items-center gap-1.5 py-1 px-2.5 rounded text-xs font-semibold"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            border: "1px solid var(--danger)",
          }}
          role="alert"
          id={inputId ? `${inputId}-error` : undefined}
        >
          <IconWarningCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        className="cr-control cr-control--amount"
        data-invalid={error ? "true" : undefined}
      >
        <span className="cr-control__affix font-bold text-lg">Q</span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          value={value ? value.toLocaleString("es-GT") : ""}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder="0.00"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        />
      </div>

      {help && !error && (
        <span className="cr-field__help">{help}</span>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export function CreceSwitch({
  label,
  description,
  checked,
  onChange,
  id,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label className="cr-switch" htmlFor={id}>
      <div>
        <strong className="block font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {label}
        </strong>
        {description && <small>{description}</small>}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Stat
// ---------------------------------------------------------------------------

export function CreceStat({
  label,
  value,
  help,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  help?: string;
}) {
  return (
    <div className="cr-stat">
      <div className="cr-stat__label">{label}</div>
      <div className="cr-stat__value">{value}</div>
      {help && <div className="cr-stat__foot">{help}</div>}
    </div>
  );
}
