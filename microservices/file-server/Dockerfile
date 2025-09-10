FROM python:3.11-slim

WORKDIR /app

# Copy the fileserver script
COPY fileserver.py .

# Install any Python dependencies if needed
RUN pip install --no-cache-dir flask flask-cors

# Expose port
EXPOSE 9909

# Run the application
CMD ["python", "fileserver.py"]
