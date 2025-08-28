"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function EmptyState(props: {
  title?: string;
  description?: string;
  onAddProject: () => void;
}) {
  const { title = "No projects yet", description = "Create your first project to get started.", onAddProject } = props;
  return (
    <div className="rounded-2xl border bg-white/60 p-8 shadow-sm">
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" className="gap-2 font-medium bg-transparent" onClick={onAddProject}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
    </div>
  );
}


