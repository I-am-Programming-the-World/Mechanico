import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const customerRouter = createTRPCRouter({
  // Geo regions (id + name) for filters
  listGeoRegions: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT id, name FROM "Region" ORDER BY name ASC
    `;
    return rows;
  }),

  listVehicles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }),

  addVehicle: protectedProcedure
    .input(
      z.object({
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int().gte(1950).lte(new Date().getFullYear() + 1),
        licensePlate: z.string().min(1).max(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const v = await ctx.db.vehicle.create({
        data: {
          userId,
          make: input.make,
          model: input.model,
          year: input.year,
          licensePlate: input.licensePlate,
        },
      });
      return v;
    }),

  updateVehicle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        make: z.string().min(1).optional(),
        model: z.string().min(1).optional(),
        year: z.number().int().gte(1950).lte(new Date().getFullYear() + 1).optional(),
        licensePlate: z.string().min(1).max(32).optional(),
      }).refine(
        (v) => v.make ?? v.model ?? v.year ?? v.licensePlate,
        "Provide at least one field to update",
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.vehicle.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });
      if (existing?.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const v = await ctx.db.vehicle.update({
        where: { id: input.id },
        data: {
          ...(input.make ? { make: input.make } : {}),
          ...(input.model ? { model: input.model } : {}),
          ...(input.year ? { year: input.year } : {}),
          ...(input.licensePlate ? { licensePlate: input.licensePlate } : {}),
        },
      });
      return v;
    }),

  deleteVehicle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.vehicle.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });
      if (existing?.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.vehicle.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  listBookings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.booking.findMany({
      where: { customerId: userId },
      include: {
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, profile: true } },
        vehicle: true,
        rating: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  listPlaces: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.savedPlace.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }),

  addPlace: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1).max(100),
        lat: z.number().gte(-90).lte(90),
        lng: z.number().gte(-180).lte(180),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return ctx.db.savedPlace.create({
        data: {
          userId,
          label: input.label,
          latitude: input.lat,
          longitude: input.lng,
          address: "",
        },
      });
    }),

  updatePlace: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(100).optional(),
        lat: z.number().gte(-90).lte(90).optional(),
        lng: z.number().gte(-180).lte(180).optional(),
      }).refine((v) => v.label !== undefined || v.lat !== undefined || v.lng !== undefined, "Provide at least one field to update"),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.savedPlace.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });
      if (existing?.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.savedPlace.update({
        where: { id: input.id },
        data: {
          ...(input.label ? { label: input.label } : {}),
          ...(input.lat !== undefined ? { latitude: input.lat } : {}),
          ...(input.lng !== undefined ? { longitude: input.lng } : {}),
        },
      });
    }),

  deletePlace: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.savedPlace.findUnique({
        where: { id: input.id },
        select: { userId: true },
      });
      if (existing?.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.savedPlace.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // Booking counts analytics (optional polygon region filter)
  getBookingCounts: protectedProcedure
    .input(z.object({ dateFrom: z.string().datetime().optional(), dateTo: z.string().datetime().optional(), regionId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const customerId = ctx.session.user.id;
      const from = input.dateFrom ? new Date(input.dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const to = input.dateTo ? new Date(input.dateTo) : new Date();

      if (input.regionId) {
        const rows = await ctx.db.$queryRaw<Array<{ status: string; cnt: number }>>`
          SELECT b.status::text AS status, COUNT(*) AS cnt
          FROM "Booking" b
          JOIN "Region" r ON r.id = ${input.regionId}
          WHERE b."customerId" = ${customerId}
            AND (
              (b."scheduledAt" IS NOT NULL AND b."scheduledAt" >= ${from} AND b."scheduledAt" < ${to}) OR
              (b."scheduledAt" IS NULL AND b."date" >= ${from} AND b."date" < ${to})
            )
            AND ST_Contains(r."polygon", ST_SetSRID(ST_MakePoint(b."longitude", b."latitude"), 4326))
          GROUP BY b.status
        `;
        const map = new Map<string, number>();
        rows.forEach((r) => map.set(r.status, Number(r.cnt)));
        return {
          PENDING: map.get("PENDING") ?? 0,
          CONFIRMED: map.get("CONFIRMED") ?? 0,
          IN_PROGRESS: map.get("IN_PROGRESS") ?? 0,
          COMPLETED: map.get("COMPLETED") ?? 0,
          CANCELLED: map.get("CANCELLED") ?? 0,
        };
      }

      const statuses: Array<"PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"> = [
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ];
      const counts: Record<string, number> = {};
      for (const s of statuses) {
        counts[s] = await ctx.db.booking.count({
          where: {
            customerId,
            status: s,
            OR: [
              { scheduledAt: { not: null, gte: from, lt: to } },
              { scheduledAt: null, date: { gte: from, lt: to } },
            ],
          },
        });
      }
      return counts;
    }),
});