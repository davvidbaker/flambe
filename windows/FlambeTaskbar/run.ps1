$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Resolve-Path (Join-Path $scriptDir "..\..")

if (-not $env:FLAMBE_API_TOKEN -and (Test-Path (Join-Path $projectDir ".env"))) {
  Get-Content (Join-Path $projectDir ".env") | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $pair = $_ -split "=", 2
    if ($pair.Length -ne 2) { return }
    $name = $pair[0].Trim()
    $value = $pair[1].Trim().Trim("'").Trim('"')
    if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

Set-Location $scriptDir
& dotnet run -c Release -- @args
