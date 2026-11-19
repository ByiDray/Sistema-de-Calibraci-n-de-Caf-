// Componentes reutilizables de la interfaz. Todas las pantallas se construyen con estas piezas
// para que la app se vea y se comporte igual en todas partes.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, DIAGNOSTICO, espacio, radio, sombra, texto, type Diagnostico } from './tema';

export type Icono = keyof typeof Ionicons.glyphMap;

// ---------- Botón ----------
type BotonProps = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro' | 'texto';
  icono?: Icono;
  cargando?: boolean;
  deshabilitado?: boolean;
  compacto?: boolean;
  style?: StyleProp<ViewStyle>;
};
export function Boton({ titulo, onPress, variante = 'primario', icono, cargando, deshabilitado, compacto, style }: BotonProps) {
  const v = VARIANTES[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        s.boton, compacto && s.botonCompacto,
        { backgroundColor: pressed ? v.bgPress : v.bg, borderColor: v.borde },
        inactivo && { opacity: 0.55 }, style,
      ]}
    >
      {cargando ? <ActivityIndicator color={v.fg} /> : icono && <Ionicons name={icono} size={compacto ? 16 : 18} color={v.fg} />}
      <Text style={[s.botonTexto, compacto && { fontSize: 14 }, { color: v.fg }]}>{titulo}</Text>
    </Pressable>
  );
}
const VARIANTES = {
  primario: { bg: color.primario, bgPress: color.primarioPresionado, fg: color.sobrePrimario, borde: color.primario },
  secundario: { bg: color.superficie, bgPress: color.primarioSuave, fg: color.primario, borde: color.bordeFuerte },
  peligro: { bg: color.superficie, bgPress: color.peligroSuave, fg: color.peligro, borde: color.peligro },
  texto: { bg: 'transparent', bgPress: color.primarioSuave, fg: color.primario, borde: 'transparent' },
};

export function BotonIcono({ icono, onPress, etiqueta, tono = color.primario }: { icono: Icono; onPress: () => void; etiqueta: string; tono?: string }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={8} onPress={onPress}
      style={({ pressed }) => [s.botonIcono, pressed && { backgroundColor: color.primarioSuave }]}
    >
      <Ionicons name={icono} size={22} color={tono} />
    </Pressable>
  );
}

export function BotonFlotante({ titulo, icono = 'add', onPress }: { titulo: string; icono?: Icono; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={titulo} onPress={onPress}
      style={({ pressed }) => [s.fab, sombra, pressed && { backgroundColor: color.primarioPresionado }]}
    >
      <Ionicons name={icono} size={22} color={color.sobrePrimario} />
      <Text style={s.fabTexto}>{titulo}</Text>
    </Pressable>
  );
}

