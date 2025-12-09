// ========================================
// ANOTADOR INTELIGENTE - APP.JS
// ========================================

// Estado Global de la Aplicación
const AppState = {
    currentDocId: null,
    currentPage: 0,
    totalPages: 0,
    annotations: [],
    chatHistory: [],
    currentTool: 'pen',
    currentColor: '#FFEB3B',
    brushSize: 3,
    isDrawing: false,
    lastPoint: null,
    currentAnnotation: null,
    documentImages: [],
    documentText: '',
    filename: ''
};

// Referencias DOM
const DOM = {
    fileInput: document.getElementById('fileInput'),
    selectFileBtn: document.getElementById('selectFileBtn'),
    saveBtn: document.getElementById('saveBtn'),
    documentContainer: document.getElementById('documentContainer'),
    documentViewer: document.getElementById('documentViewer'),
    uploadPrompt: document.getElementById('uploadPrompt'),
    textContent: document.getElementById('textContent'),
    annotationCanvas: document.getElementById('annotationCanvas'),
    documentTitle: document.getElementById('documentTitle'),
    pageInfo: document.getElementById('pageInfo'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    chatbotMessages: document.getElementById('chatbotMessages'),
    chatbotInput: document.getElementById('chatbotInput'),
    sendQuestionBtn: document.getElementById('sendQuestionBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    documentsList: document.getElementById('documentsList'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    brushSize: document.getElementById('brushSize'),
    brushSizeValue: document.getElementById('brushSizeValue')
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadDocumentsList();
    setupCanvas();
});

// ========================================
// EVENT LISTENERS
// ========================================
function initEventListeners() {
    // Subida de archivos
    DOM.selectFileBtn.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    DOM.documentContainer.addEventListener('dragover', handleDragOver);
    DOM.documentContainer.addEventListener('drop', handleDrop);
    DOM.documentContainer.addEventListener('dragleave', handleDragLeave);
    
    // Click en zona gris para subir
    DOM.uploadPrompt.addEventListener('click', () => DOM.fileInput.click());
    
    // Herramientas
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => selectTool(e.target.closest('.tool-btn').dataset.tool));
    });
    
    // Colores
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => selectColor(e.target.dataset.color));
    });
    
    // Tamaño del pincel
    DOM.brushSize.addEventListener('input', (e) => {
        AppState.brushSize = parseInt(e.target.value);
        DOM.brushSizeValue.textContent = `${AppState.brushSize}px`;
    });
    
    // Canvas - Mouse events
    DOM.annotationCanvas.addEventListener('mousedown', handleDrawStart);
    DOM.annotationCanvas.addEventListener('mousemove', handleDrawMove);
    DOM.annotationCanvas.addEventListener('mouseup', handleDrawEnd);
    DOM.annotationCanvas.addEventListener('mouseleave', handleDrawEnd);
    
    // Canvas - Touch events
    DOM.annotationCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    DOM.annotationCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    DOM.annotationCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Navegación de páginas
    DOM.prevPage.addEventListener('click', () => changePage(-1));
    DOM.nextPage.addEventListener('click', () => changePage(1));
    
    // Botones de acción
    DOM.saveBtn.addEventListener('click', saveAnnotations);
    DOM.clearAllBtn.addEventListener('click', clearCurrentPage);
    
    // Chatbot
    DOM.sendQuestionBtn.addEventListener('click', sendQuestion);
    DOM.chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendQuestion();
    });
    DOM.clearChatBtn.addEventListener('click', clearChat);
}

// ========================================
// DRAG & DROP
// ========================================
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    DOM.documentContainer.style.background = '#3a4348';
    DOM.uploadPrompt.style.color = '#fff';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === DOM.documentContainer) {
        DOM.documentContainer.style.background = '#525659';
        DOM.uploadPrompt.style.color = '#ccc';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    DOM.documentContainer.style.background = '#525659';
    DOM.uploadPrompt.style.color = '#ccc';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]);
    }
}

