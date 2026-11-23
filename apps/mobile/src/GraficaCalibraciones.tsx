// Gráfica de barras de las calibraciones de un lote, de la más antigua a la más reciente:
// la altura es el EY, el color el diagnóstico y la franja verde la zona ideal (18–22 %).
// Se dibuja con View para no agregar dependencias nativas.
import { StyleSheet, Text, View } from 'react-native';
import type { Calibracion } from './api';
import { color, DIAGNOSTICO, espacio, radio, texto, type Diagnostico } from './tema';
import { num } from './utilidades';

const TOPE = 30;   // EY máximo dibujado; lo que pasa de aquí se marca con ▲
const ALTO = 140;  // alto del área de barras en px
const MAX_BARRAS = 10;

export function GraficaCalibraciones({ calibraciones }: { calibraciones: Calibracion[] }) {
  const datos = [...calibraciones].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)).slice(-MAX_BARRAS);
  if (datos.length < 2) return null;
  const y = (ey: number) => (Math.min(ey, TOPE) / TOPE) * ALTO;

  return (
    <View style={s.contenedor} accessibilityLabel={`Gráfica de EY de las últimas ${datos.length} calibraciones`}>
      <View style={s.leyenda}>
        <Text style={texto.etiqueta}>EY POR CALIBRACIÓN</Text>
        <View style={s.claveIdeal}><View style={s.muestraIdeal} /><Text style={texto.pequeno}>zona ideal 18–22 %</Text></View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View style={[s.eje, { height: ALTO }]}>
          {[30, 20, 10, 0].map((v) => <Text key={v} style={[s.ejeTexto, { bottom: y(v) - 7 }]}>{v}</Text>)}
        </View>
        <View style={{ flex: 1, height: ALTO }}>
          <View style={[s.franja, { bottom: y(18), height: y(22) - y(18) }]} />
          {[10, 20, 30].map((v) => <View key={v} style={[s.guia, { bottom: y(v) }]} />)}
          <View style={s.barras}>
            {datos.map((c) => {
              const ey = Number(c.eyPorcentaje);
              const d = DIAGNOSTICO[c.diagnostico as Diagnostico];
              return (
                <View key={c.id} style={s.columna} accessibilityLabel={`EY ${num(ey)} %, ${d?.etiqueta ?? c.diagnostico}`}>
                  <Text style={[s.valor, { color: d?.fg ?? color.texto }]} numberOfLines={1}>{ey > TOPE ? '▲' : ''}{num(ey)}</Text>
                  <View style={[s.barra, { height: Math.max(y(ey), 3), backgroundColor: d?.fg ?? color.primario }]} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginLeft: 26 }}>
        {datos.map((c) => {
          const f = new Date(c.fechaHora);
          return (
            <View key={c.id} style={s.pie}>
              <Text style={s.pieTexto}>{f.getDate()}/{f.getMonth() + 1}</Text>
              <Text style={[s.pieTexto, { color: color.texto, fontWeight: '700' }]}>{num(c.calificacionSabor)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={[texto.pequeno, { marginTop: 2 }]}>Debajo de cada barra: fecha y calificación de sabor (0–10).</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { backgroundColor: color.superficie, borderRadius: radio.l, borderWidth: 1, borderColor: color.borde, padding: espacio.l, gap: espacio.s },
  leyenda: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: espacio.s },
  claveIdeal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muestraIdeal: { width: 14, height: 10, borderRadius: 3, backgroundColor: color.exitoSuave, borderWidth: 1, borderColor: color.exito },
  eje: { width: 26, position: 'relative' },
  ejeTexto: { position: 'absolute', right: 6, fontSize: 10.5, color: color.textoTenue },
  franja: { position: 'absolute', left: 0, right: 0, backgroundColor: color.exitoSuave, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#BFDDC9' },
  guia: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: color.borde },
  barras: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingHorizontal: 2 },
  columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  valor: { fontSize: 10.5, fontWeight: '700', marginBottom: 2 },
  barra: { width: '70%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  pie: { flex: 1, alignItems: 'center', paddingTop: 4, marginHorizontal: 3 },
  pieTexto: { fontSize: 10.5, color: color.textoSuave },
});
