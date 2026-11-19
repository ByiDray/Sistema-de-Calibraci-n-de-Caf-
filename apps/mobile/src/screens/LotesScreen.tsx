import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type GranoConLotes, type Lote } from '../api';
import type { CafeProps } from '../navegacion';
import { color, espacio, texto } from '../tema';
import { BarraProgreso, Boton, BotonFlotante, BotonIcono, Cargando, Dato, ErrorCarga, EstadoVacio, Fila, Insignia, Seccion, Tarjeta } from '../ui';
import { useCarga } from '../useCarga';
import { haceDias, num } from '../utilidades';

export default function LotesScreen({ route, navigation }: CafeProps<'Lotes'>) {
  const { idGrano } = route.params;
  const { datos: grano, error, recargar } = useCarga(() => api<GranoConLotes>(`/granos/${idGrano}`), [idGrano]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: grano?.nombreCafe ?? route.params.nombre,
      headerRight: () => <BotonIcono icono="create-outline" etiqueta="Editar café" onPress={() => navigation.navigate('GranoForm', { idGrano })} />,
    });
  }, [navigation, grano?.nombreCafe, idGrano, route.params.nombre]);

  if (error && !grano) return <ErrorCarga mensaje={error} onReintentar={recargar} />;
  if (!grano) return <Cargando />;

  const nuevo = () => navigation.navigate('LoteForm', { idGrano });
  const activos = grano.lotes.filter((l) => l.activo).sort((a, b) => b.fechaTueste.localeCompare(a.fechaTueste));
  const inactivos = grano.lotes.filter((l) => !l.activo).sort((a, b) => b.fechaTueste.localeCompare(a.fechaTueste));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.contenedor}>
        <Tarjeta style={{ backgroundColor: color.primarioSuave, borderColor: color.primarioSuave }}>
          <Fila style={{ gap: 4 }}>
            <Ionicons name="location" size={15} color={color.primario} />
            <Text style={[texto.cuerpo, { fontWeight: '600' }]}>{[grano.region, grano.paisOrigen].filter(Boolean).join(', ')}</Text>
          </Fila>
          {(grano.finca || grano.productor) && (
            <Text style={texto.pequeno}>{[grano.finca, grano.productor].filter(Boolean).join(' · ')}</Text>
          )}
          <Fila style={{ gap: espacio.xl, marginTop: espacio.xs, flexWrap: 'wrap' }}>
            <Dato etiqueta="PROCESO" valor={grano.proceso} />
            <Dato etiqueta="SCA" valor={num(grano.puntuacionSca)} />
            {grano.varietal && <Dato etiqueta="VARIETAL" valor={grano.varietal} />}
          </Fila>
        </Tarjeta>

        {grano.lotes.length === 0 ? (
          <EstadoVacio
            icono="cube-outline" titulo="Este café aún no tiene lotes"
            mensaje="Un lote es una bolsa tostada de este café. Regístralo para llevar su existencia y calibrarlo."
            accion={<Boton titulo="Registrar primer lote" icono="add" onPress={nuevo} />}
          />
        ) : (
          <>
            <Seccion titulo={`Lotes activos (${activos.length})`}>
              {activos.length === 0 && <Text style={texto.pequeno}>No hay lotes activos.</Text>}
              {activos.map((l) => <TarjetaLote key={l.id} lote={l} onPress={() => navigation.navigate('LoteDetalle', { idLote: l.id, codigo: l.codigoLote })} />)}
            </Seccion>
            {inactivos.length > 0 && (
              <Seccion titulo={`Terminados o inactivos (${inactivos.length})`}>
                {inactivos.map((l) => <TarjetaLote key={l.id} lote={l} onPress={() => navigation.navigate('LoteDetalle', { idLote: l.id, codigo: l.codigoLote })} />)}
              </Seccion>
            )}
          </>
        )}
      </ScrollView>
      {grano.lotes.length > 0 && <BotonFlotante titulo="Nuevo lote" onPress={nuevo} />}
    </View>
  );
}

export function TarjetaLote({ lote, onPress }: { lote: Lote; onPress?: () => void }) {
  const actual = Number(lote.pesoActualG);
  const inicial = Number(lote.pesoInicialG);
  const proporcion = inicial > 0 ? actual / inicial : 0;
  const poca = lote.activo && proporcion < 0.2;
  return (
    <Tarjeta onPress={onPress} style={!lote.activo && { opacity: 0.7 }}>
      <Fila style={{ justifyContent: 'space-between' }}>
        <Text style={s.codigo}>{lote.codigoLote}</Text>
        <Fila style={{ gap: 6 }}>
          <Insignia texto={`Tueste ${lote.nivelTueste.toLowerCase()}`} />
          {!lote.activo && <Insignia texto="Inactivo" fg={color.textoSuave} bg={color.fondo} />}
          {onPress && <Ionicons name="chevron-forward" size={18} color={color.textoTenue} />}
        </Fila>
      </Fila>
      <Text style={texto.pequeno}>{lote.tostaduria} · tostado {haceDias(lote.fechaTueste)}</Text>
      <View style={{ gap: 6, marginTop: 2 }}>
        <Fila style={{ justifyContent: 'space-between' }}>
          <Text style={texto.pequeno}>Existencia</Text>
          <Fila style={{ gap: 6 }}>
            {poca && <Insignia texto="Queda poco" fg={color.alerta} bg={color.alertaSuave} icono="warning-outline" />}
            <Text style={s.peso}>{num(actual)} <Text style={texto.pequeno}>/ {num(inicial)} g</Text></Text>
          </Fila>
        </Fila>
        <BarraProgreso valor={proporcion} tono={poca ? color.alerta : color.primario} />
      </View>
    </Tarjeta>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: 100 },
  codigo: { fontSize: 16, fontWeight: '700', color: color.texto, fontVariant: ['tabular-nums'] },
  peso: { fontSize: 15, fontWeight: '700', color: color.texto },
});
