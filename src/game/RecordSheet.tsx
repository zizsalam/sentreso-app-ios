import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { track } from '../analytics/posthog';
import { createTransaction } from '../api/client';
import { enqueue } from '../offline/txnQueue';
import { awardOnTxnConfirmed } from './engine';

type Props = { online: boolean };

export default function RecordSheet({ online }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'parsing' | 'confirm'>('idle');
  const [draft, setDraft] = useState<any>(null);

  const start = () => {
    track('txn_voice_start');
    setState('recording');
    setTimeout(() => {
      setState('parsing');
      setTimeout(() => {
        setDraft({ kind: 'sale', amount_cfa: 1000, source: 'voice' });
        track('txn_voice_success');
        setState('confirm');
      }, 1200);
    }, 1200);
  };

  const retry = () => {
    track('txn_voice_retry');
    setState('idle');
    setDraft(null);
  };

  const confirm = async () => {
    if (!draft) return;
    try {
      if (online) await createTransaction(draft);
      else await enqueue(draft);
      await awardOnTxnConfirmed({ kind: draft.kind, amount: draft.amount_cfa });
      track('txn_confirmed');
      setState('idle');
      setDraft(null);
    } catch {}
  };

  return (
    <View style={s.wrap}>
      {state === 'idle' && (
        <TouchableOpacity style={s.mic} onPress={start}>
          <Text style={s.micText}>🎤</Text>
        </TouchableOpacity>
      )}
      {state === 'recording' && <Text style={s.txt}>Enregistrement…</Text>}
      {state === 'parsing' && <Text style={s.txt}>Analyse…</Text>}
      {state === 'confirm' && (
        <View style={s.confirm}>
          <Text style={s.txt}>Confirmer cette transaction ?</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.btnPrimary} onPress={confirm}>
              <Text style={s.btnPrimaryText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={retry}>
              <Text style={s.btnSecondaryText}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16 },
  mic: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  micText: { fontSize: 48, color: '#fff' },
  txt: { textAlign: 'center', fontSize: 16, marginTop: 16 },
  confirm: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12, justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { backgroundColor: '#F3F4F6', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  btnSecondaryText: { color: '#6B7280', fontWeight: '600' },
});
