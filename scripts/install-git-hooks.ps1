$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $repoRoot
try {
  git config core.hooksPath .githooks
  if ($LASTEXITCODE -ne 0) {
    throw "git config core.hooksPath failed with exit code $LASTEXITCODE"
  }

  Write-Host "Configured Git hooks path: .githooks"
} finally {
  Pop-Location
}
