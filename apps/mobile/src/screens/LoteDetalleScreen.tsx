import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type LoteDetalle } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'LoteDetalle'>;

export default function LoteDetalleScreen({ route, navigation }: Props) {
  const { idLote } = route.params;
  const [lote, setLote] = useState<LoteDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState('');

  const cargar = useCallback(() => {
    api<LoteDetalle>(`/lotes/${idLote}`).then(setLote).catch((e) => setError(e.message));
  }, [idLote]);
  useFocusEffect(cargar);

  const agregarNota = async () => {
    if (!descriptor.trim()) return;
    try {
      await api(`/lotes/${idLote}/notas`, { method: 'POST', body: { descriptor: descriptor.trim() } });
      setDescriptor(''); cargar();
    } catch (e: any) { Alert.alert('No se pudo agregar', e.message); }
  };

  const borrarNota = (id: number) => api(`/notas/${id}`, { method: 'DELETE' }).then(cargar);

  if (error) return <View style={s.center}><Text>{error}</Text></View>;
  if (!lote) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.h1}>{lote.grano?.nombreCafe}</Text>
      <Text style={s.small}>
        {lote.tostaduria} · tueste {lote.nivelTueste} · {lote.fechaTueste.slice(0, 10)}
      </Text>
      <Text style={s.small}>Existencia: {Number(lote.pesoActualG)} g / {Number(lote.pesoInicialG)} g</Text>

      <Text style={s.h2}>Notas de cata del lote</Text>
      {lote.notasCata.length === 0 && <Text style={s.small}>Sin notas todavía.</Text>}
      {lote.notasCata.map((n) => (
        <View key={n.id} style={s.noteRow}>
          <Text style={{ flex: 1 }}>{n.descriptor}</Text>
          <Button title="Quitar" color="#b00" onPress={() => borrarNota(n.id)} />
        </View>
      ))}
      <View style={s.noteRow}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Nuevo descriptor" value={descriptor} onChangeText={setDescriptor} />
        <Button title="Agregar" onPress={agregarNota} />
      </View>

      <Text style={s.h2}>Calibraciones</Text>
      <Button title="Nueva calibración" onPress={() => navigation.navigate('CalibracionForm', { idLote })} />
      {lote.calibraciones.length === 0 && <Text style={s.small}>Sin calibraciones.</Text>}
      {lote.calibraciones.map((c) => (
        <View key={c.id} style={s.card}>
          <Text style={s.bold}>{c.diagnostico} · EY {Number(c.eyPorcentaje)}%</Text>
          <Text style={s.small}>
            {c.fechaHora.slice(0, 16).replace('T', ' ')} · {c.baristaNombre}
          </Text>
          <Text style={s.small}>
            {Number(c.dosisInG)} g → {Number(c.yieldOutG)} g (ratio {c.ratioCalculado}) en {Number(c.tiempoSegundos)} s
          </Text>
          <Text style={s.small}>Sabor {Number(c.calificacionSabor)}/10{c.notasBarista ? ` · ${c.notasBarista}` : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { padding: 16, gap: 6 },
  h1: { fontSize: 20, fontWeight: '700' },
  h2: { fontSize: 17, fontWeight: '600', marginTop: 16 },
  small: { color: '#666' },
  bold: { fontWeight: '600' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  card: { borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 8, padding: 12, gap: 2 },
});
