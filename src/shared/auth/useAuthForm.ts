import { useForm } from '@mantine/form';

type AuthValues = { email: string; password: string };

export function useAuthForm() {
  return useForm<AuthValues>({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Введите корректный email'),
      password: (v) => (v.length >= 6 ? null : 'Минимум 6 символов'),
    },
  });
}