import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const serviceRouter = createTRPCRouter({
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.serviceCategory.findMany({
      include: {
        services: {
          select: { id: true, name: true, basePrice: true, description: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }),
});