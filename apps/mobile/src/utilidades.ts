import { Alert, Platform } from 'react-native';
import type { Diagnostico } from './tema';

// Misma lógica que apps/api/src/calculos.ts, para mostrar el resultado mientras se captura.
// La base de datos sigue siendo la fuente de verdad al guardar.
const redondear = (valor: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round((valor + 1e-9) * f) / f;
};

export function calcularDerivados(dosisInG: number, yieldOutG: number, tdsPorcentaje: number) {
  if (!(dosisInG > 0) || !(yieldOutG > 0)) return null;
  const ratio = `1:${redondear(yieldOutG / dosisInG, 1).toFixed(1)}`;
  if (!(tdsPorcentaje > 0)) return { ratio, ey: null, diagnostico: null };
  const ey = redondear((tdsPorcentaje * yieldOutG) / dosisInG, 2);
  const diagnostico: Diagnostico = ey < 18 ? 'SUBEXTRAIDA' : ey > 22 ? 'SOBREEXTRAIDA' : 'EQUILIBRADA';
  return { ratio, ey, diagnostico };
}

export const CONSEJO: Record<Diagnostico, string> = {
  EQUILIBRADA: 'Extracción dentro del rango ideal (18–22 %).',
  SUBEXTRAIDA: 'Prueba moler más fino, subir la temperatura o alargar el tiempo.',
  SOBREEXTRAIDA: 'Prueba moler más grueso, bajar la temperatura o acortar el tiempo.',
};

export const aNumero = (t: string) => (t.trim() === '' ? NaN : Number(t.replace(',', '.')));
export const num = (v: string | number) => {
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fechaCorta = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
};
export const fechaHora = (iso: string) => {
  const f = new Date(iso);
  return `${f.getDate()} ${MESES[f.getMonth()]} · ${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
};
export const diasDesde = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  const ini = Date.UTC(a, m - 1, d);
  const fin = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fin - ini) / 86400000);
};
export const haceDias = (iso: string) => {
  const n = diasDesde(iso);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  return `hace ${n} días`;
};

// Traduce errores técnicos de la API a algo que el usuario entienda.
export function mensajeError(e: unknown, contexto?: { unico?: string; enUso?: string }) {
  const m = e instanceof Error ? e.message : String(e);
  if (/Unique|P2002/i.test(m) && contexto?.unico) return contexto.unico;
  if (/Foreign key|P2003|violates/i.test(m) && contexto?.enUso) return contexto.enUso;
  if (/Failed to fetch|Network request failed/i.test(m)) return 'Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  return m;
}

// Alert.alert con botones no funciona en web; esta función sirve en ambos.
export function confirmar(titulo: string, mensaje: string, accion = 'Eliminar'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  return new Promise((resolve) =>
    Alert.alert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: accion, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
