function extractFieldValue(line)
s = split(line,":",2)
str = Replace(s(1), ",", ";")
extractFieldValue = trim(str)
end function
 
function extractFieldName(line)
s = split(line,":",2)
str = Replace(s(0), ",", ";")
extractFieldName = trim(str)
end function
 
'***** jobfilter = "ITRS"
 
 
'***** Run the command
 
Set WshShell = WScript.CreateObject("WScript.Shell")
Set oExec = WshShell.Exec("c:\windows\system32\schtasks.exe /query /fo list /v")
 
newline = ""
header = ""
first = 1
 
'***** Process the output
Do While oExec.StdOut.AtEndOfStream <> True
 
sline=oExec.StdOut.ReadLine
 
 
if sline = "" then 
'****This is the line break
if newline <> "" then
 
if first = 1 and header <> "" then
'**** Print column headers
 
header = left(header,len(header)-1)
wscript.echo header
header = ""
first = 0
end if
 
'***Remove last comma
newline = left(newline,len(newline)-1)
 
if(InStr(newline,jobfilter) > 0) then
wscript.echo newline
end if
 
newline = ""
 
 
end if
 
elseif (InStr(1, sline,"Folder:") > 0) or (InStr(1, sline,"INFO:") > 0) then
 
'wscript.echo "folder"
 
else
 
newline = newline & extractFieldValue(sline) & ","
 
if first = 1 then
header = header & extractFieldName(sline) & ","
'wscript.echo header
end if
 
'wscript.echo extractFieldValue(sline)
 
end if
 
Loop