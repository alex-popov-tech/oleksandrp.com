// https://github.com/alex-popov-tech/go_pay_taxes_web/blob/3091d27ebd008f658c7609aa86f1224447de1b67/src/utils.ts#L17-L37
  const incomes = lines.map((line) => {
    // "03.01.2023 17:08:27" => 03.01.2023
    const date = toDate(line.split(",")[0].replaceAll('"', "").split(" ")[0]);

    // cut values around currency to avoid messing with characters in 'name'
    // 3900.41,1000.0,EUR,39.0041
    const matches = line.match(/[\d.]+,[\d.]+,[A-Z]{3},[\d.]+/g);

    const [uah, amount, currency, rate] = (matches![0] || "").split(",");
    const tax = taxFor(Number(uah));
    return {
      date,
      uah: Number(uah),
      amount: Number(amount),
      currency,
      rate: Number(rate),
      tax,
    };
  });
  return incomes;
};
