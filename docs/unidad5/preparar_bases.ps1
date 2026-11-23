# =====================================================================
# Unidad 5 · Prepara tres copias de la base "cafe" para la práctica
#   cafe_u5_consola  -> la usa docs\unidad5\consola_unidad5.sql (psql)
#   cafe_u5_prisma   -> la usa apps\api\scripts\unidad5-prisma.ts
#   cafe_u5_knex     -> la usa apps\api\scripts\unidad5-knex.mjs
# Así las vistas, funciones y disparadores no tocan la base real de la app,
# y las tres formas parten de los mismos datos.
# Uso, desde la raíz del repo:
#   $env:PGPASSWORD = "<contraseña de postgres>"
#   .\docs\unidad5\preparar_bases.ps1
# =====================================================================
$bin = "C:\Program Files\PostgreSQL\18\bin"
$copia = Join-Path $env:TEMP "cafe_unidad5.sql"

& "$bin\pg_dump.exe" -h localhost -U postgres -d cafe -Fp --no-owner -f $copia

foreach ($base in "cafe_u5_consola", "cafe_u5_prisma", "cafe_u5_knex") {
  & "$bin\dropdb.exe" -h localhost -U postgres --if-exists $base
  & "$bin\createdb.exe" -h localhost -U postgres $base
  & "$bin\psql.exe" -h localhost -U postgres -d $base -q -f $copia | Out-Null
  & "$bin\psql.exe" -h localhost -U postgres -d $base -Atc "SELECT '${base}: ' || (SELECT count(*) FROM granos) || ' granos, ' || (SELECT count(*) FROM lotes) || ' lotes, ' || (SELECT count(*) FROM calibraciones) || ' calibraciones'"
}
Remove-Item $copia
