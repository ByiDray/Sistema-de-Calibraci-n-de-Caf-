import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// ABCD de granos (ejemplo; replicar para lotes, equipos y calibraciones)
app.get("/granos", async (_req, res) => res.json(await prisma.grano.findMany()));
app.post("/granos", async (req, res) => res.status(201).json(await prisma.grano.create({ data: req.body })));
app.put("/granos/:id", async (req, res) =>
  res.json(await prisma.grano.update({ where: { id: Number(req.params.id) }, data: req.body })));
app.delete("/granos/:id", async (req, res) =>
  res.json(await prisma.grano.delete({ where: { id: Number(req.params.id) } })));

// Notas de cata, ahora por lote
app.get("/lotes/:id/notas", async (req, res) =>
  res.json(await prisma.notaCata.findMany({ where: { idLote: Number(req.params.id) } })));
app.post("/lotes/:id/notas", async (req, res) =>
  res.status(201).json(
    await prisma.notaCata.create({ data: { idLote: Number(req.params.id), descriptor: req.body.descriptor } })));

app.listen(Number(process.env.PORT ?? 3000), () => console.log("API lista"));
