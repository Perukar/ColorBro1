# ralfbot-pretooluse-bash-guard.ps1 (TEMPLATE) - Claude Code PreToolUse guard for Bash.
# Reads hook JSON from stdin; blocks forbidden/destructive git + shell commands.
# VERIFY AGAINST CURRENT CLAUDE CODE DOCS BEFORE INSTALLATION (input fields + decision schema).
Set-StrictMode -Version Latest
. "$PSScriptRoot/ralfbot-common.ps1"

$inp = Read-RalfbotStdin
# Parse policy: if stdin cannot be parsed, FAIL-OPEN (allow) so the session is not bricked,
# but warn. To run FAIL-CLOSED instead, replace the next line with: Deny-PreToolUse "unparseable hook input".
if (-not $inp) { [Console]::Error.WriteLine("RALFBOT WARNING: unparseable hook input - allowing"); Allow-PreToolUse }

# Assumed shape: $inp.tool_name, $inp.tool_input.command   (VERIFY)
$cmd = ''
try { $cmd = [string]$inp.tool_input.command } catch { $cmd = '' }
if ([string]::IsNullOrWhiteSpace($cmd)) { Allow-PreToolUse }

$c = $cmd.ToLowerInvariant()

# --- hard-block destructive / forbidden ---
$denyPatterns = @(
    'git\s+add\s+\.',
    'git\s+add\s+-a(\s|$)',
    'git\s+add\s+--all',
    'git\s+push',
    'git\s+reset',
    'git\s+clean',
    'git\s+checkout',
    'git\s+switch',
    'git\s+restore',
    'git\s+stash',
    'rm\s+-r?f',
    'remove-item.*-recurse',
    'remove-item.*-force',
    'del\s+/[a-z]',
    '\.git[\\/](index|head|config|refs|objects)'
)
foreach ($p in $denyPatterns) {
    if ($c -match $p) {
        Deny-PreToolUse "forbidden/destructive command matched /$p/. Use RALFBOT flow (preflight / test-matrix / commit-gate) or get explicit user approval first."
    }
}

# --- raw commit must go through the gate ---
if (($c -match 'git\s+commit') -and ($c -notmatch 'ralfbot-commit-gate')) {
    Deny-PreToolUse "raw 'git commit' is not allowed. Commit only via ralfbot-commit-gate.ps1 after explicit 'Commit: yes'."
}

# --- block chaining when combined with git/destructive ---
$touchesGit = ($c -match '\bgit\b') -or ($c -match 'remove-item') -or ($c -match '\brm\b') -or ($c -match '\bdel\b')
$hasChain   = ($cmd -match '&&') -or ($cmd -match ';') -or ($cmd -match '\|')
if ($touchesGit -and $hasChain) {
    Deny-PreToolUse "command chaining (&&, ;, |) with git/destructive actions is not allowed - run each command separately for an auditable trail."
}

# --- otherwise allow (read-only / benign) ---
Allow-PreToolUse
