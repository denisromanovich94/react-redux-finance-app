import { Title, Tabs } from '@mantine/core';
import { IconUser, IconPalette } from '@tabler/icons-react';
import PageContainer from '../shared/ui/PageContainer';
import { ProfileSection } from '../features/settings/ui/ProfileSection';
import { AppearanceSection } from '../features/settings/ui/AppearanceSection';

export default function Settings() {
  return (
    <PageContainer maxWidth={1200}>
      <Title order={2} mb="xl">Настройки</Title>

      <Tabs defaultValue="appearance" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
            Внешний вид
          </Tabs.Tab>
          <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
            Профиль
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="appearance" pt="xl">
          <AppearanceSection />
        </Tabs.Panel>

        <Tabs.Panel value="profile" pt="xl">
          <ProfileSection />
        </Tabs.Panel>
      </Tabs>
    </PageContainer>
  );
}
