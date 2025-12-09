import os
import time
import PyPDF2
from docx import Document
import pdf2image
from PIL import Image, ImageDraw, ImageFont
import google.generativeai as genai

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- TEXTO ---
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
    except Exception as e:
        text = f"Error: {str(e)}"
    return text

def extract_text_from_docx(docx_path):
    text = ""
    try:
        doc = Document(docx_path)
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
    except Exception as e:
        text = f"Error: {str(e)}"
    return text

def extract_text_from_txt(txt_path):
    try:
        with open(txt_path, 'r', encoding='utf-8') as file: return file.read()
    except: return "Error leyendo texto."

# --- IMÁGENES Y PAGINACIÓN ---
def pdf_to_images(pdf_path):
    try:
        return pdf2image.convert_from_path(pdf_path)
    except:
        return []

def wrap_text(text, font, max_width, draw):
    lines = []
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    for paragraph in text.split('\n'):
        if not paragraph:
            lines.append('')
            continue
        words = paragraph.split(' ')
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] - bbox[0] <= max_width:
                current_line.append(word)
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
        if current_line:
            lines.append(' '.join(current_line))
    return lines

def _render_page(lines, w, h, font, margin, lh):
    img = Image.new('RGB', (w, h), 'white')
    draw = ImageDraw.Draw(img)
    y = margin
    for line in lines:
        draw.text((margin, y), line, font=font, fill="black")
        y += lh
    return img

def create_pages_from_text(text_content):
    width, height = 1240, 1754 
    margin = 60
    line_height = 35 
    
    img_temp = Image.new('RGB', (100, 100))
    draw_temp = ImageDraw.Draw(img_temp)
    try: font = ImageFont.truetype("arial.ttf", 24)
    except: font = ImageFont.load_default()

    all_lines = wrap_text(text_content, font, width - (margin * 2), draw_temp)
    
    pages = []
    current_lines = []
    y_curr = margin
    
    for line in all_lines:
        current_lines.append(line)
        y_curr += line_height
        if y_curr > height - margin:
            pages.append(_render_page(current_lines, width, height, font, margin, line_height))
            current_lines = []
            y_curr = margin
            
    if current_lines or not pages:
        pages.append(_render_page(current_lines, width, height, font, margin, line_height))
        
    return pages

def create_image_from_text(text_content):
    pages = create_pages_from_text(text_content)
    return pages[0] if pages else None

def process_annotations_on_image(img, annotations, page_index):
    img = img.convert('RGBA')
    draw = ImageDraw.Draw(img, 'RGBA')
    width, height = img.size
    
    page_anns = [a for a in annotations if a.get('page', 0) == page_index]
    
    for ann in page_anns:
        color_hex = ann.get('color', '#000000')
        try: color_rgb = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
        except: color_rgb = (0,0,0)
        
        size = int(ann.get('size', 3)) * 2
        
        if ann['type'] == 'text':
            x, y = int(ann['x'] * width), int(ann['y'] * height)
            try: font_ann = ImageFont.truetype("arial.ttf", size * 10)
            except: font_ann = ImageFont.load_default()
            draw.text((x, y), ann['text'], fill=color_rgb + (255,), font=font_ann)
            
        elif 'points' in ann:
            points = ann['points']
            if len(points) > 1:
                abs_points = [(p['x'] * width, p['y'] * height) for p in points]
                if ann['type'] == 'highlighter':
                    overlay = Image.new('RGBA', img.size, (0,0,0,0))
                    d_over = ImageDraw.Draw(overlay)
                    d_over.line(abs_points, fill=color_rgb + (40,), width=size * 3)
                    img = Image.alpha_composite(img, overlay)
                    draw = ImageDraw.Draw(img, 'RGBA')
                else:
                    op = 255 if ann['type'] == 'pen' else 200
                    draw.line(abs_points, fill=color_rgb + (op,), width=size, joint='curve')
    
    return img.convert('RGB')

# --- IA INTELIGENTE (VERSIÓN FLASH PRIORITARIA) ---

def get_working_model():
    """Busca en tu cuenta qué modelos están disponibles y prioriza FLASH"""
    try:
        print("🔍 Buscando modelos disponibles...")
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        # LÓGICA DE PRIORIDAD MEJORADA:
        
        # 1. Buscar cualquier variante de "1.5-flash" (La mejor opción gratis)
        for m in available_models:
            if '1.5' in m and 'flash' in m: return m
            
        # 2. Buscar cualquier "flash" (versiones anteriores o nuevas)
        for m in available_models:
            if 'flash' in m: return m
            
        # 3. Si no hay flash, buscar "1.5-pro"
        for m in available_models:
            if '1.5' in m and 'pro' in m: return m
            
        # 4. Fallback a lo que sea (pro-latest, etc.)
        if available_models: return available_models[0]
        
    except Exception as e:
        print(f"⚠️ Error listando modelos: {e}")
    
    return 'gemini-1.5-flash' # Fallback duro si falla el listado

def configure_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key: return None
    genai.configure(api_key=api_key)
    
    model_name = get_working_model()
    print(f"✅ Usando modelo IA SELECCIONADO: {model_name}")
    return genai.GenerativeModel(model_name)

def ask_gemini(model, text, question, history=[]):
    if not model: return "IA no configurada."
    
    # Recortar texto para no saturar tokens
    prompt = f"Doc:\n{text[:30000]}\n\nPregunta: {question}\nResponde en español."
    
    if history:
        h_str = "\n".join([f"U: {h['question']} A: {h['answer']}" for h in history[-5:]])
        prompt = f"Historial:\n{h_str}\n\n{prompt}"
    
    # SISTEMA DE REINTENTOS PARA EVITAR ERROR 429
    max_retries = 3
    wait_time = 5 # Aumentado a 5 segundos iniciales
    
    for attempt in range(max_retries):
        try:
            return model.generate_content(prompt).text
        except Exception as e:
            error_str = str(e)
            print(f"⚠️ Intento {attempt+1} fallido: {error_str}") # Log para ver qué pasa
            
            if "429" in error_str or "quota" in error_str.lower() or "503" in error_str:
                if attempt < max_retries - 1: # Si no es el último intento
                    print(f"⏳ IA ocupada (429/503), esperando {wait_time}s...")
                    time.sleep(wait_time)
                    wait_time *= 2 # Esperar más la próxima vez (5, 10, 20)
                    continue 
            
            return f"Error IA: {error_str}"
            
    return "La IA está muy ocupada en este momento. Por favor, espera 1 minuto y vuelve a intentar."