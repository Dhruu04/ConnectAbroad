import { HTMLAttributes } from "react";

export function Logo({ className, ...props }: HTMLAttributes<SVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      {...props}
    >
      {/* Globe skeleton in background (charcoal/foreground with low opacity) */}
      <circle
        cx="50"
        cy="50"
        r="34"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="opacity-15"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="14"
        ry="34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        className="opacity-20"
      />
      <line
        x1="16"
        y1="50"
        x2="84"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        className="opacity-20"
      />

      {/* Curved Connection Arc path (accent color) */}
      <path
        d="M 34,66 C 34,44 56,34 66,34"
        stroke="var(--accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hometown Node (adapts to current text color) */}
      <circle cx="34" cy="66" r="5" fill="currentColor" />

      {/* Destination/New City Node (accent color) */}
      <circle cx="66" cy="34" r="5.5" fill="var(--accent)" />
      <circle
        cx="66"
        cy="34"
        r="9"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
