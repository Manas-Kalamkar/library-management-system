import { describe, expect, it } from "vitest";
import { CLOTHS, coverFor, hash, MOTIFS } from "../src/lib/cover";
import { daysUntil, initials, loanStatus, toDateInput } from "../src/lib/format";

describe("cover generation", () => {
    it("is deterministic and case-insensitive", () => {
        expect(coverFor("Fiction", "Emma")).toEqual(coverFor(" fiction ", "EMMA"));
        expect(hash("a")).toBe(hash("a"));
    });

    it("keeps one genre on one cloth colour, whatever the title", () => {
        const a = coverFor("Science fiction", "Dune");
        const b = coverFor("Science fiction", "Kindred");
        expect(a.cloth).toBe(b.cloth);
        expect(CLOTHS).toContain(a.cloth);
    });

    it("always yields a valid motif", () => {
        for (const title of ["", "A", "A very long title that goes on and on", "日本語"]) {
            const { motif } = coverFor("x", title);
            expect(motif).toBeGreaterThanOrEqual(0);
            expect(motif).toBeLessThan(MOTIFS);
        }
    });
});

describe("loan status", () => {
    const now = new Date("2026-10-08T12:00:00Z").getTime();
    it("returned wins over everything", () => {
        expect(loanStatus({ returnedAt: "2026-10-01T00:00:00Z", dueDate: "2026-09-01T00:00:00Z" }, now)).toBe("returned");
    });
    it("flags open loans past their due date as overdue", () => {
        expect(loanStatus({ returnedAt: null, dueDate: "2026-10-07T00:00:00Z" }, now)).toBe("overdue");
        expect(loanStatus({ returnedAt: null, dueDate: "2026-10-09T00:00:00Z" }, now)).toBe("out");
    });
    it("counts days until due", () => {
        expect(daysUntil("2026-10-10T12:00:00Z", now)).toBe(2);
        expect(daysUntil("2026-10-06T12:00:00Z", now)).toBe(-2);
    });
});

describe("helpers", () => {
    it("builds initials", () => {
        expect(initials("Ada Lovelace King")).toBe("AL");
        expect(initials("")).toBe("?");
    });
    it("formats local dates for date inputs", () => {
        expect(toDateInput(new Date(2026, 0, 5))).toBe("2026-01-05");
    });
});
