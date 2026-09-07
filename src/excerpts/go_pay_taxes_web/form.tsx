// https://github.com/alex-popov-tech/go_pay_taxes_web/blob/3091d27ebd008f658c7609aa86f1224447de1b67/src/AddIncomeForm.tsx#L17-L43
const Button = ({
  klass,
  children,
  ...rest
}: {
  klass: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...rest} className={`${klass} p-1 text-lg rounded-md`}>
    {children}
  </button>
);

const Input = ({
  isError,
  ...rest
}: {
  isError: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  const color = isError ? "#FF3419" : "#888888";
  return (
    <input
      {...rest}
      className={`p-1 border-solid border-2 rounded-md border-[${color}]`}
    />
  );
};
