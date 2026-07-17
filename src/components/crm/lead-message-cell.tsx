"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeadMessageCell({ message }: { message: string | null }) {
  const [open, setOpen] = useState(false);

  if (!message?.trim()) {
    return <span className="text-muted-foreground">—</span>;
  }

  const long = message.length > 80;

  return (
    <div className="max-w-xs">
      <p className={open ? "whitespace-pre-wrap text-sm" : "line-clamp-1 text-sm"}>
        {message}
      </p>
      {long && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <>
              Menos <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Ver más <ChevronDown className="size-3" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
