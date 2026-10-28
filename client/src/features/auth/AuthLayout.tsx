import type { ReactNode } from "react";
import { BookCover } from "@/components/BookCover";
import { BrandMark } from "@/components/layout/BrandMark";

// Real, public-domain and widely held titles, so the panel shows what the catalogue will look like.
const SHELF = [
    { title: "Pride and Prejudice", genre: "Classic", year: 1813, author: "Jane Austen", left: "4%", top: "10%", rot: -7, delay: 0 },
    { title: "Frankenstein", genre: "Gothic", year: 1818, author: "Mary Shelley", left: "34%", top: "0%", rot: 3, delay: 120 },
    { title: "Mrs Dalloway", genre: "Modernist", year: 1925, author: "Virginia Woolf", left: "60%", top: "17%", rot: 8, delay: 240 },
];

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
    return (
        <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <section aria-hidden className="relative hidden overflow-hidden bg-rail text-rail-ink lg:block">
                <div className="absolute top-10 left-10 flex items-center gap-3">
                    <BrandMark />
                    <span className="font-serif text-lg font-semibold">City Library</span>
                </div>
                <div className="absolute inset-x-10 top-[24%] h-[46%]">
                    {SHELF.map((book) => (
                        <div
                            key={book.title}
                            className="absolute w-[34%] [animation:settle_700ms_cubic-bezier(0.2,0.7,0.2,1)_both]"
                            style={{ left: book.left, top: book.top, animationDelay: `${book.delay}ms`, ["--to-rot" as string]: `${book.rot}deg`, ["--from-rot" as string]: `${book.rot - 4}deg`, transform: `rotate(${book.rot}deg)` }}
                        >
                            <BookCover title={book.title} genre={book.genre} year={book.year} authorName={book.author} />
                        </div>
                    ))}
                </div>
                <p className="absolute bottom-10 left-10 max-w-sm font-serif text-2xl leading-snug text-white/90">Find a book, lend it, get it back. Nothing else in the way.</p>
            </section>

            <main className="flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-12">
                <div className="mx-auto w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <BrandMark />
                        <span className="font-serif text-lg font-semibold">City Library</span>
                    </div>
                    <h1 className="text-[1.75rem] font-semibold">{title}</h1>
                    <p className="mt-1 mb-7 text-muted">{subtitle}</p>
                    {children}
                    <p className="mt-6 text-sm text-muted">{footer}</p>
                </div>
            </main>
        </div>
    );
}
