// Campos derivados de CALIBRACIONES (redundancia controlada, ver documento A2).
// ratio = yield_out_g / dosis_in_g ; EY = tds_porcentaje * yield_out_g / dosis_in_g
// Diagnóstico: EQUILIBRADA si 18 <= EY <= 22, SUBEXTRAIDA si < 18, SOBREEXTRAIDA si > 22.

// Redondeo "mitad hacia arriba" como el de PostgreSQL; toFixed falla en casos como 1.95 (da 1.9).
const redondear = (valor: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round((valor + 1e-9) * f) / f;
};

// Estos mismos cálculos los repite el trigger calibraciones_derivados_trg en la base de datos,
// que es la fuente de verdad: si difieren, prevalece el valor de la base.
export function calcularDerivados(dosisInG: number, yieldOutG: number, tdsPorcentaje: number) {
  const ratio = yieldOutG / dosisInG;
  const ey = redondear((tdsPorcentaje * yieldOutG) / dosisInG, 2);
  const diagnostico = ey < 18 ? "SUBEXTRAIDA" : ey > 22 ? "SOBREEXTRAIDA" : "EQUILIBRADA";
  return {
    ratioCalculado: `1:${redondear(ratio, 1).toFixed(1)}`,
    eyPorcentaje: ey,
    diagnostico,
  };
}
