import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, API_URL, type Grano } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Granos'>;

export default function GranosScreen({ navigation }: Props) {
  const [granos, setGranos] = useState<Grano[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');

  const cargar = useCallback(() => {
    setError(null);
    api<Grano[]>('/granos').then(setGranos).catch((e) => setError(e.message));
  }, []);
  useFocusEffect(cargar);

  const agregar = async () => {
    if (!nombre.trim() || !pais.trim()) return Alert.alert('Faltan datos', 'Nombre y país son obligatorios.');
    try {
      await api('/granos', {
        method: 'POST',
        body: { nombreCafe: nombre.trim(), paisOrigen: pais.trim(), proceso: 'Lavado', puntuacionSca: 80 },
      });
      setNombre(''); setPais(''); cargar();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const borrar = (g: Grano) =>
    Alert.alert('Eliminar grano', `¿Eliminar "${g.nombreCafe}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => api(`/granos/${g.id}`, { method: 'DELETE' }).then(cargar)
          .catch((e) => Alert.alert('No se pudo eliminar', 'Probablemente tiene lotes asociados. ' + e.message)),
      },
    ]);

  if (error) return (
    <View style={s.center}>
      <Text style={s.err}>No se pudo conectar con la API</Text>
      <Text style={s.small}>{API_URL}</Text>
      <Text style={s.small}>{error}</Text>
      <Button title="Reintentar" onPress={cargar} />
    </View>
  );
  if (!granos) return <View style={s.center}><ActivityIndicator /></View>;

  return (
    <FlatList
      data={granos}
      keyExtractor={(g) => String(g.id)}
      ListHeaderComponent={
        <View style={s.form}>
          <TextInput style={s.input} placeholder="Nombre del café" value={nombre} onChangeText={setNombre} />
          <TextInput style={s.input} placeholder="País de origen" value={pais} onChangeText={setPais} />
          <Button title="Agregar grano" onPress={agregar} />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={s.row}
          onPress={() => navigation.navigate('Lotes', { idGrano: item.id, nombre: item.nombreCafe })}
          onLongPress={() => borrar(item)}
        >
          <Text style={s.title}>{item.nombreCafe}</Text>
          <Text style={s.small}>{item.paisOrigen} · {item.proceso} · SCA {item.puntuacionSca}</Text>
        </Pressable>
      )}
      ListFooterComponent={<Text style={s.hint}>Mantén presionado un grano para eliminarlo.</Text>}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  err: { fontSize: 16, fontWeight: '600' },
  form: { padding: 16, gap: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  small: { color: '#666', marginTop: 2 },
  hint: { textAlign: 'center', color: '#999', padding: 16 },
});
