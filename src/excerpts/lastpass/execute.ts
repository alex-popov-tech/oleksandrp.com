// https://github.com/alex-popov-tech/extensions/blob/f12cce693f41e6669f5d6e27a908f3b26ea30bf7/extensions/lastpass/src/cli.ts#L43-L67
const execute = async (command: string) => {
  const wrappedCommand = isWindows ? buildWindowsCommand(command) : buildMacOSCommand(command);

  console.log(`Executing: ${wrappedCommand}`);
  const startTimestamp = Date.now();

  return new Promise<string>((res, rej) =>
    exec(
      wrappedCommand,
      { maxBuffer: 4 * 1024 * 1024 }, // 4 times bigger stdout buffer size for large sets of credentials
      (error: ExecException | null, stdout: string, stderr: string) => {
        const tookSeconds = (Date.now() - startTimestamp) / 1000;
        if (error) {
          console.error(`[${tookSeconds}s] Failed:\n${stderr}`);
          rej({
            ...error,
            message: error.message,
          });
        }
        console.log(`[${tookSeconds}s] Success:\n${stdout}`);
        res(stdout.trim());
      }
    )
  );
};
