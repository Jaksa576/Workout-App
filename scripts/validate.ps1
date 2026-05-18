$ErrorActionPreference = 'Stop'

$branch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
  $branch = '(detached HEAD)'
}

Write-Host "Working directory: $(Get-Location)"
Write-Host "Current branch: $branch"

npm run check

