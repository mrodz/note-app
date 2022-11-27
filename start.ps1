FUNCTION Confirm-InputString {
	PARAM (
		[String] $InputString
	)

	SWITCH ($InputString.ToLower()) {
		{
			($_ -eq "y") -or ($_ -eq "yes")
		} {
			RETURN $true
		}
		DEFAULT {
			RETURN $false
		}
	}
}

FUNCTION Exit-Abrubt {
	PARAM (
		[String] $Message
	)
	
	Write-Error $Message

	EXIT
}

$HasDocker = Get-Command "docker" -errorAction SilentlyContinue

IF ($HasDocker) {
	Start-Process -FilePath "docker" -ArgumentList "compose", "up"

	IF ($? -eq $false) {
		Exit-Abrubt "Failed to build docker container."
	}

	Write-Host "`r`nWill ping the backend's container, requesting to sync database migrations.`r`n"
	Write-Host -ForegroundColor DarkYellow "Note that this may take a while, and you will get error messages describing failed attempts to connect.`r`n"

	[Int] $Attempts = 0
	WHILE ($true) {
		$Attempts += 1
		Write-Host -BackgroundColor Green "Attempt #$Attempts to sync database..."
		$Ready = Start-Process -ea silentlycontinue -PassThru -Wait -NoNewWindow -FilePath "docker.exe" -ArgumentList "exec", "-it", "node-api", "npx", "prisma", "migrate", "dev"

		IF ($Ready.ExitCode -eq 0) {
			Write-Host -ForegroundColor Green "Docker Container is active!"
			BREAK
		}

		Start-Sleep -Seconds 10
	}

	Write-Host -BackgroundColor DarkGreen -ForegroundColor White "========APP=LAUNCHED======="

	IF (Confirm-InputString (Read-Host -Prompt "Would you like to run a pre-packaged script on the backend? Enter [Y]es or [N]o")) {
		Write-Host -BackgroundColor White -ForegroundColor DarkGreen "Entering ADMIN mode. Press Control-C to exit."
		WHILE ($true) {
			Start-Process -Wait -NoNewWindow -FilePath "docker.exe" -ArgumentList "exec", "-it", "node-api", "npx", "ts-node", "admin.ts"
		}
	}
	ELSE {
		Write-Host "Okay! You can close this terminal session now."
	}
}
ELSE {
	Exit-Abrubt "Docker is required to host this app."
}