// ========================================
// SUBIDA DE ARCHIVOS
// ========================================
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) uploadFile(file);
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    showLoading('Subiendo archivo...');
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            AppState.currentDocId = data.doc_id;
            AppState.filename = data.filename;
            await loadDocument(data.doc_id);
            addChatMessage('bot', `Documento "${data.filename}" cargado. ¿Qué quieres saber?`);
            // NO cargamos la lista aquí, solo al guardar
        } else {
            alert('Error al subir: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al subir el archivo');
    } finally {
        hideLoading();
    }
}

// ========================================
// CARGAR DOCUMENTO
// ========================================
async function loadDocument(docId) {
    showLoading('Cargando documento...');
    
    try {
        const response = await fetch(`/get_document/${docId}`);
        const doc = await response.json();
        
        if (doc.error) {
            alert('Error: ' + doc.error);
            return;
        }
        
        AppState.currentDocId = docId;
        AppState.filename = doc.original_name;
        AppState.documentText = doc.text_content || '';
        AppState.annotations = doc.annotations || [];
        AppState.documentImages = doc.image_data || [];
        
        if (AppState.documentImages.length > 0) {
            AppState.totalPages = AppState.documentImages.length;
        } else {
            AppState.totalPages = 1;
        }
        
        AppState.currentPage = 0;
        
        DOM.uploadPrompt.style.display = 'none';
        DOM.documentViewer.style.display = 'block';
        DOM.documentTitle.textContent = AppState.filename;
        
        renderCurrentPage();
        updatePageInfo();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el documento');
    } finally {
        hideLoading();
    }
}

// ========================================
// RENDERIZAR PÁGINA
// ========================================
function renderCurrentPage() {
    if (AppState.documentImages.length > 0) {
        const imgData = AppState.documentImages[AppState.currentPage];
        DOM.textContent.innerHTML = `<img src="${imgData}" alt="Página ${AppState.currentPage + 1}" style="max-width:100%; height:auto; display:block;">`;
    } else {
        DOM.textContent.innerHTML = `<div style="white-space: pre-wrap; padding: 20px;">${escapeHtml(AppState.documentText)}</div>`;
    }
    
    setTimeout(() => {
        setupCanvas();
        redrawAnnotations();
    }, 100);
}

function setupCanvas() {
    const content = DOM.textContent;
    const rect = content.getBoundingClientRect();
    
    DOM.annotationCanvas.width = content.offsetWidth;
    DOM.annotationCanvas.height = content.offsetHeight;
    DOM.annotationCanvas.style.width = content.offsetWidth + 'px';
    DOM.annotationCanvas.style.height = content.offsetHeight + 'px';
}

// ========================================
// HERRAMIENTAS
// ========================================
function selectTool(tool) {
    AppState.currentTool = tool;
    document.querySelectorAll('[data-tool]').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    
    if (tool === 'eraser') {
        DOM.annotationCanvas.style.cursor = 'not-allowed';
    } else if (tool === 'text') {
        DOM.annotationCanvas.style.cursor = 'text';
    } else {
        DOM.annotationCanvas.style.cursor = 'crosshair';
    }
}

function selectColor(color) {
    AppState.currentColor = color;
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
}

// ========================================
// DIBUJO - MOUSE
// ========================================
function handleDrawStart(e) {
    if (!AppState.currentDocId) return;
    
    AppState.isDrawing = true;
    const pos = getCanvasPosition(e);
    
    if (AppState.currentTool === 'text') {
        addTextAnnotation(pos);
        AppState.isDrawing = false;
        return;
    }
    
    if (AppState.currentTool === 'eraser') {
        eraseAnnotationAt(pos);
        return;
    }
    
    AppState.currentAnnotation = {
        type: AppState.currentTool,
        color: AppState.currentColor,
        size: AppState.brushSize,
        page: AppState.currentPage,
        points: [pos]
    };
    
    AppState.lastPoint = pos;
}

