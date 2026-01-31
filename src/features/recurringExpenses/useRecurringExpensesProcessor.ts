import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  loadRecurringExpenses,
  loadRecurringExpenseTypes,
  processRecurringExpensesAsync,
  selectPendingExpenses,
  selectProcessingStatus,
  resetProcessingStatus,
} from './recurringExpensesSlice';
import { loadTransactions } from '../transactions/transactionsSlice';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../shared/auth/AuthContext';

/**
 * Хук для автоматической обработки регулярных расходов при загрузке приложения.
 * Использовать в App.tsx или Layout компоненте.
 */
export function useRecurringExpensesProcessor() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const pendingExpenses = useAppSelector(selectPendingExpenses);
  const processingStatus = useAppSelector(selectProcessingStatus);
  const hasProcessedRef = useRef(false);
  const isLoadedRef = useRef(false);

  // Загружаем данные при авторизации
  useEffect(() => {
    if (user && !isLoadedRef.current) {
      isLoadedRef.current = true;
      dispatch(loadRecurringExpenses());
      dispatch(loadRecurringExpenseTypes());
    }
  }, [user, dispatch]);

  // Сбрасываем флаги при выходе
  useEffect(() => {
    if (!user) {
      hasProcessedRef.current = false;
      isLoadedRef.current = false;
    }
  }, [user]);

  // Автоматически обрабатываем расходы, если есть ожидающие
  useEffect(() => {
    if (
      pendingExpenses.length > 0 &&
      processingStatus === 'idle' &&
      !hasProcessedRef.current &&
      user
    ) {
      hasProcessedRef.current = true;

      dispatch(processRecurringExpensesAsync())
        .unwrap()
        .then(({ created }) => {
          if (created > 0) {
            notifications.show({
              title: 'Регулярные расходы',
              message: `Автоматически создано ${created} ${getTransactionWord(created)}`,
              color: 'blue',
              autoClose: 5000,
            });
            // Перезагружаем транзакции
            dispatch(loadTransactions());
          }
          // Сбрасываем статус после успешной обработки
          setTimeout(() => {
            dispatch(resetProcessingStatus());
          }, 1000);
        })
        .catch(() => {
          notifications.show({
            title: 'Ошибка',
            message: 'Не удалось обработать регулярные расходы',
            color: 'red',
          });
          dispatch(resetProcessingStatus());
        });
    }
  }, [pendingExpenses.length, processingStatus, dispatch, user]);
}

// Склонение слова "транзакция"
function getTransactionWord(count: number): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'транзакций';
  }
  if (lastDigit === 1) {
    return 'транзакция';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'транзакции';
  }
  return 'транзакций';
}
