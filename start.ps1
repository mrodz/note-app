$HasDocker = Get-Command "docker" -errorAction SilentlyContinue

IF ($HasDocker) {
	Start-Process -Wait -FilePath "docker.exe" -ArgumentList "compose", "up"

	IF ($? -eq $false) {
		Exit-Abrubt "Failed to build docker container."
	}

	Start-Process -Wait -FilePath "docker.exe" -ArgumentList "exec", "-it", "node-api", "prisma", "migrate", "dev"

	IF ($? -eq $false) {
		Exit-Abrubt "Failed to run docker exec. This means the database cannot take API calls!"
	}

	Write-Host "App launched"
} ELSE {
	Exit-Abrubt "Docker is required to host this app."
}

FUNCTION Exit-Abrubt {
	PARAM (
		$Message
	)
	
	Write-Error $Message

	EXIT
}
