/**
 * dashboard.tsx
 * Mushroom Farm Dashboard — with dummy values for testing
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_DATA = {
  status: 'online',
  lastUpdated: 'Just now',
  sensors: {
    temperature: {
      value: 23,
      unit: '°C',
      status: 'normal',
      history: [21, 21.5, 22, 22.5, 23, 22.8, 23.1, 23, 22.5, 23, 23.2, 23],
    },
    humidity: {
      value: 85,
      unit: '%',
      status: 'normal',
      history: [80, 82, 83, 85, 86, 85, 84, 85, 87, 85, 84, 85],
    },
    soilMoisture: {
      value: 72,
      unit: '%',
      status: 'normal',
      history: [70, 71, 72, 73, 72, 71, 72, 73, 72, 71, 72, 72],
    },
    co2: {
      value: 650,
      unit: ' ppm',
      status: 'normal',
      history: [600, 620, 630, 640, 650, 645, 650, 655, 650, 648, 650, 650],
    },
  },
};

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = '#aaa' }: { data: number[], color: string }) {
  const [width, setWidth] = useState(0);
  const HEIGHT = 44;

  const onLayout = useCallback(
    (e) => setWidth(e.nativeEvent.layout.width),
    [],
  );

  if (!data || data.length < 2) {
    return <View style={{ height: HEIGHT }} onLayout={onLayout} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const PAD = 4;

  const points = data
    .map((v, i) => {
      const x = ((i / (data.length - 1)) * (width - PAD * 2) + PAD).toFixed(1);
      const y = (HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2)).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status || 'unknown').toLowerCase();
  const variant =
    s === 'normal' ? 'normal' : s === 'warning' ? 'warning' : 'danger';
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>
        {(status || 'Unknown').charAt(0).toUpperCase() + (status || '').slice(1)}
      </Text>
    </View>
  );
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────

const SENSOR_ICONS = {
  temperature:  '🌡',
  humidity:     '💧',
  soilMoisture: '🌱',
  co2:          '💨',
};

const SENSOR_LABELS = {
  temperature:  'Temperature',
  humidity:     'Humidity',
  soilMoisture: 'Soil Moisture',
  co2:          'CO₂ Level',
};

function SensorCard({ sensorKey, data }: { sensorKey: string, data: any }) {
  const { value, unit, status, history } = data;
  const displayValue =
    value !== null && value !== undefined ? `${value}${unit}` : '—';

  return (
    <View style={styles.card}>
      <View style={styles.sensorHeader}>
        <View style={styles.sensorLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{SENSOR_ICONS[sensorKey]}</Text>
          </View>
          <View>
            <Text style={styles.sensorLabel}>{SENSOR_LABELS[sensorKey]}</Text>
            <Text style={styles.sensorValue}>{displayValue}</Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={styles.sparklineWrap}>
        <Sparkline data={history} color="#c0c0c0" />
      </View>
      <Text style={styles.timeLabel}>Last 24 hours</Text>
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const { status, lastUpdated, sensors } = DUMMY_DATA;
  const isOnline = status === 'online';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Mushroom Farm</Text>
          <Text style={styles.appSubtitle}>Real-time monitoring • House #1</Text>
        </View>

        {/* ── System Status ── */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.cardTitle}>System Status</Text>
              <Text style={styles.timeLabel}>Last updated: {lastUpdated}</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  isOnline ? styles.dotOnline : styles.dotOffline,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isOnline ? styles.statusOnline : styles.statusOffline,
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Sensor Cards ── */}
        {Object.entries(sensors).map(([key, data]) => (
          <SensorCard key={key} sensorKey={key} data={data} />
        ))}

        {/* ── Quick Actions ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { label: 'View History', screen: 'History' },
              { label: 'Controls',     screen: 'Controls' },
              { label: 'Camera',       screen: 'Camera' },
            ].map(({ label, screen }) => (
              <TouchableOpacity
                key={screen}
                style={styles.actionBtn}
                onPress={() => navigation?.navigate(screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f6f6' },
  scroll:   { padding: 16, paddingBottom: 40 },

  header:      { marginBottom: 14 },
  appTitle:    { fontSize: 22, fontWeight: '600', color: '#1a1a1a' },
  appSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },

  statusRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  dotOnline:       { backgroundColor: '#22c55e' },
  dotOffline:      { backgroundColor: '#ef4444' },
  statusText:      { fontSize: 12, fontWeight: '500' },
  statusOnline:    { color: '#16a34a' },
  statusOffline:   { color: '#dc2626' },

  sensorHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sensorLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox:        { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f4f4f4', alignItems: 'center', justifyContent: 'center' },
  iconText:       { fontSize: 18 },
  sensorLabel:    { fontSize: 12, color: '#999' },
  sensorValue:    { fontSize: 24, fontWeight: '500', color: '#1a1a1a', marginTop: 1 },
  sparklineWrap:  { marginVertical: 6 },
  timeLabel:      { fontSize: 11, color: '#c0c0c0', marginTop: 2 },

  badge:             { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badge_normal:      { backgroundColor: '#f0fdf4' },
  badge_warning:     { backgroundColor: '#fffbeb' },
  badge_danger:      { backgroundColor: '#fef2f2' },
  badgeText:         { fontSize: 11, fontWeight: '500' },
  badgeText_normal:  { color: '#16a34a' },
  badgeText_warning: { color: '#d97706' },
  badgeText_danger:  { color: '#dc2626' },

  actionsRow:    { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn:     { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#fafafa' },
  actionBtnText: { fontSize: 13, color: '#444', fontWeight: '500' },
});