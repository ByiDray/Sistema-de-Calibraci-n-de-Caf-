# Calibra · Comercial de lanzamiento · Paquete para edición

El guión completo (concepto, guión técnico escena por escena, locución, cortes y notas de armado) está en
`Guion_comercial_Calibra.pdf`, en esta misma carpeta. Este archivo explica qué hay en cada carpeta.

## Versiones a entregar
| Versión | Duración | Formato |
| --- | --- | --- |
| Master | 60 s | 1920 × 1080, 29.97 fps |
| Corte | 30 s | 1920 × 1080, 29.97 fps |
| Vertical | 15 s | 1080 × 1920, 29.97 fps |

Exportar en H.264 High: 20 Mbps (16:9) y 16 Mbps (9:16), VBR 2 pasadas; audio AAC 48 kHz, 320 kbps, −14 LUFS.

## Carpetas
| Carpeta | Qué hay |
| --- | --- |
| `01_marca` | Isotipo en SVG (para animar la aguja en E04), ícono 1024 px, logos horizontal (claro y oscuro) y vertical, paleta |
| `02_capturas` | 10 pantallas de la app a 1170 × 2532 |
| `03_mockups` | Pantallas dentro de un teléfono, composición de tres teléfonos y `marco_telefono_vacio.png` |
| `04_video_app` | Grabaciones de la app en uso: MP4 H.264, 780 × 1688, 30 fps; 1 s quieto al inicio y al final de cada una |
| `05_graficos` | Textos en pantalla, end cards y fondo, en `16x9` y `9x16` (PNG con transparencia, salvo end card y fondo) |
| `06_audio` | `locucion_guia`: un WAV por escena (voz sintética, solo para armar el corte); `subtitulos`: SRT de los tres cortes |
| `herramientas` | Scripts que generan todo; no se necesitan para editar |

## Clips de la app
| Archivo | Duración | Escena | Qué muestra |
| --- | --- | --- | --- |
| `01_inicio_resumen.mp4` | 10.0 s | E08 | Inicio: indicadores y desplazamiento suave hasta el ranking de baristas |
| `02_de_cafes_a_lote.mp4` | 6.8 s | E05 | Lista de cafés → Chiapas Altura Selecta → lote LT-2026-001 |
| `03_grafica_del_lote.mp4` | 9.5 s | E07 | Detalle del lote y desplazamiento hasta la gráfica del EY |
| `04_calibracion_en_vivo.mp4` | 17.3 s | E06 | Se escribe 36 g, 28 s, TDS 9.2 → 20.7 % (verde); TDS 7.5 → 16.88 % (ámbar) y de vuelta a 9.2 |

Los círculos que aparecen al tocar la pantalla están en la grabación a propósito, para que se vea la interacción.

## Cómo poner un video dentro del teléfono (16:9)
`03_mockups/marco_telefono_vacio.png` mide 980 × 2058 px y su pantalla es transparente.
1. Pista inferior: el MP4. Pista superior: el marco.
2. Con el marco a escala 100 %, el video va a **escala 107.3 %** (837 px de ancho). Con el punto de anclaje del video
   en 0, 0, su posición es **x = 71.5, y = 175** respecto a la esquina del marco (justo debajo de la barra de estado).
   Con el anclaje al centro, el centro del video queda en x = 490, y = 1080.5.
3. Anidar las dos pistas y escalar el anidado como un solo teléfono.

## Locución guía
`VO_E01.wav` … `VO_E10.wav` van al inicio de cada escena:
E01 0:00 · E02 0:04.5 · E03 0:10 · E04 0:13.5 · E05 0:16 · E06 0:21.5 · E07 0:35.5 · E08 0:42 · E09 0:49.5 · E10 0:55.
Es una voz sintética para medir tiempos; se reemplaza por la grabación del locutor.

## Falta conseguir
- Tomas de cafetería para E01, E02 y E09 (filmar o banco de video; términos de búsqueda en el guión).
- Música libre de regalías con licencia para publicidad (95–110 BPM, acústica y cálida) y efectos.
- Grabación del locutor.

## Tipografías
Fraunces (títulos) e Inter (textos y subtítulos), gratuitas en Google Fonts. Colores: café `#5B3A29`,
café oscuro `#2B1D14`, crema `#F7F3EE`, verde `#2E7D4F`, ámbar `#9A5B00`, rojo `#B3261E`.
