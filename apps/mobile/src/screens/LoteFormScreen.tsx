import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type Lote } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'LoteForm'>;

const NIVELES = ['Claro', 'Medio', 'Oscuro'];

export default function LoteFormScreen({ route, navigation }: Props) {
  const { idGrano, idLote } = route.params;
  const editando = idLote !== undefined;
  const [cargando, setCargando] = useState(editando);
  const [codigo, setCodigo] = useState('');
  const [tostaduria, setTostaduria] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nivel, setNivel] = useState('Medio');
  const [pesoInicial, setPesoInicial] = useState('');
  const [pesoActual, setPesoActual] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!editando) return;
    api<Lote>(`/lotes/${idLote}`).then((l) => {
      setCodigo(l.codigoLote); setTostaduria(l.tostaduria); setFecha(l.fechaTueste.slice(0, 10));
      setNivel(l.nivelTueste); setPesoInicial(String(Number(l.pesoInicialG)));
      setPesoActual(String(Number(l.pesoActualG))); setActivo(l.activo);
    }).catch((e) => Alert.alert('Error', e.message)).finally(() => setCargando(false));
  }, [editando, idLote]);

  const guardar = async () => {
    const inicial = Number(pesoInicial.replace(',', '.'));
    const actual = editando ? Number(pesoActual.replace(',', '.')) : inicial;
    const fechaOk = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(new Date(fecha).getTime());
    if (!codigo.trim() || !tostaduria.trim()) return Alert.alert('Faltan datos', 'Código y tostaduría son obligatorios.');
    if (!fechaOk) return Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD, por ejemplo 2026-10-20.');
    if (!(inicial > 0)) return Alert.alert('Peso inválido', 'El peso inicial debe ser mayor que 0.');
    if (!(actual >= 0) || actual > inicial) return Alert.alert('Peso inválido', 'El peso actual debe estar entre 0 y el peso inicial.');

    const body = {
      codigoLote: codigo.trim(), tostaduria: tostaduria.trim(), fechaTueste: new Date(fecha).toISOString(),
      nivelTueste: nivel, pesoInicialG: inicial, pesoActualG: actual, activo,
    };
    setGuardando(true);
    try {
      if (editando) await api(`/lotes/${idLote}`, { method: 'PUT', body });
      else await api('/lotes', { method: 'POST', body: { ...body, idGrano } });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message.includes('Unique') ? 'Ya existe un lote con ese código.' : e.message);
    } finally { setGuardando(false); }
  };

  if (cargando) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.label}>Código del lote</Text>
      <TextInput style={s.input} placeholder="LT-2026-011" autoCapitalize="characters" value={codigo} onChangeText={setCodigo} />
      <Text style={s.label}>Tostaduría</Text>
      <TextInput style={s.input} value={tostaduria} onChangeText={setTostaduria} />
      <Text style={s.label}>Fecha de tueste (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={fecha} onChangeText={setFecha} keyboardType="numbers-and-punctuation" />
      <Text style={s.label}>Nivel de tueste</Text>
      <View style={s.chips}>
        {NIVELES.map((n) => (
          <Pressable key={n} onPress={() => setNivel(n)} style={[s.chip, nivel === n && s.chipOn]}>
            <Text style={nivel === n && s.chipTextOn}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>Peso inicial (g)</Text>
      <TextInput style={s.input} keyboardType="decimal-pad" value={pesoInicial} onChangeText={setPesoInicial} />
      {editando && (
        <>
          <Text style={s.label}>Peso actual (g)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad" value={pesoActual} onChangeText={setPesoActual} />
        </>
      )}
      <View style={s.switchRow}>
        <Text style={s.label}>Lote activo</Text>
        <Switch value={activo} onValueChange={setActivo} />
      </View>
      {!editando && <Text style={s.small}>El peso actual empieza igual al peso inicial.</Text>}
      <Button title={guardando ? 'Guardando...' : 'Guardar lote'} onPress={guardar} disabled={guardando} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 6, paddingBottom: 40 },
  label: { fontWeight: '600', marginTop: 8, marginBottom: 4 },
  small: { color: '#666', marginVertical: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#bbb', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  chipOn: { backgroundColor: '#4b2e1e', borderColor: '#4b2e1e' },
  chipTextOn: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
