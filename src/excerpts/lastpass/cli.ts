// https://github.com/alex-popov-tech/extensions/blob/f12cce693f41e6669f5d6e27a908f3b26ea30bf7/extensions/lastpass/src/cli.ts#L19-L36
const serializeFromJson = (jsonArray: string): Account[] => {
  const array: { last_modified_gmt: string; last_touch: string }[] = JSON.parse(jsonArray);
  const res = array.map(
    (obj) =>
      ({
        ...obj,
        lastModified: new Date(parseInt(obj.last_modified_gmt, 10) * 1000),
        lastTouch: new Date(parseInt(obj.last_touch, 10) * 1000),
      } as unknown as Account)
  );
  return res;
};

// Platform-specific command builders
const buildMacOSCommand = (command: string): string => {
  const PATH = "/usr/gnu/bin:/usr/local/bin:/bin:/usr/bin:.:/opt/homebrew/bin";
  return `zsh -l -c 'export PATH="$PATH:${PATH}" && ${command}'`;
};
