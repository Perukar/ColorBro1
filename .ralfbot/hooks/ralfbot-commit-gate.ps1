# ralfbot-commit-gate.ps1 (TEMPLATE) - safe commit gate.
# NEVER pushes. NEVER uses git add . / -A / --all. Stages ONLY the exact approved files.
# Without -CommitYes 'yes', it runs all checks and prints at most "Ready for commit gate: yes" - no staging, no commit.
param(
    [Parameter(Mandatory=$true)][string]$Message,
    [Parameter(Mandatory=$true)][string[]]$Files,   # Approved commit file list (subset of Allowed files)
    [string]$CommitYes = 'no',                       # must be exactly 'yes' to actually commit
    [string]$ExpectedRoot
)
Set-StrictMode -Version Latest
. "$PSScriptRoot/ralfbot-common.ps1"
function Fail { param([string]$m) Write-Blocked $m; exit 2 }

$root = Get-RepoRoot
if (-not $root) { Fail "not inside a git repository" }
if ($ExpectedRoot -and -not (Test-ExpectedRoot $ExpectedRoot)) { Fail "ROOT MISMATCH: expected '$ExpectedRoot'" }
if (Test-IndexLock) {
    if (Test-ActiveGitProcess) { Fail "index.lock + active git process" }
    Fail "index.lock present (stale candidate) - resolve via preflight before committing."
}
if (@(Get-StagedFiles).Count -gt 0) { Fail "staged files already present - commit gate requires an EMPTY index before staging." }

# --- Allowed files (override source) ---
$allowed = @()
if ($env:RALFBOT_ALLOWED_FILES) { $allowed += ($env:RALFBOT_ALLOWED_FILES -split '[;,]') | ForEach-Object { ($_.Trim() -replace '\\','/') } }
$allowFile = Join-Path $root '.ralfbot/allowed-files.txt'
if (Test-Path $allowFile) { $allowed += Get-Content $allowFile | Where-Object { $_ -and ($_ -notmatch '^\s*#') } | ForEach-Object { ($_.Trim() -replace '\\','/') } }
if ($allowed.Count -eq 0) { Fail "no Allowed files defined (RALFBOT_ALLOWED_FILES or .ralfbot/allowed-files.txt). Refusing to commit." }

$approved = @($Files | ForEach-Object { ($_.Trim() -replace '\\','/') })
$changed  = @(Get-ChangedFiles | ForEach-Object { ($_ -replace '\\','/') })
$untracked = @(Get-UntrackedFiles | ForEach-Object { ($_ -replace '\\','/') })
# Treat both modified tracked and untracked files as working tree changes
$allChanged = @($changed + $untracked) | Select-Object -Unique

# approved subset of Allowed
foreach ($f in $approved) { if ($allowed -notcontains $f) { Fail "approved file '$f' is NOT a subset of Allowed files." } }
# allChanged (modified + untracked) subset of Allowed (no scope leak)
foreach ($f in $allChanged)  { if ($allowed -notcontains $f) { Fail "changed/untracked file '$f' is OUTSIDE Allowed scope." } }
# approved must correspond to actual intended changes (modified or untracked)
foreach ($f in $approved) { if ($allChanged -notcontains $f) { Fail "approved file '$f' has no actual changes or untracked status (not in working tree)." } }

# --- AGENTS.md / LOCKED conflict: deterministic shallow check only ---
# NOTE: hooks CANNOT judge business logic. Real AGENTS.md-vs-tests conflict is a HUMAN STOP.
# This only honors an explicit sentinel that a human/process set when a conflict is unresolved.
if (Test-Path (Join-Path $root '.ralfbot/CONFLICT')) { Fail "unresolved AGENTS/LOCKED conflict flagged (.ralfbot/CONFLICT) - human decision required (STOP)." }

# --- full test matrix + git diff --check ---
& "$PSScriptRoot/ralfbot-test-matrix.ps1" -ExpectedRoot $root
if ($LASTEXITCODE -ne 0) { Fail "test matrix / git diff --check did not PASS." }

# --- gate summary BEFORE staging ---
if ($CommitYes -ne 'yes') {
    Write-Host "Ready for commit gate: yes"
    exit 0
}

# --- Commit: yes -> stage EXACT approved files only ---
foreach ($f in $approved) {
    git add -- $f
    if ($LASTEXITCODE -ne 0) { Fail "git add failed for '$f'." }
}

# verify staged set == approved set
$stagedNow    = @(Get-StagedFiles | ForEach-Object { ($_ -replace '\\','/') })
$onlyStaged   = @($stagedNow | Where-Object { $approved -notcontains $_ })
$onlyApproved = @($approved   | Where-Object { $stagedNow -notcontains $_ })
if (@($onlyStaged).Count -gt 0 -or @($onlyApproved).Count -gt 0) {
    Fail "staged set != approved set (staged-extra: $($onlyStaged -join ',') ; approved-missing: $($onlyApproved -join ','))."
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { Fail "git commit failed." }
Write-Pass "committed approved files. NOTE: push is NOT performed by this gate."
exit 0
