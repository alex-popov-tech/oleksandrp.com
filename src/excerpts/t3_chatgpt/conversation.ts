// https://github.com/alex-popov-tech/t3_chatgpt/blob/b58629283adce50ac4e62c6a5485bbbbefb57f40/src/server/api/routers/conversation.ts#L24-L46
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const convId = input.id;
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: convId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (conversation?.createdById !== userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "That is not your conversation",
        });
      }

      return conversation;
    }),
