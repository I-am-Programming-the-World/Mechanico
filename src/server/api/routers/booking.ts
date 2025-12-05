import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bookingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        vehicleId: z.string(),
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
        description: z.string().max(1000).optional(),
        scheduledAt: z.string().optional(), // ISO datetime string
        addressLabel: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customerId = ctx.session.user.id;

      // Fetch service to get basePrice and ensure it exists
      const service = await ctx.db.service.findUnique({
        where: { id: input.serviceId },
        select: { basePrice: true },
      });

      if (!service) {
        throw new Error("Service not found");
      }

      // Create booking with PENDING status and no provider initially
      const booking = await ctx.db.booking.create({
        data: {
          status: "PENDING",
          jobType: "ON_DEMAND",
          price: service.basePrice,
          date: new Date(),
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          problemDescription: input.description ?? null,
          addressLabel: input.addressLabel ?? null,
          latitude: input.lat,
          longitude: input.lng,
          customerId,
          vehicleId: input.vehicleId,
          serviceId: input.serviceId,
          cancellationFee: null,
          declineReason: null,
        },
      });

      // Create offers for all providers who offer this service
      const providers = await ctx.db.service.findMany({
        where: { id: input.serviceId, isActive: true },
        select: { providerId: true },
      });

      const offers = providers.map((p) => ({
        bookingId: booking.id,
        providerId: p.providerId,
        status: "SENT" as const,
        createdAt: new Date(),
        respondedAt: null,
      }));

      if (offers.length > 0) {
        await ctx.db.bookingOffer.createMany({ data: offers });
      }

      return booking;
    }),

  startJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const providerId = ctx.session.user.id;

      const existing = await ctx.db.booking.findUnique({
        where: { id: input.id },
        select: { providerId: true, status: true },
      });
 
      if (existing?.providerId !== providerId) {
        throw new Error("Booking not found");
      }

      if (existing.status !== "CONFIRMED") {
        return existing;
      }

      return ctx.db.booking.update({
        where: { id: input.id },
        data: { status: "IN_PROGRESS" },
      });
    }),

  completeJob: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const providerId = ctx.session.user.id;

      const existing = await ctx.db.booking.findUnique({
        where: { id: input.id },
        select: { providerId: true, status: true },
      });
 
      if (existing?.providerId !== providerId) {
        throw new Error("Booking not found");
      }

      if (existing.status !== "IN_PROGRESS") {
        return existing;
      }

      return ctx.db.booking.update({
        where: { id: input.id },
        data: { status: "COMPLETED" },
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        select: { customerId: true, status: true },
      });
 
      if (booking?.customerId !== userId) {
        throw new Error("Booking not found");
      }

      if (["COMPLETED", "CANCELLED"].includes(booking.status)) {
        return booking;
      }

      return ctx.db.booking.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
          vehicle: true,
          customer: {
            select: {
              id: true,
              profile: true,
            },
          },
          provider: {
            select: {
              id: true,
              profile: true,
            },
          },
          rating: true,
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      return booking;
    }),
});