'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { useEvent } from '@/lib/hooks/useEvent';
import { useGenerateInvitationText } from '@/lib/hooks/useAi';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SidebarBlocks } from '@/components/SidebarBlocks';
import { Canvas } from '@/components/Canvas';

export default function InvitationEditor({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const { data, isLoading } = useEvent(eventId);
  const queryClient = useQueryClient();
  const generateText = useGenerateInvitationText();
  const [design, setDesign] = useState<any>({ blocks: [] });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const router = useRouter();

  // Initialize design when event data loads. The API returns invitation.design
  // as a JSON string (NVARCHAR), so parse it into a { blocks } object.
  useEffect(() => {
    const raw = data?.invitation?.design;
    if (!raw) {
      setDesign({ blocks: [] });
      return;
    }
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setDesign(parsed && typeof parsed === 'object' ? parsed : { blocks: [] });
    } catch {
      setDesign({ blocks: [] });
    }
  }, [data?.invitation?.design]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback || aiFeedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
        setAiFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback, aiFeedback]);

  if (isLoading) return <div>Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving invitation payload:', design);
      const resp = await api.put(`/events/${eventId}/invitation`, { design });
      console.log('Save response:', resp?.data ?? resp);
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setFeedback({ type: 'success', msg: 'Design saved successfully!' });
    } catch (err: any) {
      console.error('Save error response:', err?.response?.data ?? err);
      setFeedback({ type: 'error', msg: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateText = async () => {
    if (!data) return;
    try {
      const result = await generateText.mutateAsync({
        eventType: data.type,
        coupleNames: data.title,
        eventDate: data.eventDate ?? undefined,
        venue: data.venue ?? undefined,
        details: data.description ?? undefined,
        tone: 'Simple',
      });
      setGeneratedText(result.text);
      setAiFeedback({ type: 'success', msg: 'AI text generated. Add it to canvas.' });
    } catch (err: any) {
      setAiFeedback({ type: 'error', msg: apiErrorMessage(err) });
    }
  };

  const handleAddGeneratedText = () => {
    if (!generatedText) return;

    const newBlock = {
      id: `text-${Date.now()}`,
      type: 'text',
      props: { text: generatedText },
    };

    setDesign({ ...design, blocks: [...(design.blocks ?? []), newBlock] });
    setGeneratedText(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // Only proceed if dropped over the canvas
    if (!over || over.id !== 'canvas') return;
    
    const type = (active.data?.current?.type ?? active.id) as string;
    if (type && type !== 'canvas') {
      const newBlock = { id: `${type}-${Date.now()}`, type, props: {} };
      const updated = { ...design, blocks: [...(design.blocks ?? []), newBlock] };
      setDesign(updated);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-[80vh] gap-6">
        <aside className="w-64">
          <SidebarBlocks />
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handleGenerateText} loading={generateText.isPending}>
              Generate text with AI
            </Button>
            <Button onClick={() => router.push(`/events/${eventId}`)} variant="secondary">
              Back
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Invitation Editor — {data?.title}</h1>
              <p className="text-sm text-slate-500">Use AI to generate a text block and add it to the canvas.</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              {(feedback || aiFeedback) && (
                <div className={`text-sm ${feedback?.type === 'success' || aiFeedback?.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback?.msg ?? aiFeedback?.msg}
                </div>
              )}
              <Button onClick={handleSave} loading={saving} disabled={saving}>
                Save
              </Button>
            </div>
          </div>

          <Canvas design={design} onChange={setDesign} />

          {generatedText && (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h2 className="text-sm font-semibold text-slate-700">Generated invitation text</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{generatedText}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button onClick={handleAddGeneratedText}>Add to canvas</Button>
                <Button variant="secondary" onClick={() => setGeneratedText(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </DndContext>
  );
}
