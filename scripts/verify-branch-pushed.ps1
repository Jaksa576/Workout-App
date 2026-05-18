[CmdletBinding()]
param(
  [switch]$AllowMain
)

$ErrorActionPreference = 'Stop'

$branch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($branch)) {
  throw 'No current branch found. Detached HEAD is not supported for completion verification.'
}

if ($branch -eq 'main' -and -not $AllowMain) {
  throw 'Refusing to verify main without -AllowMain. Use a named branch for Codex worktree changes.'
}

$uncommitted = git status --porcelain
if ($uncommitted) {
  throw 'Working tree has uncommitted changes. Commit or stash them before verifying the branch is pushed.'
}

git fetch --prune origin

$upstream = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($upstream)) {
  throw "Branch '$branch' has no upstream. Push it with: git push -u origin $branch"
}

$localHead = git rev-parse HEAD
$upstreamHead = git rev-parse '@{u}'

if ($localHead -ne $upstreamHead) {
  $aheadBehind = git rev-list --left-right --count 'HEAD...@{u}'
  $parts = $aheadBehind -split '\s+'
  $ahead = [int]$parts[0]
  $behind = [int]$parts[1]

  if ($ahead -gt 0) {
    throw "Local branch '$branch' is ahead of '$upstream' by $ahead commit(s). Push before final report."
  }

  throw "Local branch '$branch' does not match '$upstream' (ahead: $ahead, behind: $behind)."
}

Write-Host "Branch '$branch' is pushed to '$upstream' at $localHead."

