[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackendRoot,

    [Parameter(Mandatory = $true)]
    [string]$ScenarioList,

    [ValidateRange(0, 300)]
    [int]$HoldSeconds = 15
)

$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'SecuraAI - Wazuh multi-family demo'
$manager = Join-Path $BackendRoot 'scripts\wazuh\agent-scenario-manager.ps1'
if (-not (Test-Path -LiteralPath $manager)) {
    throw "Wazuh scenario manager was not found: $manager"
}

$scenarios = @($ScenarioList.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($scenarios.Count -eq 0) {
    throw 'At least one Wazuh scenario is required.'
}

Set-Location -LiteralPath $BackendRoot
Clear-Host
Write-Host 'SecuraAI is sending Authentication, App Access, VPN and SSO scenarios through the Wazuh Windows agent.' -ForegroundColor Cyan

for ($index = 0; $index -lt $scenarios.Count; $index++) {
    $scenario = $scenarios[$index]
    Write-Host ''
    Write-Host "[$($index + 1)/$($scenarios.Count)] $scenario" -ForegroundColor Green
    & $manager -Scenario $scenario
    if (-not $?) {
        throw "Wazuh scenario failed: $scenario"
    }
    Start-Sleep -Seconds 2
}

Write-Host ''
Write-Host "All $($scenarios.Count) scenarios were emitted through the Windows agent log stream." -ForegroundColor Green
Write-Host "Keeping this result visible for $HoldSeconds seconds for video capture..." -ForegroundColor Yellow
Start-Sleep -Seconds $HoldSeconds
