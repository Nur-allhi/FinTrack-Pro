const PERMISSION_KEY = 'notification_permission';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  localStorage.setItem(PERMISSION_KEY, result);
  return result;
}

export function notify(title: string, options?: NotificationOptions): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const defaults: NotificationOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'fintrack-' + Date.now(),
    ...options,
  };

  try {
    new Notification(title, defaults);
  } catch {
    // Fallback for contexts where Notification constructor isn't available
  }
}

export function notifyTransactionAdded(accountName: string, amount: number, currency: string): void {
  notify('Transaction Added', {
    body: `${currency}${Math.abs(amount).toLocaleString()} ${amount >= 0 ? 'credited to' : 'debited from'} ${accountName}`,
  });
}

export function notifyLoanDue(borrowerName: string, amount: number, currency: string): void {
  notify('Loan Due Reminder', {
    body: `${borrowerName} — ${currency}${amount.toLocaleString()} pending`,
  });
}

export function notifyTransfer(from: string, to: string, amount: number, currency: string): void {
  notify('Transfer Complete', {
    body: `${currency}${amount.toLocaleString()} transferred from ${from} to ${to}`,
  });
}
