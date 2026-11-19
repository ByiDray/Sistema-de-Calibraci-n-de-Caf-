import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, type Calibracion, type Equipo } from '../api';
import type { CafeProps } from '../navegacion';
import { color, DIAGNOSTICO, espacio, radio, sombra, texto } from '../tema';
import { Boton, Campo, CampoNumerico, Cargando, ErrorCarga, Fila, Seccion, Selector, Tarjeta, useAviso } from '../ui';
import { aNumero, calcularDerivados, CONSEJO, mensajeError, num } from '../utilidades';

type Clave = 'dosisInG' | 'ajusteMolienda' | 'temperaturaC' | 'presionBar' | 'yieldOutG' | 'tiempoSegundos' | 'tdsPorcentaje' | 'calificacionSabor';
type Def = { etiqueta: string; unidad?: string; paso?: number; min: number; max: number; minExclusivo?: boolean; placeholder: string };

// Rangos tomados de apps/api/src/validacion.ts (diccionario de datos).
const CAMPOS: Record<Clave, Def> = {
  dosisInG: { etiqueta: 'Dosis', unidad: 'g', paso: 0.1, min: 0, max: 999, minExclusivo: true, placeholder: '18' },
  ajusteMolienda: { etiqueta: 'Molienda', paso: 0.25, min: 0, max: 99, minExclusivo: true, placeholder: '2.5' },
  temperaturaC: { etiqueta: 'Temperatura', unidad: '°C', paso: 0.5, min: 0, max: 100, placeholder: '93' },
  presionBar: { etiqueta: 'Presión', unidad: 'bar', paso: 0.5, min: 0, max: 15, placeholder: '9' },
  yieldOutG: { etiqueta: 'Bebida', unidad: 'g', paso: 0.5, min: 0, max: 999, minExclusivo: true, placeholder: '36' },
  tiempoSegundos: { etiqueta: 'Tiempo', unidad: 's', paso: 1, min: 0, max: 9999, minExclusivo: true, placeholder: '28' },
  tdsPorcentaje: { etiqueta: 'TDS', unidad: '%', paso: 0.05, min: 0, max: 100, minExclusivo: true, placeholder: '9.5' },
  calificacionSabor: { etiqueta: 'Sabor', unidad: '/10', paso: 0.5, min: 0, max: 10, placeholder: '7.5' },
};
const RECETA: Clave[] = ['dosisInG', 'ajusteMolienda', 'temperaturaC', 'presionBar'];
const RESULTADO: Clave[] = ['yieldOutG', 'tiempoSegundos', 'tdsPorcentaje'];

