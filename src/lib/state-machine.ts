// src/lib/state-machine.ts
import { BookingStatus, Role } from '@/types/firestore';

const VALID_TRANSITIONS: Record<BookingStatus, { next: BookingStatus[]; allowedRoles: Role[] }> = {
  DRAFT: {
    next: ['PENDING_PAYMENT', 'CANCELLED'],
    allowedRoles: ['CUSTOMER', 'ADMIN'],
  },
  PENDING_PAYMENT: {
    next: ['PENDING_REVIEW', 'PAYMENT_FAILED', 'CANCELLED'],
    allowedRoles: ['ADMIN'], // Triggered via verified webhook or system job
  },
  PAYMENT_FAILED: {
    next: ['PENDING_PAYMENT', 'CANCELLED'],
    allowedRoles: ['CUSTOMER', 'ADMIN'],
  },
  PENDING_REVIEW: {
    next: ['AWAITING_NEWSPAPER_CONFIRMATION', 'ARTWORK_REQUIRED', 'REJECTED', 'CANCELLATION_REQUESTED'],
    allowedRoles: ['CUSTOMER', 'ADMIN'],
  },
  ARTWORK_REQUIRED: {
    next: ['PENDING_REVIEW', 'CANCELLATION_REQUESTED', 'CANCELLED'],
    allowedRoles: ['CUSTOMER', 'ADMIN'],
  },
  AWAITING_NEWSPAPER_CONFIRMATION: {
    next: ['CONFIRMED', 'REJECTED', 'CANCELLATION_REQUESTED'],
    allowedRoles: ['ADMIN', 'PUBLISHER_AUDITOR'],
  },
  CONFIRMED: {
    next: ['PUBLISHED', 'CANCELLATION_REQUESTED'],
    allowedRoles: ['ADMIN', 'PUBLISHER_AUDITOR'],
  },
  REJECTED: {
    next: ['REFUND_PENDING', 'CANCELLED'],
    allowedRoles: ['ADMIN'],
  },
  CANCELLATION_REQUESTED: {
    next: ['CANCELLED', 'REFUND_PENDING', 'CONFIRMED'],
    allowedRoles: ['ADMIN'],
  },
  REFUND_PENDING: {
    next: ['REFUNDED'],
    allowedRoles: ['ADMIN'],
  },
  PUBLISHED: { next: [], allowedRoles: [] },
  CANCELLED: { next: [], allowedRoles: [] },
  REFUNDED: { next: [], allowedRoles: [] },
};

export function assertValidStatusTransition(
  current: BookingStatus,
  target: BookingStatus,
  actorRole: Role
): void {
  const rule = VALID_TRANSITIONS[current];
  if (
    (target === 'CONFIRMED' || target === 'PUBLISHED') &&
    actorRole === 'CUSTOMER'
  ) {
    throw new Error(`Role ${actorRole} is not authorized to transition booking to ${target}.`);
  }
  if (!rule || !rule.next.includes(target)) {
    throw new Error(`Invalid status transition from ${current} to ${target}.`);
  }
  if (target !== 'CANCELLATION_REQUESTED' && !rule.allowedRoles.includes(actorRole)) {
    throw new Error(`Role ${actorRole} is not authorized to transition booking to ${target}.`);
  }
}