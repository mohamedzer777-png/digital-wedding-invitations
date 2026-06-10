/**
 * Application-level enums.
 *
 * The SQL Server Prisma connector does not support native `enum` types, so these
 * fields are stored as `String` in the schema. This module re-establishes type
 * safety + a single source of truth for the allowed values. Each export is both
 * a value (for runtime checks / Zod) and a type (for compile-time safety).
 */

function asEnum<const T extends readonly string[]>(values: T) {
  return {
    values,
    options: values as unknown as [T[number], ...T[number][]], // for z.enum(...)
    is: (v: unknown): v is T[number] => typeof v === 'string' && (values as readonly string[]).includes(v),
  };
}

export const Role = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export type Role = (typeof Role)[keyof typeof Role];
export const RoleEnum = asEnum(['USER', 'ADMIN'] as const);

export const UserStatus = { ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED' } as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export const UserStatusEnum = asEnum(['ACTIVE', 'SUSPENDED'] as const);

export const SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const SubscriptionStatusEnum = asEnum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'] as const);

export const EventType = {
  WEDDING: 'WEDDING',
  ENGAGEMENT: 'ENGAGEMENT',
  BIRTHDAY: 'BIRTHDAY',
  CORPORATE: 'CORPORATE',
  OTHER: 'OTHER',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];
export const EventTypeEnum = asEnum(['WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'CORPORATE', 'OTHER'] as const);

export const EventStatus = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISHED', ARCHIVED: 'ARCHIVED' } as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
export const EventStatusEnum = asEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const);

export const InvitationStatus = { DRAFT: 'DRAFT', READY: 'READY' } as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];
export const InvitationStatusEnum = asEnum(['DRAFT', 'READY'] as const);

export const RsvpStatus = {
  PENDING: 'PENDING',
  GOING: 'GOING',
  NOT_GOING: 'NOT_GOING',
  MAYBE: 'MAYBE',
} as const;
export type RsvpStatus = (typeof RsvpStatus)[keyof typeof RsvpStatus];
export const RsvpStatusEnum = asEnum(['PENDING', 'GOING', 'NOT_GOING', 'MAYBE'] as const);

export const MessageChannel = { WHATSAPP: 'WHATSAPP' } as const;
export type MessageChannel = (typeof MessageChannel)[keyof typeof MessageChannel];
export const MessageChannelEnum = asEnum(['WHATSAPP'] as const);

export const MessageType = { INVITATION: 'INVITATION', REMINDER: 'REMINDER', CUSTOM: 'CUSTOM' } as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export const MessageTypeEnum = asEnum(['INVITATION', 'REMINDER', 'CUSTOM'] as const);

export const MessageStatus = {
  QUEUED: 'QUEUED',
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];
export const MessageStatusEnum = asEnum(['QUEUED', 'SCHEDULED', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const);

export const AnalyticsType = {
  INVITATION_OPENED: 'INVITATION_OPENED',
  RSVP_VIEWED: 'RSVP_VIEWED',
  RSVP_CLICKED: 'RSVP_CLICKED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  MESSAGE_READ: 'MESSAGE_READ',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
} as const;
export type AnalyticsType = (typeof AnalyticsType)[keyof typeof AnalyticsType];
export const AnalyticsTypeEnum = asEnum([
  'INVITATION_OPENED',
  'RSVP_VIEWED',
  'RSVP_CLICKED',
  'MESSAGE_SENT',
  'MESSAGE_DELIVERED',
  'MESSAGE_READ',
  'MESSAGE_FAILED',
] as const);
