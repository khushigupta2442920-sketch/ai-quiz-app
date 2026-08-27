# Python ka base computer layein
FROM python:3.10-slim

# Render ko bolenge Tesseract OCR install karne
RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-eng

# Aapka code set karein
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# App ko start karein
CMD ["gunicorn", "app:app"]

