FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for Playwright (Amazon Linux 2023)
RUN dnf install -y \
    gcc gcc-c++ libpq-devel \
    nss nspr alsa-lib atk at-spi2-atk cups-libs \
    libXcomposite libXdamage libXrandr mesa-libgbm pango gtk3 \
    libdrm libxkbcommon \
    && dnf clean all

# Install Python dependencies
COPY requirements-amazon.txt .
RUN pip install --no-cache-dir -r requirements-amazon.txt

# Install Chromium only
RUN playwright install chromium

COPY amazon_handler.py ${LAMBDA_TASK_ROOT}
COPY test_amazon.py ${LAMBDA_TASK_ROOT}

# Default: run as Lambda handler. Override with "python amazon_handler.py" for local testing.
CMD ["amazon_handler.lambda_handler"]
