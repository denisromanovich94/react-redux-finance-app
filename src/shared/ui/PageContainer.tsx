import { Container } from '@mantine/core';

type Props = {
  children: React.ReactNode;
  maxWidth?: number;
};

export default function PageContainer({ children, maxWidth = 1200 }: Props) {
  return (
    <Container size={maxWidth} py="md">
      {children}
    </Container>
  );
}
