import os
from flask import Flask
from dotenv import load_dotenv
# Importamos las rutas del otro archivo
from routes import register_routes

# Cargar variables de entorno
load_dotenv()

# --- 1. CREAR LA APP AQUÍ (IMPORTANTE: FUERA DE FUNCIONES) ---
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# --- 2. CONFIGURACIÓN ---
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key_123')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ANNOTATED_FOLDER'] = 'annotated_docs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB

# Crear carpetas si no existen
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['ANNOTATED_FOLDER'], exist_ok=True)

# --- 3. REGISTRAR RUTAS ---
# Conectamos las rutas del archivo routes.py con esta app
register_routes(app)

# --- 4. ARRANQUE (Solo para local) ---
if __name__ == '__main__':
    import nltk
    try: nltk.download('punkt', quiet=True)
    except: pass
    
    print("🟢 Servidor iniciado. Abre: http://localhost:5001")
    app.run(debug=True, port=5001, host='0.0.0.0')