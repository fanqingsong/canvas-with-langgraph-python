"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState(props: {
  title?: string;
  description?: string;
  className?: string;
  onAddItem: () => void;
  onAddTypedItem?: (t: "work" | "entity" | "notes" | "chart") => void;
}) {
  const { title = "Nothing here yet", description = "Create your first item to get started.", onAddItem, onAddTypedItem } = props;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-medium">
                <Plus className="h-4 w-4" />
                New…
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-background">
              <DropdownMenuItem onClick={() => onAddTypedItem?.("work")}>Work item</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTypedItem?.("entity")}>Entity</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTypedItem?.("notes")}>Notes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTypedItem?.("chart")}>Chart</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}


