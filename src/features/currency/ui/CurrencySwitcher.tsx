import { SegmentedControl } from '@mantine/core';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { setDisplayCurrency } from '../currencySlice';
import type { CurrencyCode } from '../types';

export default function CurrencySwitcher() {
  const dispatch = useAppDispatch();
  const displayCurrency = useAppSelector((state) => state.currency.displayCurrency);

  const handleChange = (value: string) => {
    dispatch(setDisplayCurrency(value as CurrencyCode));
  };

  return (
    <SegmentedControl
      value={displayCurrency}
      onChange={handleChange}
      data={[
        { label: '₽ RUB', value: 'RUB' },
        { label: '$ USD', value: 'USD' },
        { label: '€ EUR', value: 'EUR' },
      ]}
      size="xs"
    />
  );
}
