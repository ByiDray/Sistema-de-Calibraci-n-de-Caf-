// Campos derivados de CALIBRACIONES (redundancia controlada, ver documento A2).
// ratio = yield_out_g / dosis_in_g ; EY = tds_porcentaje * yield_out_g / dosis_in_g
// Diagnóstico: EQUILIBRADA si 18 <= EY <= 22, SUBEXTRAIDA si < 18, SOBREEXTRAIDA si > 22.

export function calcularDerivados(dosisInG: number, yieldOutG: number, tdsPorcentaje: number) {
  const ratio = yieldOutG / dosisInG;
  const ey = (tdsPorcentaje * yieldOutG) / dosisInG;
  const diagnostico = ey < 18 ? "SUBEXTRAIDA" : ey > 22 ? "SOBREEXTRAIDA" : "EQUILIBRADA";
  return {
    ratioCalculado: `1:${ratio.toFixed(1)}`,
    eyPorcentaje: Number(ey.toFixed(2)),
    diagnostico,
  };
}
