const KEY = 'finance-app-state';

export type PersistedState = {
  transactions?: { items: Array<{ id: string; date: string; category: string; amount: number }> };
};

export function loadState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return undefined;
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    throw new Error('Не удалось сохранить состояние в localStorage: ');
  }
}