import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, type Equipo } from '../api';

export default function EquiposScreen() {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipo, setTipo] = useState<'molino' | 'maquina'>('molino');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [codigo, setCodigo] = useState('');

  const cargar = useCallback(() => {
    api<Equipo[]>('/equipos').then(setEquipos).catch((e) => setError(e.message));
  }, []);
  useFocusEffect(cargar);

  const agregar = async () => {
    if (!marca.trim() || !modelo.trim() || !codigo.trim()) return Alert.alert('Faltan datos', 'Marca, modelo y código son obligatorios.');
    try {
      await api('/equipos', {
        method: 'POST',
        body: { tipo, marca: marca.trim(), modelo: modelo.trim(), identificadorLocal: codigo.trim() },
      });
      setMarca(''); setModelo(''); setCodigo(''); cargar();
    } catch (e: any) {
      Alert.alert('No se pudo agregar', e.message.includes('Unique') ? 'Ya existe un equipo con ese código.' : e.message);
    }
  };

  const borrar = (eq: Equipo) =>
    Alert.alert('Eliminar equipo', `¿Eliminar ${eq.marca} ${eq.modelo}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => api(`/equipos/${eq.id}`, { method: 'DELETE' }).then(cargar)
          .catch(() => Alert.alert('No se pudo eliminar', 'El equipo se usa en calibraciones.')),
      },
    ]);

  if (error) return <View style={s.center}><Text>{error}</Text></View>;
  if (!equipos) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <FlatList
      data={equipos}
      keyExtractor={(e) => String(e.id)}
      ListHeaderComponent={
        <View style={s.form}>
          <View style={s.chips}>
            {(['molino', 'maquina'] as const).map((t) => (
              <Pressable key={t} onPress={() => setTipo(t)} style={[s.chip, tipo === t && s.chipOn]}>
                <Text style={tipo === t && s.chipTextOn}>{t === 'molino' ? 'Molino' : 'Máquina'}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={s.input} placeholder="Marca" value={marca} onChangeText={setMarca} />
          <TextInput style={s.input} placeholder="Modelo" value={modelo} onChangeText={setModelo} />
          <TextInput style={s.input} placeholder="Código (ej. MOL-06)" autoCapitalize="characters" value={codigo} onChangeText={setCodigo} />
          <Button title="Agregar equipo" onPress={agregar} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={s.row} onLongPress={() => borrar(item)}>
          <Text style={s.title}>{item.marca} {item.modelo}</Text>
          <Text style={s.small}>{item.tipo === 'molino' ? 'Molino' : 'Máquina'} · {item.identificadorLocal}</Text>
        </Pressable>
      )}
      ListFooterComponent={<Text style={s.hint}>Mantén presionado un equipo para eliminarlo.</Text>}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  form: { padding: 16, gap: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#bbb', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  chipOn: { backgroundColor: '#4b2e1e', borderColor: '#4b2e1e' },
  chipTextOn: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  small: { color: '#666', marginTop: 2 },
  hint: { textAlign: 'center', color: '#999', padding: 16 },
});
