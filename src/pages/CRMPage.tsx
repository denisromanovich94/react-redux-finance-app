import { useEffect, useState, useMemo } from 'react';
import { Title, Button, Group, Stack, SegmentedControl, TextInput, Grid, SimpleGrid } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import PageContainer from '../shared/ui/PageContainer';
import StatCard from '../shared/ui/StatCard';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  loadLeads,
  loadStats,
  createLeadAsync,
  updateLeadAsync,
  deleteLeadAsync,
  setStatusFilter,
  setSearchFilter,
} from '../features/crm/crmSlice';
import LeadCard from '../features/crm/ui/LeadCard';
import LeadModal from '../features/crm/ui/LeadModal';
import type { Lead, LeadStatus, CreateLeadInput, UpdateLeadInput } from '../features/crm/types';
import { formatCurrencyAmount } from '../features/currency/utils';

export default function CRMPage() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((s) => s.crm.leads);
  const stats = useAppSelector((s) => s.crm.stats);
  const filters = useAppSelector((s) => s.crm.filters);
  const loading = useAppSelector((s) => s.crm.loading);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    dispatch(loadLeads());
    dispatch(loadStats());
  }, [dispatch]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
        return false;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          lead.name.toLowerCase().includes(search) ||
          lead.company?.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [leads, filters]);

  const handleCreateLead = (data: CreateLeadInput) => {
    dispatch(createLeadAsync(data));
  };

  const handleUpdateLead = (data: CreateLeadInput) => {
    if (editingLead) {
      dispatch(updateLeadAsync({ id: editingLead.id, updates: data }));
      setEditingLead(null);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    openModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить лид?')) {
      dispatch(deleteLeadAsync(id));
    }
  };

  const handleModalClose = () => {
    setEditingLead(null);
    closeModal();
  };

  const handleStatusChange = (id: string, newStatus: LeadStatus, rejectionReason?: string) => {
    const updates: UpdateLeadInput = { status: newStatus };
    if (rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }
    dispatch(updateLeadAsync({ id, updates }));
  };

  return (
    <PageContainer maxWidth={1400}>
      <Group justify="space-between" mb="lg">
        <Title order={2}>CRM</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
          Создать лид
        </Button>
      </Group>

      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
          <StatCard
            label="Всего лидов"
            value={stats.totalLeads.toString()}
            color="blue"
          />
          <StatCard
            label="Новые лиды"
            value={stats.newLeads.toString()}
            color="cyan"
          />
          <StatCard
            label="Выигранные сделки"
            value={stats.wonDeals.toString()}
            color="green"
          />
          <StatCard
            label="Общая выручка"
            value={formatCurrencyAmount(stats.totalValue, 'RUB')}
            color="teal"
          />
        </SimpleGrid>
      )}

      <Stack gap="md" mb="lg">
        <TextInput
          placeholder="Поиск лидов..."
          leftSection={<IconSearch size={16} />}
          value={filters.search}
          onChange={(e) => dispatch(setSearchFilter(e.currentTarget.value))}
        />

        <SegmentedControl
          value={filters.status.length === 1 ? filters.status[0] : 'all'}
          onChange={(value) => {
            if (value === 'all') {
              dispatch(setStatusFilter([]));
            } else {
              dispatch(setStatusFilter([value as LeadStatus]));
            }
          }}
          data={[
            { label: 'Все', value: 'all' },
            { label: 'Новые', value: 'new' },
            { label: 'Связались', value: 'contacted' },
            { label: 'Переговоры', value: 'negotiation' },
            { label: 'Сделки', value: 'won' },
            { label: 'Отказы', value: 'lost' },
          ]}
        />
      </Stack>

      {loading && <Title order={4}>Загрузка...</Title>}

      <Grid>
        {filteredLeads.map((lead) => (
          <Grid.Col key={lead.id} span={{ base: 12, sm: 6, md: 4 }} style={{ display: 'flex' }}>
            <LeadCard
              lead={lead}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </Grid.Col>
        ))}
      </Grid>

      {!loading && filteredLeads.length === 0 && (
        <Title order={4} c="dimmed" ta="center" mt="xl">
          Нет лидов
        </Title>
      )}

      <LeadModal
        opened={modalOpened}
        onClose={handleModalClose}
        onSubmit={editingLead ? handleUpdateLead : handleCreateLead}
        lead={editingLead}
      />
    </PageContainer>
  );
}
