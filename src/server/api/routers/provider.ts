import { z } from "zod";
import { observable } from "@trpc/server/observable";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { ee, channels } from "~/server/events";

export const providerRouter = createTRPCRouter({
  getNearby: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Find providers who offer this serviceId
      const services = await ctx.db.service.findMany({
        where: {
          id: input.serviceId,
          isActive: true,
        },
        include: {
          provider: {
            include: {
              profile: true,
            },
          },
        },
      });

      // If we had Profile.location (PostGIS geography), we could compute distance here.
      // For now, use a placeholder distance and ETA.
      return services.map((s) => ({
        providerId: s.providerId,
        name: s.provider.profile?.fullName ?? "مکانیک",
        distanceMeters: 0, // Placeholder until PostGIS distance is added
        etaMinutes: 15,    // Placeholder ETA
        rating: null,
        basePrice: s.basePrice,
        serviceName: s.name,
      }));
    }),

  updateLocation: protectedProcedure
    .input(
      z.object({
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
        isAvailable: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Emit location update
      ee.emit(channels.providerLocation(userId), {
        providerId: userId,
        lat: input.lat,
        lng: input.lng,
        isAvailable: input.isAvailable,
      });

      return { ok: true };
    }),

  onLocationUpdate: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .subscription(({ input }) => {
      return observable<{
        providerId: string;
        lat: number;
        lng: number;
        isAvailable: boolean;
      }>((emit) => {
        const ch = channels.providerLocation(input.providerId);
        const onEvent = (msg: { providerId: string; lat: number; lng: number; isAvailable: boolean }) => emit.next(msg);
        ee.on(ch, onEvent);
        return () => {
          ee.off(ch, onEvent);
        };
      });
    }),

  listJobs: protectedProcedure.query(async ({ ctx }) => {
    const providerId = ctx.session.user.id;
    return ctx.db.booking.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Accept an offer: set providerId on the booking and mark offer as ACCEPTED
  acceptOffer: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const providerId = ctx.session.user.id;

      // Ensure the offer exists and is SENT
      const offer = await ctx.db.bookingOffer.findFirst({
        where: {
          bookingId: input.bookingId,
          providerId,
          status: "SENT",
        },
      });

      if (!offer) {
        throw new Error("Offer not found or already responded");
      }

      // Update booking: assign provider and set status to CONFIRMED
      const booking = await ctx.db.booking.update({
        where: { id: input.bookingId },
        data: { providerId, status: "CONFIRMED" },
      });

      // Mark offer as ACCEPTED
      await ctx.db.bookingOffer.updateMany({
        where: {
          bookingId: input.bookingId,
          providerId,
          status: "SENT",
        },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });

      return booking;
    }),

  // Active broadcast offers for this provider (not expired)
  listOffers: protectedProcedure.query(async ({ ctx }) => {
    const providerId = ctx.session.user.id;

    const offers = await ctx.db.bookingOffer.findMany({
      where: {
        providerId,
        status: "SENT",
      },
      include: {
        booking: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return offers.map((o) => {
      const ttlMs = 10 * 60 * 1000; // 10 minutes TTL as a simple rule
      const offeredAt = o.createdAt;
      return {
        id: o.id,
        bookingId: o.bookingId,
        latitude: o.booking.latitude,
        longitude: o.booking.longitude,
        scheduledAt: o.booking.scheduledAt,
        price: o.booking.price,
        problem: o.booking.problemDescription ?? "",
        address: o.booking.addressLabel ?? "",
        serviceName: o.booking.service.name,
        offeredAt: offeredAt.toISOString(),
        ttlMs,
      };
    });
  }),

  // Decline an active offer (mark as EXPIRED)
  declineOffer: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const providerId = ctx.session.user.id;

      await ctx.db.bookingOffer.updateMany({
        where: {
          bookingId: input.bookingId,
          providerId,
          status: "SENT",
        },
        data: {
          status: "EXPIRED",
          respondedAt: new Date(),
        },
      });

      return { ok: true };
    }),
});