import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type Equipo } from '../api';
import type { EquiposProps } from '../navegacion';
import { color, espacio, radio, texto } from '../tema';
import { Boton, BotonFlotante, Cargando, ErrorCarga, EstadoVacio, Fila, Seccion, Tarjeta, type Icono } from '../ui';
import { useCarga } from '../useCarga';

const GRUPOS: { tipo: Equipo['tipo']; titulo: string; icono: Icono; vacio: string }[] = [
  { tipo: 'molino', titulo: 'Molinos', icono: 'settings-outline', vacio: 'Agrega el molino con el que preparas.' },
  { tipo: 'maquina', titulo: 'Máquinas de espresso', icono: 'cafe-outline', vacio: 'Agrega tu máquina de espresso.' },
];

export default function EquiposScreen({ navigation }: EquiposProps<'Equipos'>) {
  const { datos: equipos, error, recargar } = useCarga(() => api<Equipo[]>('/equipos'), []);

  if (error && !equipos) return <ErrorCarga mensaje={error} onReintentar={recargar} />;
  if (!equipos) return <Cargando />;

  if (equipos.length === 0) return (
    <EstadoVacio
      icono="construct-outline" titulo="Registra tu equipo"
      mensaje="Para calibrar necesitas al menos un molino y una máquina de espresso."
      accion={<Boton titulo="Agregar equipo" icono="add" onPress={() => navigation.navigate('EquipoForm', {})} />}
    />
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.contenedor} contentInsetAdjustmentBehavior="automatic">
        {GRUPOS.map((g) => {
          const lista = equipos.filter((e) => e.tipo === g.tipo);
          return (
            <Seccion key={g.tipo} titulo={`${g.titulo} (${lista.length})`}
              accion={<Boton titulo="Agregar" icono="add" compacto variante="texto" onPress={() => navigation.navigate('EquipoForm', { tipo: g.tipo })} />}>
              {lista.length === 0 && (
                <Tarjeta style={{ borderStyle: 'dashed' }} onPress={() => navigation.navigate('EquipoForm', { tipo: g.tipo })}>
                  <Text style={texto.pequeno}>{g.vacio}</Text>
                </Tarjeta>
              )}
              {lista.map((e) => (
                <Tarjeta key={e.id} onPress={() => navigation.navigate('EquipoForm', { idEquipo: e.id })}>
                  <Fila style={{ gap: espacio.m }}>
                    <View style={s.icono}><Ionicons name={g.icono} size={22} color={color.primario} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.nombre}>{e.marca} {e.modelo}</Text>
                      <Text style={texto.pequeno}>Código {e.identificadorLocal}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={color.textoTenue} />
                  </Fila>
                </Tarjeta>
              ))}
            </Seccion>
          );
        })}
      </ScrollView>
      <BotonFlotante titulo="Nuevo equipo" onPress={() => navigation.navigate('EquipoForm', {})} />
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: 100 },
  icono: { width: 44, height: 44, borderRadius: radio.m, backgroundColor: color.primarioSuave, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 16, fontWeight: '700', color: color.texto },
});