// ---------- Contenedores ----------
export function Tarjeta({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  if (!onPress) return <View style={[s.tarjeta, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [s.tarjeta, pressed && { backgroundColor: color.superficieAlt, transform: [{ scale: 0.99 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

export function Seccion({ titulo, accion, children, style }: { titulo: string; accion?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: espacio.s }, style]}>
      <View style={s.seccionCabecera}>
        <Text style={s.seccionTitulo} accessibilityRole="header">{titulo.toUpperCase()}</Text>
        {accion}
      </View>
      {children}
    </View>
  );
}

export function Fila({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: espacio.s }, style]}>{children}</View>;
}

// ---------- Formularios ----------
type CampoProps = TextInputProps & { etiqueta: string; error?: string | null; ayuda?: string; obligatorio?: boolean };
export function Campo({ etiqueta, error, ayuda, obligatorio, style, ...resto }: CampoProps) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={{ gap: espacio.xs }}>
      <Text style={s.etiqueta}>{etiqueta}{obligatorio && <Text style={{ color: color.peligro }}> *</Text>}</Text>
      <TextInput
        placeholderTextColor={color.textoTenue}
        accessibilityLabel={etiqueta}
        {...resto}
        onFocus={(e) => { setFoco(true); resto.onFocus?.(e); }}
        onBlur={(e) => { setFoco(false); resto.onBlur?.(e); }}
        style={[s.input, s.sinContorno, foco && s.inputFoco, !!error && s.inputError, resto.multiline && { minHeight: 80, textAlignVertical: 'top' }, style]}
      />
      {error ? <MensajeCampo texto={error} error /> : ayuda ? <MensajeCampo texto={ayuda} /> : null}
    </View>
  );
}

function MensajeCampo({ texto: t, error }: { texto: string; error?: boolean }) {
  return (
    <Fila style={{ gap: espacio.xs, alignItems: 'flex-start' }}>
      {error && <Ionicons name="alert-circle" size={14} color={color.peligro} style={{ marginTop: 1 }} />}
      <Text style={[s.ayuda, error && { color: color.peligro }]}>{t}</Text>
    </Fila>
  );
}

type CampoNumericoProps = {
  etiqueta: string; valor: string; onCambio: (v: string) => void; paso?: number; unidad?: string;
  error?: string | null; ayuda?: string; obligatorio?: boolean; placeholder?: string; min?: number; max?: number;
};
// Campo numérico con botones − y + para ajustes finos sin abrir el teclado.
export function CampoNumerico({ etiqueta, valor, onCambio, paso, unidad, error, ayuda, obligatorio, placeholder, min = 0, max = 9999 }: CampoNumericoProps) {
  const [foco, setFoco] = useState(false);
  const mover = (dir: 1 | -1) => {
    const actual = Number(valor.replace(',', '.'));
    const sugerido = Number(placeholder);
    const base = Number.isNaN(actual) || valor.trim() === '' ? (Number.isNaN(sugerido) ? min : sugerido - dir * (paso ?? 1)) : actual;
    const dec = String(paso).split('.')[1]?.length ?? 0;
    const nuevo = Math.min(max, Math.max(min, base + dir * (paso ?? 1)));
    onCambio(nuevo.toFixed(dec).replace(/\.0+$/, ''));
  };
  return (
    <View style={{ gap: espacio.xs, flex: 1, minWidth: 140 }}>
      <Text style={s.etiqueta} numberOfLines={1}>{etiqueta}{obligatorio && <Text style={{ color: color.peligro }}> *</Text>}</Text>
      <View style={[s.input, s.numerico, foco && s.inputFoco, !!error && s.inputError]}>
        {paso !== undefined && <BotonPaso icono="remove" etiqueta={`Bajar ${etiqueta}`} onPress={() => mover(-1)} />}
        <TextInput
          value={valor} onChangeText={onCambio} keyboardType="decimal-pad" placeholder={placeholder}
          placeholderTextColor={color.textoTenue} accessibilityLabel={etiqueta}
          onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
          style={[s.numericoInput, s.sinContorno, paso === undefined && { textAlign: 'left' }]}
        />
        {unidad && <Text style={s.unidad}>{unidad}</Text>}
        {paso !== undefined && <BotonPaso icono="add" etiqueta={`Subir ${etiqueta}`} onPress={() => mover(1)} />}
      </View>
      {error ? <MensajeCampo texto={error} error /> : ayuda ? <MensajeCampo texto={ayuda} /> : null}
    </View>
  );
}
function BotonPaso({ icono, etiqueta, onPress }: { icono: Icono; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={etiqueta} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [s.paso, pressed && { backgroundColor: color.primarioSuave }]}>
      <Ionicons name={icono} size={18} color={color.primario} />
    </Pressable>
  );
}

type Opcion<T> = { valor: T; etiqueta: string; detalle?: string };
export function Selector<T extends string | number>({ etiqueta, opciones, valor, onCambio, error, obligatorio }: {
  etiqueta?: string; opciones: Opcion<T>[]; valor: T | null; onCambio: (v: T) => void; error?: string | null; obligatorio?: boolean;
}) {
  return (
    <View style={{ gap: espacio.xs }}>
      {etiqueta && <Text style={s.etiqueta}>{etiqueta}{obligatorio && <Text style={{ color: color.peligro }}> *</Text>}</Text>}
      <View style={s.chips} accessibilityRole="radiogroup">
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)} onPress={() => onCambio(o.valor)}
              accessibilityRole="radio" accessibilityState={{ selected: activo }} accessibilityLabel={o.etiqueta}
              style={({ pressed }) => [s.chip, activo && s.chipActivo, pressed && !activo && { backgroundColor: color.primarioSuave }]}
            >
              {activo && <Ionicons name="checkmark" size={15} color={color.sobrePrimario} />}
              <View>
                <Text style={[s.chipTexto, activo && { color: color.sobrePrimario }]}>{o.etiqueta}</Text>
                {o.detalle && <Text style={[s.chipDetalle, activo && { color: '#E9DCD1' }]}>{o.detalle}</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
      {error && <MensajeCampo texto={error} error />}
    </View>
  );
}

