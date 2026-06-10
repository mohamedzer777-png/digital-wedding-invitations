'use client';

import { useDraggable } from '@dnd-kit/core';

function DraggableItem({ type, label }: { type: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ 
    id: type,
    data: { type }
  });
  
  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`cursor-grab active:cursor-grabbing rounded-md border p-3 mb-2 bg-white transition ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      {label}
    </div>
  );
}

export function SidebarBlocks() {
  return (
    <div className="space-y-3">
      <h3 className="mb-2 text-sm font-medium text-slate-700">Drag blocks to canvas →</h3>
      <DraggableItem type="text" label="📝 Text Block" />
      <DraggableItem type="image" label="🖼 Image Block" />
      <DraggableItem type="rsvp" label="✉️ RSVP Form" />
    </div>
  );
}
