// https://github.com/automician/playright/blob/5ebb3ef94c4e88a8aafe31f83ee3566b6be1fca0/lib/conditions.ts#L66-L88
  const attributeWithValue = (name: string, value: string) =>
    new Condition(`has attribute: ${name}=${value}`,
      async (element: Element) => {
        const attr = await query.attribute(name).call(element);
        if (value !== attr) {
          throw new Error(`actual ${name}="${attr}"`);
        }
      });

  const attributeWithoutValue = (name: string) =>
    new Condition(`has attribute: ${name}`, async (element: Element) => {
      const attr = await query.attribute(name).call(element);
      if (attr === null) {
        throw new Error('actual: absent');
      }
    });

  export const attribute = (name: string, value?: string) => {
    if (value) {
      return attributeWithValue(name, value);
    }
    return attributeWithoutValue(name);
  };
