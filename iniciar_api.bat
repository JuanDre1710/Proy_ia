@echo off
echo 🟢 Iniciando microservicio IA River...
cd /d %~dp0\ia_fraude
call ..\venv\Scripts\activate
python app.py
pause
