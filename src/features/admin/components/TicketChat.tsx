import { useState, useEffect, useRef } from 'react';
import {
  Stack,
  Paper,
  Group,
  Text,
  Select,
  Textarea,
  Button,
  Loader,
  Center,
  ScrollArea,
  Box,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Ticket, TicketMessage, TicketStatus } from '../types';
import { useAppDispatch } from '../../../hooks';
import { sendTicketMessage, updateTicketStatus } from '../adminSlice';

interface TicketChatProps {
  ticket: Ticket | null;
  messages: TicketMessage[];
  loading: boolean;
}

export default function TicketChat({ ticket, messages, loading }: TicketChatProps) {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Скролл вниз при новых сообщениях
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  if (!ticket) {
    return (
      <Center py="xl" h="100%">
        <Text c="dimmed">Выберите тикет из списка</Text>
      </Center>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    await dispatch(sendTicketMessage({ ticketId: ticket.id, content: message.trim() }));
    setMessage('');
    setSending(false);
  };

  const handleStatusChange = (status: string | null) => {
    if (!status) return;
    dispatch(updateTicketStatus({ ticketId: ticket.id, status: status as TicketStatus }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Stack h="100%" gap={0}>
      {/* Шапка тикета */}
      <Paper withBorder p="sm" radius={0}>
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2}>
            <Text fw={500} lineClamp={1}>
              {ticket.subject}
            </Text>
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {ticket.user_email}
              </Text>
              {ticket.user_telegram && (
                <>
                  <Text size="xs" c="dimmed">
                    •
                  </Text>
                  <Text size="xs" c="blue">
                    @{ticket.user_telegram}
                  </Text>
                </>
              )}
            </Group>
          </Stack>
          <Select
            size="xs"
            w={130}
            data={[
              { value: 'open', label: 'Открыт' },
              { value: 'in_progress', label: 'В работе' },
              { value: 'resolved', label: 'Решён' },
              { value: 'closed', label: 'Закрыт' },
            ]}
            value={ticket.status}
            onChange={handleStatusChange}
          />
        </Group>
      </Paper>

      {/* Сообщения */}
      <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef} p="md">
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : messages.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed">Нет сообщений</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {messages.map((msg) => (
              <Box
                key={msg.id}
                style={{
                  alignSelf: msg.is_admin ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                <Paper
                  p="sm"
                  radius="md"
                  bg={msg.is_admin ? 'blue.1' : 'gray.1'}
                  style={{
                    borderTopRightRadius: msg.is_admin ? 0 : undefined,
                    borderTopLeftRadius: !msg.is_admin ? 0 : undefined,
                  }}
                >
                  <Stack gap={4}>
                    <Group gap="xs" justify={msg.is_admin ? 'flex-end' : 'flex-start'}>
                      <Text size="xs" fw={500} c={msg.is_admin ? 'blue' : 'dark'}>
                        {msg.is_admin ? 'Поддержка' : msg.sender_email}
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
      {ticket.status !== 'closed' && (
        <Paper withBorder p="sm" radius={0}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Напишите ответ..."
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              autosize
              minRows={1}
              maxRows={4}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleSend}
              loading={sending}
              disabled={!message.trim()}
              leftSection={<IconSend size={16} />}
            >
              Отправить
            </Button>
          </Group>
        </Paper>
      )}

      {ticket.status === 'closed' && (
        <Paper withBorder p="sm" radius={0} bg="gray.1">
          <Text size="sm" c="dimmed" ta="center">
            Тикет закрыт
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
