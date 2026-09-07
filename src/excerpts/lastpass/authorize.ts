// https://github.com/alex-popov-tech/extensions/blob/f12cce693f41e6669f5d6e27a908f3b26ea30bf7/extensions/lastpass/src/cli.ts#L70-L89
const authorizeMacOS = (subcommand: string, password: string): string => {
  const quote = password?.includes('"') ? "'" : '"';
  return `echo ${quote}${password}${quote} | LPASS_DISABLE_PINENTRY=1 lpass ${subcommand}`;
};

const authorizeWindows = (subcommand: string, password: string): string => {
  // PowerShell requires backtick escaping for special characters
  // Escape backticks FIRST (since backtick is the escape character)
  let escapedPassword = password.replace(/`/g, "``");
  // Then escape other special characters: dollar ($), double-quote (")
  escapedPassword = escapedPassword.replace(/[$"]/g, "`$&");

  // Use double quotes with properly escaped password
  return `$env:LPASS_DISABLE_PINENTRY=1; echo "${escapedPassword}" | lpass ${subcommand}`;
};

const authorize = (subcommand: string, opts: { password: string }) => {
  const { password } = opts;
  return isWindows ? authorizeWindows(subcommand, password) : authorizeMacOS(subcommand, password);
};
