# Stage 1: Build the React client
FROM node:22-slim AS client-builder

WORKDIR /build/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# Stage 2: Python runtime
FROM python:3.13-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app.py ./
COPY agents/ ./agents/
COPY core/ ./core/
COPY models/ ./models/

# Copy the built React client from stage 1
COPY --from=client-builder /build/client/dist ./client/dist

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
