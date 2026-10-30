// Práctica de DCL con el framework: ejecuta docs/dcl/dcl_app_bd_cafe.sql con Prisma
// dentro de una transacción interactiva, comprueba los permisos y al final la revierte.
// Uso (desde apps/api): npx tsx scripts/practica-dcl.ts
import fs from "node:fs";
import { prisma } from "../src/prisma.js";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Prueba = [descripcion: string, consulta: string, esperado: boolean];

const archivo = new URL("../../../docs/dcl/dcl_app_bd_cafe.sql", import.meta.url);
const partes = fs.readFileSync(archivo, "utf8").split(/^-- \[([A-Z]{2}\d\d)\] (.*)$/m);
const bloques = [];
for (let i = 1; i < partes.length; i += 3) {
  const sql = partes[i + 2].split("\n").filter((l) => !/^\s*--/.test(l) && !/^ROLLBACK;/.test(l.trim())).join("\n").trim();
  bloques.push({ id: partes[i], titulo: partes[i + 1], sql });
}

// Comprobaciones que se corren justo después de la sentencia indicada.
const pruebas: Record<string, Prueba[]> = {
  US15: [["Existen los 15 usuarios con LOGIN", "SELECT count(*) = 15 FROM pg_roles WHERE rolcanlogin AND rolname ~ '^(admin_cafe|api_cafe|barista_|practicante_|tostador_|calidad_|inventario_|auditor_|reportes_|respaldo_)'", true]],
  GR15: [
    ["barista_ana puede INSERT en calibraciones", "SELECT has_table_privilege('barista_ana', 'calibraciones', 'INSERT')", true],
    ["barista_ana NO puede DELETE en calibraciones", "SELECT has_table_privilege('barista_ana', 'calibraciones', 'DELETE')", false],
    ["barista_ana puede UPDATE en lotes.peso_actual_g", "SELECT has_column_privilege('barista_ana', 'lotes', 'peso_actual_g', 'UPDATE')", true],
    ["barista_ana NO puede UPDATE en lotes.codigo_lote", "SELECT has_column_privilege('barista_ana', 'lotes', 'codigo_lote', 'UPDATE')", false],
    ["tostador_norte puede INSERT en lotes", "SELECT has_table_privilege('tostador_norte', 'lotes', 'INSERT')", true],
    ["calidad_andy lee granos (hereda rol_lectura)", "SELECT has_table_privilege('calidad_andy', 'granos', 'SELECT')", true],
    ["auditor_uni NO puede INSERT en granos", "SELECT has_table_privilege('auditor_uni', 'granos', 'INSERT')", false],
    ["api_cafe puede DELETE en notas_cata", "SELECT has_table_privilege('api_cafe', 'notas_cata', 'DELETE')", true],
    ["admin_cafe tiene SELECT con GRANT OPTION", "SELECT has_table_privilege('admin_cafe', 'granos', 'SELECT WITH GRANT OPTION')", true],
  ],
  RV14: [["reportes_bi SIGUE leyendo granos (lo hereda del grupo)", "SELECT has_table_privilege('reportes_bi', 'granos', 'SELECT')", true]],
  RV15: [
    ["barista_luis ya no se puede conectar", "SELECT has_database_privilege('barista_luis', current_database(), 'CONNECT')", false],
    ["barista_luis ya no es miembro de rol_barista", "SELECT pg_has_role('barista_luis', 'rol_barista', 'MEMBER')", false],
    ["barista_ana ya NO puede INSERT en calibraciones", "SELECT has_table_privilege('barista_ana', 'calibraciones', 'INSERT')", false],
    ["barista_ana sigue leyendo calibraciones", "SELECT has_table_privilege('barista_ana', 'calibraciones', 'SELECT')", true],
    ["barista_ana ya NO puede UPDATE en lotes.peso_actual_g", "SELECT has_column_privilege('barista_ana', 'lotes', 'peso_actual_g', 'UPDATE')", false],
    ["calidad_andy ya NO puede DELETE en notas_cata", "SELECT has_table_privilege('calidad_andy', 'notas_cata', 'DELETE')", false],
    ["calidad_andy sigue pudiendo INSERT en notas_cata", "SELECT has_table_privilege('calidad_andy', 'notas_cata', 'INSERT')", true],
    ["tostador_norte ya NO puede UPDATE en granos", "SELECT has_table_privilege('tostador_norte', 'granos', 'UPDATE')", false],
    ["inventario_rosa ya NO puede usar el esquema", "SELECT has_schema_privilege('inventario_rosa', 'public', 'USAGE')", false],
    ["admin_cafe conserva SELECT", "SELECT has_table_privilege('admin_cafe', 'granos', 'SELECT')", true],
    ["admin_cafe ya NO tiene GRANT OPTION", "SELECT has_table_privilege('admin_cafe', 'granos', 'SELECT WITH GRANT OPTION')", false],
    ["reportes_bi ya NO lee granos", "SELECT has_table_privilege('reportes_bi', 'granos', 'SELECT')", false],
  ],
};

// Prueba real: actuar como el usuario y ver si PostgreSQL deja ejecutar la sentencia.
async function comoUsuario(tx: Tx, rol: string, sql: string) {
  await tx.$executeRawUnsafe("SAVEPOINT prueba_rol");
  try {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE ${rol}`);
    await tx.$executeRawUnsafe(sql);
    return "permitido";
  } catch (e: any) {
    return "rechazado: " + String(e.meta?.message ?? e.message).split("\n").pop();
  } finally {
    await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT prueba_rol");
  }
}

let fallas = 0;
try {
  await prisma.$transaction(async (tx) => {
    for (const b of bloques) {
      await tx.$executeRawUnsafe(b.sql);
      console.log(`${b.id} OK  ${b.titulo}`);
      for (const [descripcion, consulta, esperado] of pruebas[b.id] ?? []) {
        const [fila] = await tx.$queryRawUnsafe<Record<string, boolean>[]>(consulta);
        const valor = Object.values(fila)[0];
        if (valor !== esperado) fallas++;
        console.log(`     ${valor === esperado ? "✓" : "✗"} ${descripcion}: ${valor}`);
      }
      if (b.id === "GR15") {
        console.log("     como barista_ana, SELECT granos:", await comoUsuario(tx, "barista_ana", "SELECT count(*) FROM granos"));
        console.log("     como barista_ana, DELETE granos:", await comoUsuario(tx, "barista_ana", "DELETE FROM granos WHERE false"));
      }
      if (b.id === "RV15") {
        console.log("     como barista_ana, INSERT calibraciones:", await comoUsuario(tx, "barista_ana",
          "INSERT INTO calibraciones (id_lote) SELECT 1 WHERE false"));
      }
    }
    throw new Error("ROLLBACK_INTENCIONAL");
  }, { timeout: 60_000 });
} catch (e: any) {
  if (e.message !== "ROLLBACK_INTENCIONAL") throw e;
}

const [{ quedan }] = await prisma.$queryRawUnsafe<{ quedan: number }[]>(
  "SELECT count(*)::int AS quedan FROM pg_roles WHERE rolname ~ '^(rol_|admin_cafe|api_cafe|barista_|practicante_|tostador_|calidad_|inventario_|auditor_|reportes_|respaldo_)'");
console.log(`\nTransacción revertida. Roles de práctica que quedaron: ${quedan}. Comprobaciones fallidas: ${fallas}.`);
await prisma.$disconnect();
