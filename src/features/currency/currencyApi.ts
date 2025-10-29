import type { CurrencyData } from './types';

const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CACHE_KEY = 'currency_rates';
const LAST_UPDATE_KEY = 'currency_last_update';
const UPDATE_HOUR_MSK = 9; // 9:00 утра по МСК

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
 * Получить следующее время обновления (сегодня или завтра в 9:00 МСК)
 */
function getNextUpdateTime(): Date {
  const now = new Date();

  // Получаем текущее время в МСК (UTC+3)
  const mskOffset = 3 * 60; // МСК = UTC+3
  const localOffset = now.getTimezoneOffset(); // смещение локального времени от UTC в минутах (отрицательное для восточных часовых поясов)
  const mskTime = new Date(now.getTime() + (mskOffset + localOffset) * 60 * 1000);

  // Устанавливаем время 9:00 МСК для сегодня
  const nextUpdate = new Date(mskTime);
  nextUpdate.setHours(UPDATE_HOUR_MSK, 0, 0, 0);

  // Если 9:00 МСК уже прошло, берем завтрашний день
  if (mskTime >= nextUpdate) {
    nextUpdate.setDate(nextUpdate.getDate() + 1);
  }

  // Конвертируем обратно в локальное время
  return new Date(nextUpdate.getTime() - (mskOffset + localOffset) * 60 * 1000);
}

/**
 * Проверить, нужно ли обновить курсы
 */
function shouldUpdateRates(): boolean {
  try {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    if (!lastUpdate) return true;

    const lastUpdateDate = new Date(lastUpdate);
    const now = new Date();

    // Получаем время последнего обновления в МСК
    const mskOffset = 3 * 60;
    const localOffset = now.getTimezoneOffset();
    const lastUpdateMsk = new Date(lastUpdateDate.getTime() + (mskOffset + localOffset) * 60 * 1000);
    const nowMsk = new Date(now.getTime() + (mskOffset + localOffset) * 60 * 1000);

    // Проверяем, если сегодня уже было обновление после 9:00 МСК
    const todayUpdate = new Date(nowMsk);
    todayUpdate.setHours(UPDATE_HOUR_MSK, 0, 0, 0);

    // Если сейчас время >= 9:00 МСК и последнее обновление было до 9:00 МСК сегодня
    if (nowMsk >= todayUpdate) {
      // Нужно обновить, если последнее обновление было до 9:00 сегодня
      return lastUpdateMsk < todayUpdate;
    }

    // Если сейчас время < 9:00 МСК, проверяем было ли обновление вчера после 9:00
    const yesterdayUpdate = new Date(todayUpdate);
    yesterdayUpdate.setDate(yesterdayUpdate.getDate() - 1);

    return lastUpdateMsk < yesterdayUpdate;
  } catch (error) {
    console.error('Error checking update time:', error);
    return true;
  }
}

/**
 * Получить закэшированные курсы если они не устарели
 */
function getCachedRates(): CurrencyData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    // Проверяем, нужно ли обновить курсы
    if (shouldUpdateRates()) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    const parsedCache: CachedData = JSON.parse(cached);
    return parsedCache.data;
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
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error caching rates:', error);
  }
}

/**
 * Очистить кэш курсов
 */
export function clearRatesCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(LAST_UPDATE_KEY);
}

/**
 * Получить время последнего обновления курсов
 */
export function getLastUpdateTime(): Date | null {
  try {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    return lastUpdate ? new Date(lastUpdate) : null;
  } catch (error) {
    console.error('Error getting last update time:', error);
    return null;
  }
}
