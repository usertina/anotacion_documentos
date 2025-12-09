import os
from flask import Flask
from dotenv import load_dotenv
import nltk

# Cargar variables de entorno
load_dotenv()

def create_app():
    app = Flask(__name__, 
                static_folder='static',
                template_folder='templates')

    # Configuración
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key_123')
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
    app.config['ANNOTATED_FOLDER'] = os.getenv('ANNOTATED_FOLDER', 'annotated_docs')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH_MB', 16)) * 1024 * 1024

    # Crear directorios
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['ANNOTATED_FOLDER'], exist_ok=True)

    # Registrar Rutas (Importamos aquí para evitar importaciones circulares)
    from routes import register_routes
    register_routes(app)

    return app

if __name__ == '__main__':
    # Descargas iniciales
    try:
        nltk.download('punkt', quiet=True)
    except: pass
    
    app = create_app()
    print(f"🚀 Servidor iniciado en http://localhost:5001")
    app.run(debug=True, port=5001, host='0.0.0.0')