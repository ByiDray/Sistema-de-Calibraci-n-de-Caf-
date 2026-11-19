import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, type Equipo } from '../api';
import type { EquiposProps } from '../navegacion';
import { color, espacio, texto } from '../tema';
import { Boton, Campo, Cargando, Selector, Tarjeta, useAviso } from '../ui';
import { confirmar, mensajeError } from '../utilidades';

type Errores = Partial<Record<'marca' | 'modelo' | 'codigo', string>>;

export default function EquipoFormScreen({ route, navigation }: EquiposProps<'EquipoForm'>) {
  const idEquipo = route.params?.idEquipo;
  const editando = idEquipo !== undefined;
  const aviso = useAviso();
  const [cargando, setCargando] = useState(editando);
  const [tipo, setTipo] = useState<Equipo['tipo']>(route.params?.tipo ?? 'molino');
  const [f, setF] = useState({ marca: '', modelo: '', codigo: '' });
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => { setF((p) => ({ ...p, [k]: v })); setErrores((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!editando) return;
    // La API no tiene GET /equipos/:id; se toma de la lista.
    api<Equipo[]>('/equipos').then((lista) => {
      const e = lista.find((x) => x.id === idEquipo);
      if (!e) throw new Error('El equipo ya no existe.');
      setTipo(e.tipo); setF({ marca: e.marca, modelo: e.modelo, codigo: e.identificadorLocal });
    }).catch((e) => aviso(mensajeError(e), 'error')).finally(() => setCargando(false));
  }, [editando, idEquipo, aviso]);

  const guardar = async () => {
    const e: Errores = {};
    if (!f.marca.trim()) e.marca = 'Escribe la marca.';
    if (!f.modelo.trim()) e.modelo = 'Escribe el modelo.';
    if (!f.codigo.trim()) e.codigo = 'Asigna un código corto para reconocerlo.';
    setErrores(e);
    if (Object.keys(e).length) return;
    const body = { tipo, marca: f.marca.trim(), modelo: f.modelo.trim(), identificadorLocal: f.codigo.trim().toUpperCase() };
    setGuardando(true);
    try {
      if (editando) await api(`/equipos/${idEquipo}`, { method: 'PUT', body });
      else await api('/equipos', { method: 'POST', body });
      aviso(editando ? 'Equipo actualizado' : `${body.marca} ${body.modelo} agregado`);
      navigation.goBack();
    } catch (err) {
      const m = mensajeError(err, { unico: 'Ya existe un equipo con ese código.' });
      if (m.startsWith('Ya existe')) setErrores({ codigo: m }); else aviso(m, 'error');
    } finally { setGuardando(false); }
  };

  const eliminar = async () => {
    if (!(await confirmar('Eliminar equipo', `Se eliminará ${f.marca} ${f.modelo}.`))) return;
    try {
      await api(`/equipos/${idEquipo}`, { method: 'DELETE' });
      aviso('Equipo eliminado');
      navigation.goBack();
    } catch (err) {
      aviso(mensajeError(err, { enUso: 'No se puede eliminar: este equipo aparece en calibraciones.' }), 'error');
    }
  };

  if (cargando) return <Cargando />;

  return (
    <ScrollView contentContainerStyle={s.contenedor} keyboardShouldPersistTaps="handled">
      <Tarjeta style={{ gap: espacio.l }}>
        <Selector etiqueta="Tipo de equipo" obligatorio valor={tipo} onCambio={setTipo}
          opciones={[{ valor: 'molino', etiqueta: 'Molino' }, { valor: 'maquina', etiqueta: 'Máquina de espresso' }]} />
        <Campo etiqueta="Marca" obligatorio value={f.marca} onChangeText={set('marca')} error={errores.marca}
          placeholder={tipo === 'molino' ? 'Ej. Eureka' : 'Ej. La Marzocco'} />
        <Campo etiqueta="Modelo" obligatorio value={f.modelo} onChangeText={set('modelo')} error={errores.modelo}
          placeholder={tipo === 'molino' ? 'Ej. Mignon Specialita' : 'Ej. Linea Mini'} />
        <Campo etiqueta="Código" obligatorio value={f.codigo} onChangeText={set('codigo')} error={errores.codigo}
          autoCapitalize="characters" placeholder={tipo === 'molino' ? 'MOL-01' : 'MAQ-01'}
          ayuda="Un código corto para distinguirlo si tienes varios iguales." />
      </Tarjeta>
      <Boton titulo={editando ? 'Guardar cambios' : 'Agregar equipo'} icono="checkmark" onPress={guardar} cargando={guardando} />
      {editando && (
        <View style={s.peligro}>
          <Text style={texto.pequeno}>Solo puedes eliminar equipos que no se hayan usado en calibraciones.</Text>
          <Boton titulo="Eliminar equipo" icono="trash-outline" variante="peligro" onPress={eliminar} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: espacio.l, gap: espacio.xl, paddingBottom: espacio.xxl * 2 },
  peligro: { gap: espacio.s, paddingTop: espacio.l, borderTopWidth: 1, borderColor: color.borde },
});
