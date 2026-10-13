@echo off
set GIT="%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
cd /d "%~dp0"

%GIT% config --global user.name "Mina Kameel Nashed"
%GIT% config --global user.email "mina.kameel.nashed@gmail.com"
%GIT% config --global init.defaultBranch main

%GIT% init
%GIT% add -A
%GIT% commit -m "Initial commit: FLAME platform (React + Node/Express + Prisma)"

echo ===STATUS===
%GIT% log --oneline -1
echo ===FILECOUNT===
%GIT% ls-files | find /c /v ""
