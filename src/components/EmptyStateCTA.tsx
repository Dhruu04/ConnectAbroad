import React from "react";
import { type LucideIcon, Sparkles, RefreshCw } from "lucide-react";

interface ActionConfig {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "outline";
}

interface EmptyStateCTAProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  primaryAction?: ActionConfig;
  secondaryAction?: ActionConfig;
  className?: string;
}

export function EmptyStateCTA({
  icon: Icon,
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateCTAProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-surface via-surface/80 to-background p-8 md:p-12 text-center shadow-xl backdrop-blur-md transition-all duration-300 ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-md space-y-6">
        {/* Animated Badge & Icon Header */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative flex size-20 items-center justify-center rounded-3xl border border-accent/25 bg-accent-soft/30 text-accent shadow-inner transition-transform duration-300 hover:scale-105">
            <Icon className="size-10 text-accent stroke-[1.75]" />
            <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
              <Sparkles className="size-3.5" />
            </span>
          </div>

          {badge && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
              {badge}
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Call To Action Buttons */}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
              >
                {primaryAction.icon ? (
                  <primaryAction.icon className="size-4" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                <span>{primaryAction.label}</span>
              </button>
            )}

            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="w-full sm:w-auto min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/80 px-5 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent-soft/20 active:scale-95 transition-all cursor-pointer"
              >
                {secondaryAction.icon ? (
                  <secondaryAction.icon className="size-4 text-muted-foreground" />
                ) : (
                  <RefreshCw className="size-4 text-muted-foreground" />
                )}
                <span>{secondaryAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
