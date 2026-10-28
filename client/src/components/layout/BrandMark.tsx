export function BrandMark({ className = "size-8" }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden>
            <rect width="64" height="64" rx="14" fill="#2b3b63" />
            <path d="M18 16h22a6 6 0 0 1 6 6v26H24a6 6 0 0 1-6-6V16Z" fill="#f4efe3" />
            <path d="M18 42a6 6 0 0 1 6-6h22" fill="none" stroke="#b07d1e" strokeWidth="3.5" />
            <path d="M26 24h14" stroke="#1e2b4a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
    );
}
