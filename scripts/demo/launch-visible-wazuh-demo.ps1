[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackendRoot,

    [Parameter(Mandatory = $true)]
    [string]$ScenarioList,

    [ValidateRange(0, 300)]
    [int]$HoldSeconds = 20
)

$ErrorActionPreference = 'Stop'

$manager = Join-Path $BackendRoot 'scripts\wazuh\agent-scenario-manager.ps1'
if (-not (Test-Path -LiteralPath $manager)) {
    throw "Wazuh scenario manager was not found: $manager"
}

$menuChoices = @{
    AuthNormal              = '1'
    AuthBurst               = '2'
    AuthSuccessAfterFail    = '3'
    AuthMultiAccountSpray   = '4'
    AuthAccountLockout      = '5'
    AppNormal               = '6'
    AppDenialBurst          = '7'
    AppSuccessAfterDenial   = '8'
    VpnNormal               = '9'
    VpnFailureBurst         = '10'
    SsoFailureBurst         = '11'
    SsoBaselineAndNewIp     = '12'
    WinNativeAuthFail       = '13'
    AppAuditScanProfile     = '14'
    BoundaryJitterMix       = '15'
    ColdStartNoHistory      = '16'
    AllCore                 = 'A'
}

$scenarios = @($ScenarioList.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if ($scenarios.Count -eq 0) {
    throw 'At least one Wazuh scenario is required.'
}
foreach ($scenario in $scenarios) {
    if (-not $menuChoices.ContainsKey($scenario)) {
        throw "The Wazuh menu does not define scenario '$scenario'."
    }
}

$windowTitle = "SecuraAI Wazuh Scenario Menu $([Guid]::NewGuid().ToString('N').Substring(0, 8))"
$childScript = Join-Path $env:TEMP "$windowTitle.ps1"
$escapedTitle = $windowTitle.Replace("'", "''")
$escapedBackendRoot = $BackendRoot.Replace("'", "''")
$escapedManager = $manager.Replace("'", "''")
$childContent = @"
`$Host.UI.RawUI.WindowTitle = '$escapedTitle'
Set-Location -LiteralPath '$escapedBackendRoot'
& '$escapedManager'
exit `$LASTEXITCODE
"@
[IO.File]::WriteAllText($childScript, $childContent, [Text.UTF8Encoding]::new($false))

$arguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$childScript`""

$process = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList $arguments `
    -WindowStyle Maximized `
    -PassThru

if ($null -eq $process) {
    throw 'The visible Wazuh PowerShell window could not be started.'
}

$shell = New-Object -ComObject WScript.Shell
$activated = $false
$activationDeadline = (Get-Date).AddSeconds(20)
while ((Get-Date) -lt $activationDeadline -and -not $process.HasExited) {
    if ($shell.AppActivate($windowTitle)) {
        $activated = $true
        break
    }
    Start-Sleep -Milliseconds 300
}
if (-not $activated) {
    throw 'The Wazuh scenario menu opened but could not receive keyboard input.'
}

Start-Sleep -Seconds 5
$historyPath = 'C:\ProgramData\securaai-sim\run-history.csv'

function Get-ScenarioRunCount {
    param([Parameter(Mandatory = $true)][string]$ScenarioName)

    if (-not (Test-Path -LiteralPath $historyPath)) {
        return 0
    }
    return @(
        Import-Csv -LiteralPath $historyPath |
            Where-Object { $_.Scenario -eq $ScenarioName }
    ).Count
}

try {
    foreach ($scenario in $scenarios) {
        if ($process.HasExited) {
            throw "The Wazuh menu closed before '$scenario' could run."
        }

        $beforeCount = Get-ScenarioRunCount -ScenarioName $scenario
        [void]$shell.AppActivate($windowTitle)
        Start-Sleep -Milliseconds 500
        $shell.SendKeys([string]$menuChoices[$scenario])
        Start-Sleep -Milliseconds 700
        $shell.SendKeys('{ENTER}')

        $scenarioDeadline = (Get-Date).AddMinutes(4)
        do {
            Start-Sleep -Seconds 1
            if ($process.HasExited) {
                throw "The Wazuh menu closed while '$scenario' was running."
            }
            $afterCount = Get-ScenarioRunCount -ScenarioName $scenario
        } while ($afterCount -le $beforeCount -and (Get-Date) -lt $scenarioDeadline)

        if ($afterCount -le $beforeCount) {
            throw "Timed out waiting for Wazuh scenario '$scenario' to complete."
        }
        Start-Sleep -Seconds 3
    }

    [void]$shell.AppActivate($windowTitle)
    Write-Host "All $($scenarios.Count) menu selections completed. Keeping the menu visible for $HoldSeconds seconds..." -ForegroundColor Green
    Start-Sleep -Seconds $HoldSeconds
    $shell.SendKeys('Q')
    Start-Sleep -Milliseconds 700
    $shell.SendKeys('{ENTER}')

    if (-not $process.WaitForExit(15000)) {
        throw 'The Wazuh menu did not close after selecting Q.'
    }
    exit $process.ExitCode
}
finally {
    Remove-Item -LiteralPath $childScript -Force -ErrorAction SilentlyContinue
}
