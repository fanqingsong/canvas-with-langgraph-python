"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState(props: {
  title?: string;
  description?: string;
  className?: string;
  onAddItem: () => void;
}) {
  const { title = "Nothing here yet", description = "Create your first item to get started.", onAddItem } = props;
  return (
    <div className={cn(
      "grid place-items-center justify-center rounded-2xl p-8 border-2 border-dashed",
      "bg-border/50 border-foreground/25 transition-colors",
      "has-[button:hover]:bg-accent/10 has-[button:hover]:border-accent/25",
      props.className
    )}>
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" className="gap-2 font-medium" onClick={onAddItem}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );
}


