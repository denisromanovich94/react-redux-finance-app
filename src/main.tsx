import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, ColorSchemeScript, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { store } from './app/store';
import App from './App';
import { TelegramThemeProvider } from './shared/telegram/TelegramThemeProvider';
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/ru';

dayjs.extend(customParseFormat);
dayjs.locale('ru');



const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
        <TelegramThemeProvider>
          <Notifications />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TelegramThemeProvider>
      </MantineProvider>
    </Provider>
  </React.StrictMode>
);