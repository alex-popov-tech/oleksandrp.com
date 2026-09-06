// https://github.com/automician/playright/blob/5ebb3ef94c4e88a8aafe31f83ee3566b6be1fca0/lib/conditions.ts#L34-L57
  export const visible =
    Condition.failIfNot('is visible', async (element: Element) => {
      const handle = await element.handle();
      const box = await handle.boundingBox();
      return box !== null;
    });

  export const text = (expected: string | number | RegExp) =>
    Condition.failIfNotActual(
      `has text: ${expected}`,
      query.text,
      typeof expected === 'string'
        ? predicate.includes(expected)
        : predicate.matches(expected),
    );

  export const exactText = (expected: string | number | RegExp) =>
    Condition.failIfNotActual(
      `has exact text: ${expected}`,
      query.text,
      typeof expected === 'string'
        ? predicate.equals(expected)
        : predicate.matches(expected),
    );
