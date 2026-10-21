import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type Calibracion, type Equipo } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'CalibracionForm'>;

const CAMPOS = [
  { k: 'dosisInG', label: 'Dosis de entrada (g)', min: 0.1, max: 99 },
  { k: 'yieldOutG', label: 'Peso de la bebida (g)', min: 0.1, max: 999 },
  { k: 'tiempoSegundos', label: 'Tiempo de extracción (s)', min: 1, max: 999 },
  { k: 'tdsPorcentaje', label: 'TDS (%)', min: 0.01, max: 100 },
  { k: 'ajusteMolienda', label: 'Ajuste del molino', min: 0.01, max: 99 },
  { k: 'temperaturaC', label: 'Temperatura (°C)', min: 1, max: 100 },
  { k: 'presionBar', label: 'Presión (bar)', min: 0.1, max: 15 },
  { k: 'calificacionSabor', label: 'Calificación de sabor (0 a 10)', min: 0, max: 10 },
] as const;

export default function CalibracionFormScreen({ route, navigation }: Props) {
  const { idLote } = route.params;
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [idMolino, setIdMolino] = useState<number | null>(null);
  const [idMaquina, setIdMaquina] = useState<number | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [barista, setBarista] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api<Equipo[]>('/equipos').then(setEquipos).catch((e) => Alert.alert('Error', e.message)); }, []);

  const guardar = async () => {
    if (!idMolino || !idMaquina) return Alert.alert('Falta equipo', 'Elige un molino y una máquina.');
    if (!barista.trim()) return Alert.alert('Falta el barista', 'Escribe el nombre de quien calibra.');
    const body: Record<string, unknown> = {};
    for (const c of CAMPOS) {
      const n = Number((valores[c.k] ?? '').replace(',', '.'));
      if (!valores[c.k] || Number.isNaN(n) || n < c.min || n > c.max) {
        return Alert.alert('Dato inválido', `${c.label}: debe estar entre ${c.min} y ${c.max}.`);
      }
      body[c.k] = n;
    }
    setGuardando(true);
    try {
      const nueva = await api<Calibracion>('/calibraciones', {
        method: 'POST',
        body: {
          ...body, idLote, idMolino, idMaquina, baristaNombre: barista.trim(),
          notasBarista: notas.trim() || null, fechaHora: new Date().toISOString(),
        },
      });
      Alert.alert('Calibración guardada', `${nueva.diagnostico}\nEY ${Number(nueva.eyPorcentaje)}% · ratio ${nueva.ratioCalculado}`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message);
    } finally { setGuardando(false); }
  };

  if (!equipos) return <View style={s.center}><ActivityIndicator /></View>;
  const molinos = equipos.filter((e) => e.tipo === 'molino');
  const maquinas = equipos.filter((e) => e.tipo === 'maquina');

  const selector = (titulo: string, lista: Equipo[], sel: number | null, set: (id: number) => void) => (
    <View>
      <Text style={s.label}>{titulo}</Text>
      {lista.length === 0 && <Text style={s.small}>No hay equipos de este tipo. Agrégalos en Equipos.</Text>}
      <View style={s.chips}>
        {lista.map((e) => (
          <Pressable key={e.id} onPress={() => set(e.id)} style={[s.chip, sel === e.id && s.chipOn]}>
            <Text style={sel === e.id && s.chipTextOn}>{e.identificadorLocal} · {e.marca}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      {selector('Molino', molinos, idMolino, setIdMolino)}
      {selector('Máquina de espresso', maquinas, idMaquina, setIdMaquina)}
      {CAMPOS.map((c) => (
        <View key={c.k}>
          <Text style={s.label}>{c.label}</Text>
          <TextInput
            style={s.input} keyboardType="decimal-pad" value={valores[c.k] ?? ''}
            onChangeText={(t) => setValores((v) => ({ ...v, [c.k]: t }))}
          />
        </View>
      ))}
      <Text style={s.label}>Barista</Text>
      <TextInput style={s.input} value={barista} onChangeText={setBarista} />
      <Text style={s.label}>Notas del barista (opcional)</Text>
      <TextInput style={s.input} value={notas} onChangeText={setNotas} multiline />
      <Text style={s.small}>El ratio, el EY y el diagnóstico se calculan automáticamente.</Text>
      <Button title={guardando ? 'Guardando...' : 'Guardar calibración'} onPress={guardar} disabled={guardando} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 6, paddingBottom: 40 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  small: { color: '#666', marginVertical: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#bbb', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: '#4b2e1e', borderColor: '#4b2e1e' },
  chipTextOn: { color: '#fff' },
});