function handleDrawMove(e) {
    if (!AppState.isDrawing || !AppState.currentAnnotation) return;
    
    const pos = getCanvasPosition(e);
    AppState.currentAnnotation.points.push(pos);
    
    drawLine(AppState.lastPoint, pos, AppState.currentAnnotation);
    AppState.lastPoint = pos;
}

function handleDrawEnd(e) {
    if (AppState.currentAnnotation && AppState.currentAnnotation.points.length > 0) {
        AppState.annotations.push(AppState.currentAnnotation);
    }
    
    AppState.isDrawing = false;
    AppState.currentAnnotation = null;
    AppState.lastPoint = null;
}

// ========================================
// DIBUJO - TOUCH
// ========================================
function handleTouchStart(e) {
    e.preventDefault();
    if (!AppState.currentDocId) return;
    
    const touch = e.touches[0];
    AppState.isDrawing = true;
    const pos = getCanvasPositionFromTouch(touch);
    
    if (AppState.currentTool === 'text') {
        addTextAnnotation(pos);
        AppState.isDrawing = false;
        return;
    }
    
    if (AppState.currentTool === 'eraser') {
        eraseAnnotationAt(pos);
        return;
    }
    
    AppState.currentAnnotation = {
        type: AppState.currentTool,
        color: AppState.currentColor,
        size: AppState.brushSize,
        page: AppState.currentPage,
        points: [pos]
    };
    
    AppState.lastPoint = pos;
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!AppState.isDrawing || !AppState.currentAnnotation) return;
    
    const touch = e.touches[0];
    const pos = getCanvasPositionFromTouch(touch);
    AppState.currentAnnotation.points.push(pos);
    
    drawLine(AppState.lastPoint, pos, AppState.currentAnnotation);
    AppState.lastPoint = pos;
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (AppState.currentAnnotation && AppState.currentAnnotation.points.length > 0) {
        AppState.annotations.push(AppState.currentAnnotation);
    }
    
    AppState.isDrawing = false;
    AppState.currentAnnotation = null;
    AppState.lastPoint = null;
}

// ========================================
// POSICIONAMIENTO
// ========================================
function getCanvasPosition(e) {
    const rect = DOM.annotationCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
}

function getCanvasPositionFromTouch(touch) {
    const rect = DOM.annotationCanvas.getBoundingClientRect();
    return {
        x: (touch.clientX - rect.left) / rect.width,
        y: (touch.clientY - rect.top) / rect.height
    };
}

// ========================================
// RENDERIZADO DE ANOTACIONES
// ========================================
function redrawAnnotations() {
    const canvas = DOM.annotationCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const pageAnnotations = AppState.annotations.filter(a => a.page === AppState.currentPage);
    
    pageAnnotations.forEach(ann => {
        if (ann.type === 'text') {
            drawTextAnnotation(ctx, ann);
        } else if (ann.points && ann.points.length > 1) {
            drawPathAnnotation(ctx, ann);
        }
    });
}

function drawLine(from, to, annotation) {
    const canvas = DOM.annotationCanvas;
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.size * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (annotation.type === 'highlighter') {
        ctx.globalAlpha = 0.15;
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = annotation.size * 6;
    } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.beginPath();
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();

// Restaurar contexto para no afectar al siguiente dibujo
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function drawPathAnnotation(ctx, annotation) {
    const canvas = DOM.annotationCanvas;
    const points = annotation.points;
    
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.size * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (annotation.type === 'highlighter') {
        ctx.globalAlpha = 0.15;
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = annotation.size * 6;
    } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.beginPath();
    ctx.moveTo(points[0].x * canvas.width, points[0].y * canvas.height);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * canvas.width, points[i].y * canvas.height);
    }
    
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function drawTextAnnotation(ctx, annotation) {
    const canvas = DOM.annotationCanvas;
    const x = annotation.x * canvas.width;
    const y = annotation.y * canvas.height;
    
    ctx.fillStyle = annotation.color;
    ctx.font = `${annotation.size * 10}px Arial`;
    ctx.fillText(annotation.text, x, y);
}

