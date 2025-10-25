import type { CurrencyData } from './types';

const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CACHE_KEY = 'currency_rates';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

interface CachedData {
  data: CurrencyData;
  timestamp: number;
}

/**
 * Получить курсы валют с ЦБ РФ
 * Использует кэш для минимизации запросов
 */
export async function fetchExchangeRates(): Promise<CurrencyData> {
  // Проверяем кэш
  const cached = getCachedRates();
  if (cached) {
    return cached;
  }

  // Загружаем свежие данные
  const response = await fetch(CBR_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.statusText}`);
  }

  const data: CurrencyData = await response.json();

  // Сохраняем в кэш
  setCachedRates(data);

  return data;
}

/**
 * Получить закэшированные курсы если они не устарели
 */
function getCachedRates(): CurrencyData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedData = JSON.parse(cached);
    const now = Date.now();

    // Проверяем свежесть кэша
    if (now - parsedCache.timestamp < CACHE_DURATION) {
      return parsedCache.data;
    }

    // Кэш устарел
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cached rates:', error);
    return null;
  }
}

/**
 * Сохранить курсы в кэш
 */
function setCachedRates(data: CurrencyData): void {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching rates:', error);
  }
}

/**
 * Очистить кэш курсов
 */
export function clearRatesCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
