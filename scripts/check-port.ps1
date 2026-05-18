[CmdletBinding()]
param(
  [int]$Port = 3001
)

$ErrorActionPreference = 'Stop'

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
  $connections | Select-Object LocalAddress, LocalPort, State, OwningProcess
  throw "Port $Port is already in use."
}

Write-Host "Port $Port is available."

