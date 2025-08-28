import { useForm } from '@mantine/form';
import dayjs from 'dayjs';

export type TxFormValues = {
  date: Date | null;
  category: string;
  amount: number;
  comment: string;
};

export function toTxPayload(values: TxFormValues) {
  return {
    date: dayjs(values.date!).format('DD.MM.YYYY'),
    category: values.category,
    amount: Number(values.amount),
    comment: values.comment.trim() ? values.comment.trim() : null,
  };
}

export function useTransactionForm() {
  const form = useForm<TxFormValues>({
    initialValues: {
      date: null,
      category: '',
      amount: 0,
      comment: '',
    },
    validate: {
      date: (v) => (v ? null : 'Выберите дату'),
      category: (v) => (v ? null : 'Выберите категорию'),
      amount: (v) => (Number(v) !== 0 ? null : 'Сумма не должна быть равна 0'),
      // comment необязателен
    },
  });

  function setFromTransaction(tx: { date: string; category: string; amount: number; comment?: string | null }) {
    form.setValues({
      date: dayjs(tx.date, 'DD.MM.YYYY').toDate(),
      category: tx.category,
      amount: tx.amount,
      comment: tx.comment ?? '',
    });
  }

  return { form, setFromTransaction };
}
