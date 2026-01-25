import { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Title,
  Paper,
  Group,
  Text,
  Badge,
  Button,
  Modal,
  TextInput,
  Textarea,
  Select,
  Loader,
  Center,
  Grid,
  ScrollArea,
  Box,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSend, IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';
import { useAppDispatch, useAppSelector } from '../hooks';
import PageContainer from '../shared/ui/PageContainer';
import {
  loadMyTickets,
  createTicket,
  loadMessages,
  sendMessage,
  selectTicket,
} from '../features/tickets/ticketsSlice';
import type { TicketStatus, TicketPriority } from '../features/admin/types';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const statusColors: Record<TicketStatus, string> = {
  open: 'blue',
  in_progress: 'yellow',
  resolved: 'green',
  closed: 'gray',
};

const statusLabels: Record<TicketStatus, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
};

export default function Support() {
  const dispatch = useAppDispatch();
  const { tickets, currentMessages, loading, messagesLoading, selectedTicketId } = useAppSelector(
    (s) => s.tickets
  );

  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(loadMyTickets());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTicketId) {
      dispatch(loadMessages(selectedTicketId));
    }
  }, [selectedTicketId, dispatch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [currentMessages]);

  const handleCreate = () => {
    if (!subject.trim() || !content.trim()) return;

    dispatch(
      createTicket({
        subject: subject.trim(),
        content: content.trim(),
        priority,
      })
    );

    setSubject('');
    setContent('');
    setPriority('normal');
    closeCreateModal();
  };

  const handleSelectTicket = (ticketId: string) => {
    dispatch(selectTicket(ticketId));
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicketId) return;

    setSending(true);
    await dispatch(sendMessage({ ticketId: selectedTicketId, content: message.trim() }));
    setMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  return (
    <PageContainer maxWidth={1200}>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Поддержка</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Новое обращение
          </Button>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : tickets.length === 0 ? (
          <Paper withBorder p="xl" radius="md">
            <Stack align="center" gap="md">
              <Text c="dimmed">У вас пока нет обращений</Text>
              <Button onClick={openCreateModal}>Создать обращение</Button>
            </Stack>
          </Paper>
        ) : (
          <Grid gutter="md">
            {/* Список тикетов */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="xs">
                {tickets.map((ticket) => (
                  <Paper
                    key={ticket.id}
                    withBorder
                    p="sm"
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      borderColor:
                        selectedTicketId === ticket.id ? 'var(--mantine-color-blue-5)' : undefined,
                      backgroundColor:
                        selectedTicketId === ticket.id ? 'var(--mantine-color-blue-light)' : undefined,
                    }}
                    onClick={() => handleSelectTicket(ticket.id)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs">
                          <Badge size="xs" color={statusColors[ticket.status]} variant="light">
                            {statusLabels[ticket.status]}
                          </Badge>
                        </Group>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {ticket.subject}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {dayjs(ticket.updated_at).fromNow()}
                        </Text>
                      </Stack>
                      <ActionIcon variant="subtle" color="gray">
                        <IconChevronRight size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Grid.Col>

            {/* Чат */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper withBorder radius="md" h={500} style={{ overflow: 'hidden' }}>
                {!selectedTicket ? (
                  <Center h="100%">
                    <Text c="dimmed">Выберите обращение из списка</Text>
                  </Center>
                ) : (
                  <Stack h="100%" gap={0}>
                    {/* Шапка */}
                    <Paper withBorder p="sm" radius={0}>
                      <Group justify="space-between">
                        <Stack gap={2}>
                          <Text fw={500} lineClamp={1}>
                            {selectedTicket.subject}
                          </Text>
                          <Badge size="xs" color={statusColors[selectedTicket.status]} variant="light">
                            {statusLabels[selectedTicket.status]}
                          </Badge>
                        </Stack>
                      </Group>
                    </Paper>

                    {/* Сообщения */}
                    <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef} p="md">
                      {messagesLoading ? (
                        <Center py="xl">
                          <Loader />
                        </Center>
                      ) : currentMessages.length === 0 ? (
                        <Center py="xl">
                          <Text c="dimmed">Нет сообщений</Text>
                        </Center>
                      ) : (
                        <Stack gap="md">
                          {currentMessages.map((msg) => (
                            <Box
                              key={msg.id}
                              style={{
                                alignSelf: msg.is_admin ? 'flex-start' : 'flex-end',
                                maxWidth: '80%',
                              }}
                            >
                              <Paper
                                p="sm"
                                radius="md"
                                bg={msg.is_admin ? 'gray.1' : 'blue.1'}
                                style={{
                                  borderTopLeftRadius: msg.is_admin ? 0 : undefined,
                                  borderTopRightRadius: !msg.is_admin ? 0 : undefined,
                                }}
                              >
                                <Stack gap={4}>
                                  <Group gap="xs" justify={msg.is_admin ? 'flex-start' : 'flex-end'}>
                                    <Text size="xs" fw={500} c={msg.is_admin ? 'dark' : 'blue'}>
                                      {msg.is_admin ? 'Поддержка' : 'Вы'}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {dayjs(msg.created_at).format('DD.MM HH:mm')}
                                    </Text>
                                  </Group>
                                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                  </Text>
                                </Stack>
                              </Paper>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </ScrollArea>

                    {/* Поле ввода */}
                    {selectedTicket.status !== 'closed' && (
                      <Paper withBorder p="sm" radius={0}>
                        <Group gap="sm" align="flex-end">
                          <Textarea
                            placeholder="Напишите сообщение..."
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            autosize
                            minRows={1}
                            maxRows={4}
                            style={{ flex: 1 }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            loading={sending}
                            disabled={!message.trim()}
                            leftSection={<IconSend size={16} />}
                          >
                            Отправить
                          </Button>
                        </Group>
                      </Paper>
                    )}

                    {selectedTicket.status === 'closed' && (
                      <Paper withBorder p="sm" radius={0} bg="gray.1">
                        <Text size="sm" c="dimmed" ta="center">
                          Обращение закрыто
                        </Text>
                      </Paper>
                    )}
                  </Stack>
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        )}
      </Stack>

      {/* Модалка создания тикета */}
      <Modal opened={createModalOpened} onClose={closeCreateModal} title="Новое обращение" styles={{ inner: { right: 0, left: 0 } }}>
        <Stack>
          <TextInput
            label="Тема"
            placeholder="Кратко опишите проблему"
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
            required
          />
          <Textarea
            label="Описание"
            placeholder="Подробно опишите вашу проблему или вопрос..."
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            minRows={4}
            required
          />
          <Select
            label="Приоритет"
            data={[
              { value: 'low', label: 'Низкий' },
              { value: 'normal', label: 'Обычный' },
              { value: 'high', label: 'Высокий' },
              { value: 'urgent', label: 'Срочный' },
            ]}
            value={priority}
            onChange={(v) => setPriority((v as TicketPriority) || 'normal')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeCreateModal}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={!subject.trim() || !content.trim()}>
              Создать
            </Button>
          </Group>
        </Stack>
      </Modal>
    </PageContainer>
  );
}
