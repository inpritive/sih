#!/bin/bash
echo "Starting test suite..."

cd backend
# Activate virtual environment just in case
source venv/Scripts/activate 2>/dev/null || true

# Run backend tests
echo "Running backend tests..."
./venv/Scripts/python.exe -m pytest -v test_api.py test_ocr_accuracy.py --junitxml=backend_report.xml
BACKEND_EXIT_CODE=$?

cd ../frontend

# Run frontend/E2E tests
echo "Running frontend E2E tests..."
# Start the backend server for frontend tests
cd ../backend
./venv/Scripts/python.exe main.py &
BACKEND_PID=$!
cd ../frontend
# Start frontend server
npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

# Run playwright
npx playwright test tests/e2e.spec.js --reporter=list,junit
FRONTEND_EXIT_CODE=$?

# Kill servers
kill $BACKEND_PID
kill $FRONTEND_PID

cd ..

echo ""
echo "=== TEST RUN SUMMARY ==="
if [ $BACKEND_EXIT_CODE -eq 0 ]; then
  echo "Backend Tests: PASSED"
else
  echo "Backend Tests: FAILED"
fi

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
  echo "Frontend/Integration Tests: PASSED"
else
  echo "Frontend/Integration Tests: FAILED"
fi

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
  echo "Overall: PASSED"
  exit 0
else
  echo "Overall: FAILED"
  exit 1
fi
