import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { api, type Lote } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'Lotes'>;

export default function LotesScreen({ route, navigation }: Props) {
  const [lotes, setLotes] = useState<Lote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    api<Lote[]>(`/lotes?idGrano=${route.params.idGrano}`).then(setLotes).catch((e) => setError(e.message));
  }, [route.params.idGrano]));

  const nuevo = () => navigation.navigate('LoteForm', { idGrano: route.params.idGrano });

  if (error) return <View style={s.center}><Text>{error}</Text></View>;
  if (!lotes) return <View style={s.center}><ActivityIndicator /></View>;
  if (lotes.length === 0) return (
    <View style={s.center}>
      <Text style={{ marginBottom: 12 }}>Este grano aún no tiene lotes.</Text>
      <Button title="Nuevo lote" onPress={nuevo} />
    </View>
  );

  return (
    <FlatList
      data={lotes}
      ListHeaderComponent={<View style={{ padding: 16 }}><Button title="Nuevo lote" onPress={nuevo} /></View>}
      keyExtractor={(l) => String(l.id)}
      renderItem={({ item }) => (
        <Pressable style={s.row} onPress={() => navigation.navigate('LoteDetalle', { idLote: item.id, codigo: item.codigoLote })}>
          <Text style={s.title}>{item.codigoLote} {item.activo ? '' : '(inactivo)'}</Text>
          <Text style={s.small}>
            {item.tostaduria} · tueste {item.nivelTueste} · {item.fechaTueste.slice(0, 10)}
          </Text>
          <Text style={s.small}>{Number(item.pesoActualG)} g de {Number(item.pesoInicialG)} g</Text>
        </Pressable>
      )}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  small: { color: '#666', marginTop: 2 },
});
