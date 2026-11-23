import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type Resumen } from '../api';
import type { InicioProps } from '../navegacion';
import { color, DIAGNOSTICO, espacio, radio, texto, type Diagnostico } from '../tema';
import { BarraProgreso, Boton, Cargando, ErrorCarga, EstadoVacio, Fila, Insignia, InsigniaDiagnostico, Seccion, Tarjeta } from '../ui';
import { useCarga } from '../useCarga';
import { fechaHora, num } from '../utilidades';

const ORDEN: Diagnostico[] = ['EQUILIBRADA', 'SUBEXTRAIDA', 'SOBREEXTRAIDA'];

export default function InicioScreen({ navigation }: InicioProps) {
  const { datos: r, error, refrescando, recargar } = useCarga(() => api<Resumen>('/resumen'), []);

  // Las pantallas de lotes viven en la pestaña Cafés; "initial: false" deja la lista de cafés debajo.
  const abrirLote = (idLote: number, codigo: string) =>
    navigation.getParent()?.navigate('CafeTab', { screen: 'LoteDetalle', params: { idLote, codigo }, initial: false });

  if (error && !r) return <ErrorCarga mensaje={error} onReintentar={recargar} />;
  if (!r) return <Cargando mensaje="Preparando tu resumen…" />;

  const totalCal = ORDEN.reduce((s, d) => s + (r.calibraciones[d] ?? 0), 0);
  const equilibradas = r.calibraciones.EQUILIBRADA ?? 0;

  return (
    <ScrollView contentContainerStyle={s.contenedor} contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} tintColor={color.primario} />}>
      <View style={s.kpis}>
        <Kpi icono="cube-outline" valor={String(r.lotesActivos)} etiqueta="Lotes activos" />
        <Kpi icono="scale-outline" valor={`${(Number(r.gramosDisponibles) / 1000).toFixed(1)} kg`} etiqueta="Café disponible" />
        <Kpi icono="checkmark-circle-outline" valor={totalCal ? `${Math.round((equilibradas / totalCal) * 100)} %` : '—'} etiqueta="Shots equilibrados" />
      </View>

      <Seccion titulo="Extracciones">
        <Tarjeta>
          {totalCal === 0 ? <Text style={texto.pequeno}>Aún no hay calibraciones.</Text> : (
            <>
              <View style={s.barraApilada} accessibilityLabel={ORDEN.map((d) => `${DIAGNOSTICO[d].etiqueta}: ${r.calibraciones[d] ?? 0}`).join(', ')}>
                {ORDEN.map((d) => (r.calibraciones[d] ?? 0) > 0 && (
                  <View key={d} style={{ flex: r.calibraciones[d], backgroundColor: DIAGNOSTICO[d].fg }} />
                ))}
              </View>
              <Fila style={{ flexWrap: 'wrap', gap: espacio.m }}>
                {ORDEN.map((d) => (
                  <Fila key={d} style={{ gap: 6 }}>
                    <View style={[s.punto, { backgroundColor: DIAGNOSTICO[d].fg }]} />
                    <Text style={texto.pequeno}>{DIAGNOSTICO[d].etiqueta} <Text style={s.fuerte}>{r.calibraciones[d] ?? 0}</Text></Text>
                  </Fila>
                ))}
              </Fila>
            </>
          )}
        </Tarjeta>
      </Seccion>

      <Seccion titulo="Se están acabando">
        {r.pocaExistencia.length === 0 ? (
          <Tarjeta><Fila><Ionicons name="happy-outline" size={18} color={color.exito} /><Text style={texto.pequeno}>Ningún lote activo baja del 20 %.</Text></Fila></Tarjeta>
        ) : r.pocaExistencia.map((l) => {
          const p = Number(l.pesoActualG) / Number(l.pesoInicialG);
          return (
            <Tarjeta key={l.id} onPress={() => abrirLote(l.id, l.codigoLote)}>
              <Fila style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fuerte}>{l.codigoLote}</Text>
                  <Text style={texto.pequeno}>{l.nombreCafe}</Text>
                </View>
                <Insignia texto={`${num(l.pesoActualG)} g`} fg={color.alerta} bg={color.alertaSuave} icono="warning-outline" />
              </Fila>
              <BarraProgreso valor={p} tono={color.alerta} />
            </Tarjeta>
          );
        })}
      </Seccion>

      <Seccion titulo="Últimas calibraciones">
        {r.ultimasCalibraciones.length === 0 ? (
          <EstadoVacio icono="speedometer-outline" titulo="Sin calibraciones" mensaje="Entra a un lote y registra tu primer shot."
            accion={<Boton titulo="Ver mis cafés" variante="secundario" onPress={() => navigation.getParent()?.navigate('CafeTab', { screen: 'Granos' })} />} />
        ) : r.ultimasCalibraciones.map((c) => (
          <Tarjeta key={c.id} onPress={() => abrirLote(c.idLote, c.codigoLote)}>
            <Fila style={{ justifyContent: 'space-between' }}>
              <InsigniaDiagnostico diagnostico={c.diagnostico} />
              <Text style={texto.pequeno}>{fechaHora(c.fechaHora)}</Text>
            </Fila>
            <Fila style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fuerte} numberOfLines={1}>{c.nombreCafe}</Text>
                <Text style={texto.pequeno}>{c.codigoLote} · {c.baristaNombre}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.fuerte}>EY {num(c.eyPorcentaje)} %</Text>
                <Text style={texto.pequeno}>Sabor {num(c.calificacionSabor)}/10</Text>
              </View>
            </Fila>
          </Tarjeta>
        ))}
      </Seccion>

      {r.baristas.length > 0 && (
        <Seccion titulo="Baristas por sabor promedio">
          <Tarjeta style={{ gap: espacio.m }}>
            {r.baristas.map((b, i) => (
              <View key={b.nombre} style={{ gap: 4 }}>
                <Fila style={{ justifyContent: 'space-between' }}>
                  <Text style={[texto.cuerpo, i === 0 && s.fuerte]}>{i === 0 ? '★ ' : ''}{b.nombre}</Text>
                  <Text style={texto.pequeno}><Text style={s.fuerte}>{b.saborPromedio.toFixed(1)}</Text>/10 · {b.calibraciones} shots</Text>
                </Fila>
                <BarraProgreso valor={b.saborPromedio / 10} tono={i === 0 ? color.primario : color.bordeFuerte} />
              </View>
            ))}
          </Tarjeta>
        </Seccion>
      )}
    </ScrollView>
  );
}

function Kpi({ icono, valor, etiqueta }: { icono: keyof typeof Ionicons.glyphMap; valor: string; etiqueta: string }) {
  return (
    <View style={s.kpi} accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Ionicons name={icono} size={18} color={color.primario} />
      <Text style={s.kpiValor} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
      <Text style={s.kpiEtiqueta} numberOfLines={2}>{etiqueta}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: espacio.xxl },
  kpis: { flexDirection: 'row', gap: espacio.s },
  kpi: { flex: 1, backgroundColor: color.superficie, borderRadius: radio.l, borderWidth: 1, borderColor: color.borde, padding: espacio.m, gap: 2 },
  kpiValor: { fontSize: 22, fontWeight: '800', color: color.texto, marginTop: 4 },
  kpiEtiqueta: { fontSize: 12, color: color.textoSuave, fontWeight: '600' },
  barraApilada: { flexDirection: 'row', height: 14, borderRadius: radio.pill, overflow: 'hidden', gap: 2 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  fuerte: { fontWeight: '700', color: color.texto, fontSize: 15 },
});
