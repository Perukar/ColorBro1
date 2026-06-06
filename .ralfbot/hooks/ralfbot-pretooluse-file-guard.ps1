# ralfbot-pretooluse-file-guard.ps1 (TEMPLATE) - Claude Code PreToolUse guard for Edit/Write/MultiEdit.
# Blocks edits to LOCKED files (unless explicitly allowed), secret-like files, and out-of-repo paths.
# VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION (input fields + decision schema).
Set-StrictMode -Version Latest
. "$PSScriptRoot/ralfbot-common.ps1"

$inp = Read-RalfbotStdin
if (-not $inp) { [Console]::Error.WriteLine("RALFBOT WARNING: unparseable hook input - allowing"); Allow-PreToolUse }

# Assumed: $inp.tool_input.file_path (Edit/Write/MultiEdit). (VERIFY)
$fp = ''
try { $fp = [string]$inp.tool_input.file_path } catch { $fp = '' }
if ([string]::IsNullOrWhiteSpace($fp)) { Allow-PreToolUse }

$root = Get-RepoRoot
if (-not $root) { Deny-PreToolUse "cannot resolve repo root; refusing file write outside a known repo." }

# normalize to absolute + repo-relative
try { $full = [System.IO.Path]::GetFullPath((Join-Path $root $fp)) } catch { $full = [System.IO.Path]::GetFullPath($fp) }
if (Test-Path $fp) { try { $full = (Resolve-Path $fp).Path } catch {} }
$rootFull = [System.IO.Path]::GetFullPath($root)

if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    Deny-PreToolUse "file path is OUTSIDE the repository: $full"
}
$rel = ($full.Substring($rootFull.Length).TrimStart('\','/')) -replace '\\','/'
$relLower = $rel.ToLowerInvariant()

# --- secret-like ---
$secretRegex = @('(^|/)\.env($|\.)', '\.pem$', '(^|/)id_rsa$', '\.key$', 'secrets', 'credentials', 'token', 'private')
foreach ($s in $secretRegex) { if ($relLower -match $s) { Deny-PreToolUse "secret-like file write blocked: $rel" } }

# --- allowed override (env or .ralfbot/allowed-files.txt) ---
$allowed = @()
if ($env:RALFBOT_ALLOWED_FILES) { $allowed += ($env:RALFBOT_ALLOWED_FILES -split '[;,]') | ForEach-Object { $_.Trim() } }
$allowFile = Join-Path $root '.ralfbot/allowed-files.txt'
if (Test-Path $allowFile) {
    $allowed += Get-Content $allowFile | Where-Object { $_ -and ($_ -notmatch '^\s*#') } | ForEach-Object { $_.Trim() }
}
$allowedNorm = @()
foreach ($a in $allowed) { $allowedNorm += ((($a -replace '\\','/') -replace '^\./','').ToLowerInvariant()) }

function Test-Allowed { param([string]$relPath)
    foreach ($a in $allowedNorm) {
        if ([string]::IsNullOrWhiteSpace($a)) { continue }
        if ($a.EndsWith('/**')) { $prefix = $a.Substring(0, $a.Length - 3); if ($relPath.StartsWith($prefix)) { return $true } }
        elseif ($relPath -eq $a) { return $true }
        elseif ($relPath -like $a) { return $true }
    }
    return $false
}

# --- LOCKED set ---
$lockedRegex = @(
    '^agents\.md$', '^claude\.md$', '^www/core\.js$',
    '^test_www_business_scenarios\.js$', '^test_www_mass_model\.js$',
    '^test_www_mapping\.js$', '^test_www_render_runtime\.js$',
    '^docs/logic_locked/', '^docs/agents_locked/'
)
$isLocked = $false
foreach ($l in $lockedRegex) { if ($relLower -match $l) { $isLocked = $true; break } }

if ($isLocked -and -not (Test-Allowed $relLower)) {
    Deny-PreToolUse "LOCKED file '$rel' edit blocked - add it to RALFBOT_ALLOWED_FILES or .ralfbot/allowed-files.txt for an explicitly-scoped, approved task."
}

Allow-PreToolUse
