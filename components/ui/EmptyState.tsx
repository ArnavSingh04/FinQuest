"use client";

/** Centred empty state: warm-toned geometric city SVG, DM Serif heading, muted subtext, terracotta CTA. */
export function EmptyState({
  heading,
  subtext,
  ctaLabel,
  onCta,
}: {
  heading: string;
  subtext: string;
  ctaLabel: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="mb-6 h-20 w-20 shrink-0 rounded-2xl opacity-90"
        style={{
          background: "var(--bg-surface)",
          border: "2px solid var(--border)",
          boxShadow: "0 2px 12px rgba(44,36,22,0.08)",
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="h-full w-full p-3"
          style={{ color: "var(--text-muted)" }}
        >
          <rect x="8" y="28" width="8" height="12" rx="1" fill="currentColor" opacity={0.6} />
          <rect x="20" y="22" width="8" height="18" rx="1" fill="currentColor" opacity={0.8} />
          <rect x="32" y="26" width="8" height="14" rx="1" fill="currentColor" opacity={0.5} />
          <path
            d="M12 28v-6l4-4 4 4v6M28 22v-8l4-4 4 4v8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.4}
          />
        </svg>
      </div>
      <h3 className="font-heading text-lg font-normal text-text-primary">
        {heading}
      </h3>
      <p className="mt-2 max-w-[260px] text-sm text-text-muted">
        {subtext}
      </p>
      {onCta && (
        <button
          type="button"
          onClick={onCta}
          className="touch-target mt-6 min-h-[44px] rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-accent-primary-hover"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
