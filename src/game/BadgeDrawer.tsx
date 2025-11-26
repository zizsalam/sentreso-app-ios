import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const BADGES = [
  { id: 'first_txn', label: 'Première transaction' },
  { id: '7_day_streak', label: 'Série de 7 jours' },
  { id: '100_txn', label: '100 transactions' },
  { id: 'balanced_bookkeeper', label: 'Comptable équilibré' },
];

export default function BadgeDrawer() {
  return (
    <View style={s.wrap}>
      <FlatList
        data={BADGES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tile} onPress={() => {}}>
            <Text style={s.emoji}>🏅</Text>
            <Text style={s.lbl}>{item.label}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 12 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16 },
  tile: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  emoji: { fontSize: 28, marginBottom: 8 },
  lbl: { fontWeight: '600', textAlign: 'center' },
});
