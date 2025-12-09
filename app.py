"""
ANOTADOR UNIVERSAL - Flask Backend
Sistema completo de anotación de documentos
Qubiz.Team - 2024
"""

from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from io import BytesIO
import base64

# Inicializar Flask
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'tu-clave-secreta-aqui'  # Cambiar en producción

# Crear carpeta de uploads si no existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Almacenamiento en memoria (usar base de datos en producción)
documents = {}

# Extensiones permitidas
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# RUTAS PRINCIPALES
# ==========================================

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

# ==========================================
# ENDPOINTS DE DOCUMENTOS
# ==========================================

@app.route('/upload', methods=['POST'])
def upload():
    """Subir un nuevo documento"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'})
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'File type not allowed'})
        
        # Generar ID único
        doc_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}_{filename}")
        
        # Guardar archivo
        file.save(filepath)
        
        # Procesar documento según tipo
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        if file_ext == 'pdf':
            image_data, text_content = process_pdf(filepath)
        elif file_ext == 'docx':
            image_data, text_content = process_docx(filepath)
        elif file_ext == 'txt':
            image_data, text_content = process_txt(filepath)
        elif file_ext in ['png', 'jpg', 'jpeg', 'gif']:
            image_data, text_content = process_image(filepath)
        else:
            image_data, text_content = [], ""
        
        # Guardar en memoria
        documents[doc_id] = {
            'id': doc_id,
            'original_name': filename,
            'file_path': filepath,
            'upload_date': datetime.now().isoformat(),
            'image_data': image_data,
            'text_content': text_content,
            'annotations': []
        }
        
        return jsonify({
            'success': True,
            'doc_id': doc_id,
            'filename': filename
        })
    
    except Exception as e:
        print(f"Error en upload: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_document/<doc_id>')
def get_document(doc_id):
    """Obtener un documento por ID"""
    try:
        if doc_id not in documents:
            return jsonify({'error': 'Document not found'}), 404
        
        return jsonify(documents[doc_id])
    
    except Exception as e:
        print(f"Error en get_document: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/list_documents')
def list_documents():
    """Listar todos los documentos"""
    try:
        docs_list = [
            {
                'id': doc['id'],
                'filename': doc['original_name'],
                'date': doc['upload_date']
            }
            for doc in documents.values()
        ]
        
        # Ordenar por fecha (más reciente primero)
        docs_list.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({'success': True, 'documents': docs_list})
    
    except Exception as e:
        print(f"Error en list_documents: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/save_annotations', methods=['POST'])
def save_annotations():
    """Guardar anotaciones de un documento"""
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        annotations = data.get('annotations', [])
        
        if not doc_id or doc_id not in documents:
            return jsonify({'success': False, 'error': 'Document not found'})
        
        documents[doc_id]['annotations'] = annotations
        documents[doc_id]['last_modified'] = datetime.now().isoformat()
        
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Error en save_annotations: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_document', methods=['POST'])
def delete_document():
    """Borrar un documento"""
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        
        if not doc_id or doc_id not in documents:
            return jsonify({'success': False, 'error': 'Document not found'})
        
        # Borrar archivo físico
        doc = documents[doc_id]
        if 'file_path' in doc and os.path.exists(doc['file_path']):
            try:
                os.remove(doc['file_path'])
            except Exception as e:
                print(f"Error al borrar archivo: {e}")
        
        # Borrar del diccionario
        del documents[doc_id]
        
        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Error en delete_document: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/export_pdf', methods=['POST'])
def export_pdf():
    """Exportar documento con anotaciones como PDF"""
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        annotations = data.get('annotations', [])
        
        if not doc_id or doc_id not in documents:
            return jsonify({'success': False, 'error': 'Document not found'})
        
        doc = documents[doc_id]
        
        # Intentar usar ReportLab
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.utils import ImageReader
            
            # Crear PDF en memoria
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            # Si tiene imágenes (páginas)
            if doc['image_data']:
                for page_num, img_data in enumerate(doc['image_data']):
                    # Dibujar imagen de fondo
                    if img_data.startswith('data:image'):
                        img_bytes = base64.b64decode(img_data.split(',')[1])
                        img_buffer = BytesIO(img_bytes)
                        img = ImageReader(img_buffer)
                        c.drawImage(img, 0, 0, width, height, preserveAspectRatio=True)
                    
                    # Dibujar anotaciones de esta página
                    page_annotations = [a for a in annotations if a.get('page') == page_num]
                    draw_annotations_on_canvas(c, page_annotations, width, height)
                    
                    c.showPage()
            else:
                # Documento de texto plano
                c.setFont("Helvetica", 12)
                text_content = doc.get('text_content', '')
                
                y = height - 50
                for line in text_content.split('\n'):
                    if y < 50:
                        c.showPage()
                        y = height - 50
                    c.drawString(50, y, line[:100])
                    y -= 15
            
            c.save()
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f"{doc['original_name']}_anotado.pdf"
            )
        
        except ImportError:
            return jsonify({
                'success': False,
                'error': 'ReportLab no instalado. Ejecuta: pip install reportlab --break-system-packages'
            })
    
    except Exception as e:
        print(f"Error en export_pdf: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

def draw_annotations_on_canvas(c, annotations, width, height):
    """Helper para dibujar anotaciones en el canvas de PDF"""
    for ann in annotations:
        color = ann.get('color', '#FFEB3B')
        r, g, b = hex_to_rgb(color)
        
        if ann.get('type') == 'text':
            c.setFillColorRGB(r, g, b)
            c.setFont("Helvetica", ann.get('size', 3) * 10)
            x = ann.get('x', 0) * width
            y = height - (ann.get('y', 0) * height)
            c.drawString(x, y, ann.get('text', ''))
        
        elif ann.get('type') in ['pen', 'highlighter']:
            points = ann.get('points', [])
            if len(points) > 1:
                c.setStrokeColorRGB(r, g, b)
                c.setLineWidth(ann.get('size', 3) * 2)
                
                if ann.get('type') == 'highlighter':
                    c.setStrokeAlpha(0.3)
                
                p = c.beginPath()
                first_point = points[0]
                p.moveTo(first_point['x'] * width, height - (first_point['y'] * height))
                
                for point in points[1:]:
                    p.lineTo(point['x'] * width, height - (point['y'] * height))
                
                c.drawPath(p, stroke=1, fill=0)
                c.setStrokeAlpha(1)

def hex_to_rgb(hex_color):
    """Convertir color hexadecimal a tupla RGB (0-1)"""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b)

# ==========================================
# CHATBOT
# ==========================================

@app.route('/ask_chatbot', methods=['POST'])
def ask_chatbot():
    """Procesar pregunta del chatbot"""
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        question = data.get('question')
        chat_history = data.get('chat_history', [])
        
        if not doc_id or doc_id not in documents:
            return jsonify({'success': False, 'error': 'Document not found'})
        
        doc = documents[doc_id]
        
        # AQUÍ: Integra tu IA favorita (Claude, GPT, etc.)
        # Por ahora, respuesta simple
        answer = f"Pregunta recibida: '{question}' sobre el documento '{doc['original_name']}'"
        
        # Ejemplo con contexto del documento
        if doc['text_content']:
            answer += f"\n\nEl documento tiene {len(doc['text_content'])} caracteres."
        
        return jsonify({'success': True, 'answer': answer})
    
    except Exception as e:
        print(f"Error en ask_chatbot: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

# ==========================================
# PROCESADORES DE DOCUMENTOS
# ==========================================

def process_pdf(filepath):
    """Procesar archivo PDF"""
    try:
        from pdf2image import convert_from_path
        import pytesseract
        from PIL import Image
        
        # Convertir PDF a imágenes
        images = convert_from_path(filepath, dpi=200)
        
        image_data = []
        text_content = []
        
        for img in images:
            # Convertir a base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            image_data.append(f"data:image/png;base64,{img_str}")
            
            # Extraer texto con OCR
            text = pytesseract.image_to_string(img, lang='spa+eng')
            text_content.append(text)
        
        return image_data, '\n\n'.join(text_content)
    
    except ImportError:
        print("pdf2image o pytesseract no instalado")
        return [], "PDF procesado (instala pdf2image y pytesseract para OCR)"

def process_docx(filepath):
    """Procesar archivo DOCX"""
    try:
        import docx
        doc = docx.Document(filepath)
        text = '\n'.join([para.text for para in doc.paragraphs])
        return [], text
    except ImportError:
        return [], "DOCX procesado (instala python-docx para extracción)"

def process_txt(filepath):
    """Procesar archivo TXT"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        return [], text
    except Exception as e:
        return [], f"Error al leer TXT: {str(e)}"

