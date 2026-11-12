# =====================================================================
# Unidad 4.4 · Respaldo y restauración en consola (PowerShell + herramientas de PostgreSQL)
# Respalda la base "cafe" y la restaura en una base nueva para comprobar el respaldo.
# Uso, desde la raíz del repo:
#   $env:PGPASSWORD = "<contraseña de postgres>"
#   .\docs\unidad4\respaldo_consola.ps1
# Los respaldos quedan en respaldos\ (carpeta ignorada por git: contienen datos).
# =====================================================================
$bin = "C:\Program Files\PostgreSQL\18\bin"
$fecha = Get-Date -Format "yyyyMMdd_HHmm"
New-Item -ItemType Directory -Force respaldos | Out-Null

# 1. Respaldo en formato personalizado (comprimido, se restaura con pg_restore)
& "$bin\pg_dump.exe" -h localhost -U postgres -d cafe -Fc -f "respaldos\cafe_$fecha.dump"

# 2. Respaldo en texto plano (script SQL legible, se restaura con psql)
& "$bin\pg_dump.exe" -h localhost -U postgres -d cafe -Fp -f "respaldos\cafe_$fecha.sql"

# 3. Respaldo de solo la estructura
& "$bin\pg_dump.exe" -h localhost -U postgres -d cafe --schema-only -f "respaldos\cafe_estructura_$fecha.sql"

# 4. Restaurar en una base nueva
& "$bin\dropdb.exe" -h localhost -U postgres --if-exists cafe_restaurada_consola
& "$bin\createdb.exe" -h localhost -U postgres cafe_restaurada_consola
& "$bin\pg_restore.exe" -h localhost -U postgres -d cafe_restaurada_consola "respaldos\cafe_$fecha.dump"

# 5. Comprobar: mismos registros en el original y en la restaurada
$conteo = "SELECT (SELECT count(*) FROM granos) granos, (SELECT count(*) FROM lotes) lotes, (SELECT count(*) FROM equipos) equipos, (SELECT count(*) FROM calibraciones) calibraciones, (SELECT count(*) FROM notas_cata) notas_cata"
& "$bin\psql.exe" -h localhost -U postgres -d cafe -c $conteo
& "$bin\psql.exe" -h localhost -U postgres -d cafe_restaurada_consola -c $conteo
