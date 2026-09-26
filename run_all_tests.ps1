Write-Host "Starting test suite..."

cd backend
# Run backend tests
Write-Host "Running backend tests..."
& .\venv\Scripts\python.exe -m pytest -v test_api.py test_ocr_accuracy.py --junitxml=backend_report.xml
$BACKEND_EXIT_CODE = $LASTEXITCODE

cd ..\frontend

# Run frontend/E2E tests
Write-Host "Running frontend E2E tests..."
# Start the backend server for frontend tests
cd ..\backend
$BackendJob = Start-Job {
    cd c:\Users\prity\Downloads\sih\backend
    .\venv\Scripts\python.exe main.py
}
cd ..\frontend
# Start frontend server
$FrontendJob = Start-Job {
    cd c:\Users\prity\Downloads\sih\frontend
    npm.cmd run dev
}

# Wait for servers to start
Write-Host "Waiting 15 seconds for servers to start..."
Start-Sleep -Seconds 15

# Run playwright
npx.cmd playwright test tests/e2e.spec.js --reporter=list,junit
$FRONTEND_EXIT_CODE = $LASTEXITCODE

# Kill servers
Stop-Job $BackendJob
Stop-Job $FrontendJob
Remove-Job $BackendJob
Remove-Job $FrontendJob

cd ..

Write-Host "`n=== TEST RUN SUMMARY ==="
if ($BACKEND_EXIT_CODE -eq 0) {
    Write-Host "Backend Tests: PASSED"
} else {
    Write-Host "Backend Tests: FAILED"
}

if ($FRONTEND_EXIT_CODE -eq 0) {
    Write-Host "Frontend/Integration Tests: PASSED"
} else {
    Write-Host "Frontend/Integration Tests: FAILED"
}

if ($BACKEND_EXIT_CODE -eq 0 -and $FRONTEND_EXIT_CODE -eq 0) {
    Write-Host "Overall: PASSED"
    exit 0
} else {
    Write-Host "Overall: FAILED"
    exit 1
}