export function Buscador({ valor, onCambio, placeholder }: { valor: string; onCambio: (v: string) => void; placeholder: string }) {
  return (
    <View style={[s.input, s.buscador]}>
      <Ionicons name="search" size={18} color={color.textoTenue} />
      <TextInput
        value={valor} onChangeText={onCambio} placeholder={placeholder} placeholderTextColor={color.textoTenue}
        accessibilityLabel={placeholder} style={[s.sinContorno, { flex: 1, fontSize: 15, color: color.texto, paddingVertical: 0 }]}
      />
      {valor !== '' && <BotonIcono icono="close-circle" etiqueta="Limpiar búsqueda" tono={color.textoTenue} onPress={() => onCambio('')} />}
    </View>
  );
}

// ---------- Indicadores ----------
export function Insignia({ texto: t, fg = color.primario, bg = color.primarioSuave, icono }: { texto: string; fg?: string; bg?: string; icono?: Icono }) {
  return (
    <View style={[s.insignia, { backgroundColor: bg }]}>
      {icono && <Ionicons name={icono} size={13} color={fg} />}
      <Text style={[s.insigniaTexto, { color: fg }]}>{t}</Text>
    </View>
  );
}

export function InsigniaDiagnostico({ diagnostico }: { diagnostico: string }) {
  const d = DIAGNOSTICO[diagnostico as Diagnostico];
  if (!d) return <Insignia texto={diagnostico} />;
  return <Insignia texto={d.etiqueta} fg={d.fg} bg={d.bg} icono={d.icono} />;
}

export function BarraProgreso({ valor, tono = color.primario }: { valor: number; tono?: string }) {
  const v = Math.max(0, Math.min(1, valor));
  return (
    <View style={s.barra} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <View style={[s.barraRelleno, { width: `${v * 100}%`, backgroundColor: tono }]} />
    </View>
  );
}

export function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <View style={{ gap: 2, minWidth: 64 }}>
      <Text style={s.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[s.datoValor, destacado && { fontSize: 20 }]}>{valor}</Text>
    </View>
  );
}

// ---------- Estados de pantalla ----------
export function Cargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <View style={s.centro}>
      <ActivityIndicator size="large" color={color.primario} />
      <Text style={texto.pequeno}>{mensaje}</Text>
    </View>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <View style={s.centro}>
      <View style={[s.circulo, { backgroundColor: color.peligroSuave }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={color.peligro} />
      </View>
      <Text style={texto.subtitulo}>No pudimos cargar la información</Text>
      <Text style={[texto.pequeno, { textAlign: 'center' }]}>{mensaje}</Text>
      <Text style={[texto.pequeno, { textAlign: 'center' }]}>Si el servidor estaba dormido, puede tardar hasta un minuto en despertar.</Text>
      <Boton titulo="Reintentar" icono="refresh" onPress={onReintentar} style={{ marginTop: espacio.s }} />
    </View>
  );
}

export function EstadoVacio({ icono, titulo, mensaje, accion }: { icono: Icono; titulo: string; mensaje?: string; accion?: ReactNode }) {
  return (
    <View style={[s.centro, { paddingVertical: espacio.xxl }]}>
      <View style={s.circulo}><Ionicons name={icono} size={32} color={color.primario} /></View>
      <Text style={[texto.subtitulo, { textAlign: 'center' }]}>{titulo}</Text>
      {mensaje && <Text style={[texto.pequeno, { textAlign: 'center', maxWidth: 300 }]}>{mensaje}</Text>}
      {accion && <View style={{ marginTop: espacio.s }}>{accion}</View>}
    </View>
  );
}

// ---------- Avisos breves (toast) ----------
type Aviso = { texto: string; tipo: 'exito' | 'error' };
const AvisoCtx = createContext<(texto: string, tipo?: Aviso['tipo']) => void>(() => {});
export const useAviso = () => useContext(AvisoCtx);

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const opacidad = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mostrar = useCallback((t: string, tipo: Aviso['tipo'] = 'exito') => {
    clearTimeout(timer.current);
    setAviso({ texto: t, tipo });
    Animated.timing(opacidad, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacidad, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => setAviso(null));
    }, tipo === 'error' ? 4500 : 2800);
  }, [opacidad]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <AvisoCtx.Provider value={mostrar}>
      {children}
      {aviso && (
        <Animated.View pointerEvents="none" style={[s.toast, sombra, { opacity: opacidad }, aviso.tipo === 'error' && { backgroundColor: color.peligro }]}
          accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Ionicons name={aviso.tipo === 'error' ? 'alert-circle' : 'checkmark-circle'} size={20} color="#fff" />
          <Text style={s.toastTexto}>{aviso.texto}</Text>
        </Animated.View>
      )}
    </AvisoCtx.Provider>
  );
}