// ========================================
// HERRAMIENTAS ESPECIALES
// ========================================
function addTextAnnotation(pos) {
    const text = prompt('Ingresa el texto:');
    if (!text) return;
    
    const annotation = {
        type: 'text',
        color: AppState.currentColor,
        size: AppState.brushSize,
        page: AppState.currentPage,
        x: pos.x,
        y: pos.y,
        text: text
    };
    
    AppState.annotations.push(annotation);
    redrawAnnotations();
}

function eraseAnnotationAt(pos) {
    const threshold = 0.05; 
    
    AppState.annotations = AppState.annotations.filter(ann => {
        if (ann.page !== AppState.currentPage) return true;
        
        if (ann.type === 'text') {
            const distance = Math.sqrt(Math.pow(ann.x - pos.x, 2) + Math.pow(ann.y - pos.y, 2));
            return distance > threshold;
        } else if (ann.points) {
            return !ann.points.some(p => {
                const distance = Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2));
                return distance < threshold;
            });
        }
        return true;
    });
    
    redrawAnnotations();
}

function clearCurrentPage() {
    if (!confirm('¿Limpiar todas las anotaciones de esta página?')) return;
    AppState.annotations = AppState.annotations.filter(a => a.page !== AppState.currentPage);
    redrawAnnotations();
}

// ========================================
// NAVEGACIÓN
// ========================================
function changePage(delta) {
    const newPage = AppState.currentPage + delta;
    if (newPage >= 0 && newPage < AppState.totalPages) {
        AppState.currentPage = newPage;
        renderCurrentPage();
        updatePageInfo();
    }
}

function updatePageInfo() {
    DOM.pageInfo.textContent = `${AppState.currentPage + 1}/${AppState.totalPages}`;
    DOM.prevPage.disabled = AppState.currentPage === 0;
    DOM.nextPage.disabled = AppState.currentPage === AppState.totalPages - 1;
}

