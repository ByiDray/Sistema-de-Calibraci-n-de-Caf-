import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type Grano } from '../api';
import type { CafeProps } from '../navegacion';
import { color, espacio, texto } from '../tema';
import { BotonFlotante, Buscador, Cargando, ErrorCarga, EstadoVacio, Fila, Insignia, Selector, Tarjeta, Boton } from '../ui';
import { useCarga } from '../useCarga';
import { num } from '../utilidades';

export const PROCESOS = ['Lavado', 'Natural', 'Honey', 'Anaeróbico'] as const;

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function GranosScreen({ navigation }: CafeProps<'Granos'>) {
  const { datos: granos, error, refrescando, recargar } = useCarga(() => api<Grano[]>('/granos'), []);
  const [busqueda, setBusqueda] = useState('');
  const [proceso, setProceso] = useState<string>('Todos');

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return (granos ?? []).filter((g) =>
      (proceso === 'Todos' || g.proceso === proceso) &&
      (!q || normalizar([g.nombreCafe, g.paisOrigen, g.region, g.finca, g.productor, g.varietal].filter(Boolean).join(' ')).includes(q)));
  }, [granos, busqueda, proceso]);

  const nuevo = () => navigation.navigate('GranoForm', {});

  if (error && !granos) return <ErrorCarga mensaje={error} onReintentar={recargar} />;
  if (!granos) return <Cargando mensaje="Cargando tus cafés…" />;

  if (granos.length === 0) return (
    <EstadoVacio
      icono="cafe-outline"
      titulo="Aún no registras cafés"
      mensaje="Empieza agregando el primer grano: su origen, proceso y puntuación. Después podrás crear lotes y calibrarlos."
      accion={<Boton titulo="Agregar mi primer café" icono="add" onPress={nuevo} />}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visibles}
        keyExtractor={(g) => String(g.id)}
        contentContainerStyle={s.lista}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshing={refrescando}
        onRefresh={recargar}
        ListHeaderComponent={
          <View style={{ gap: espacio.m, marginBottom: espacio.xs }}>
            <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por nombre, país, finca…" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Selector
                opciones={['Todos', ...PROCESOS].map((p) => ({ valor: p, etiqueta: p }))}
                valor={proceso} onCambio={setProceso}
              />
            </ScrollView>
            <Text style={texto.pequeno}>
              {visibles.length === granos.length ? `${granos.length} cafés` : `${visibles.length} de ${granos.length} cafés`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EstadoVacio icono="search-outline" titulo="Sin resultados" mensaje="Prueba con otra búsqueda o quita el filtro de proceso."
            accion={<Boton titulo="Limpiar filtros" variante="secundario" onPress={() => { setBusqueda(''); setProceso('Todos'); }} />} />
        }
        renderItem={({ item }) => (
          <Tarjeta onPress={() => navigation.navigate('Lotes', { idGrano: item.id, nombre: item.nombreCafe })}>
            <Fila style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.nombre}>{item.nombreCafe}</Text>
                <Fila style={{ gap: 4 }}>
                  <Ionicons name="location-outline" size={14} color={color.textoSuave} />
                  <Text style={texto.pequeno} numberOfLines={1}>
                    {[item.region, item.paisOrigen].filter(Boolean).join(', ')}
                    {item.finca ? ` · ${item.finca}` : ''}
                  </Text>
                </Fila>
              </View>
              <View style={s.sca}>
                <Text style={s.scaValor}>{num(item.puntuacionSca)}</Text>
                <Text style={s.scaEtiqueta}>SCA</Text>
              </View>
            </Fila>
            <Fila style={{ justifyContent: 'space-between' }}>
              <Fila style={{ gap: 6 }}>
                <Insignia texto={item.proceso} />
                {item.varietal && <Insignia texto={item.varietal} fg={color.textoSuave} bg={color.fondo} />}
              </Fila>
              <Fila style={{ gap: 2 }}>
                {item._count && <Text style={texto.pequeno}>{item._count.lotes} {item._count.lotes === 1 ? 'lote' : 'lotes'}</Text>}
                <Ionicons name="chevron-forward" size={18} color={color.textoTenue} />
              </Fila>
            </Fila>
          </Tarjeta>
        )}
      />
      <BotonFlotante titulo="Nuevo café" onPress={nuevo} />
    </View>
  );
}

const s = StyleSheet.create({
  lista: { padding: espacio.l, gap: espacio.m, paddingBottom: 96 },
  nombre: { fontSize: 17, fontWeight: '700', color: color.texto },
  sca: { alignItems: 'center', backgroundColor: color.primarioSuave, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, minWidth: 56 },
  scaValor: { fontSize: 18, fontWeight: '800', color: color.primario },
  scaEtiqueta: { fontSize: 10, fontWeight: '700', color: color.primario, letterSpacing: 1 },
});
