import os
import uuid
import json
import traceback
from datetime import datetime # ESTA FALTABA
from flask import render_template, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
import utils

def register_routes(app):
    gemini_model = utils.configure_gemini()

    @app.route('/')
    def index(): return render_template('index.html')

    @app.route('/static/<path:f>')
    def serve_static(f): return send_from_directory(app.static_folder, f)

    @app.route('/upload', methods=['POST'])
    def upload_file():
        try:
            if 'file' not in request.files: return jsonify({'error': 'Falta archivo'}), 400
            file = request.files['file']
            if file.filename == '': return jsonify({'error': 'No seleccionado'}), 400
            if not utils.allowed_file(file.filename): return jsonify({'error': 'Tipo no válido'}), 400
            
            filename = secure_filename(file.filename)
            unique_id = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_id)
            file.save(filepath)
            
            ext = filename.rsplit('.', 1)[1].lower()
            text = ""
            paths = []
            
            try:
                if ext == 'pdf':
                    text = utils.extract_text_from_pdf(filepath)
                    imgs = utils.pdf_to_images(filepath)
                    for i, img in enumerate(imgs):
                        name = f"{unique_id}_page_{i}.png"
                        img.save(os.path.join(app.config['UPLOAD_FOLDER'], name), 'PNG')
                        paths.append(name)
                elif ext == 'docx': text = utils.extract_text_from_docx(filepath)
                elif ext == 'txt': text = utils.extract_text_from_txt(filepath)
                else: paths = [unique_id]; text = "Imagen."
            except Exception as e: 
                print(f"Error procesando: {e}")
                text = f"Error: {e}"

            doc = {
                'id': unique_id, 'original_name': filename, 'file_type': ext,
                'text_content': text, 'image_paths': paths, 'annotations': [],
                'upload_time': datetime.now().isoformat(), 'status': 'temp'
            }
            
            with open(os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_id}.json"), 'w', encoding='utf-8') as f:
                json.dump(doc, f, ensure_ascii=False, indent=2)
            
            return jsonify({'success': True, 'doc_id': unique_id, 'filename': filename, 'text_preview': text[:200]})
        except Exception as e:
            print(traceback.format_exc())
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/get_document/<doc_id>')
    def get_document(doc_id):
        path = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}.json")
        if not os.path.exists(path): return jsonify({'error': 'No encontrado'}), 404
        with open(path, 'r', encoding='utf-8') as f: doc = json.load(f)
        
        import base64
        imgs_b64 = []
        for p in doc.get('image_paths', []):
            fp = os.path.join(app.config['UPLOAD_FOLDER'], p)
            if os.path.exists(fp):
                with open(fp, 'rb') as i:
                    b64 = base64.b64encode(i.read()).decode('utf-8')
                    m = 'image/jpeg' if p.endswith(('jpg','jpeg')) else 'image/png'
                    imgs_b64.append(f"data:{m};base64,{b64}")
        doc['image_data'] = imgs_b64
        return jsonify(doc)

    @app.route('/save_annotations', methods=['POST'])
    def save_annotations():
        try:
            d = request.json
            path = os.path.join(app.config['UPLOAD_FOLDER'], f"{d['doc_id']}.json")
            if not os.path.exists(path): return jsonify({'error': 'No existe'}), 404
            with open(path, 'r', encoding='utf-8') as f: doc = json.load(f)
            
            doc['annotations'] = d.get('annotations', [])
            doc['last_annotated'] = datetime.now().isoformat()
            doc['status'] = 'saved'
            
            with open(path, 'w', encoding='utf-8') as f: json.dump(doc, f, ensure_ascii=False, indent=2)
            return jsonify({'success': True})
        except Exception as e: return jsonify({'error': str(e)}), 500

    @app.route('/list_documents')
    def list_documents():
        files = []
        folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(folder): return jsonify({'success': True, 'documents': []})
        
        for fn in os.listdir(folder):
            if fn.endswith('.json'):
                try:
                    with open(os.path.join(folder, fn), 'r', encoding='utf-8') as f:
                        d = json.load(f)
                        if d.get('status') == 'saved':
                            files.append({'id':d['id'], 'filename':d['original_name'], 'date':d['upload_time'], 'file_type':d['file_type']})
                except: pass
        files.sort(key=lambda x: x['date'], reverse=True)
        return jsonify({'success': True, 'documents': files})

    @app.route('/download_annotated/<doc_id>')
    def download_annotated(doc_id):
        try:
            path = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}.json")
            if not os.path.exists(path): return jsonify({'error': 'No existe'}), 404
            with open(path, 'r', encoding='utf-8') as f: doc = json.load(f)
            
            anns = doc.get('annotations', [])
            paths = doc.get('image_paths', [])
            text = doc.get('text_content', '')
            output_imgs = []

            if paths:
                for i, p in enumerate(paths):
                    fp = os.path.join(app.config['UPLOAD_FOLDER'], p)
                    if os.path.exists(fp):
                        img = Image.open(fp).convert('RGB')
                        output_imgs.append(utils.process_annotations_on_image(img, anns, i))
            
            if not output_imgs:
                print("Generando desde texto...")
                text_pages = utils.create_pages_from_text(text)
                for i, page_img in enumerate(text_pages):
                    output_imgs.append(utils.process_annotations_on_image(page_img, anns, i))

            out_name = f"annotated_{doc['original_name']}"
            if doc['file_type'] not in ['png','jpg','jpeg']: 
                if not out_name.endswith('.pdf'): out_name = os.path.splitext(out_name)[0] + '.pdf'
                save_path = os.path.join(app.config['ANNOTATED_FOLDER'], out_name)
                output_imgs[0].save(save_path, "PDF", resolution=100.0, save_all=True, append_images=output_imgs[1:])
            else:
                save_path = os.path.join(app.config['ANNOTATED_FOLDER'], out_name)
                output_imgs[0].save(save_path)
            
            return send_file(save_path, as_attachment=True)

        except Exception as e:
            print(traceback.format_exc())
            return jsonify({'error': str(e)}), 500

    @app.route('/delete_document/<doc_id>', methods=['DELETE'])
    def delete_document(doc_id):
        path = os.path.join(app.config['UPLOAD_FOLDER'], f"{doc_id}.json")
        if os.path.exists(path):
            os.remove(path)
            return jsonify({'success': True})
        return jsonify({'error': 'No encontrado'}), 404

    @app.route('/ask_chatbot', methods=['POST'])
    def ask_chatbot():
        d = request.json
        path = os.path.join(app.config['UPLOAD_FOLDER'], f"{d['doc_id']}.json")
        if not os.path.exists(path): return jsonify({'error': 'No existe'}), 404
        with open(path, 'r', encoding='utf-8') as f: text = json.load(f).get('text_content', '')[:20000]
        return jsonify({'success': True, 'answer': utils.ask_gemini(gemini_model, text, d.get('question'), d.get('chat_history', []))})