$ErrorActionPreference = "Stop"
$editionRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$commonScript = Join-Path $editionRoot "..\amr_atlas_common\scripts\build-edition.ps1"
if (-not (Test-Path -LiteralPath $commonScript)) {
    throw "Base comune non trovata: $commonScript"
}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $commonScript -EditionRoot $editionRoot
if ($LASTEXITCODE -ne 0) { throw "Build fallita con codice $LASTEXITCODE" }
