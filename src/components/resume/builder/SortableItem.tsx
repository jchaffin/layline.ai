"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export default function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleGripClick = (e: React.MouseEvent) => {
    const group = (e.target as HTMLElement).closest(".group");
    const collapseBtn =
      group?.querySelector<HTMLButtonElement>("[data-collapse-trigger]");
    if (collapseBtn) {
      e.preventDefault();
      e.stopPropagation();
      collapseBtn.click();
    }
  };

  const grip = (
    <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent flex items-center justify-center shrink-0"
      onClick={handleGripClick}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
    </div>
  );

  const child = React.Children.only(children) as React.ReactElement<{
    grip?: React.ReactNode;
  }>;

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      {React.cloneElement(child, { grip })}
    </div>
  );
}
