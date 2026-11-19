import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, type Grano } from '../api';
import type { CafeProps } from '../navegacion';
import { color, espacio, texto } from '../tema';
import { Boton, Campo, CampoNumerico, Cargando, Seccion, Selector, Tarjeta, useAviso } from '../ui';
import { aNumero, confirmar, mensajeError, num } from '../utilidades';
import { PROCESOS } from './GranosScreen';

type Errores = Partial<Record<'nombre' | 'pais' | 'proceso' | 'sca', string>>;

export default function GranoFormScreen({ route, navigation }: CafeProps<'GranoForm'>) {
  const idGrano = route.params?.idGrano;
  const editando = idGrano !== undefined;
  const aviso = useAviso();
  const [cargando, setCargando] = useState(editando);
  const [f, setF] = useState({ nombre: '', pais: '', region: '', finca: '', productor: '', varietal: '', proceso: '', sca: '' });
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => { setF((p) => ({ ...p, [k]: v })); setErrores((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!editando) return;
    api<Grano>(`/granos/${idGrano}`).then((g) => setF({
      nombre: g.nombreCafe, pais: g.paisOrigen, region: g.region ?? '', finca: g.finca ?? '', productor: g.productor ?? '',
      varietal: g.varietal ?? '', proceso: g.proceso, sca: num(g.puntuacionSca),
    })).catch((e) => aviso(mensajeError(e), 'error')).finally(() => setCargando(false));
  }, [editando, idGrano, aviso]);

  const validar = () => {
    const e: Errores = {};
    if (!f.nombre.trim()) e.nombre = 'Escribe el nombre del café.';
    if (!f.pais.trim()) e.pais = 'Indica el país de origen.';
    if (!f.proceso) e.proceso = 'Elige el proceso.';
    const sca = aNumero(f.sca);
    if (Number.isNaN(sca)) e.sca = 'Escribe la puntuación SCA.';
    else if (sca < 0 || sca > 100) e.sca = 'La puntuación va de 0 a 100.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    const body = {
      nombreCafe: f.nombre.trim(), paisOrigen: f.pais.trim(), proceso: f.proceso, puntuacionSca: aNumero(f.sca),
      region: f.region.trim() || null, finca: f.finca.trim() || null, productor: f.productor.trim() || null, varietal: f.varietal.trim() || null,
    };
    setGuardando(true);
    try {
      if (editando) await api(`/granos/${idGrano}`, { method: 'PUT', body });
      else await api('/granos', { method: 'POST', body });
      aviso(editando ? 'Cambios guardados' : `“${body.nombreCafe}” agregado`);
      navigation.goBack();
    } catch (e) {
      aviso(mensajeError(e), 'error');
    } finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!(await confirmar('Eliminar café', `Se eliminará “${f.nombre}”. Esta acción no se puede deshacer.`))) return;
    try {
      await api(`/granos/${idGrano}`, { method: 'DELETE' });
      aviso('Café eliminado');
      navigation.popToTop();
    } catch (e) {
      aviso(mensajeError(e, { enUso: 'No se puede eliminar: este café tiene lotes. Elimina primero sus lotes.' }), 'error');
    }
  };

  if (cargando) return <Cargando />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.contenedor} keyboardShouldPersistTaps="handled">
        <Seccion titulo="Lo esencial">
          <Tarjeta style={{ gap: espacio.l }}>
            <Campo etiqueta="Nombre del café" obligatorio value={f.nombre} onChangeText={set('nombre')} error={errores.nombre}
              placeholder="Ej. Pluma Hidalgo" autoFocus={!editando} />
            <Campo etiqueta="País de origen" obligatorio value={f.pais} onChangeText={set('pais')} error={errores.pais} placeholder="Ej. México" />
            <Selector etiqueta="Proceso" obligatorio opciones={PROCESOS.map((p) => ({ valor: p, etiqueta: p }))}
              valor={f.proceso} onCambio={set('proceso')} error={errores.proceso} />
            <CampoNumerico etiqueta="Puntuación SCA" obligatorio valor={f.sca} onCambio={set('sca')} paso={0.25} min={0} max={100}
              placeholder="84" error={errores.sca} ayuda="80 puntos o más se considera café de especialidad." />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Más detalles (opcional)">
          <Tarjeta style={{ gap: espacio.l }}>
            <Campo etiqueta="Región" value={f.region} onChangeText={set('region')} placeholder="Ej. Oaxaca" />
            <Campo etiqueta="Finca" value={f.finca} onChangeText={set('finca')} placeholder="Ej. Finca La Gloria" />
            <Campo etiqueta="Productor" value={f.productor} onChangeText={set('productor')} />
            <Campo etiqueta="Varietal" value={f.varietal} onChangeText={set('varietal')} placeholder="Ej. Typica, Geisha" />
          </Tarjeta>
        </Seccion>

        <Boton titulo={editando ? 'Guardar cambios' : 'Agregar café'} icono="checkmark" onPress={guardar} cargando={guardando} />

        {editando && (
          <View style={s.peligro}>
            <Text style={texto.pequeno}>Solo puedes eliminar un café que no tenga lotes.</Text>
            <Boton titulo="Eliminar café" icono="trash-outline" variante="peligro" onPress={eliminar} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: espacio.xxl * 2 },
  peligro: { gap: espacio.s, paddingTop: espacio.l, borderTopWidth: 1, borderColor: color.borde },
});
