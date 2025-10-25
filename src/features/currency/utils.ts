import type { CurrencyCode, CurrencyData } from './types';

/**
 * Конвертировать сумму из одной валюты в другую
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: CurrencyData | null
): number {
  // Если валюты одинаковые, возвращаем исходную сумму
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Если нет данных о курсах, возвращаем исходную сумму
  if (!rates) {
    return amount;
  }

  // Рубль - базовая валюта
  if (fromCurrency === 'RUB') {
    const rate = rates.Valute[toCurrency];
    if (!rate) return amount;
    return amount / rate.Value;
  }

  if (toCurrency === 'RUB') {
    const rate = rates.Valute[fromCurrency];
    if (!rate) return amount;
    return amount * rate.Value;
  }

  // Конвертация через рубли (from -> RUB -> to)
  const fromRate = rates.Valute[fromCurrency];
  const toRate = rates.Valute[toCurrency];

  if (!fromRate || !toRate) return amount;

  const inRubles = amount * fromRate.Value;
  return inRubles / toRate.Value;
}

/**
 * Форматировать сумму с учетом валюты
 */
export function formatCurrencyAmount(
  amount: number,
  currency: CurrencyCode,
  short: boolean = false
): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const symbols: Record<CurrencyCode, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };

  const symbol = symbols[currency] || currency;

  if (short) {
    return `${formatted} ${symbol}`;
  }

  return `${formatted} ${symbol}`;
}

/**
 * Получить символ валюты
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };
  return symbols[currency] || currency;
}

/**
 * Получить название валюты
 */
export function getCurrencyName(currency: CurrencyCode): string {
  const names: Record<CurrencyCode, string> = {
    RUB: 'Рубль',
    USD: 'Доллар',
    EUR: 'Евро',
  };
  return names[currency] || currency;
}
