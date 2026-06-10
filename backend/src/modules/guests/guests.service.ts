import { parse } from 'csv-parse/sync';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { getOwnedEventOrThrow } from '../events/events.service.js';
import type { CreateGuestInput, ListGuestsQuery, UpdateGuestInput } from './guests.schema.js';

interface CsvRow {
  name: string;
  phone: string;
  email?: string;
  groupLabel?: string;
  partySize?: number;
}

/** Maps flexible CSV header names to our fields. */
function normalizeRow(raw: Record<string, string>): CsvRow | null {
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const found = Object.keys(raw).find((h) => h.trim().toLowerCase() === k);
      if (found) {
        const value = raw[found];
        if (value && value.trim()) return value.trim();
      }
    }
    return undefined;
  };

  const name = get('name', 'guest', 'full name', 'fullname');
  const phone = get('phone', 'phone number', 'mobile', 'tel', 'number');
  if (!name || !phone) return null;

  const partySizeRaw = get('partysize', 'party size', 'seats', 'guests');
  return {
    name,
    phone,
    email: get('email', 'e-mail'),
    groupLabel: get('group', 'grouplabel', 'group label', 'side', 'category'),
    partySize: partySizeRaw ? Math.max(1, parseInt(partySizeRaw, 10) || 1) : 1,
  };
}

export const guestService = {
  async list(ownerId: string, eventId: string, query: ListGuestsQuery) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const where = {
      eventId,
      ...(query.groupLabel ? { groupLabel: query.groupLabel } : {}),
      ...(query.rsvpStatus ? { rsvpStatus: query.rsvpStatus } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.guest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.guest.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async create(ownerId: string, eventId: string, input: CreateGuestInput) {
    await getOwnedEventOrThrow(eventId, ownerId);
    try {
      return await prisma.guest.create({ data: { ...input, eventId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A guest with this phone already exists for this event');
      }
      throw err;
    }
  },

  async importCsv(ownerId: string, eventId: string, fileBuffer: Buffer) {
    await getOwnedEventOrThrow(eventId, ownerId);

    let records: Record<string, string>[];
    try {
      records = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    } catch {
      throw ApiError.badRequest('Could not parse CSV file');
    }

    // Pre-fetch existing phones to classify created vs updated.
    const existing = await prisma.guest.findMany({ where: { eventId }, select: { phone: true } });
    const existingPhones = new Set(existing.map((g) => g.phone));

    let created = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = normalizeRow(records[i]!);
      if (!row) {
        errors.push({ row: i + 2, message: 'Missing required name or phone' }); // +2: header + 1-based
        continue;
      }
      try {
        await prisma.guest.upsert({
          where: { eventId_phone: { eventId, phone: row.phone } },
          update: { name: row.name, email: row.email, groupLabel: row.groupLabel, partySize: row.partySize },
          create: {
            eventId,
            name: row.name,
            phone: row.phone,
            email: row.email,
            groupLabel: row.groupLabel,
            partySize: row.partySize ?? 1,
          },
        });
        if (existingPhones.has(row.phone)) updated++;
        else {
          created++;
          existingPhones.add(row.phone);
        }
      } catch {
        errors.push({ row: i + 2, message: 'Failed to import row' });
      }
    }

    return { created, updated, skipped: errors.length, total: records.length, errors };
  },

  async update(ownerId: string, eventId: string, guestId: string, input: UpdateGuestInput) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const guest = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!guest) throw ApiError.notFound('Guest not found');
    try {
      return await prisma.guest.update({ where: { id: guestId }, data: input });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict('A guest with this phone already exists for this event');
      }
      throw err;
    }
  },

  async remove(ownerId: string, eventId: string, guestId: string) {
    await getOwnedEventOrThrow(eventId, ownerId);
    const guest = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
    if (!guest) throw ApiError.notFound('Guest not found');

    // Message→Guest and AnalyticsEvent→Guest are NoAction: clear dependents first.
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { guestId } }),
      prisma.analyticsEvent.updateMany({ where: { guestId }, data: { guestId: null } }),
      prisma.guest.delete({ where: { id: guestId } }),
    ]);
    return { success: true };
  },
};
