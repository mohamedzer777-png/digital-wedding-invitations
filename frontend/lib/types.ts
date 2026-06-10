export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  createdAt: string;
  subscription?: { status: string; plan: { name: string } } | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type EventType = 'WEDDING' | 'ENGAGEMENT' | 'BIRTHDAY' | 'CORPORATE' | 'OTHER';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  description: string | null;
  eventDate: string | null;
  venue: string | null;
  location: string | null;
  createdAt: string;
  _count?: { guests: number; messages: number; reminders?: number };
  invitation?: {
    id: string;
    templateId: string | null;
    design: string; // JSON text from the API — parse before use
    bodyText: string | null;
    status: string;
  } | null;
}

// ── Analytics ──────────────────────────────────────────────
export interface AnalyticsSummary {
  guests: { total: number; going: number; notGoing: number; maybe: number; pending: number };
  messages: { sent: number; delivered: number; read: number; failed: number };
  engagement: { opened: number; rsvpClicked: number; openRate: number; responseRate: number };
}

export interface TimelinePoint {
  date: string;
  opened: number;
  rsvpClicked: number;
  messagesSent: number;
}

export interface AnalyticsTimeline {
  timeline: TimelinePoint[];
}

// ── Admin (system-wide) ────────────────────────────────────
export interface SystemAnalytics {
  users: number;
  events: number;
  messages: number;
  guests: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  createdAt: string;
  updatedAt: string;
  subscription?: { status: string; plan: { name: string } } | null;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminPlan {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  maxEvents: number;
  maxGuests: number;
  features: string[];
  isActive: boolean;
}

export interface GuestItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  groupLabel?: string | null;
  partySize: number;
  rsvpStatus: string;
  createdAt: string;
}

export interface InvitationDesign {
  blocks: Array<{ id: string; type: string; props?: Record<string, any> }>;
}

export interface RsvpEventData {
  title: string;
  type: EventType;
  eventDate: string | null;
  venue: string | null;
  location: string | null;
  timezone?: string | null;
}

export interface RsvpGuestData {
  name: string;
  partySize: number;
  rsvpStatus: string;
  respondedAt: string | null;
}

export interface RsvpInvitationData {
  design: InvitationDesign;
  bodyText?: string | null;
  status?: string;
}

export interface RsvpPageData {
  event: RsvpEventData;
  invitation: RsvpInvitationData | null;
  guest: RsvpGuestData;
}
