import os
from flask import Flask
from dotenv import load_dotenv
# Importamos la función de rutas
from routes import register_routes

# Cargar variables de entorno
load_dotenv()

# --- 1. DEFINICIÓN GLOBAL DE LA APP (IMPORTANTE PARA RENDER) ---
# Debe estar aquí fuera, no dentro de ninguna función ni del 'if main'
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# --- 2. CONFIGURACIÓN ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key_123')
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['ANNOTATED_FOLDER'] = os.getenv('ANNOTATED_FOLDER', 'annotated_docs')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB max

# Crear carpetas necesarias
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['ANNOTATED_FOLDER'], exist_ok=True)

# --- 3. REGISTRAR RUTAS ---
# Llamamos a la función que está en routes.py y le pasamos nuestra app
register_routes(app)

# --- 4. BLOQUE DE EJECUCIÓN LOCAL ---
# Esto solo se ejecuta si lanzas "python app.py" en tu PC.
# Gunicorn ignora esto, pero usa la variable 'app' definida arriba.
if __name__ == '__main__':
    import nltk
    try:
        nltk.download('punkt', quiet=True)
    except: 
        pass
    
    print(f"🚀 Servidor iniciado en local...")
    app.run(debug=True, port=5001, host='0.0.0.0')