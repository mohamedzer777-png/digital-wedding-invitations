'use client';

import { useDroppable } from '@dnd-kit/core';

function DropZone({ 
  children, 
  onDrop 
}: { 
  children: React.ReactNode; 
  onDrop?: (type: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas' });
  
  return (
    <div 
      ref={setNodeRef}
      className={`min-h-[60vh] rounded-md border-2 border-dashed p-4 transition ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'
      }`}
    >
      {children}
    </div>
  );
}

export function Canvas({ 
  design, 
  onChange 
}: { 
  design: any; 
  onChange: (d: any) => void;
}) {
  return (
    <DropZone>
      <div className="space-y-3">
        {(design?.blocks ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Drag blocks here to build your invitation</p>
        ) : (
          (design.blocks ?? []).map((b: any) => (
            <div key={b.id} className="rounded-md border p-4 bg-slate-50 hover:bg-slate-100 transition group">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 capitalize">{b.type} block</span>
                <button 
                  onClick={() => {
                    const updated = {
                      ...design,
                      blocks: design.blocks.filter((x: any) => x.id !== b.id)
                    };
                    onChange(updated);
                  }}
                  className="text-xs text-red-600 opacity-0 group-hover:opacity-100 transition"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 text-sm text-slate-700">
                {b.type === 'text' && (
                  <p className="whitespace-pre-line">{b.props?.text ?? 'Text placeholder'}</p>
                )}
                {b.type === 'image' && (
                  <div className="rounded-md border bg-white p-3 text-center text-slate-500">
                    {b.props?.src ? <img src={b.props.src} alt="Invitation" className="mx-auto max-h-40" /> : 'Image placeholder'}
                  </div>
                )}
                {b.type === 'rsvp' && (
                  <p>RSVP form block will show guest response options.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DropZone>
  );
}
