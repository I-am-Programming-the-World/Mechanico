import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.count();
    const providers = await ctx.db.user.count({ where: { role: "PROVIDER" } });
    const customers = await ctx.db.user.count({ where: { role: "CUSTOMER" } });
    const bookings = await ctx.db.booking.count();
    return { users, providers, customers, bookings };
  }),

  getApprovalQueue: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      where: { role: "PROVIDER", isApproved: false },
      include: { profile: true },
    });
  }),

  approveProvider: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isApproved: true },
      });
    }),
});