const s = StyleSheet.create({
  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacio.s,
    minHeight: 48, paddingHorizontal: espacio.l, borderRadius: radio.m, borderWidth: 1,
  },
  botonCompacto: { minHeight: 36, paddingHorizontal: espacio.m, borderRadius: radio.s },
  botonTexto: { fontSize: 16, fontWeight: '600' },
  botonIcono: { width: 40, height: 40, borderRadius: radio.pill, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', right: espacio.l, bottom: espacio.l, flexDirection: 'row', alignItems: 'center', gap: espacio.s,
    backgroundColor: color.primario, paddingHorizontal: espacio.l + 2, height: 52, borderRadius: radio.pill,
  },
  fabTexto: { color: color.sobrePrimario, fontWeight: '700', fontSize: 15 },
  tarjeta: {
    backgroundColor: color.superficie, borderRadius: radio.l, padding: espacio.l, gap: espacio.s,
    borderWidth: 1, borderColor: color.borde,
  },
  seccionCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
  seccionTitulo: { ...texto.etiqueta, fontSize: 12, letterSpacing: 0.8 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: color.texto },
  input: {
    backgroundColor: color.superficie, borderWidth: 1, borderColor: color.bordeFuerte, borderRadius: radio.m,
    paddingHorizontal: espacio.m, paddingVertical: espacio.m - 2, fontSize: 16, color: color.texto, minHeight: 48,
  },
  inputFoco: { borderColor: color.primario, borderWidth: 2, paddingHorizontal: espacio.m - 1 },
  // En web el navegador dibuja su propio contorno; el borde de foco ya lo indica.
  sinContorno: { outlineWidth: 0 },
  inputError: { borderColor: color.peligro },
  ayuda: { fontSize: 12.5, color: color.textoSuave, flex: 1 },
  numerico: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: espacio.xs, paddingVertical: 0 },
  numericoInput: { flex: 1, minWidth: 40, fontSize: 17, fontWeight: '600', color: color.texto, textAlign: 'center', paddingVertical: espacio.s },
  unidad: { color: color.textoSuave, fontSize: 14, marginRight: espacio.xs },
  paso: { width: 36, height: 36, borderRadius: radio.s, alignItems: 'center', justifyContent: 'center', backgroundColor: color.fondo },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radio.pill, borderWidth: 1, borderColor: color.bordeFuerte, backgroundColor: color.superficie,
  },
  chipActivo: { backgroundColor: color.primario, borderColor: color.primario },
  chipTexto: { fontSize: 14.5, color: color.texto, fontWeight: '500' },
  chipDetalle: { fontSize: 11.5, color: color.textoSuave },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, paddingVertical: 0 },
  insignia: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radio.pill, alignSelf: 'flex-start' },
  insigniaTexto: { fontSize: 12.5, fontWeight: '600' },
  barra: { height: 8, borderRadius: radio.pill, backgroundColor: color.primarioSuave, overflow: 'hidden' },
  barraRelleno: { height: '100%', borderRadius: radio.pill },
  datoEtiqueta: { fontSize: 11.5, color: color.textoSuave, fontWeight: '600', letterSpacing: 0.4 },
  datoValor: { fontSize: 16, fontWeight: '700', color: color.texto },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.xl, gap: espacio.s, backgroundColor: color.fondo },
  circulo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: color.primarioSuave, marginBottom: espacio.s },
  toast: {
    position: 'absolute', left: espacio.l, right: espacio.l, top: 64, alignSelf: 'center', maxWidth: 480,
    flexDirection: 'row', alignItems: 'center', gap: espacio.s, backgroundColor: color.texto,
    paddingHorizontal: espacio.l, paddingVertical: espacio.m, borderRadius: radio.m,
  },
  toastTexto: { color: '#fff', fontSize: 14.5, flex: 1, fontWeight: '500' },
});
