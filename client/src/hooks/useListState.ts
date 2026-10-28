import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useDebounced } from "./useDebounced";

/** Search text + page, kept in the URL so lists are linkable and survive reload. */
export function useListState() {
    const [params, setParams] = useSearchParams();
    const search = params.get("q") ?? "";
    const page = Math.max(1, Number(params.get("page")) || 1);
    const [draft, setDraft] = useState(search);
    const debounced = useDebounced(draft, 300);

    const patch = (values: Record<string, string | null>, resetPage = true) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [k, v] of Object.entries(values)) v ? next.set(k, v) : next.delete(k);
                if (resetPage) next.delete("page");
                return next;
            },
            { replace: true },
        );

    // keep the URL in step with the debounced input (an effect, never during render)
    useEffect(() => {
        if (debounced !== search && debounced === draft) patch({ q: debounced || null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    return {
        search,
        page,
        draft,
        setDraft,
        setPage: (p: number) => patch({ page: p === 1 ? null : String(p) }, false),
        param: (key: string) => params.get(key),
        patch,
    };
}