def process_image(filepath):
    """Procesar archivo de imagen"""
    try:
        with open(filepath, 'rb') as f:
            img_bytes = f.read()
        
        img_b64 = base64.b64encode(img_bytes).decode()
        ext = filepath.rsplit('.', 1)[1].lower()
        
        # Intentar OCR
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(filepath)
            text = pytesseract.image_to_string(img, lang='spa+eng')
        except:
            text = "Imagen cargada"
        
        return [f"data:image/{ext};base64,{img_b64}"], text
    
    except Exception as e:
        return [], f"Error al procesar imagen: {str(e)}"

# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 ANOTADOR UNIVERSAL - Qubiz.Team")
    print("=" * 50)
    print("📡 Servidor iniciando...")
    print(f"📁 Carpeta de uploads: {app.config['UPLOAD_FOLDER']}")
    print(f"📄 Documentos en memoria: {len(documents)}")
    print("=" * 50)
    print("✅ Servidor listo")
    print("🌐 Accede desde:")
    print("   • PC: http://localhost:5001")
    print("   • Móvil: http://TU_IP_LOCAL:5001")
    print("=" * 50)
    
    # IMPORTANTE: host='0.0.0.0' permite acceso desde otros dispositivos
    app.run(host='0.0.0.0', port=5001, debug=True)