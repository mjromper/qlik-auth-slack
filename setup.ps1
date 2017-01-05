$nl = [Environment]::NewLine

If (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(`
    [Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "You do not have Administrator rights to run this script!`nPlease re-run this script as an Administrator!"
    Write-Host $nl"Press any key to continue ..."
    $x = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Break
}

# Set black background
$Host.UI.RawUI.BackgroundColor = "Black"
Clear-Host

# define some variables
$temp="c:\TempSlack\SlackAuthSetup-yFH4gu"
$npm="npm-1.4.12.zip"
$config="c:\Program Files\Qlik\Sense\ServiceDispatcher"
$target="$config\Node\Slack-Auth"

# check if module is installed
if(!(Test-Path -Path "$target\node_modules")) {

    $confirm = Read-Host "This script will install the Slack Auth module, do you want to proceed? [Y/n]"
    if ($confirm -eq 'n') {
      Break
    }

    # check if npm has been downloaded already
	if(!(Test-Path -Path "$temp\$npm")) {
        New-Item -Path "$temp" -Type directory -force | Out-Null
		Invoke-WebRequest "http://nodejs.org/dist/npm/$npm" -OutFile "$temp\$npm"
	}

    # check if module has been downloaded
    if(!(Test-Path -Path "$target\src")) {
        New-Item -Path "$target\src" -Type directory | Out-Null
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/qlik-auth-slack/master/service.js" -OutFile "$target\service.js"
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/qlik-auth-slack/master/slack.js" -OutFile "$target\slack.js"
        Invoke-WebRequest "http://raw.githubusercontent.com/mjromper/qlik-auth-slack/master/package.json" -OutFile "$target\package.json"
    }

    # check if npm has been unzipped already
    if(!(Test-Path -Path "$temp\node_modules")) {
        Write-Host "Extracting files..."
        Add-Type -assembly "system.io.compression.filesystem"
        [io.compression.zipfile]::ExtractToDirectory("$temp\$npm", "$temp")
    }

    # install module with dependencies
	Write-Host "Installing modules..."
    Push-Location "$target"
    $env:Path=$env:Path + ";$config\Node"
	&$temp\npm.cmd config set spin=false
	&$temp\npm.cmd --prefix "$target" install
    Pop-Location

    # cleanup temporary data
    Write-Host $nl"Removing temporary files..."
    Remove-Item $temp -recurse
}

function Read-Default($text, $defaultValue) { $prompt = Read-Host "$($text) [$($defaultValue)]"; return ($defaultValue,$prompt)[[bool]$prompt]; }

# check if config has been added already
if (!(Select-String -path "$config\services.conf" -pattern "Identity=aor-slack-auth" -quiet)) {

	$settings = @"


[slack-auth]
Identity=aor-slack-auth
Enabled=true
DisplayName=Slack Auth
ExecType=nodejs
ExePath=Node\node.exe
Script=Node\slack-auth\service.js

[slack-auth.parameters]
user_directory=
auth_port=
slack_team=
client_id=
client_secret=
"@
	Add-Content "$config\services.conf" $settings
}

# configure module
Write-Host $nl"CONFIGURE MODULE"
Write-Host $nl"To make changes to the configuration in the future just re-run this script."

$user_directory=Read-Default $nl"Enter name of user directory" "SLACK"
$auth_port=Read-Default $nl"Enter port" "8085"
$client_id=Read-Default $nl"Application ID" $client_id
$client_secret=Read-Default $nl"Client Secret" $client_secret
$slack_team=Read-Default $nl"Slack Team (Optional)" ""

function Set-Config( $file, $key, $value )
{
    $regreplace = $("(?<=$key).*?=.*")
    $regvalue = $("=" + $value)
    if (([regex]::Match((Get-Content $file),$regreplace)).success) {
        (Get-Content $file) `
            |Foreach-Object { [regex]::Replace($_,$regreplace,$regvalue)
         } | Set-Content $file
    }
}

# write changes to configuration file
Write-Host $nl"Updating configuration..."
Set-Config -file "$config\services.conf" -key "user_directory" -value $user_directory
Set-Config -file "$config\services.conf" -key "auth_port" -value $auth_port
Set-Config -file "$config\services.conf" -key "client_id" -value $client_id
Set-Config -file "$config\services.conf" -key "client_secret" -value $client_secret
Set-Config -file "$config\services.conf" -key "slack_team" -value $slack_team

Write-Host $nl"Done! Please restart the 'Qlik Sense Service Dispatcher' service for changes to take affect."$nl