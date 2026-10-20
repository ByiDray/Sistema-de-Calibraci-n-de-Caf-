import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { prisma } from "./prisma.js";
import { calcularDerivados } from "./calculos.js";

const app = express();
app.use(cors());
app.use(express.json());

// Express 4 no captura errores de funciones async; este envoltorio los pasa al manejador.
const h = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);
const id = (req: Request) => Number(req.params.id);

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- GRANOS (ABCD) ----
app.get("/granos", h(async (_req, res) => res.json(await prisma.grano.findMany({ orderBy: { id: "asc" } }))));
app.get("/granos/:id", h(async (req, res) =>
  res.json(await prisma.grano.findUniqueOrThrow({ where: { id: id(req) }, include: { lotes: true } }))));
app.post("/granos", h(async (req, res) => res.status(201).json(await prisma.grano.create({ data: req.body }))));
app.put("/granos/:id", h(async (req, res) =>
  res.json(await prisma.grano.update({ where: { id: id(req) }, data: req.body }))));
app.delete("/granos/:id", h(async (req, res) => res.json(await prisma.grano.delete({ where: { id: id(req) } }))));

// ---- LOTES ----
app.get("/lotes", h(async (req, res) => {
  const idGrano = req.query.idGrano ? Number(req.query.idGrano) : undefined;
  res.json(await prisma.lote.findMany({ where: { idGrano }, include: { grano: true }, orderBy: { id: "asc" } }));
}));
app.get("/lotes/:id", h(async (req, res) =>
  res.json(await prisma.lote.findUniqueOrThrow({
    where: { id: id(req) },
    include: { grano: true, notasCata: true, calibraciones: { orderBy: { fechaHora: "desc" } } },
  }))));
app.post("/lotes", h(async (req, res) => res.status(201).json(await prisma.lote.create({ data: req.body }))));
app.put("/lotes/:id", h(async (req, res) =>
  res.json(await prisma.lote.update({ where: { id: id(req) }, data: req.body }))));
app.delete("/lotes/:id", h(async (req, res) => res.json(await prisma.lote.delete({ where: { id: id(req) } }))));

// ---- EQUIPOS ----
app.get("/equipos", h(async (_req, res) => res.json(await prisma.equipo.findMany({ orderBy: { id: "asc" } }))));
app.post("/equipos", h(async (req, res) => res.status(201).json(await prisma.equipo.create({ data: req.body }))));
app.put("/equipos/:id", h(async (req, res) =>
  res.json(await prisma.equipo.update({ where: { id: id(req) }, data: req.body }))));
app.delete("/equipos/:id", h(async (req, res) => res.json(await prisma.equipo.delete({ where: { id: id(req) } }))));

// ---- CALIBRACIONES (ratio, EY y diagnóstico se calculan aquí, no los captura el usuario) ----
const inclCalib = { lote: true, molino: true, maquina: true };
app.get("/calibraciones", h(async (req, res) => {
  const idLote = req.query.idLote ? Number(req.query.idLote) : undefined;
  res.json(await prisma.calibracion.findMany({ where: { idLote }, include: inclCalib, orderBy: { fechaHora: "desc" } }));
}));
app.post("/calibraciones", h(async (req, res) => {
  const b = req.body;
  const derivados = calcularDerivados(Number(b.dosisInG), Number(b.yieldOutG), Number(b.tdsPorcentaje));
  res.status(201).json(await prisma.calibracion.create({ data: { ...b, ...derivados } }));
}));
app.put("/calibraciones/:id", h(async (req, res) => {
  const actual = await prisma.calibracion.findUniqueOrThrow({ where: { id: id(req) } });
  const b = { ...req.body };
  const derivados = calcularDerivados(
    Number(b.dosisInG ?? actual.dosisInG), Number(b.yieldOutG ?? actual.yieldOutG),
    Number(b.tdsPorcentaje ?? actual.tdsPorcentaje),
  );
  res.json(await prisma.calibracion.update({ where: { id: id(req) }, data: { ...b, ...derivados } }));
}));
app.delete("/calibraciones/:id", h(async (req, res) =>
  res.json(await prisma.calibracion.delete({ where: { id: id(req) } }))));

// ---- NOTAS DE CATA (por lote) ----
app.get("/lotes/:id/notas", h(async (req, res) =>
  res.json(await prisma.notaCata.findMany({ where: { idLote: id(req) }, orderBy: { id: "asc" } }))));
app.post("/lotes/:id/notas", h(async (req, res) =>
  res.status(201).json(await prisma.notaCata.create({ data: { idLote: id(req), descriptor: req.body.descriptor } }))));
app.delete("/notas/:id", h(async (req, res) => res.json(await prisma.notaCata.delete({ where: { id: id(req) } }))));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.code === "P2025" ? 404 : err.code === "P2002" ? 409 : err.code === "P2003" ? 409 : 400;
  console.error(err.message);
  res.status(status).json({ error: err.code ?? "error", message: String(err.message).split("\n").pop() });
});

app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0", () => console.log("API lista"));
