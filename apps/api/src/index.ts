import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { prisma } from "./prisma.js";
import { calcularDerivados } from "./calculos.js";
import { aNumeros, calibracionSchema, equipoSchema, granoSchema, loteSchema, notaSchema } from "./validacion.js";

class ErrorDeNegocio extends Error {}

const app = express();
app.use(cors());
app.use(express.json());

// Express 4 no captura errores de funciones async; este envoltorio los pasa al manejador.
const h = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
const id = (req: Request) => Number(req.params.id);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Clave sencilla para cuando la API se expone con un túnel. Si API_KEY no está definida, no se exige.
app.use((req, res, next) => {
  const key = process.env.API_KEY;
  if (key && req.header("x-api-key") !== key) return res.status(401).json({ message: "No autorizado" });
  next();
});

// ---- GRANOS (ABCD) ----
const DEC_GRANO = ["puntuacionSca"];
app.get("/granos", h(async (_req, res) =>
  res.json(await prisma.grano.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { lotes: true } } } }))));
app.get("/granos/:id", h(async (req, res) =>
  res.json(await prisma.grano.findUniqueOrThrow({ where: { id: id(req) }, include: { lotes: true } }))));
app.post("/granos", h(async (req, res) =>
  res.status(201).json(await prisma.grano.create({ data: granoSchema.parse(req.body) }))));
app.put("/granos/:id", h(async (req, res) => {
  const actual = await prisma.grano.findUniqueOrThrow({ where: { id: id(req) } });
  const data = granoSchema.parse({ ...aNumeros(actual, DEC_GRANO), ...req.body });
  res.json(await prisma.grano.update({ where: { id: id(req) }, data }));
}));
app.delete("/granos/:id", h(async (req, res) => res.json(await prisma.grano.delete({ where: { id: id(req) } }))));

// ---- LOTES ----
const DEC_LOTE = ["pesoInicialG", "pesoActualG"];
app.get("/lotes", h(async (req, res) => {
  const idGrano = req.query.idGrano ? Number(req.query.idGrano) : undefined;
  res.json(await prisma.lote.findMany({ where: { idGrano }, include: { grano: true }, orderBy: { id: "asc" } }));
}));
app.get("/lotes/:id", h(async (req, res) =>
  res.json(await prisma.lote.findUniqueOrThrow({
    where: { id: id(req) },
    include: { grano: true, notasCata: true, calibraciones: { orderBy: { fechaHora: "desc" } } },
  }))));
app.post("/lotes", h(async (req, res) =>
  res.status(201).json(await prisma.lote.create({ data: loteSchema.parse(req.body) }))));
app.put("/lotes/:id", h(async (req, res) => {
  const actual = await prisma.lote.findUniqueOrThrow({ where: { id: id(req) } });
  const data = loteSchema.parse({ ...aNumeros(actual, DEC_LOTE), ...req.body });
  res.json(await prisma.lote.update({ where: { id: id(req) }, data }));
}));
app.delete("/lotes/:id", h(async (req, res) => res.json(await prisma.lote.delete({ where: { id: id(req) } }))));

// ---- EQUIPOS ----
app.get("/equipos", h(async (_req, res) => res.json(await prisma.equipo.findMany({ orderBy: { id: "asc" } }))));
app.post("/equipos", h(async (req, res) =>
  res.status(201).json(await prisma.equipo.create({ data: equipoSchema.parse(req.body) }))));
app.put("/equipos/:id", h(async (req, res) => {
  const actual = await prisma.equipo.findUniqueOrThrow({ where: { id: id(req) } });
  res.json(await prisma.equipo.update({ where: { id: id(req) }, data: equipoSchema.parse({ ...actual, ...req.body }) }));
}));
app.delete("/equipos/:id", h(async (req, res) => res.json(await prisma.equipo.delete({ where: { id: id(req) } }))));

// ---- CALIBRACIONES (ratio, EY y diagnóstico se calculan aquí, no los captura el usuario) ----
const DEC_CALIB = ["dosisInG", "ajusteMolienda", "temperaturaC", "presionBar", "yieldOutG", "tiempoSegundos", "tdsPorcentaje", "calificacionSabor"];
const inclCalib = { lote: true, molino: true, maquina: true };

async function prepararCalibracion(entrada: unknown) {
  const c = calibracionSchema.parse(entrada);
  const [molino, maquina] = await Promise.all([
    prisma.equipo.findUnique({ where: { id: c.idMolino } }),
    prisma.equipo.findUnique({ where: { id: c.idMaquina } }),
  ]);
  if (!molino || molino.tipo !== "molino") throw new ErrorDeNegocio("idMolino: debe ser un equipo de tipo molino");
  if (!maquina || maquina.tipo !== "maquina") throw new ErrorDeNegocio("idMaquina: debe ser un equipo de tipo maquina");
  const derivados = calcularDerivados(c.dosisInG, c.yieldOutG, c.tdsPorcentaje);
  if (derivados.eyPorcentaje > 100) throw new ErrorDeNegocio("Los datos dan un EY mayor a 100%: revisa dosis, peso de bebida y TDS");
  return { ...c, ...derivados };
}

