export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export type Grano = {
  id: number; nombreCafe: string; finca: string | null; productor: string | null; paisOrigen: string;
  region: string | null; varietal: string | null; proceso: string; puntuacionSca: string;
};
export type Lote = {
  id: number; idGrano: number; codigoLote: string; tostaduria: string; fechaTueste: string;
  nivelTueste: string; pesoInicialG: string; pesoActualG: string; activo: boolean; grano?: Grano;
};
export type NotaCata = { id: number; idLote: number; descriptor: string };
export type Calibracion = {
  id: number; fechaHora: string; dosisInG: string; yieldOutG: string; tiempoSegundos: string;
  ratioCalculado: string; eyPorcentaje: string; diagnostico: string; calificacionSabor: string;
  baristaNombre: string; notasBarista: string | null;
};
export type LoteDetalle = Lote & { notasCata: NotaCata[]; calibraciones: Calibracion[] };

export async function api<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options?.method ?? "GET",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.EXPO_PUBLIC_API_KEY ?? "" },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Error ${res.status}`);
  return data as T;
}