export default function CalibracionFormScreen({ route, navigation }: CafeProps<'CalibracionForm'>) {
  const { idLote, codigo } = route.params;
  const aviso = useAviso();
  const inset = useSafeAreaInsets();
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [anterior, setAnterior] = useState<Calibracion | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [idMolino, setIdMolino] = useState<number | null>(null);
  const [idMaquina, setIdMaquina] = useState<number | null>(null);
  const [v, setV] = useState<Record<Clave, string>>({
    dosisInG: '', ajusteMolienda: '', temperaturaC: '', presionBar: '', yieldOutG: '', tiempoSegundos: '', tdsPorcentaje: '', calificacionSabor: '',
  });
  const [barista, setBarista] = useState('');
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setErrorCarga(null);
    Promise.all([api<Equipo[]>('/equipos'), api<Calibracion[]>(`/calibraciones?idLote=${idLote}`)])
      .then(([eqs, cals]) => {
        setEquipos(eqs);
        const ult = cals[0] ?? null;
        setAnterior(ult);
        const molinos = eqs.filter((e) => e.tipo === 'molino');
        const maquinas = eqs.filter((e) => e.tipo === 'maquina');
        // Se parte de la última receta del lote: así solo se ajusta lo que cambió.
        setIdMolino(ult && molinos.some((m) => m.id === ult.idMolino) ? ult.idMolino : molinos.length === 1 ? molinos[0].id : null);
        setIdMaquina(ult && maquinas.some((m) => m.id === ult.idMaquina) ? ult.idMaquina : maquinas.length === 1 ? maquinas[0].id : null);
        if (ult) {
          setV((p) => ({ ...p, dosisInG: num(ult.dosisInG), ajusteMolienda: num(ult.ajusteMolienda), temperaturaC: num(ult.temperaturaC), presionBar: num(ult.presionBar) }));
          setBarista(ult.baristaNombre);
        }
      })
      .catch((e) => setErrorCarga(mensajeError(e)));
  };
  useEffect(cargar, [idLote]);

  const set = (k: Clave) => (t: string) => { setV((p) => ({ ...p, [k]: t })); setErrores((e) => ({ ...e, [k]: undefined })); };
  const vivo = useMemo(() => calcularDerivados(aNumero(v.dosisInG), aNumero(v.yieldOutG), aNumero(v.tdsPorcentaje)), [v.dosisInG, v.yieldOutG, v.tdsPorcentaje]);

  const guardar = async () => {
    const e: Record<string, string> = {};
    if (!idMolino) e.molino = 'Elige el molino.';
    if (!idMaquina) e.maquina = 'Elige la máquina.';
    const body: Record<string, number> = {};
    (Object.keys(CAMPOS) as Clave[]).forEach((k) => {
      const d = CAMPOS[k];
      const n = aNumero(v[k]);
      if (Number.isNaN(n)) e[k] = `Escribe ${d.etiqueta.toLowerCase()}`;
      else if (d.minExclusivo ? n <= d.min : n < d.min) e[k] = `Mayor que ${d.min}`;
      else if (n > d.max) e[k] = `Máximo ${d.max}`;
      else body[k] = n;
    });
    if (!barista.trim()) e.barista = 'Escribe quién preparó el shot.';
    if (vivo?.ey != null && vivo.ey > 100) e.tdsPorcentaje = 'El EY daría más de 100 %. Revisa TDS, dosis y bebida.';
    setErrores(e);
    if (Object.keys(e).length) return aviso('Revisa los campos marcados en rojo', 'error');

    setGuardando(true);
    try {
      const nueva = await api<Calibracion>('/calibraciones', {
        method: 'POST',
        body: { ...body, idLote, idMolino, idMaquina, baristaNombre: barista.trim(), notasBarista: notas.trim() || null, fechaHora: new Date().toISOString() },
      });
      const d = DIAGNOSTICO[nueva.diagnostico as keyof typeof DIAGNOSTICO];
      aviso(`Guardada · ${d?.etiqueta ?? nueva.diagnostico} · EY ${num(nueva.eyPorcentaje)} %`);
      navigation.goBack();
    } catch (err) {
      aviso(mensajeError(err), 'error');
    } finally { setGuardando(false); }
  };

  if (errorCarga) return <ErrorCarga mensaje={errorCarga} onReintentar={cargar} />;
  if (!equipos) return <Cargando />;

  const molinos = equipos.filter((e) => e.tipo === 'molino');
  const maquinas = equipos.filter((e) => e.tipo === 'maquina');
  const irAEquipos = () => navigation.getParent()?.navigate('EquiposTab', { screen: 'EquipoForm', params: {} });
  const opcionesEquipo = (l: Equipo[]) => l.map((e) => ({ valor: e.id, etiqueta: `${e.marca} ${e.modelo}`, detalle: e.identificadorLocal }));

  const campo = (k: Clave) => {
    const d = CAMPOS[k];
    const prev = anterior && RESULTADO.concat('calificacionSabor').includes(k) ? `Anterior: ${num(anterior[k])}` : undefined;
    return (
      <CampoNumerico key={k} etiqueta={d.etiqueta} unidad={d.unidad} paso={d.paso} min={d.min} max={d.max}
        valor={v[k]} onCambio={set(k)} error={errores[k]} ayuda={prev} placeholder={d.placeholder} obligatorio />
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={s.contenedor} keyboardShouldPersistTaps="handled">
        <Fila style={{ gap: 6 }}>
          <Ionicons name={anterior ? 'refresh-circle-outline' : 'sparkles-outline'} size={18} color={color.textoSuave} />
          <Text style={[texto.pequeno, { flex: 1 }]}>
            {anterior
              ? `Partimos de tu última receta${codigo ? ` del lote ${codigo}` : ''}. Ajusta solo lo que cambiaste.`
              : 'Primera calibración de este lote. Llena la receta y el resultado del shot.'}
          </Text>
        </Fila>

        <Seccion titulo="1 · Equipo">
          <Tarjeta style={{ gap: espacio.l }}>
            {molinos.length === 0 || maquinas.length === 0 ? (
              <View style={{ gap: espacio.s }}>
                <Text style={texto.cuerpo}>Necesitas registrar al menos un molino y una máquina de espresso.</Text>
                <Boton titulo="Ir a Equipos" icono="construct-outline" variante="secundario" onPress={irAEquipos} />
              </View>
            ) : (
              <>
                <Selector etiqueta="Molino" obligatorio opciones={opcionesEquipo(molinos)} valor={idMolino}
                  onCambio={(id) => { setIdMolino(id); setErrores((e) => ({ ...e, molino: undefined })); }} error={errores.molino} />
                <Selector etiqueta="Máquina" obligatorio opciones={opcionesEquipo(maquinas)} valor={idMaquina}
                  onCambio={(id) => { setIdMaquina(id); setErrores((e) => ({ ...e, maquina: undefined })); }} error={errores.maquina} />
              </>
            )}
          </Tarjeta>
        </Seccion>

        <Seccion titulo="2 · Receta">
          <Tarjeta><View style={s.rejilla}>{RECETA.map(campo)}</View></Tarjeta>
        </Seccion>

        <Seccion titulo="3 · Resultado del shot">
          <Tarjeta style={{ gap: espacio.l }}>
            <View style={s.rejilla}>{RESULTADO.map(campo)}</View>
            <PanelResultado vivo={vivo} />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="4 · Cata">
          <Tarjeta style={{ gap: espacio.l }}>
            <View style={s.rejilla}>{campo('calificacionSabor')}</View>
            <Campo etiqueta="Barista" obligatorio value={barista} error={errores.barista}
              onChangeText={(t) => { setBarista(t); setErrores((e) => ({ ...e, barista: undefined })); }} placeholder="¿Quién lo preparó?" />
            <Campo etiqueta="Notas (opcional)" value={notas} onChangeText={setNotas} multiline maxLength={255}
              placeholder="Ej. dulce, cuerpo medio, final un poco astringente" />
          </Tarjeta>
        </Seccion>
      </ScrollView>

      <View style={[s.barraInferior, sombra, { paddingBottom: espacio.m + inset.bottom }]}>
        <ResumenCompacto vivo={vivo} />
        <Boton titulo="Guardar" icono="checkmark" onPress={guardar} cargando={guardando} style={{ minWidth: 130 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

type Vivo = ReturnType<typeof calcularDerivados>;

function PanelResultado({ vivo }: { vivo: Vivo }) {
  if (!vivo) return (
    <View style={[s.panel, { backgroundColor: color.fondo }]}>
      <Ionicons name="calculator-outline" size={20} color={color.textoSuave} />
      <Text style={[texto.pequeno, { flex: 1 }]}>Escribe dosis, bebida y TDS para ver el ratio, el EY y el diagnóstico al instante.</Text>
    </View>
  );
  const d = vivo.diagnostico ? DIAGNOSTICO[vivo.diagnostico] : null;
  return (
    <View style={[s.panel, { backgroundColor: d?.bg ?? color.fondo, flexDirection: 'column', alignItems: 'stretch' }]} accessibilityLiveRegion="polite">
      <Fila style={{ gap: espacio.xl }}>
        <View><Text style={s.panelEtiqueta}>RATIO</Text><Text style={s.panelValor}>{vivo.ratio}</Text></View>
        <View><Text style={s.panelEtiqueta}>EY</Text><Text style={[s.panelValor, d && { color: d.fg }]}>{vivo.ey != null ? `${vivo.ey} %` : '—'}</Text></View>
      </Fila>
      {vivo.ey != null && <MedidorEY ey={vivo.ey} />}
      {d && vivo.diagnostico ? (
        <Fila style={{ gap: 6, alignItems: 'flex-start' }}>
          <Ionicons name={d.icono} size={18} color={d.fg} />
          <Text style={{ flex: 1, color: d.fg, fontWeight: '600' }}>{d.etiqueta}. <Text style={{ fontWeight: '400' }}>{CONSEJO[vivo.diagnostico]}</Text></Text>
        </Fila>
      ) : <Text style={texto.pequeno}>Falta el TDS para calcular el EY.</Text>}
    </View>
  );
}

// Barra de 12 a 28 % con la zona ideal (18–22 %) resaltada.
function MedidorEY({ ey }: { ey: number }) {
  const MIN = 12, MAX = 28;
  const pos = (x: number) => `${((Math.min(MAX, Math.max(MIN, x)) - MIN) / (MAX - MIN)) * 100}%` as const;
  return (
    <View style={{ gap: 4 }}>
      <View style={s.medidor}>
        <View style={[s.zona, { left: pos(18), width: `${(4 / (MAX - MIN)) * 100}%` }]} />
        <View style={[s.aguja, { left: pos(ey) }]} />
      </View>
      <Fila style={{ justifyContent: 'space-between' }}>
        <Text style={s.escala}>Sub</Text><Text style={s.escala}>18 – 22 % ideal</Text><Text style={s.escala}>Sobre</Text>
      </Fila>
    </View>
  );
}

function ResumenCompacto({ vivo }: { vivo: Vivo }) {
  const d = vivo?.diagnostico ? DIAGNOSTICO[vivo.diagnostico] : null;
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.panelEtiqueta}>{vivo?.ey != null ? 'EY · RATIO' : 'RESULTADO'}</Text>
      <Text style={[s.resumen, d && { color: d.fg }]} numberOfLines={1}>
        {vivo?.ey != null ? `${vivo.ey} % · ${vivo.ratio}` : vivo ? vivo.ratio : 'Sin calcular'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: 120 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.m },
  panel: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m, borderRadius: radio.m },
  panelEtiqueta: { fontSize: 11, fontWeight: '700', color: color.textoSuave, letterSpacing: 0.6 },
  panelValor: { fontSize: 24, fontWeight: '800', color: color.texto, fontVariant: ['tabular-nums'] },
  medidor: { height: 10, borderRadius: radio.pill, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: espacio.xs },
  zona: { position: 'absolute', top: 0, bottom: 0, backgroundColor: color.exito, opacity: 0.35, borderRadius: radio.pill },
  aguja: { position: 'absolute', top: -4, width: 4, height: 18, marginLeft: -2, borderRadius: 2, backgroundColor: color.texto },
  escala: { fontSize: 11, color: color.textoSuave },
  barraInferior: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: espacio.m,
    backgroundColor: color.superficie, paddingHorizontal: espacio.l, paddingTop: espacio.m, borderTopWidth: 1, borderColor: color.borde,
  },
  resumen: { fontSize: 18, fontWeight: '800', color: color.texto },
});
