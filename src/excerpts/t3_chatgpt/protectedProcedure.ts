// https://github.com/alex-popov-tech/t3_chatgpt/blob/b58629283adce50ac4e62c6a5485bbbbefb57f40/src/server/api/trpc.ts#L101-L111
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
