import { EventEmitter } from "events";

export const ee = new EventEmitter();

// Increase max listeners to avoid warnings for many subscribers per channel
ee.setMaxListeners(0);

// Channel helpers
export const channels = {
  bookingNew: (providerId: string) => `booking:new:${providerId}`,
  bookingStatus: (bookingId: string) => `booking:status:${bookingId}`,
  bookingChat: (bookingId: string) => `booking:chat:${bookingId}`,
  bookingItems: (bookingId: string) => `booking:items:${bookingId}`,
  bookingAttachments: (bookingId: string) => `booking:attachments:${bookingId}`,
  providerLocation: (providerId: string) => `provider:loc:${providerId}`,
} as const;