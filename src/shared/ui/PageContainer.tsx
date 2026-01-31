import { Container } from '@mantine/core';

type Props = {
  children: React.ReactNode;
  maxWidth?: number;
};

export default function PageContainer({ children, maxWidth = 1200 }: Props) {
  return (
    <Container style={{ maxWidth }} py={{ base: 0, sm: 'md' }} px={{ base: 0, sm: 'md' }}>
      {children}
    </Container>
  );
}
