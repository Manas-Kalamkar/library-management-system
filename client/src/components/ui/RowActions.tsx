import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "./Button";

export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
    return (
        <div className="flex items-center justify-end gap-1">
            <IconButton label={`Edit ${name}`} onClick={onEdit}>
                <Pencil className="size-4" aria-hidden />
            </IconButton>
            <IconButton label={`Delete ${name}`} onClick={onDelete} className="hover:bg-danger-bg hover:text-danger">
                <Trash2 className="size-4" aria-hidden />
            </IconButton>
        </div>
    );
}
