# Usar una imagen de Python compatible (3.11)
FROM python:3.11-slim

# 1. Instalar Poppler (necesario para pdf2image)
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar directorio de trabajo
WORKDIR /app

# 3. Copiar los archivos de requisitos e instalarlos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copiar el resto del código
COPY . .

# 5. Crear carpetas necesarias si no existen
RUN mkdir -p uploads annotated_docs

# 6. Comando para iniciar la app con Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000", "--timeout", "120"]