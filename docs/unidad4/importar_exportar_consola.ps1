# =====================================================================
# Unidad 4.6 · Exportar e importar entre PostgreSQL y SQLite en consola
#   Ida:     PostgreSQL (cafe) --psql \copy--> CSV --sqlite3 .import--> respaldos\cafe_consola.sqlite
#   Vuelta:  SQLite --sqlite3 -csv--> CSV --psql \copy--> PostgreSQL (cafe_desde_sqlite_consola)
# Uso, desde la raíz del repo:
#   $env:PGPASSWORD = "<contraseña de postgres>"
#   .\docs\unidad4\importar_exportar_consola.ps1
# =====================================================================
$pg = "C:\Program Files\PostgreSQL\18\bin"
$sqlite = "C:\Users\Adriel\tools\sqlite\sqlite3.exe"
$tablas = "granos", "equipos", "lotes", "calibraciones", "notas_cata"
New-Item -ItemType Directory -Force respaldos\export, respaldos\desde_sqlite | Out-Null
Remove-Item -ErrorAction SilentlyContinue respaldos\cafe_consola.sqlite

# ---------- Ida 1: exportar cada tabla de PostgreSQL a CSV ----------
foreach ($t in $tablas) {
  # lotes.activo se exporta como 0/1, porque SQLite no tiene tipo booleano
  $consulta = if ($t -eq "lotes") { "SELECT id_lote, id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g, activo::int AS activo FROM lotes" } else { "SELECT * FROM $t" }
  & "$pg\psql.exe" -h localhost -U postgres -d cafe -c "\copy ($consulta) TO 'respaldos/export/$t.csv' WITH (FORMAT csv, HEADER)"
}

# ---------- Ida 2: crear la base SQLite e importar los CSV ----------
$importar = @(".read docs/unidad4/sqlite_esquema.sql")
foreach ($t in $tablas) { $importar += ".import --csv --skip 1 respaldos/export/$t.csv $t" }
$importar += @(
  # En CSV el nulo llega como cadena vacía: se convierte de nuevo a NULL
  "UPDATE granos SET finca = NULLIF(finca, ''), productor = NULLIF(productor, ''), region = NULLIF(region, ''), varietal = NULLIF(varietal, '');",
  "UPDATE calibraciones SET notas_barista = NULLIF(notas_barista, '');",
  "PRAGMA foreign_key_check;",
  "SELECT 'granos', count(*) FROM granos UNION ALL SELECT 'lotes', count(*) FROM lotes UNION ALL SELECT 'equipos', count(*) FROM equipos UNION ALL SELECT 'calibraciones', count(*) FROM calibraciones UNION ALL SELECT 'notas_cata', count(*) FROM notas_cata;"
)
$importar -join "`n" | & $sqlite respaldos\cafe_consola.sqlite

# ---------- Vuelta 1: exportar de SQLite a CSV ----------
foreach ($t in $tablas) {
  & $sqlite -header -csv respaldos\cafe_consola.sqlite "SELECT * FROM $t ORDER BY 1" | Out-File -Encoding utf8NoBOM "respaldos\desde_sqlite\$t.csv"
}

# ---------- Vuelta 2: base PostgreSQL nueva con la estructura del proyecto, e importar ----------
& "$pg\dropdb.exe" -h localhost -U postgres --if-exists cafe_desde_sqlite_consola
& "$pg\createdb.exe" -h localhost -U postgres cafe_desde_sqlite_consola
Get-ChildItem apps\api\prisma\migrations -Directory | Sort-Object Name | ForEach-Object {
  & "$pg\psql.exe" -h localhost -U postgres -d cafe_desde_sqlite_consola -q -f "$($_.FullName)\migration.sql"
}
foreach ($t in $tablas) {
  & "$pg\psql.exe" -h localhost -U postgres -d cafe_desde_sqlite_consola -c "\copy $t FROM 'respaldos/desde_sqlite/$t.csv' WITH (FORMAT csv, HEADER)"
}
& "$pg\psql.exe" -h localhost -U postgres -d cafe_desde_sqlite_consola -c "SELECT (SELECT count(*) FROM granos) granos, (SELECT count(*) FROM lotes) lotes, (SELECT count(*) FROM calibraciones) calibraciones"
