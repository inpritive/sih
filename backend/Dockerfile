# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the lightweight API requirements
COPY requirements-api.txt .

# Install only the API dependencies (FastAPI, SQLAlchemy, etc.)
RUN pip install --no-cache-dir -r requirements-api.txt

# Copy the current directory contents into the container
COPY . .

# Expose port 8000 for the FastAPI server
EXPOSE 8000

# Run uvicorn when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
