/**
 * alertStore.js
 * Simple shared in-memory alert store — no AWS, no external deps.
 * Location: app/screens/alertStore.js
 *
 * Dashboard writes alerts here when thresholds are breached.
 * Alerts screen reads from here.
 */

let _alerts = [];
let _listeners = [];

export function getAlerts() {
  return _alerts;
}

export function addAlert(alert) {
  // Avoid duplicate active alerts for the same sensor
  const exists = _alerts.find(
    (a) => a.sensorKey === alert.sensorKey && !a.read
  );
  if (exists) return;

  const newAlert = {
    id:        Date.now().toString(),
    read:      false,
    time:      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...alert,
  };
  _alerts = [newAlert, ..._alerts].slice(0, 50); // keep last 50
  _listeners.forEach((fn) => fn(_alerts));
}

export function markRead(id) {
  _alerts = _alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
  _listeners.forEach((fn) => fn(_alerts));
}

export function markAllRead() {
  _alerts = _alerts.map((a) => ({ ...a, read: true }));
  _listeners.forEach((fn) => fn(_alerts));
}

export function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}