// ========================================
// GUARDAR
// ========================================
async function saveAnnotations() {
    if (!AppState.currentDocId) {
        alert('No hay documento cargado');
        return;
    }
    
    showLoading('Guardando...');
    
    try {
        const response = await fetch('/save_annotations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_id: AppState.currentDocId,
                annotations: AppState.annotations
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✓ Documento guardado correctamente');
            loadDocumentsList();
        } else {
            alert('Error al guardar: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    } finally {
        hideLoading();
    }
}

// ========================================
// LISTA DE DOCUMENTOS (CON BOTONES)
// ========================================
async function loadDocumentsList() {
    try {
        const response = await fetch('/list_documents');
        const data = await response.json();
        
        if (data.success && data.documents.length > 0) {
            DOM.documentsList.innerHTML = data.documents.map(doc => {
                const annotatedUrl = `${window.location.origin}/download_annotated/${doc.id}`;
                let finalName = doc.filename;
                if (!doc.filename.match(/\.(jpg|jpeg|png|gif)$/i)) {
                    finalName = doc.filename.split('.')[0] + '.pdf';
                }

                return `
                <div class="document-item ${doc.id === AppState.currentDocId ? 'active' : ''}">
                    <div class="doc-info" onclick="loadSavedDocument('${doc.id}')" style="cursor:pointer; flex:1;">
                        <div class="document-name">${escapeHtml(doc.filename)}</div>
                        <div class="document-meta">${formatDate(doc.date)} • ${doc.file_type.toUpperCase()}</div>
                    </div>
                    
                    <div style="display:flex; gap:5px; align-items:center;">
                        
                        <button onclick="event.stopPropagation(); shareViaWA('${finalName}', '${annotatedUrl}')" 
                                class="tool-btn" style="padding:5px; color:#25D366; width:28px; height:28px;" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>

                        <button onclick="event.stopPropagation(); shareViaEmail('${finalName}', '${annotatedUrl}')" 
                                class="tool-btn" style="padding:5px; color:#DB4437; width:28px; height:28px;" title="Email">
                            <i class="fas fa-envelope"></i>
                        </button>

                        <button onclick="event.stopPropagation(); downloadDocument('${doc.id}')" 
                                class="tool-btn" style="padding:5px; color:#4361ee; width:28px; height:28px;" title="Descargar">
                            <i class="fas fa-file-download"></i>
                        </button>

                        <button onclick="event.stopPropagation(); deleteDocument('${doc.id}')" 
                                class="tool-btn" style="padding:5px; color:#ff4444; width:28px; height:28px;" title="Borrar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>`;
            }).join('');
        } else {
            DOM.documentsList.innerHTML = '<div class="empty-docs" style="padding:10px; color:#999; text-align:center;">Sin documentos</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        DOM.documentsList.innerHTML = '<div class="empty-docs" style="padding:10px; color:#999;">Error al cargar</div>';
    }
}

async function loadSavedDocument(docId) {
    await loadDocument(docId);
}

async function downloadDocument(docId) {
    window.location.href = `/download_annotated/${docId}`;
}

// NUEVAS FUNCIONES DE ACCIÓN
function shareViaWA(filename, url) {
    const text = encodeURIComponent(`Aquí tienes el documento editado "${filename}": ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareViaEmail(filename, url) {
    const subject = encodeURIComponent(`Documento: ${filename}`);
    const body = encodeURIComponent(`Enlace al documento editado: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

async function deleteDocument(docId) {
    if(!confirm("¿Estás seguro de que quieres eliminar este documento?")) return;

    try {
        const res = await fetch(`/delete_document/${docId}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
            if (AppState.currentDocId === docId) {
                location.reload();
            } else {
                loadDocumentsList();
            }
        } else {
            alert("Error al eliminar: " + data.error);
        }
    } catch (e) {
        alert("Error de conexión");
    }
}

// ========================================
// CHATBOT
// ========================================
async function sendQuestion() {
    const question = DOM.chatbotInput.value.trim();
    if (!question || !AppState.currentDocId) return;
    
    addChatMessage('user', question);
    DOM.chatbotInput.value = '';
    
    addChatMessage('bot', '...', 'typing');
    
    try {
        const response = await fetch('/ask_chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_id: AppState.currentDocId,
                question: question,
                chat_history: AppState.chatHistory
            })
        });
        
        const data = await response.json();
        
        removeTypingMessage();
        
        if (data.success) {
            addChatMessage('bot', data.answer);
            AppState.chatHistory.push({ question, answer: data.answer });
        } else {
            addChatMessage('bot', 'Error: ' + data.error);
        }
    } catch (error) {
        removeTypingMessage();
        addChatMessage('bot', 'Error al comunicar con el servidor');
        console.error('Error:', error);
    }
}

function addChatMessage(type, text, extraClass = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type} ${extraClass}`;
    msgDiv.textContent = text;
    DOM.chatbotMessages.appendChild(msgDiv);
    DOM.chatbotMessages.scrollTop = DOM.chatbotMessages.scrollHeight;
}

function removeTypingMessage() {
    const typing = DOM.chatbotMessages.querySelector('.typing');
    if (typing) typing.remove();
}

function clearChat() {
    AppState.chatHistory = [];
    DOM.chatbotMessages.innerHTML = '<div class="message bot">Historial limpiado.</div>';
}

// ========================================
// UTILIDADES
// ========================================
function showLoading(message) {
    console.log('Loading:', message);
}

function hideLoading() {
    console.log('Loading complete');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// ========================================
// RESPONSIVE - Window Resize
// ========================================
window.addEventListener('resize', () => {
    if (AppState.currentDocId) {
        setupCanvas();
        redrawAnnotations();
    }
});