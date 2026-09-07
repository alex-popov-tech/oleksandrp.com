// https://github.com/automician/playright/blob/5ebb3ef94c4e88a8aafe31f83ee3566b6be1fca0/lib/queries.ts#L49-L59
  export const text: Callable<Element, string> = {
    toString: () => 'text',
    call: element => element.handle().then(its => its.innerText()),
  };

  export function attribute(name: string): Callable<Element, string> {
    return {
      toString: () => `attribute ${name}`,
      call: element => element.handle().then(its => its.getAttribute(name)),
    };
  }
