# ralfbot-common.ps1  (Block C v1 - TEMPLATE, NOT INSTALLED)
# Shared READ-ONLY helpers for RALFBOT hooks/scripts.
# This file MUST NOT modify, stage, or commit anything.
# VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION (hook input fields + decision JSON schema).

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-RalfbotStdin {
    # Safely read & parse Claude Code hook JSON from stdin. Returns PSCustomObject or $null.
    try {
        $raw = [Console]::In.ReadToEnd()
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return ($raw | ConvertFrom-Json -ErrorAction Stop)
    } catch { return $null }
}

function Get-RepoRoot { try { return (git rev-parse --show-toplevel 2>$null).Trim() } catch { return $null } }

function Test-ExpectedRoot {
    param([string]$Expected)
    if ([string]::IsNullOrWhiteSpace($Expected)) { return $true }
    $actual = Get-RepoRoot
    if (-not $actual) { return $false }
    try { return ((Resolve-Path $actual).Path -eq (Resolve-Path $Expected).Path) } catch { return $false }
}

function Get-CurrentBranch { try { return (git rev-parse --abbrev-ref HEAD 2>$null).Trim() } catch { return $null } }
function Get-Head          { try { return (git rev-parse HEAD 2>$null).Trim() } catch { return $null } }
function Get-GitStatusShort{ try { return @(git status --short 2>$null) | Where-Object { $_ } } catch { return @() } }
function Get-StagedFiles   { try { return @(git diff --cached --name-only 2>$null) | Where-Object { $_ } } catch { return @() } }
function Get-ChangedFiles  { try { return @(git diff --name-only 2>$null) | Where-Object { $_ } } catch { return @() } }
function Get-UntrackedFiles{ try { return @(git ls-files --others --exclude-standard 2>$null) | Where-Object { $_ } } catch { return @() } }

function Test-ActiveGitProcess { return [bool](Get-Process git -ErrorAction SilentlyContinue) }

function Get-IndexLockPath { $r = Get-RepoRoot; if (-not $r) { return $null }; return (Join-Path $r '.git/index.lock') }
function Test-IndexLock    { $p = Get-IndexLockPath; return ($p -and (Test-Path $p)) }
function Get-IndexLockSize { $p = Get-IndexLockPath; if ($p -and (Test-Path $p)) { return (Get-Item $p).Length }; return -1 }

# ---- output helpers ----
function Write-Pass        { param([string]$m) Write-Host "PASS: $m" }
function Write-WarningLine { param([string]$m) Write-Host "WARNING: $m" }
function Write-Blocked     { param([string]$m) Write-Host "BLOCKED: $m" }

# ---- PreToolUse decision helpers ----
# Primary, version-stable block mechanism = EXIT CODE 2 (stderr is returned to Claude).
# Secondary = JSON on stdout. The JSON shape below is an ASSUMPTION.
# VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION.
function Deny-PreToolUse {
    param([string]$Reason)
    [Console]::Error.WriteLine("RALFBOT BLOCKED: $Reason")
    $payload = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = "RALFBOT: $Reason"
        }
    } | ConvertTo-Json -Depth 6 -Compress
    Write-Output $payload
    exit 2
}

function Allow-PreToolUse {
    # No output + exit 0 = proceed with Claude Code's normal permission flow.
    exit 0
}
