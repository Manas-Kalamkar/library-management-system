import type { Borrowing } from "./types";

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const numberFormat = new Intl.NumberFormat();

export const formatDate = (iso?: string | null) => (iso ? dateFormat.format(new Date(iso)) : "–");
export const formatNumber = (n: number) => numberFormat.format(n);

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";

export const shortId = (id: string) => `…${id.slice(-5)}`;

export type LoanStatus = "returned" | "overdue" | "out";

export const loanStatus = (loan: Pick<Borrowing, "returnedAt" | "dueDate">, now = Date.now()): LoanStatus => {
    if (loan.returnedAt) return "returned";
    return new Date(loan.dueDate).getTime() < now ? "overdue" : "out";
};

const DAY = 86_400_000;
export const daysUntil = (iso: string, now = Date.now()) => Math.ceil((new Date(iso).getTime() - now) / DAY);

/** yyyy-mm-dd in the user's local time zone, for <input type="date">. */
export const toDateInput = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** End of the chosen local day, as an ISO string the API accepts. */
export const endOfLocalDay = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T23:59:59`).toISOString();

export const addDays = (days: number, from = new Date()) => new Date(from.getTime() + days * DAY);

export const roleLabel = (role: string) => (role === "ADMIN" ? "Administrator" : role === "LIBRARIAN" ? "Librarian" : "Borrower");
