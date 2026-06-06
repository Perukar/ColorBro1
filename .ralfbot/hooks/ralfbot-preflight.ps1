# ralfbot-preflight.ps1 (TEMPLATE) - manual/bootstrap preflight. READ-ONLY by default.
# The ONLY mutation permitted here is removing a 0-byte stale index.lock, and only with
# the explicit -AllowStaleLockRemoval switch AND no active git process.
param(
    [string]$ExpectedRoot,
    [switch]$AllowStaleLockRemoval
)
Set-StrictMode -Version Latest
. "$PSScriptRoot/ralfbot-common.ps1"

$root = Get-RepoRoot
if (-not $root) { Write-Blocked "not inside a git repository"; exit 2 }
if ($ExpectedRoot -and -not (Test-ExpectedRoot $ExpectedRoot)) {
    Write-Blocked "ROOT MISMATCH: expected '$ExpectedRoot', actual '$root'"; exit 2
}

$branch    = Get-CurrentBranch
$head      = Get-Head
$status    = Get-GitStatusShort
$staged    = Get-StagedFiles
$changed   = Get-ChangedFiles
$untracked = Get-UntrackedFiles
$activeGit = Test-ActiveGitProcess
$hasLock   = Test-IndexLock
$lockSize  = Get-IndexLockSize

Write-Host "Repo root : $root"
Write-Host "Branch    : $branch"
Write-Host "HEAD      : $head"
Write-Host "Staged    : $([string]::Join(', ', @($staged)))"
Write-Host "Changed   : $([string]::Join(', ', @($changed)))"
Write-Host "Untracked : $([string]::Join(', ', @($untracked)))"
Write-Host "git proc  : $activeGit"

# --- secret-like presence (names only; contents NEVER read) ---
$secretGlobs = @('.env','.env.*','*.pem','id_rsa','*.key','*secrets*','*credentials*','*token*','*private*')
# exclude common build/package dirs from scan (too many false positives)
# escape leading dots for .git and .venv so regex matches literally
$excludePattern = '[\\/](\.git|node_modules|venv|\.venv|build|dist|__pycache__)[\\/]'
$secretsFound = @()
foreach ($g in $secretGlobs) {
    $secretsFound += Get-ChildItem -Path $root -Recurse -Force -File -Filter $g -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch $excludePattern } |
        Select-Object -ExpandProperty FullName
}
if ($secretsFound.Count -gt 0) {
    Write-WarningLine "secret-like files present (NOT read): $([string]::Join(', ', @($secretsFound | Select-Object -Unique)))"
}

# --- index.lock policy ---
if ($hasLock -and $activeGit) {
    Write-Blocked "index.lock present AND active git process - concurrent/active git operation"; exit 2
}
if ($hasLock -and -not $activeGit) {
    if ($AllowStaleLockRemoval -and $lockSize -eq 0) {
        Remove-Item (Get-IndexLockPath) -Force
        Write-WarningLine "stale 0-byte index.lock removed (explicit -AllowStaleLockRemoval)"
    } else {
        Write-Blocked "stale index.lock candidate (size=$lockSize bytes). NOT removing by default. Re-run with -AllowStaleLockRemoval only if 0 bytes and no active git process, or remove manually."
        exit 2
    }
}

# --- staged files block ---
if ($staged.Count -gt 0) {
    Write-Blocked "staged files already present before task: $([string]::Join(', ', @($staged)))"; exit 2
}

# --- dirty vs clean ---
if ($status.Count -gt 0) {
    Write-WarningLine "DIRTY repo - recommend DIRTY STATE SCOPE AUDIT before new implementation"
    Write-Host "STATUS: DIRTY"
    exit 0
}

Write-Pass "clean working tree, no staged files, no lock conflict"
Write-Host "STATUS: PASS"
exit 0