app.get("/calibraciones", h(async (req, res) => {
  const idLote = req.query.idLote ? Number(req.query.idLote) : undefined;
  res.json(await prisma.calibracion.findMany({ where: { idLote }, include: inclCalib, orderBy: { fechaHora: "desc" } }));
}));
app.post("/calibraciones", h(async (req, res) =>
  res.status(201).json(await prisma.calibracion.create({ data: await prepararCalibracion(req.body) }))));
app.put("/calibraciones/:id", h(async (req, res) => {
  const actual = await prisma.calibracion.findUniqueOrThrow({ where: { id: id(req) } });
  const data = await prepararCalibracion({ ...aNumeros(actual, DEC_CALIB), ...req.body });
  res.json(await prisma.calibracion.update({ where: { id: id(req) }, data }));
}));
app.delete("/calibraciones/:id", h(async (req, res) =>
  res.json(await prisma.calibracion.delete({ where: { id: id(req) } }))));

// ---- RESUMEN para la pantalla de Inicio de la app ----
app.get("/resumen", h(async (_req, res) => {
  const [activos, existencia, porDiagnostico, ultimas, baristas, lotesActivos] = await Promise.all([
    prisma.lote.count({ where: { activo: true } }),
    prisma.lote.aggregate({ where: { activo: true }, _sum: { pesoActualG: true } }),
    prisma.calibracion.groupBy({ by: ["diagnostico"], _count: { _all: true } }),
    prisma.calibracion.findMany({
      orderBy: { fechaHora: "desc" }, take: 5,
      include: { lote: { select: { codigoLote: true, grano: { select: { nombreCafe: true } } } } },
    }),
    prisma.calibracion.groupBy({ by: ["baristaNombre"], _count: { _all: true }, _avg: { calificacionSabor: true, eyPorcentaje: true } }),
    prisma.lote.findMany({ where: { activo: true }, include: { grano: { select: { nombreCafe: true } } } }),
  ]);
  // "Queda poco": menos del 20 % del peso inicial, igual que en la app.
  const pocaExistencia = lotesActivos
    .filter((l) => Number(l.pesoActualG) < Number(l.pesoInicialG) * 0.2)
    .sort((a, b) => Number(a.pesoActualG) / Number(a.pesoInicialG) - Number(b.pesoActualG) / Number(b.pesoInicialG))
    .map((l) => ({ id: l.id, codigoLote: l.codigoLote, nombreCafe: l.grano.nombreCafe, pesoActualG: l.pesoActualG, pesoInicialG: l.pesoInicialG }));
  res.json({
    lotesActivos: activos,
    gramosDisponibles: existencia._sum.pesoActualG ?? 0,
    calibraciones: Object.fromEntries(porDiagnostico.map((d) => [d.diagnostico, d._count._all])),
    pocaExistencia,
    ultimasCalibraciones: ultimas.map((c) => ({
      id: c.id, idLote: c.idLote, fechaHora: c.fechaHora, eyPorcentaje: c.eyPorcentaje, diagnostico: c.diagnostico,
      calificacionSabor: c.calificacionSabor, baristaNombre: c.baristaNombre, codigoLote: c.lote.codigoLote, nombreCafe: c.lote.grano.nombreCafe,
    })),
    baristas: baristas
      .map((b) => ({ nombre: b.baristaNombre, calibraciones: b._count._all, saborPromedio: Number(b._avg.calificacionSabor), eyPromedio: Number(b._avg.eyPorcentaje) }))
      .sort((a, b) => b.saborPromedio - a.saborPromedio),
  });
}));

// ---- NOTAS DE CATA (por lote) ----
app.get("/lotes/:id/notas", h(async (req, res) =>
  res.json(await prisma.notaCata.findMany({ where: { idLote: id(req) }, orderBy: { id: "asc" } }))));
app.post("/lotes/:id/notas", h(async (req, res) =>
  res.status(201).json(await prisma.notaCata.create({ data: { idLote: id(req), ...notaSchema.parse(req.body) } }))));
app.delete("/notas/:id", h(async (req, res) => res.json(await prisma.notaCata.delete({ where: { id: id(req) } }))));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const mensaje = err.issues.map((i) => `${i.path.join(".") || "datos"}: ${i.message}`).join("; ");
    return res.status(400).json({ error: "validacion", message: mensaje });
  }
  if (err instanceof ErrorDeNegocio) return res.status(400).json({ error: "regla", message: err.message });
  const status = err.code === "P2025" ? 404 : err.code === "P2002" || err.code === "P2003" ? 409 : 400;
  console.error(err.message);
  res.status(status).json({ error: err.code ?? "error", message: String(err.message).split("\n").pop() });
});

app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0", () => console.log("API lista"));
