import { z } from "zod";

// Reglas tomadas del diccionario de datos (documento A2).
const texto = (max: number) => z.string().trim().min(1, "No puede estar vacío").max(max, `Máximo ${max} caracteres`);
const textoOpc = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).nullish().transform((v) => (v === undefined ? undefined : v || null));
const num = (min: number, max: number, minExclusivo = false) => {
  const n = z.number({ invalid_type_error: "Debe ser un número" });
  return (minExclusivo ? n.gt(min, `Debe ser mayor que ${min}`) : n.gte(min, `Debe ser al menos ${min}`)).lte(max, `Debe ser máximo ${max}`);
};

export const PROCESOS = ["Lavado", "Natural", "Honey", "Anaeróbico"] as const;
export const NIVELES_TUESTE = ["Claro", "Medio", "Oscuro"] as const;
export const TIPOS_EQUIPO = ["molino", "maquina"] as const;
export const DIAGNOSTICOS = ["EQUILIBRADA", "SUBEXTRAIDA", "SOBREEXTRAIDA"] as const;

export const granoSchema = z.object({
  nombreCafe: texto(100),
  finca: textoOpc(100),
  productor: textoOpc(100),
  paisOrigen: texto(50),
  region: textoOpc(100),
  varietal: textoOpc(50),
  proceso: z.enum(PROCESOS, { errorMap: () => ({ message: `Debe ser: ${PROCESOS.join(", ")}` }) }),
  puntuacionSca: num(0, 100),
});

export const loteSchema = z
  .object({
    idGrano: z.number().int().positive(),
    codigoLote: texto(30),
    tostaduria: texto(100),
    fechaTueste: z.coerce.date({ errorMap: () => ({ message: "Fecha inválida" }) }),
    nivelTueste: z.enum(NIVELES_TUESTE, { errorMap: () => ({ message: `Debe ser: ${NIVELES_TUESTE.join(", ")}` }) }),
    pesoInicialG: num(0, 99999999, true),
    pesoActualG: num(0, 99999999),
    activo: z.boolean(),
  })
  .refine((l) => l.pesoActualG <= l.pesoInicialG, {
    path: ["pesoActualG"],
    message: "El peso actual no puede ser mayor que el peso inicial",
  });

export const equipoSchema = z.object({
  tipo: z.enum(TIPOS_EQUIPO, { errorMap: () => ({ message: "Debe ser: molino o maquina" }) }),
  marca: texto(50),
  modelo: texto(50),
  identificadorLocal: texto(20),
});

export const calibracionSchema = z.object({
  idLote: z.number().int().positive(),
  idMolino: z.number().int().positive(),
  idMaquina: z.number().int().positive(),
  fechaHora: z.coerce.date({ errorMap: () => ({ message: "Fecha y hora inválidas" }) }),
  dosisInG: num(0, 999, true),
  ajusteMolienda: num(0, 99, true),
  temperaturaC: num(0, 100),
  presionBar: num(0, 15),
  yieldOutG: num(0, 999, true),
  tiempoSegundos: num(0, 9999, true),
  tdsPorcentaje: num(0, 100, true),
  calificacionSabor: num(0, 10),
  notasBarista: textoOpc(255),
  baristaNombre: texto(100),
});

export const notaSchema = z.object({ descriptor: texto(80) });

// Convierte los Decimal de Prisma a number para volver a validar un registro completo.
export function aNumeros<T extends Record<string, unknown>>(registro: T, campos: string[]) {
  const copia: Record<string, unknown> = { ...registro };
  for (const c of campos) if (copia[c] != null) copia[c] = Number(copia[c]);
  return copia;
}
