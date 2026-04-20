/**
 * AlertsScreen.tsx
 * Alerts & Notifications page for Mushroom Farm app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebaseConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertCategory = 'All' | 'Environmental' | 'AI Detection' | 'System';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  title: string;
  description: string;
  category: Exclude<AlertCategory, 'All'>;
  severity: AlertSeverity;
  time: string;
  read: boolean;
}

// ─── Mock data (replace with Firebase data when ESP32 is sending) ─────────────

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    title: 'Disease Detected',
    description: 'AI camera detected possible infection in growing area. Confidence: 87.3%',
    category: 'AI Detection',
    severity: 'critical',
    time: '2h ago',
    read: false,
  },
  {
    id: '2',
    title: 'High Temperature',
    description: 'Temperature exceeded threshold: 26°C (Max: 25°C)',
    category: 'Environmental',
    severity: 'warning',
    time: '5h ago',
    read: false,
  },
  {
    id: '3',
    title: 'Low Humidity',
    description: 'Humidity dropped to 75% (Min: 80%). Humidifier activated.',
    category: 'Environmental',
    severity: 'warning',
    time: '8h ago',
    read: true,
  },
  {
    id: '4',
    title: 'Water Pump Activated',
    description: 'Scheduled watering cycle completed successfully.',
    category: 'System',
    severity: 'info',
    time: '12h ago',
    read: true,
  },
  {
    id: '5',
    title: 'CO₂ Level High',
    description: 'CO₂ concentration: 850 ppm (Max: 800 ppm). Ventilation increased.',
    category: 'Environmental',
    severity: 'warning',
    time: '1d ago',
    read: true,
  },
];

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    borderColor: '#ef4444',
    iconBg: '#fef2f2',
    iconColor: '#ef4444',
    icon: '⊗',
  },
  warning: {
    borderColor: '#f59e0b',
    iconBg: '#fffbeb',
    iconColor: '#f59e0b',
    icon: '⚠',
  },
  info: {
    borderColor: '#e5e7eb',
    iconBg: '#f0fdf4',
    iconColor: '#22c55e',
    icon: '✓',
  },
};

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onMarkRead,
}: {
  alert: Alert;
  onMarkRead: (id: string) => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity];
  const isUnread = !alert.read;

  return (
    <View
      style={[
        styles.alertCard,
        { borderColor: isUnread ? config.borderColor : '#e5e7eb' },
        isUnread && { borderWidth: 1.5 },
      ]}
    >
      {/* Header row */}
      <View style={styles.alertHeader}>
        <View style={styles.alertLeft}>
          <View style={[styles.alertIcon, { backgroundColor: config.iconBg }]}>
            <Text style={{ color: config.iconColor, fontSize: 14 }}>
              {config.icon}
            </Text>
          </View>
          <Text style={[styles.alertTitle, isUnread && styles.alertTitleBold]}>
            {alert.title}
          </Text>
        </View>
        <Text style={styles.alertTime}>{alert.time}</Text>
      </View>

      {/* Description */}
      <Text style={styles.alertDesc}>{alert.description}</Text>

      {/* Footer row */}
      <View style={styles.alertFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{alert.category}</Text>
        </View>
        {isUnread && (
          <TouchableOpacity onPress={() => onMarkRead(alert.id)}>
            <Text style={styles.markReadText}>Mark as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [activeFilter, setActiveFilter] = useState<AlertCategory>('All');
  const [pushEnabled, setPushEnabled] = useState(true);

  // Subscribe to Firebase alerts
  useEffect(() => {
    const alertsRef = ref(db, 'mushroom_farm/house_1/alerts');
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed: Alert[] = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
        }));
        setAlerts(parsed.sort((a, b) => (a.read ? 1 : -1)));
      }
    });
    return () => unsubscribe();
  }, []);

  // Mark alert as read
  const handleMarkRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    // Update Firebase
    update(ref(db, `mushroom_farm/house_1/alerts/${id}`), { read: true });
  };

  // Filter alerts
  const filtered =
    activeFilter === 'All'
      ? alerts
      : alerts.filter((a) => a.category === activeFilter);

  // Summary counts
  const unreadCount   = alerts.filter((a) => !a.read).length;
  const warningCount  = alerts.filter((a) => a.severity === 'warning').length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;

  const filters: AlertCategory[] = ['All', 'Environmental', 'AI Detection', 'System'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Alerts & Notifications</Text>
          <Text style={styles.subtitle}>System monitoring</Text>
        </View>

        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{unreadCount}</Text>
            <Text style={styles.summaryLabel}>Unread</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryWarning]}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{warningCount}</Text>
            <Text style={styles.summaryLabel}>Warnings</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCritical]}>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{criticalCount}</Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </View>
        </View>

        {/* ── Push notifications toggle ── */}
        <View style={styles.card}>
          <View style={styles.pushRow}>
            <View style={styles.pushLeft}>
              <Text style={styles.pushIcon}>🔔</Text>
              <Text style={styles.pushLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#e5e7eb', true: '#1a1a1a' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── Filter tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                activeFilter === f && styles.filterBtnActive,
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  activeFilter === f && styles.filterBtnTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Alert list ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No alerts in this category</Text>
          </View>
        ) : (
          filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={handleMarkRead}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f6f6' },
  scroll:   { padding: 16, paddingBottom: 40 },

  header:   { marginBottom: 14 },
  title:    { fontSize: 22, fontWeight: '600', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 2 },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ebebeb',
    padding: 14,
    alignItems: 'center',
  },
  summaryWarning:  { borderColor: '#f59e0b' },
  summaryCritical: { borderColor: '#ef4444' },
  summaryValue:    { fontSize: 24, fontWeight: '600', color: '#1a1a1a' },
  summaryLabel:    { fontSize: 12, color: '#999', marginTop: 2 },

  // Push notifications
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    padding: 14,
    marginBottom: 10,
  },
  pushRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pushLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pushIcon:  { fontSize: 18 },
  pushLabel: { fontSize: 15, fontWeight: '500', color: '#1a1a1a' },

  // Filters
  filterScroll: { marginBottom: 12 },
  filterRow:    { flexDirection: 'row', gap: 8, paddingRight: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  filterBtnActive:     { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  filterBtnText:       { fontSize: 13, color: '#666' },
  filterBtnTextActive: { color: '#ffffff', fontWeight: '500' },

  // Alert cards
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    padding: 14,
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertIcon:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alertTitle:     { fontSize: 14, color: '#1a1a1a', flex: 1 },
  alertTitleBold: { fontWeight: '600' },
  alertTime:      { fontSize: 12, color: '#999' },
  alertDesc:      { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 10 },
  alertFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  categoryBadgeText: { fontSize: 12, color: '#666' },
  markReadText:      { fontSize: 12, color: '#378ADD', fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText:  { fontSize: 14, color: '#999' },
});