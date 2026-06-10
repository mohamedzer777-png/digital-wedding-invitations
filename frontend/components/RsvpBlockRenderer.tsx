'use client';

import type { InvitationDesign } from '@/lib/types';

function TextBlock({ block }: { block: { props?: Record<string, any> } }) {
  return <p className="text-slate-800">{block.props?.text ?? 'Text block content'}</p>;
}

function ImageBlock({ block }: { block: { props?: Record<string, any> } }) {
  const src = block.props?.src ?? 'https://via.placeholder.com/600x240?text=Invitation+Image';
  return <img src={src} alt={block.props?.alt ?? 'Invitation image'} className="w-full rounded-md object-cover" />;
}

function RsvpFormBlock() {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">This area shows the RSVP form on the invitation.</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        <li>• Status selector</li>
        <li>• Party size input</li>
      </ul>
    </div>
  );
}

export function RsvpBlockRenderer({ design }: { design: InvitationDesign | null }) {
  if (!design || !Array.isArray(design.blocks) || design.blocks.length === 0) {
    return <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-500">No invitation design available.</div>;
  }

  return (
    <div className="space-y-4">
      {design.blocks.map((block) => {
        const type = block.type?.toLowerCase();
        return (
          <div key={block.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {type === 'text' && <TextBlock block={block} />}
            {type === 'image' && <ImageBlock block={block} />}
            {type === 'rsvp' && <RsvpFormBlock />}
            {!['text', 'image', 'rsvp'].includes(type) && (
              <p className="text-slate-700">Unknown block type: {block.type}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
