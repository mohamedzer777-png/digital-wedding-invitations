import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { parseJson } from '../../lib/json.js';
import { EventType } from '../../lib/enums.js';
import type { GenerateTextInput, ImproveTextInput, SuggestTemplateInput } from './ai.schema.js';

const openaiClient = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

function safeTemplate(template: { design: string } & Record<string, unknown>) {
  return { ...template, design: parseJson<Record<string, unknown>>(template.design, {}) };
}

function buildInvitationPrompt(input: GenerateTextInput, mode: 'generate'): string;
function buildInvitationPrompt(input: ImproveTextInput, mode: 'improve'): string;
function buildInvitationPrompt(input: GenerateTextInput | ImproveTextInput, mode: 'generate' | 'improve') {
  if (mode === 'generate') {
    const typedInput = input as GenerateTextInput;
    const summary = [];
    if (typedInput.coupleNames) summary.push(`for ${typedInput.coupleNames}`);
    if (typedInput.eventDate) summary.push(`on ${typedInput.eventDate}`);
    if (typedInput.venue) summary.push(`at ${typedInput.venue}`);
    if (typedInput.details) summary.push(`${typedInput.details}`);

    return [`You are a creative invitation copywriter for a ${typedInput.eventType?.toLowerCase() ?? 'wedding event'} invitation.`,
      `Write an elegant and warm invitation text in a ${typedInput.tone} tone.`,
      summary.length > 0 ? `Include ${summary.join(', ')}.` : '',
      'Keep the message concise and engaging for WhatsApp delivery.',
      'Use a friendly, personal voice and mention RSVP instructions.'
    ].filter(Boolean).join(' ');
  }

  const typedInput = input as ImproveTextInput;
  return [`You are an expert copy editor.`,
    'Improve the following invitation message for clarity, warmth, and style while preserving the meaning.',
    `Text: ${typedInput.text}`].join(' ');
}

async function completePrompt(prompt: string) {
  if (!openaiClient) {
    return null;
  }

  const response = await openaiClient.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.8,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? null;
}

export const aiService = {
  async generateText(input: GenerateTextInput) {
    const prompt = buildInvitationPrompt(input, 'generate');
    const generated = await completePrompt(prompt);
    if (generated) return { text: generated };

    const eventType = input.eventType ?? 'WEDDING';
    const tone = input.tone;
    const couple = input.coupleNames ? `${input.coupleNames} ` : '';
    return {
      text: `Join us for ${couple}as we celebrate a ${tone.toLowerCase()} ${eventType.toLowerCase()}${input.eventDate ? ` on ${input.eventDate}` : ''}${input.venue ? ` at ${input.venue}` : ''}. We would be honored to have you with us. Please RSVP via the link.`,
    };
  },

  async improveText(input: ImproveTextInput) {
    const prompt = buildInvitationPrompt(input, 'improve');
    const improved = await completePrompt(prompt);
    if (improved) return { text: improved };
    return { text: `${input.text.trim().replace(/\s+/g, ' ')}

Please join us to celebrate our special day!` };
  },

  async suggestTemplate(input: SuggestTemplateInput) {
    const templates = await prisma.template.findMany({ where: { isPublic: true }, orderBy: [{ createdAt: 'desc' }], take: 5 });
    const suggestions = templates.map(safeTemplate);
    const message = `Suggested invitation templates for a ${input.tone.toLowerCase()} ${input.eventType?.toLowerCase() ?? 'wedding'} event.`;
    return { message, templates: suggestions };
  },
};
