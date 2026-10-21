import { prisma } from "../src/prisma.js";
import { calcularDerivados } from "../src/calculos.js";

// Datos de ejemplo de la sección 7 del documento A2.
// Las notas de cata se ligan al LOTE del grano correspondiente.

const granos = [
  ["Chiapas Altura Selecta", "Finca La Esperanza", "Cooperativa Sierra Madre", "México", "Chiapas", "Typica", "Lavado", 86.5, "2026-09-15T10:30:00"],
  ["Geisha Boquete", "Finca Lérida", "Hacienda La Esmeralda", "Panamá", "Boquete", "Geisha", "Lavado", 92.5, "2026-09-16T09:00:00"],
  ["Huila Natural", "Finca El Paraíso", "Familia Rojas", "Colombia", "Huila", "Caturra", "Natural", 84.75, "2026-09-17T11:15:00"],
  ["Yirgacheffe Washed", "Kebele Konga", "Cooperativa Konga", "Etiopía", "Yirgacheffe", "Heirloom", "Lavado", 88.0, "2026-09-18T08:40:00"],
  ["Honey Cerrado", "Fazenda Santa Clara", "Familia Almeida", "Brasil", "Cerrado Mineiro", "Bourbon", "Honey", 85.25, "2026-09-19T14:20:00"],
  ["Antigua Bourbon", "Finca Vista Hermosa", "Ana Lucía Morales", "Guatemala", "Antigua", "Bourbon", "Lavado", 87.0, "2026-09-21T09:55:00"],
  ["Nyeri AA", "Gakuyuini", "Cooperativa Nyeri", "Kenia", "Nyeri", "SL28", "Lavado", 89.5, "2026-09-22T10:05:00"],
  ["Cajamarca Natural", "Finca San Jorge", "Asociación Cajamarca", "Perú", "Cajamarca", "Typica", "Natural", 83.0, "2026-09-23T12:30:00"],
  ["Sidama Natural", "Bombe", "Unión Sidama", "Etiopía", "Sidama", "Heirloom", "Natural", 87.75, "2026-09-24T08:10:00"],
  ["Tolima Honey", "Finca La Florida", "Carlos Mendoza", "Colombia", "Tolima", "Castillo", "Honey", 82.5, "2026-09-25T15:45:00"],
] as const;

// [tostaduria, fecha_tueste, nivel, peso_inicial, peso_actual, activo]
const lotes = [
  ["Tostaduría Local", "2026-09-20", "Medio", 1000, 850.5, true],
  ["Tostaduría Local", "2026-09-22", "Claro", 1000, 420, true],
  ["Tostaduría Norte", "2026-09-25", "Medio", 1000, 0, false],
  ["Tostaduría Local", "2026-09-28", "Claro", 500, 500, true],
  ["Tostaduría Norte", "2026-10-01", "Oscuro", 1000, 610.25, true],
  ["Tostaduría Local", "2026-10-02", "Medio", 750, 180, true],
  ["Tostaduría Norte", "2026-10-04", "Claro", 1000, 975, true],
  ["Tostaduría Local", "2026-10-05", "Medio", 500, 0, false],
  ["Tostaduría Norte", "2026-10-07", "Medio", 1000, 830, true],
  ["Tostaduría Local", "2026-10-09", "Oscuro", 1000, 1000, true],
] as const;

const equipos = [
  ["molino", "Eureka", "Mignon Specialita", "MOL-01"],
  ["maquina", "La Marzocco", "Linea Mini", "MAQ-01"],
  ["molino", "Mazzer", "Super Jolly", "MOL-02"],
  ["maquina", "Rocket", "Appartamento", "MAQ-02"],
  ["molino", "Niche", "Zero", "MOL-03"],
  ["maquina", "Lelit", "Bianca", "MAQ-03"],
  ["molino", "Baratza", "Encore ESP", "MOL-04"],
  ["maquina", "Breville", "Barista Express", "MAQ-04"],
  ["molino", "Eureka", "Mignon Silenzio", "MOL-05"],
  ["maquina", "La Marzocco", "GS3", "MAQ-05"],
] as const;

