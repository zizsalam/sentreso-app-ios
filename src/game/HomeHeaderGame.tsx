import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = { xp: number; streak: number; bronzeProgress: number };

export default function HomeHeaderGame({ xp, streak, bronzeProgress }: Props) {
  const pct = Math.max(0, Math.min(1, bronzeProgress));
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: Math.max(12, insets.top + 8) }]}>
      <Text style={s.title}>Chaque vente te rapproche du crédit.</Text>
      <View style={s.row}>
        <Text style={s.pill}>XP {xp}</Text>
        <Text style={s.pill}>🔥 {streak} jours</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={s.progressLabel}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#eee', fontWeight: '600' },
  barBg: { height: 8, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#4CAF50' },
  progressLabel: { marginTop: 6, fontSize: 12, color: '#6B7280' },
});
