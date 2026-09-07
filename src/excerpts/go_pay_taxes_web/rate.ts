// https://github.com/alex-popov-tech/go_pay_taxes_web/blob/3091d27ebd008f658c7609aa86f1224447de1b67/src/utils.ts#L100-L125
// [ { r030: 978, txt: "Євро", rate: 32.9039, cc: "EUR", exchangedate: "23.02.2022" } ];
export const getRate = (currency: string, date: Date): Promise<Rate> =>
  fetch(
    `https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${currency}&date=${format(
      date,
      "yyyyMMdd",
    )}&json`,
  )
    .then((it) => it.json())
    .then((rates) => rates[0]);

const PERCENT_TAX = 5;

export const taxFor = (sum: number) => Number((PERCENT_TAX * sum) / 100);

export const sumOf = (incomes: Income[], mapper: (it: Income) => number) =>
  Number(incomes.map(mapper).reduce((acc, it) => acc + it, 0));

export const prettyPrint = (num: number): string => {
  const rounded = Number(num.toFixed(2));
  const formattedNum = rounded.toLocaleString("en").replace(/,/g, " ");
  const decimalPart = formattedNum.split(".")[1];
  return decimalPart && decimalPart.length === 1
    ? formattedNum + "0"
    : formattedNum;
};
