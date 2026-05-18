$ErrorActionPreference = 'Stop'

Write-Host "Working directory: $(Get-Location)"
Write-Host "git: $(git --version)"
Write-Host "node: $(node --version)"
Write-Host "npm: $(npm --version)"

$branch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
  throw 'No current branch found. Detached HEAD is not supported for Codex worktree setup.'
}

if ($branch -eq 'main') {
  throw 'Refusing to set up a Codex worktree on main. Create or switch to a named branch first.'
}

git fetch --prune origin

$sourceEnv = 'C:\Code\Workout-App\.env.local'
$targetEnv = Join-Path (Get-Location) '.env.local'

if (-not (Test-Path -LiteralPath $targetEnv)) {
  if (-not (Test-Path -LiteralPath $sourceEnv)) {
    throw "Missing source .env.local at $sourceEnv."
  }

  Copy-Item -LiteralPath $sourceEnv -Destination $targetEnv
  Write-Host 'Copied .env.local from C:\Code\Workout-App\.env.local.'
} else {
  Write-Host '.env.local already exists; leaving it unchanged.'
}

$envContent = Get-Content -LiteralPath $targetEnv -Raw
$requiredKeys = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
)

foreach ($key in $requiredKeys) {
  if ($envContent -notmatch "(?m)^\s*$([regex]::Escape($key))\s*=") {
    throw ".env.local is missing $key."
  }
}

Write-Host '.env.local contains required public Supabase keys.'

npm install

