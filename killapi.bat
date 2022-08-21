@ECHO OFF
SETLOCAL
TITLE Kill server on port

@REM Allow users to pass the port as an argument, instead of typing it manually.
IF "%~1" NEQ "" (
	SET Port=%~1
) ELSE (
	ECHO Enter a port number...
	CALL :ReadInput Port,"Will kill process running on localhost:"
)

CALL :StrLen PortLength Port
SET /a PortLength=PortLength

IF %PortLength% NEQ 4 (
	ECHO:
	ECHO Port must be 4 digit long ^(you entered %Port%^)
	GOTO :eof
)

CALL :KillPort PIDsKilled,%Port%

IF %PIDsKilled% EQU 1 (
	ECHO "Done! Port %Port% is clear for usage."
) ELSE (
	ECHO "Uh oh, could not kill process on port %Port% (Are you sure something is running there and you have permission to kill it?)"
)

GOTO :eof

:KillPort <resultVar> <port>
(
	FOR /F "tokens=5 delims= " %%i IN ('netstat -ano ^| findstr :%~2') DO (
		TASKKILL /F /PID %%i
		SET %~1=1
		EXIT /B 0
	)

	SET %~1=0
	EXIT /B 0
)

:ReadInput <resultVar> <stringPrompt>
(
	SET /p "%~1=%~2"
	EXIT /B 0
)

:StrLen <resultVar> <stringVar>
(   
    SETLOCAL ENABLEDELAYEDEXPANSION
    (set^ tmp=!%~2!)
    IF DEFINED tmp (
        SET "len=1"
        FOR %%P IN (4096 2048 1024 512 256 128 64 32 16 8 4 2 1) DO (
            IF "!tmp:~%%P,1!" NEQ "" ( 
                SET /a "len+=%%P"
                SET "tmp=!tmp:~%%P!"
            )
        )
    ) ELSE (
        SET len=0
    )
)
( 
    ENDLOCAL
    SET "%~1=%len%"
    EXIT /b
)

