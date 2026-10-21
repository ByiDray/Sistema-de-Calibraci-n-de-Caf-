import test from "node:test";
import assert from "node:assert/strict";
import { calcularDerivados } from "./calculos.js";

test("calibración equilibrada del documento (18 g -> 36 g, TDS 9.9)", () => {
  assert.deepEqual(calcularDerivados(18, 36, 9.9), { ratioCalculado: "1:2.0", eyPorcentaje: 19.8, diagnostico: "EQUILIBRADA" });
});

test("subextraída cuando EY < 18", () => {
  assert.equal(calcularDerivados(18, 33, 9.0).diagnostico, "SUBEXTRAIDA");
  assert.equal(calcularDerivados(18, 33, 9.0).eyPorcentaje, 16.5);
});

test("sobreextraída cuando EY > 22", () => {
  assert.equal(calcularDerivados(18, 45, 10).diagnostico, "SOBREEXTRAIDA");
});

test("los límites 18 y 22 son equilibrados", () => {
  assert.equal(calcularDerivados(10, 20, 9).diagnostico, "EQUILIBRADA"); // EY 18
  assert.equal(calcularDerivados(10, 20, 11).diagnostico, "EQUILIBRADA"); // EY 22
});

test("redondea la mitad hacia arriba como PostgreSQL (1.95 -> 2.0)", () => {
  assert.equal(calcularDerivados(16, 31.2, 19).ratioCalculado, "1:2.0");
});

test("ratio con un decimal", () => {
  assert.equal(calcularDerivados(19, 40, 9.4).ratioCalculado, "1:2.1");
});
