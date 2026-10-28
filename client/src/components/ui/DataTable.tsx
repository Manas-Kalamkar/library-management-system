import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Display";

export interface Column<T> {
    key: string;
    header: string;
    cell: (row: T) => ReactNode;
    /** The row's headline on mobile cards (rendered without a label). */
    primary?: boolean;
    align?: "right";
    className?: string;
    /** Hide the header text but keep it for assistive tech (e.g. an actions column). */
    srOnlyHeader?: boolean;
}

interface Props<T> {
    caption: string;
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    skeletonRows?: number;
    dimmed?: boolean;
}

/**
 * A real <table> from md up (proper header semantics), and a stack of labelled cards on phones
 * where a wide table would force sideways scrolling.
 */
export function DataTable<T>({ caption, columns, rows, rowKey, loading, skeletonRows = 5, dimmed }: Props<T>) {
    const primary = columns.find((c) => c.primary) ?? columns[0]!;
    const rest = columns.filter((c) => c !== primary);

    return (
        <div className={cn("transition-opacity", dimmed && "opacity-60")}>
            <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
                <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">{caption}</caption>
                    <thead className="border-b border-line bg-surface-2 text-[0.8125rem] text-muted">
                        <tr>
                            {columns.map((c) => (
                                <th key={c.key} scope="col" className={cn("px-4 py-2.5 font-medium", c.align === "right" && "text-right")}>
                                    <span className={cn(c.srOnlyHeader && "sr-only")}>{c.header}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {loading
                            ? Array.from({ length: skeletonRows }, (_, i) => (
                                  <tr key={i}>
                                      {columns.map((c) => (
                                          <td key={c.key} className="px-4 py-3.5">
                                              <Skeleton className="h-4 w-3/4" />
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : rows.map((row) => (
                                  <tr key={rowKey(row)} className="transition-colors hover:bg-surface-2/70">
                                      {columns.map((c) => (
                                          <td key={c.key} className={cn("px-4 py-3 align-middle", c.align === "right" && "text-right", c.className)}>
                                              {c.cell(row)}
                                          </td>
                                      ))}
                                  </tr>
                              ))}
                    </tbody>
                </table>
            </div>

            <ul aria-label={caption} className="grid gap-3 md:hidden">
                {loading
                    ? Array.from({ length: Math.min(skeletonRows, 4) }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
                    : rows.map((row) => (
                          <li key={rowKey(row)} className="rounded-xl border border-line bg-surface p-4">
                              <div className="font-medium">{primary.cell(row)}</div>
                              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                                  {rest
                                      .filter((c) => !c.srOnlyHeader)
                                      .map((c) => (
                                          <div key={c.key} className="contents">
                                              <dt className="text-muted">{c.header}</dt>
                                              <dd className="min-w-0 break-words">{c.cell(row)}</dd>
                                          </div>
                                      ))}
                              </dl>
                              {rest
                                  .filter((c) => c.srOnlyHeader)
                                  .map((c) => {
                                      const content = c.cell(row);
                                      // rows with nothing to do (e.g. an already-returned loan) get no empty strip
                                      return content == null || content === false ? null : (
                                          <div key={c.key} className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                                              {content}
                                          </div>
                                      );
                                  })}
                          </li>
                      ))}
            </ul>
        </div>
    );
}
