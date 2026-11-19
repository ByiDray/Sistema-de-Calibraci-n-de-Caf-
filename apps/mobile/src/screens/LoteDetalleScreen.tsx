import { useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, type Calibracion, type LoteDetalle } from '../api';
import type { CafeProps } from '../navegacion';
import { color, DIAGNOSTICO, espacio, radio, texto, type Diagnostico } from '../tema';
import { Boton, BotonIcono, Cargando, Dato, ErrorCarga, EstadoVacio, Fila, InsigniaDiagnostico, Seccion, Tarjeta, useAviso } from '../ui';
import { useCarga } from '../useCarga';
import { fechaHora, mensajeError, num } from '../utilidades';
import { TarjetaLote } from './LotesScreen';

export default function LoteDetalleScreen({ route, navigation }: CafeProps<'LoteDetalle'>) {
  const { idLote } = route.params;
  const aviso = useAviso();
  const { datos: lote, error, recargar, setDatos } = useCarga(() => api<LoteDetalle>(`/lotes/${idLote}`), [idLote]);
  const [descriptor, setDescriptor] = useState('');
  const [agregando, setAgregando] = useState(false);

  useLayoutEffect(() => {
    if (!lote) return;
    navigation.setOptions({
      title: lote.codigoLote,
      headerRight: () => <BotonIcono icono="create-outline" etiqueta="Editar lote" onPress={() => navigation.navigate('LoteForm', { idGrano: lote.idGrano, idLote })} />,
    });
  }, [navigation, lote, idLote]);

  if (error && !lote) return <ErrorCarga mensaje={error} onReintentar={recargar} />;
  if (!lote) return <Cargando />;

  const agregarNota = async () => {
    const d = descriptor.trim();
    if (!d) return;
    if (lote.notasCata.some((n) => n.descriptor.toLowerCase() === d.toLowerCase())) return aviso(`“${d}” ya está en las notas`, 'error');
    setAgregando(true);
    try {
      const nueva = await api<LoteDetalle['notasCata'][number]>(`/lotes/${idLote}/notas`, { method: 'POST', body: { descriptor: d } });
      setDatos({ ...lote, notasCata: [...lote.notasCata, nueva] });
      setDescriptor('');
    } catch (e) { aviso(mensajeError(e, { unico: `“${d}” ya está en las notas` }), 'error'); }
    finally { setAgregando(false); }
  };

  const quitarNota = async (id: number) => {
    const antes = lote;
    setDatos({ ...lote, notasCata: lote.notasCata.filter((n) => n.id !== id) });
    try { await api(`/notas/${id}`, { method: 'DELETE' }); }
    catch (e) { setDatos(antes); aviso(mensajeError(e), 'error'); }
  };

  const cals = lote.calibraciones;
  const mejor = cals.reduce<Calibracion | null>((m, c) => (!m || Number(c.calificacionSabor) > Number(m.calificacionSabor) ? c : m), null);
  const calibrar = () => navigation.navigate('CalibracionForm', { idLote, codigo: lote.codigoLote });

  return (
    <ScrollView contentContainerStyle={s.contenedor}>
      <View style={{ gap: espacio.s }}>
        <Text style={texto.titulo}>{lote.grano?.nombreCafe}</Text>
        <TarjetaLote lote={lote} />
      </View>

      <Boton titulo="Nueva calibración" icono="speedometer-outline" onPress={calibrar} deshabilitado={!lote.activo} />
      {!lote.activo && <Text style={[texto.pequeno, { marginTop: -espacio.m }]}>Este lote está inactivo. Actívalo en “Editar” para calibrarlo.</Text>}

      <Seccion titulo="Notas de cata">
        <Tarjeta>
          {lote.notasCata.length === 0 && <Text style={texto.pequeno}>¿A qué sabe? Agrega descriptores como “chocolate”, “cítrico” o “panela”.</Text>}
          <View style={s.notas}>
            {lote.notasCata.map((n) => (
              <View key={n.id} style={s.nota}>
                <Text style={s.notaTexto}>{n.descriptor}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${n.descriptor}`} hitSlop={8} onPress={() => quitarNota(n.id)}>
                  <Ionicons name="close" size={16} color={color.primario} />
                </Pressable>
              </View>
            ))}
          </View>
          <Fila style={{ marginTop: espacio.xs }}>
            <TextInput
              style={[s.inputNota, { outlineWidth: 0 }]} placeholder="Agregar descriptor…" placeholderTextColor={color.textoTenue}
              value={descriptor} onChangeText={setDescriptor} onSubmitEditing={agregarNota} returnKeyType="done"
              accessibilityLabel="Nuevo descriptor de cata" maxLength={80}
            />
            <Boton titulo="Agregar" compacto onPress={agregarNota} cargando={agregando} deshabilitado={!descriptor.trim()} />
          </Fila>
        </Tarjeta>
      </Seccion>

      <Seccion titulo={`Calibraciones (${cals.length})`}>
        {cals.length === 0 ? (
          <EstadoVacio icono="speedometer-outline" titulo="Sin calibraciones"
            mensaje="Registra tu primer shot: dosis, peso de bebida, tiempo y TDS. Calculamos el EY y te decimos si está equilibrado." />
        ) : (
          <>
            {mejor && (
              <Fila style={{ gap: espacio.xl, paddingHorizontal: espacio.xs }}>
                <Dato etiqueta="ÚLTIMO EY" valor={`${num(cals[0].eyPorcentaje)} %`} />
                <Dato etiqueta="MEJOR SABOR" valor={`${num(mejor.calificacionSabor)}/10`} />
                <Dato etiqueta="MEJOR RECETA" valor={`${num(mejor.dosisInG)}→${num(mejor.yieldOutG)} g`} />
              </Fila>
            )}
            {cals.map((c, i) => <TarjetaCalibracion key={c.id} c={c} reciente={i === 0} mejor={c.id === mejor?.id && cals.length > 1} />)}
          </>
        )}
      </Seccion>
    </ScrollView>
  );
}

function TarjetaCalibracion({ c, reciente, mejor }: { c: Calibracion; reciente: boolean; mejor: boolean }) {
  const d = DIAGNOSTICO[c.diagnostico as Diagnostico];
  return (
    <Tarjeta style={[{ borderLeftWidth: 4, borderLeftColor: d?.fg ?? color.borde }]}>
      <Fila style={{ justifyContent: 'space-between' }}>
        <InsigniaDiagnostico diagnostico={c.diagnostico} />
        <Fila style={{ gap: 6 }}>
          {mejor && <Ionicons name="star" size={14} color={color.alerta} accessibilityLabel="Mejor sabor" />}
          <Text style={texto.pequeno}>{reciente ? 'Última · ' : ''}{fechaHora(c.fechaHora)}</Text>
        </Fila>
      </Fila>
      <Fila style={{ gap: espacio.l, flexWrap: 'wrap' }}>
        <Dato etiqueta="EY" valor={`${num(c.eyPorcentaje)} %`} destacado />
        <Dato etiqueta="RATIO" valor={c.ratioCalculado} destacado />
        <Dato etiqueta="TIEMPO" valor={`${num(c.tiempoSegundos)} s`} destacado />
        <Dato etiqueta="SABOR" valor={`${num(c.calificacionSabor)}/10`} destacado />
      </Fila>
      <Text style={texto.pequeno}>
        {num(c.dosisInG)} g → {num(c.yieldOutG)} g · molienda {num(c.ajusteMolienda)} · {num(c.temperaturaC)} °C · {num(c.presionBar)} bar · TDS {num(c.tdsPorcentaje)} %
      </Text>
      <Fila style={{ gap: 4 }}>
        <Ionicons name="person-outline" size={13} color={color.textoSuave} />
        <Text style={texto.pequeno}>{c.baristaNombre}</Text>
      </Fila>
      {c.notasBarista && <Text style={s.notaBarista}>“{c.notasBarista}”</Text>}
    </Tarjeta>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: espacio.xxl * 2 },
  notas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  nota: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: color.primarioSuave,
    paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: radio.pill,
  },
  notaTexto: { color: color.primario, fontWeight: '600', fontSize: 14 },
  inputNota: {
    flex: 1, borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: radio.s, paddingHorizontal: espacio.m,
    minHeight: 40, fontSize: 15, color: color.texto, backgroundColor: color.superficie,
  },
  notaBarista: { ...texto.pequeno, fontStyle: 'italic', color: color.texto },
});
