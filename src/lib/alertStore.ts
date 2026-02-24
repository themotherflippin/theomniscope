import type { Alert } from './types';

let alertId = 0;

export function createAlertStore() {
  let alerts: Alert[] = [];
  let listeners: (() => void)[] = [];

  function notify() {
    listeners.forEach(fn => fn());
  }

  return {
    getAlerts: () => alerts,
    addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
      alerts = [{
        ...alert,
        id: `alert-${++alertId}`,
        timestamp: Date.now(),
        read: false,
      }, ...alerts].slice(0, 50);
      notify();
    },
    markRead: (id: string) => {
      alerts = alerts.map(a => a.id === id ? { ...a, read: true } : a);
      notify();
    },
    markAllRead: () => {
      alerts = alerts.map(a => ({ ...a, read: true }));
      notify();
    },
    subscribe: (fn: () => void) => {
      listeners.push(fn);
      return () => { listeners = listeners.filter(l => l !== fn); };
    },
    unreadCount: () => alerts.filter(a => !a.read).length,
  };
}

export const alertStore = createAlertStore();
