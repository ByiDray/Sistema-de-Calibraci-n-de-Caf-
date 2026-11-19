import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api, type Lote } from '../api';
import type { CafeProps } from '../navegacion';
import { color, espacio, texto } from '../tema';
import { Boton, Campo, CampoNumerico, Cargando, Fila, Seccion, Selector, Tarjeta, useAviso } from '../ui';
import { aNumero, confirmar, fechaCorta, mensajeError, num } from '../utilidades';

const NIVELES = ['Claro', 'Medio', 'Oscuro'];
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const restarDias = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type Errores = Partial<Record<'codigo' | 'tostaduria' | 'fecha' | 'inicial' | 'actual', string>>;

export default function LoteFormScreen({ route, navigation }: CafeProps<'LoteForm'>) {
  const { idGrano, idLote } = route.params;
  const editando = idLote !== undefined;
  const aviso = useAviso();
  const [cargando, setCargando] = useState(editando);
  const [f, setF] = useState({ codigo: '', tostaduria: '', fecha: hoyISO(), nivel: 'Medio', inicial: '', actual: '' });
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => { setF((p) => ({ ...p, [k]: v })); setErrores((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!editando) return;
    api<Lote>(`/lotes/${idLote}`).then((l) => {
      setF({
        codigo: l.codigoLote, tostaduria: l.tostaduria, fecha: l.fechaTueste.slice(0, 10), nivel: l.nivelTueste,
        inicial: num(l.pesoInicialG), actual: num(l.pesoActualG),
      });
      setActivo(l.activo);
    }).catch((e) => aviso(mensajeError(e), 'error')).finally(() => setCargando(false));
  }, [editando, idLote, aviso]);

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(f.fecha) && !Number.isNaN(new Date(f.fecha).getTime());

  const validar = () => {
    const e: Errores = {};
    if (!f.codigo.trim()) e.codigo = 'Escribe un código para identificar el lote.';
    if (!f.tostaduria.trim()) e.tostaduria = 'Indica quién lo tostó.';
    if (!fechaValida) e.fecha = 'Usa el formato AAAA-MM-DD, por ejemplo 2026-10-20.';
    else if (f.fecha > hoyISO()) e.fecha = 'La fecha de tueste no puede estar en el futuro.';
    const ini = aNumero(f.inicial);
    if (!(ini > 0)) e.inicial = 'El peso inicial debe ser mayor que 0.';
    if (editando) {
      const act = aNumero(f.actual);
      if (!(act >= 0)) e.actual = 'Escribe cuánto café queda (0 si se terminó).';
      else if (ini > 0 && act > ini) e.actual = 'No puede quedar más café del que había al inicio.';
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    const inicial = aNumero(f.inicial);
    const body = {
      codigoLote: f.codigo.trim().toUpperCase(), tostaduria: f.tostaduria.trim(), fechaTueste: new Date(f.fecha).toISOString(),
      nivelTueste: f.nivel, pesoInicialG: inicial, pesoActualG: editando ? aNumero(f.actual) : inicial, activo,
    };
    setGuardando(true);
    try {
      if (editando) await api(`/lotes/${idLote}`, { method: 'PUT', body });
      else await api('/lotes', { method: 'POST', body: { ...body, idGrano } });
      aviso(editando ? 'Lote actualizado' : `Lote ${body.codigoLote} registrado`);
      navigation.goBack();
    } catch (e) {
      const m = mensajeError(e, { unico: 'Ya existe un lote con ese código. Usa otro.' });
      if (m.startsWith('Ya existe')) setErrores({ codigo: m }); else aviso(m, 'error');
    } finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!(await confirmar('Eliminar lote', `Se eliminará el lote ${f.codigo}. Esta acción no se puede deshacer.`))) return;
    try {
      await api(`/lotes/${idLote}`, { method: 'DELETE' });
      aviso('Lote eliminado');
      navigation.pop(2);
    } catch (e) {
      aviso(mensajeError(e, { enUso: 'No se puede eliminar: el lote tiene calibraciones o notas. Márcalo como inactivo.' }), 'error');
    }
  };

  if (cargando) return <Cargando />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.contenedor} keyboardShouldPersistTaps="handled">
        <Seccion titulo="Identificación">
          <Tarjeta style={{ gap: espacio.l }}>
            <Campo etiqueta="Código del lote" obligatorio value={f.codigo} onChangeText={set('codigo')} error={errores.codigo}
              placeholder="LT-2026-011" autoCapitalize="characters" ayuda="Suele venir impreso en la bolsa." />
            <Campo etiqueta="Tostaduría" obligatorio value={f.tostaduria} onChangeText={set('tostaduria')} error={errores.tostaduria}
              placeholder="Ej. Tostadores del Sur" />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Tueste">
          <Tarjeta style={{ gap: espacio.l }}>
            <View style={{ gap: espacio.s }}>
              <Campo etiqueta="Fecha de tueste" obligatorio value={f.fecha} onChangeText={set('fecha')} error={errores.fecha}
                keyboardType="numbers-and-punctuation" placeholder="AAAA-MM-DD"
                ayuda={fechaValida ? fechaCorta(f.fecha) : 'Formato AAAA-MM-DD'} />
              <Fila style={{ flexWrap: 'wrap' }}>
                {[['Hoy', 0], ['Ayer', 1], ['Hace 1 semana', 7]].map(([t, n]) => (
                  <Boton key={t} titulo={String(t)} compacto variante="secundario" onPress={() => set('fecha')(restarDias(Number(n)))} />
                ))}
              </Fila>
            </View>
            <Selector etiqueta="Nivel de tueste" obligatorio opciones={NIVELES.map((n) => ({ valor: n, etiqueta: n }))} valor={f.nivel} onCambio={set('nivel')} />
          </Tarjeta>
        </Seccion>

        <Seccion titulo="Existencia">
          <Tarjeta style={{ gap: espacio.l }}>
            <Fila style={{ flexWrap: 'wrap', gap: espacio.m, alignItems: 'flex-start' }}>
              <CampoNumerico etiqueta="Peso inicial" obligatorio unidad="g" valor={f.inicial} onCambio={set('inicial')} error={errores.inicial} placeholder="340" />
              {editando && (
                <CampoNumerico etiqueta="Peso actual" obligatorio unidad="g" valor={f.actual} onCambio={set('actual')} error={errores.actual} />
              )}
            </Fila>
            {!editando && <Text style={texto.pequeno}>El peso actual empieza igual al inicial.</Text>}
            <Fila style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[texto.cuerpo, { fontWeight: '600' }]}>Lote activo</Text>
                <Text style={texto.pequeno}>Desactívalo cuando se termine la bolsa.</Text>
              </View>
              <Switch value={activo} onValueChange={setActivo} trackColor={{ true: color.primario, false: color.bordeFuerte }}
                thumbColor={color.superficie} accessibilityLabel="Lote activo" />
            </Fila>
          </Tarjeta>
        </Seccion>

        <Boton titulo={editando ? 'Guardar cambios' : 'Registrar lote'} icono="checkmark" onPress={guardar} cargando={guardando} />

        {editando && (
          <View style={s.peligro}>
            <Text style={texto.pequeno}>Solo puedes eliminar un lote sin calibraciones ni notas.</Text>
            <Boton titulo="Eliminar lote" icono="trash-outline" variante="peligro" onPress={eliminar} />
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
