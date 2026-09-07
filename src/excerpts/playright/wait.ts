// https://github.com/automician/playright/blob/5ebb3ef94c4e88a8aafe31f83ee3566b6be1fca0/lib/wait.ts#L59-L90
  async for<R>(callable: Callable<T, R>): Promise<R> {
    const finishTime = new Date().getTime() + this.timeout;
    // make assertions stack point to failed client code, omit playright path
    const syncStack = new Error().stack
      .split('\n')
      .slice(3)
      .join('\n');

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        /* eslint-disable no-await-in-loop */
        const entity = await callable.call(this.entity);
        return entity;
      } catch (reason) {
        if (new Date().getTime() > finishTime) {
          const error = new TimeoutError(
            '\n'
              + `Timed out after ${this.timeout}ms, while waiting for:\n`
              + `${this.entity}.${callable}\n`
              + '\n'
              + `Reason: ${reason.message}\n`,
          );
          error.stack = syncStack;

          const handledError = await this.handleFailure(error);
          throw handledError;
          /* eslint-enable no-await-in-loop */
        }
      }
    }
  }
