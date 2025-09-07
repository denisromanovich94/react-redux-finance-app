import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import type { Transaction } from './transactionsApi';

export type TxFormValues = {
  date: Date | null;
  category: string;
  amount: number;
  hours: number;
  comment: string;
};

export function toTxPayload(values: TxFormValues): Omit<Transaction, 'id' | 'user_id' | 'created_at'> {
  if (!values.date) {
    throw new Error('Дата обязательна');
  }

  const payload: Omit<Transaction, 'id' | 'user_id' | 'created_at'> = {
    date: dayjs(values.date).format('DD.MM.YYYY'),
    category: values.category,
    amount: Number(values.amount),
    comment: values.comment.trim() ? values.comment.trim() : null,
  };

  if (values.hours && values.hours > 0) {
    payload.hours = Number(values.hours);
  }

  return payload;
}

export function useTransactionForm() {
  const form = useForm<TxFormValues>({
    initialValues: {
      date: null,
      category: '',
      amount: 0,
      hours: 0,
      comment: '',
    },
    validate: {
      date: (v) => (v ? null : 'Выберите дату'),
      category: (v) => (v ? null : 'Выберите категорию'),
      amount: (v) => (Number(v) !== 0 ? null : 'Сумма не должна быть равна 0'),
    },
  });

  function setFromTransaction(tx: { date: string; category: string; amount: number; hours?: number; comment?: string | null }) {
    form.setValues({
      date: dayjs(tx.date, 'DD.MM.YYYY').toDate(),
      category: tx.category,
      amount: tx.amount,
      hours: tx.hours ?? 0,
      comment: tx.comment ?? '',
    });
  }

  return { form, setFromTransaction };
}
