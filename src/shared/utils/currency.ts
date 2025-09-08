export function formatRub(amount: number, withPlus = true): string {
  const sign = amount < 0 ? '-' : withPlus ? '+' : '';
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${formatted}`;
}