// [índice lote 1-10, índice molino, índice máquina, fecha_hora, dosis, ajuste, temp, presión, yield, tiempo, tds, calificación, notas, barista]
const calibraciones = [
  [1, 1, 2, "2026-10-02T08:15:00", 18, 12.0, 93.0, 9.0, 36, 28.0, 9.9, 8, "Chocolate y caramelo, acidez suave", "Carlos Ramírez"],
  [2, 3, 4, "2026-10-03T09:10:00", 19, 14.0, 94.0, 9.0, 38, 30.0, 9.6, 7, "Jazmín, cuerpo ligero", "Ana Pérez"],
  [2, 3, 4, "2026-10-03T09:30:00", 19, 13.5, 93.0, 9.0, 40, 27.5, 9.4, 6, "Bergamota, final corto", "Ana Pérez"],
  [4, 5, 6, "2026-10-05T10:00:00", 18.5, 10.0, 92.0, 8.5, 37, 29.0, 8.9, 5, "Acidez punzante, poco dulzor", "Luis Torres"],
  [5, 7, 8, "2026-10-06T11:20:00", 18, 15.0, 95.0, 9.0, 34, 25.0, 10.1, 8, "Nuez y cacao, cuerpo medio", "Carlos Ramírez"],
  [6, 1, 2, "2026-10-07T08:05:00", 18, 12.5, 93.5, 9.0, 36, 28.5, 9.7, 8, "Caramelo, dulzor a panela", "Luis Torres"],
  [7, 3, 4, "2026-10-08T09:45:00", 18, 13.0, 93.0, 9.2, 35.5, 27.0, 9.3, 7, "Frutos rojos, acidez media", "Ana Pérez"],
  [9, 9, 10, "2026-10-09T10:30:00", 19, 9.5, 92.5, 9.0, 38, 31.0, 10.4, 9, "Chocolate con leche, final largo", "Carlos Ramírez"],
  [10, 5, 6, "2026-10-10T08:50:00", 18, 16.0, 96.0, 9.0, 33, 24.0, 9.0, 4, "Sabor plano, amargo leve", "Luis Torres"],
  [5, 7, 8, "2026-10-12T12:00:00", 18, 14.5, 94.0, 9.0, 36, 29.5, 10.0, 8, "Manzana verde, dulzor brillante", "Ana Pérez"],
] as const;

// [índice lote 1-10, descriptor]  (en el A2 estaban por grano; cada grano i tiene el lote i)
const notas = [
  [1, "Chocolate amargo"], [1, "Caramelo"], [2, "Jazmín"], [2, "Bergamota"], [3, "Chocolate con leche"],
  [4, "Limón"], [5, "Nuez"], [6, "Cacao"], [7, "Frutos rojos"], [8, "Manzana verde"],
] as const;

async function main() {
  // El seed borra todas las tablas: fuera de localhost exige confirmación explícita.
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL ?? "");
  if (!local && process.env.SEED_CONFIRM !== "si") {
    throw new Error("La base no es local. El seed BORRA los datos; para continuar define SEED_CONFIRM=si");
  }
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "notas_cata", "calibraciones", "lotes", "equipos", "granos" RESTART IDENTITY CASCADE',
  );

  const g = [];
  for (const [nombreCafe, finca, productor, paisOrigen, region, varietal, proceso, puntuacionSca, fecha] of granos) {
    g.push(await prisma.grano.create({
      data: { nombreCafe, finca, productor, paisOrigen, region, varietal, proceso, puntuacionSca, fechaCreacion: new Date(fecha) },
    }));
  }

  const l = [];
  for (const [i, [tostaduria, fecha, nivelTueste, pesoInicialG, pesoActualG, activo]] of lotes.entries()) {
    l.push(await prisma.lote.create({
      data: {
        idGrano: g[i].id, codigoLote: `LT-2026-${String(i + 1).padStart(3, "0")}`, tostaduria,
        fechaTueste: new Date(fecha), nivelTueste, pesoInicialG, pesoActualG, activo,
      },
    }));
  }

  const e = [];
  for (const [tipo, marca, modelo, identificadorLocal] of equipos) {
    e.push(await prisma.equipo.create({ data: { tipo, marca, modelo, identificadorLocal } }));
  }

  for (const [lo, mo, ma, fecha, dosisInG, ajusteMolienda, temperaturaC, presionBar, yieldOutG, tiempoSegundos, tdsPorcentaje, calificacionSabor, notasBarista, baristaNombre] of calibraciones) {
    await prisma.calibracion.create({
      data: {
        idLote: l[lo - 1].id, idMolino: e[mo - 1].id, idMaquina: e[ma - 1].id, fechaHora: new Date(fecha),
        dosisInG, ajusteMolienda, temperaturaC, presionBar, yieldOutG, tiempoSegundos, tdsPorcentaje,
        calificacionSabor, notasBarista, baristaNombre,
        ...calcularDerivados(dosisInG, yieldOutG, tdsPorcentaje),
      },
    });
  }

  for (const [lo, descriptor] of notas) {
    await prisma.notaCata.create({ data: { idLote: l[lo - 1].id, descriptor } });
  }

  console.log("Seed listo: 10 granos, 10 lotes, 10 equipos, 10 calibraciones, 10 notas de cata.");
}

main().finally(() => prisma.$disconnect());
