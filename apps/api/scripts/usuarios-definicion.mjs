// Unidad 4.5 · Definición de los 10 usuarios y sus permisos sobre la base "cafe".
// La usan la consola (docs/unidad4/usuarios_consola.sql), Prisma y Knex, cada uno con su prefijo,
// porque los roles son globales del servidor y no se pueden repetir.
// Las contraseñas son solo de práctica: cámbialas si usas estos usuarios fuera de tu equipo.

export const USUARIOS = [
  // [nombre, grupo, atributos extra, función]
  ["admin_cafe", null, "", "Administrador de la base de la app"],
  ["api_cafe", null, "CONNECTION LIMIT 20", "Conexión de la API (Express + Prisma)"],
  ["barista_ana", "rol_barista", "", "Barista Ana Pérez"],
  ["barista_carlos", "rol_barista", "", "Barista Carlos Ramírez"],
  ["barista_sofia", "rol_barista", "", "Barista Sofía"],
  ["practicante_juan", "rol_barista", "VALID UNTIL '2026-12-31'", "Practicante con acceso temporal"],
  ["tostador_norte", "rol_tostador", "", "Tostaduría Norte"],
  ["tostador_local", "rol_tostador", "", "Tostaduría Local"],
  ["calidad_andy", "rol_calidad", "", "Catador de control de calidad"],
  ["auditor_uni", "rol_lectura", "", "Auditor externo, solo lectura"],
];
export const GRUPOS = ["rol_barista", "rol_tostador", "rol_calidad", "rol_lectura"];

export function contrasena(prefijo, usuario) {
  return `Practica#${prefijo}${usuario}`;
}

// Sentencias para crear grupos, usuarios y permisos con un prefijo dado (con_, pri_, knx_)
export function sentencias(p) {
  const g = (n) => `${p}${n}`;
  const todos = [...GRUPOS.map(g), g("api_cafe"), g("admin_cafe")].join(", ");
  return [
    ...GRUPOS.map((n) => `CREATE ROLE ${g(n)} NOLOGIN`),
    ...USUARIOS.map(([u, grupo, extra]) =>
      `CREATE ROLE ${g(u)} LOGIN PASSWORD '${contrasena(p, u)}'${extra ? " " + extra : ""}${grupo ? ` IN ROLE ${g(grupo)}` : ""}`),
    `GRANT CONNECT ON DATABASE cafe TO ${todos}`,
    `GRANT USAGE ON SCHEMA public TO ${todos}`,
    `GRANT SELECT ON granos, lotes, equipos, notas_cata TO ${g("rol_barista")}`,
    `GRANT SELECT, INSERT ON calibraciones TO ${g("rol_barista")}`,
    `GRANT USAGE ON SEQUENCE calibraciones_id_calibracion_seq TO ${g("rol_barista")}`,
    `GRANT SELECT, INSERT, UPDATE ON granos, lotes TO ${g("rol_tostador")}`,
    `GRANT USAGE ON SEQUENCE granos_id_grano_seq, lotes_id_lote_seq TO ${g("rol_tostador")}`,
    `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${g("rol_lectura")}`,
    `GRANT ${g("rol_lectura")} TO ${g("rol_calidad")}`,
    `GRANT INSERT, DELETE ON notas_cata TO ${g("rol_calidad")}`,
    `GRANT USAGE ON SEQUENCE notas_cata_id_nota_seq TO ${g("rol_calidad")}`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${g("api_cafe")}`,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${g("api_cafe")}`,
    `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${g("admin_cafe")} WITH GRANT OPTION`,
  ];
}

// Borra los roles con ese prefijo (primero sus permisos con DROP OWNED, después el rol)
export function limpieza(p) {
  return `DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolname LIKE '${p.replace("_", "\\_")}%' ORDER BY rolcanlogin DESC LOOP
    EXECUTE format('DROP OWNED BY %I', r.rolname);
    EXECUTE format('DROP ROLE %I', r.rolname);
  END LOOP; END $$`;
}

// Comprobaciones: [descripción, consulta, esperado]
export function pruebas(p) {
  return [
    ["10 usuarios con LOGIN", `SELECT count(*) = 10 FROM pg_roles WHERE rolcanlogin AND rolname LIKE '${p.replace("_", "\\_")}%'`, true],
    ["barista puede INSERT en calibraciones", `SELECT has_table_privilege('${p}barista_ana', 'calibraciones', 'INSERT')`, true],
    ["barista NO puede DELETE en granos", `SELECT has_table_privilege('${p}barista_ana', 'granos', 'DELETE')`, false],
    ["tostador puede INSERT en lotes", `SELECT has_table_privilege('${p}tostador_norte', 'lotes', 'INSERT')`, true],
    ["calidad lee calibraciones (hereda lectura)", `SELECT has_table_privilege('${p}calidad_andy', 'calibraciones', 'SELECT')`, true],
    ["auditor NO puede INSERT en granos", `SELECT has_table_privilege('${p}auditor_uni', 'granos', 'INSERT')`, false],
    ["api puede DELETE en notas_cata", `SELECT has_table_privilege('${p}api_cafe', 'notas_cata', 'DELETE')`, true],
    ["admin tiene GRANT OPTION", `SELECT has_table_privilege('${p}admin_cafe', 'granos', 'SELECT WITH GRANT OPTION')`, true],
  ];
}
