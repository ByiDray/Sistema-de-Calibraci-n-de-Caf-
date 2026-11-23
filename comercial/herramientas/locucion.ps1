param([string]$Lineas, [string]$Salida, [string]$Voz = 'Microsoft Sabina Desktop')
# Genera un WAV (48 kHz, 16 bits, mono) por línea con la voz de Windows en español de México.
Add-Type -AssemblyName System.Speech
$voz = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voz.SelectVoice($Voz)
$voz.Rate = 1  # un poco más ágil, cercano al ritmo de un locutor de comerciales
$formato = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(48000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($l in Get-Content -Path $Lineas -Encoding UTF8) {
  $id, $texto = $l -split '\|', 2
  $archivo = Join-Path $Salida "VO_$id.wav"
  $voz.SetOutputToWaveFile($archivo, $formato)
  $voz.Speak($texto)
  $voz.SetOutputToNull()
  $dur = (Get-Item $archivo).Length / (48000 * 2)
  Write-Output ("ok VO_{0}.wav  {1:N1} s" -f $id, $dur)
}
$voz.Dispose()
