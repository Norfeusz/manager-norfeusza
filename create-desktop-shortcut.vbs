Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")

Set oLink = oWS.CreateShortcut(sDesktop & "\Manager Norfeusza.lnk")

' Ścieżka do start.bat
sScriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
oLink.TargetPath = sScriptPath & "\start.bat"
oLink.WorkingDirectory = sScriptPath
oLink.Description = "Manager Norfeusza - Zarządzanie projektami muzycznymi"

' Ustaw ikonę z logo.ico
oLink.IconLocation = sScriptPath & "\logo.ico, 0"

oLink.Save

WScript.Echo "Skrót 'Manager Norfeusza' utworzony na pulpicie!"
