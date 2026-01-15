export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'UAH';

export interface ExchangeRate {
  CharCode: string;
  NumCode: string;
  Nominal: number;
  Name: string;
  Value: number;
  Previous: number;
}

export interface CurrencyData {
  Date: string;
  PreviousDate: string;
  PreviousURL: string;
  Timestamp: string;
  Valute: {
    [key: string]: ExchangeRate;
  };
}

export interface CurrencyState {
  displayCurrency: CurrencyCode;
  rates: CurrencyData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}
