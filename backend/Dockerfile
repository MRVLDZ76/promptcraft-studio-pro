FROM python:3.11.9-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y --force-yes \
    nano \
    python3-pip \
    gettext \
    chrpath \
    libssl-dev \
    libxft-dev \
    libfreetype6 \
    libfreetype6-dev \
    libfontconfig1 \
    libfontconfig1-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install gunicorn
RUN pip install --upgrade pip && pip install gunicorn

# Set working directory
WORKDIR /code/

# Copy requirements and install dependencies
COPY requirements.txt /code/
RUN pip install -r requirements.txt

# Copy application code
COPY . /code/

# Create start_server.sh script
RUN echo '#!/bin/bash\nset -e\ngunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120' > /code/start_server.sh && \
    chmod +x /code/start_server.sh

# Expose port
EXPOSE 8000

# Run the application
CMD ["/code/start_server.sh"]
