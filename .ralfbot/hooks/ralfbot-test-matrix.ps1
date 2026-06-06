# ralfbot-test-matrix.ps1 (TEMPLATE) - runs the full PERUKAR test matrix, each command SEPARATELY.
# No &&. No ; grouping. Adds git diff --check. Returns PASS (exit 0) / BLOCKED (exit 2).
param([string]$ExpectedRoot)
Set-StrictMode -Version Latest
. "$PSScriptRoot/ralfbot-common.ps1"

$root = Get-RepoRoot
if (-not $root) { Write-Blocked "not inside a git repository"; exit 2 }
if ($ExpectedRoot -and -not (Test-ExpectedRoot $ExpectedRoot)) { Write-Blocked "ROOT MISMATCH: expected '$ExpectedRoot'"; exit 2 }

Push-Location $root
try {
    $commands = @(
        @('node','--check','www/core.js'),
        @('node','--check','test_www_business_scenarios.js'),
        @('node','--check','test_www_mass_model.js'),
        @('node','--check','test_www_mapping.js'),
        @('node','--check','test_www_render_runtime.js'),
        @('node','test_www_business_scenarios.js'),
        @('node','test_www_mass_model.js'),
        @('node','test_www_mapping.js'),
        @('node','test_www_render_runtime.js')
    )
    $failed = @()
    foreach ($parts in $commands) {
        $display = ($parts -join ' ')
        Write-Host "RUN: $display"
        & $parts[0] @($parts[1..($parts.Count - 1)])
        if ($LASTEXITCODE -ne 0) { $failed += $display }
    }

    # cleanliness check (separate command)
    Write-Host "RUN: git diff --check"
    git diff --check
    if ($LASTEXITCODE -ne 0) { $failed += 'git diff --check' }

    if ($failed.Count -gt 0) { Write-Blocked ("FAIL: " + [string]::Join(' | ', $failed)); exit 2 }
    Write-Pass "full test matrix + git diff --check"
    exit 0
} finally { Pop-Location }
