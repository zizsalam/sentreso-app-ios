import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = { progress: number };

export default function BronzeCard({ progress }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={s.card}>
      <Text style={s.hint}>Plus que 2 jours de suite pour débloquer Bronze.</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={s.criteria}>
        <Text style={s.item}>• Série de jours régulière</Text>
        <Text style={s.item}>• Activité sur 14 jours</Text>
        <Text style={s.item}>• Variance maîtrisée</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16 },
  hint: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  barBg: { height: 8, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: 8, backgroundColor: '#d97706' },
  criteria: { gap: 4, marginBottom: 12 },
  item: { color: '#374151' },

});
