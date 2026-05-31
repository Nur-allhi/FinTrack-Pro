const PERMISSION_KEY = 'notification_permission';
const PUSH_SUB_KEY = 'push_subscription';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'PushManager' in window && 'serviceWorker' in navigator;
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

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const permission = await requestPermission();
    if (permission !== 'granted') return null;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return null;
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    localStorage.setItem(PUSH_SUB_KEY, JSON.stringify(sub));
    return sub;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;
    await sub.unsubscribe();
    localStorage.removeItem(PUSH_SUB_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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
