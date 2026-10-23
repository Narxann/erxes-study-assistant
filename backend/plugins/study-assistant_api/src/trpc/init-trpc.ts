import { initTRPC } from '@trpc/server';
import { z } from 'zod';

import { ITRPCContext } from 'erxes-api-shared/utils';
import { checkSolution } from './check-solution';

const t = initTRPC.context<ITRPCContext>().create();

export const appRouter = t.router({
  'study-assistant': t.router({
    hello: t.procedure.query(() => {
      return 'Hello study-assistant';
    }),

    checkSolution: t.procedure
      .input(
        z.object({
          problem: z.string().min(1),
          steps: z.array(z.string()).min(1),
        }),
      )
      .mutation(({ input }) => {
        return checkSolution(input.problem, input.steps);
      }),
  }),
});

export type AppRouter = typeof appRouter;
