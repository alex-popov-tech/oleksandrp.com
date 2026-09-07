// https://github.com/alex-popov-tech/go_pay_taxes_web/blob/3091d27ebd008f658c7609aa86f1224447de1b67/src/utils.ts#L79-L98
// '10.04.2023' => Date
export const toDate = (date: string) => {
  const [day, month, year] = date.split(".").map(Number);
  return new Date(year, month - 1, day);
};

export const validate = (args: { date: Date; amount: number }) =>
  z
    .object({
      date: z.date().refine((value) => value.getTime() < Date.now()),
      amount: z.number().positive(),
    })
    .parseAsync(args)
    .catch(
      (error) =>
        error.issues.map((it: { path: string[] }) => it.path[0]) as Promise<
          string[]
        >,
    )
    .then(() => []);
