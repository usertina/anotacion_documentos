// ========================================
// ANOTADOR - JAVASCRIPT FUNCIONAL SIMPLE
// Versión optimizada para móvil
// ========================================

console.log('🚀 Iniciando Anotador...');

// --- ESTADO GLOBAL ---
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

// --- ELEMENTOS DOM ---
let DOM = {};

// --- INICIALIZACIÓN ---
function init() {
    console.log('📦 Cargando elementos DOM...');
    
    DOM = {
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
    
    // Verificar elementos críticos
    if (!DOM.fileInput || !DOM.selectFileBtn || !DOM.uploadPrompt) {
        console.error('❌ ELEMENTOS CRÍTICOS NO ENCONTRADOS');
        return;
    }
    
    console.log('✅ Elementos DOM cargados');
    
    initEventListeners();
    loadDocumentsList();
}

// --- EVENT LISTENERS ---
function initEventListeners() {
    console.log('🔗 Configurando event listeners...');
    
    // Subida de archivos - Click en botón
    if (DOM.selectFileBtn) {
        DOM.selectFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🖱️ Click en botón Subir');
            if (DOM.fileInput) {
                DOM.fileInput.click();
            }
        });
        console.log('✅ Listener: selectFileBtn');
    }
    
    // Subida de archivos - Change input
    if (DOM.fileInput) {
        DOM.fileInput.addEventListener('change', handleFileSelect);
        console.log('✅ Listener: fileInput change');
    }
    
    // Click en zona gris para subir
    if (DOM.uploadPrompt) {
        DOM.uploadPrompt.addEventListener('click', (e) => {
            console.log('🖱️ Click en uploadPrompt');
            if (DOM.fileInput) {
                DOM.fileInput.click();
            }
        });
        console.log('✅ Listener: uploadPrompt');
    }
    
    // Drag and Drop
    if (DOM.documentContainer) {
        DOM.documentContainer.addEventListener('dragover', handleDragOver);
        DOM.documentContainer.addEventListener('drop', handleDrop);
        DOM.documentContainer.addEventListener('dragleave', handleDragLeave);
        console.log('✅ Listener: drag & drop');
    }
    
    // Herramientas
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.currentTarget.dataset.tool;
            console.log('🔧 Herramienta seleccionada:', tool);
            selectTool(tool);
        });
    });
    console.log('✅ Listeners: herramientas');
    
    // Colores
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = e.currentTarget.dataset.color;
            console.log('🎨 Color seleccionado:', color);
            selectColor(color);
        });
    });
    console.log('✅ Listeners: colores');
    
    // Grosor
    if (DOM.brushSize) {
        DOM.brushSize.addEventListener('input', (e) => {
            AppState.brushSize = parseInt(e.target.value);
            if (DOM.brushSizeValue) {
                DOM.brushSizeValue.textContent = `${AppState.brushSize}px`;
            }
        });
        console.log('✅ Listener: brushSize');
    }
    
    // Canvas - Mouse
    if (DOM.annotationCanvas) {
        DOM.annotationCanvas.addEventListener('mousedown', handleDrawStart);
        DOM.annotationCanvas.addEventListener('mousemove', handleDrawMove);
        DOM.annotationCanvas.addEventListener('mouseup', handleDrawEnd);
        DOM.annotationCanvas.addEventListener('mouseleave', handleDrawEnd);
        console.log('✅ Listeners: canvas mouse');
        
        // Canvas - Touch
        DOM.annotationCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        DOM.annotationCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        DOM.annotationCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        console.log('✅ Listeners: canvas touch');
    }
    
    // Navegación
    if (DOM.prevPage) {
        DOM.prevPage.addEventListener('click', () => changePage(-1));
    }
    if (DOM.nextPage) {
        DOM.nextPage.addEventListener('click', () => changePage(1));
    }
    console.log('✅ Listeners: navegación');
    
    // Botones acción
    if (DOM.saveBtn) {
        DOM.saveBtn.addEventListener('click', saveAnnotations);
        console.log('✅ Listener: saveBtn');
    }
    if (DOM.clearAllBtn) {
        DOM.clearAllBtn.addEventListener('click', clearCurrentPage);
    }
    
    // Chatbot
    if (DOM.sendQuestionBtn) {
        DOM.sendQuestionBtn.addEventListener('click', sendQuestion);
    }
    if (DOM.chatbotInput) {
        DOM.chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendQuestion();
        });
    }
    if (DOM.clearChatBtn) {
        DOM.clearChatBtn.addEventListener('click', clearChat);
    }
    
    console.log('✅ Todos los listeners configurados');
}

// --- DRAG & DROP ---
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('📥 Drag over');
    DOM.documentContainer.style.background = '#2a2d30';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === DOM.documentContainer) {
        DOM.documentContainer.style.background = '#3d4147';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('📥 Drop detectado');
    DOM.documentContainer.style.background = '#3d4147';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        console.log('📄 Archivo dropeado:', files[0].name);
        uploadFile(files[0]);
    }
}

// --- SUBIDA DE ARCHIVOS ---
function handleFileSelect(e) {
    console.log('📂 Archivo seleccionado');
    const file = e.target.files[0];
    if (file) {
        console.log('📄 Archivo:', file.name, file.type, file.size);
        uploadFile(file);
    }
}

async function uploadFile(file) {
    console.log('⬆️ Subiendo archivo:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    showMessage('Subiendo archivo...');
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('📡 Respuesta del servidor:', data);
        
        if (data.success) {
            AppState.currentDocId = data.doc_id;
            AppState.filename = data.filename;
            await loadDocument(data.doc_id);
            showMessage(`✅ "${data.filename}" cargado`);
        } else {
            showMessage('❌ Error: ' + data.error);
        }
    } catch (error) {
        console.error('❌ Error al subir:', error);
        showMessage('❌ Error al subir el archivo');
    }
}

// --- CARGAR DOCUMENTO ---
async function loadDocument(docId) {
    console.log('📖 Cargando documento:', docId);
    showMessage('Cargando documento...');
    
    try {
        const response = await fetch(`/get_document/${docId}`);
        const doc = await response.json();
        
        if (doc.error) {
            showMessage('❌ Error: ' + doc.error);
            return;
        }
        
        console.log('📄 Documento cargado:', doc);
        
        AppState.currentDocId = docId;
        AppState.filename = doc.original_name;
        AppState.documentText = doc.text_content || '';
        AppState.annotations = doc.annotations || [];
        AppState.documentImages = doc.image_data || [];
        AppState.totalPages = AppState.documentImages.length > 0 ? AppState.documentImages.length : 1;
        AppState.currentPage = 0;
        
        DOM.uploadPrompt.style.display = 'none';
        DOM.documentViewer.style.display = 'block';
        DOM.documentTitle.textContent = AppState.filename;
        
        renderCurrentPage();
        updatePageInfo();
        showMessage('');
        
    } catch (error) {
        console.error('❌ Error al cargar:', error);
        showMessage('❌ Error al cargar el documento');
    }
}

// --- RENDERIZAR PÁGINA ---
function renderCurrentPage() {
    console.log('🖼️ Renderizando página:', AppState.currentPage);
    
    if (AppState.documentImages.length > 0) {
        const imgData = AppState.documentImages[AppState.currentPage];
        DOM.textContent.innerHTML = `<img src="${imgData}" alt="Página ${AppState.currentPage + 1}" 
                                     style="max-width:100%; width:100%; height:auto; display:block;">`;
        
        const img = DOM.textContent.querySelector('img');
        img.onload = function() {
            console.log('✅ Imagen cargada');
            setTimeout(() => {
                setupCanvas();
                redrawAnnotations();
            }, 100);
        };
    } else {
        DOM.textContent.innerHTML = `<div style="white-space: pre-wrap; padding: 20px;">${escapeHtml(AppState.documentText)}</div>`;
        setTimeout(() => {
            setupCanvas();
            redrawAnnotations();
        }, 100);
    }
}

// --- SETUP CANVAS ---
function setupCanvas() {
    console.log('🎨 Configurando canvas...');
    
    if (!DOM.annotationCanvas || !DOM.textContent) {
        console.error('❌ Canvas o content no encontrado');
        return;
    }
    
    const dpr = window.devicePixelRatio || 1;
    
    DOM.annotationCanvas.style.width = DOM.textContent.offsetWidth + 'px';
    DOM.annotationCanvas.style.height = DOM.textContent.offsetHeight + 'px';
    
    DOM.annotationCanvas.width = DOM.textContent.offsetWidth * dpr;
    DOM.annotationCanvas.height = DOM.textContent.offsetHeight * dpr;
    
    const ctx = DOM.annotationCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    console.log('✅ Canvas:', DOM.annotationCanvas.width, 'x', DOM.annotationCanvas.height, 'DPR:', dpr);
}

// --- HERRAMIENTAS ---
function selectTool(tool) {
    AppState.currentTool = tool;
    document.querySelectorAll('[data-tool]').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`[data-tool="${tool}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
    
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
    const selectedBtn = document.querySelector(`[data-color="${color}"]`);
    if (selectedBtn) selectedBtn.classList.add('active');
}

// --- DIBUJO MOUSE ---
function handleDrawStart(e) {
    if (!AppState.currentDocId) return;
    console.log('✏️ Inicio dibujo');
    
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
        console.log('✅ Anotación guardada');
    }
    
    AppState.isDrawing = false;
    AppState.currentAnnotation = null;
    AppState.lastPoint = null;
}

// --- DIBUJO TOUCH ---
function handleTouchStart(e) {
    e.preventDefault();
    if (!AppState.currentDocId) return;
    console.log('👆 Inicio touch');
    
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
    handleDrawEnd(e);
}

// --- POSICIONAMIENTO ---
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

// --- RENDERIZADO ---
function drawLine(from, to, annotation) {
    const canvas = DOM.annotationCanvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
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
    ctx.moveTo(from.x * width, from.y * height);
    ctx.lineTo(to.x * width, to.y * height);
    ctx.stroke();
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function redrawAnnotations() {
    if (!DOM.annotationCanvas) return;
    
    const canvas = DOM.annotationCanvas;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = rect.width;
    const height = rect.height;
    
    const pageAnnotations = AppState.annotations.filter(a => a.page === AppState.currentPage);
    
    pageAnnotations.forEach(ann => {
        if (ann.type === 'text') {
            ctx.fillStyle = ann.color;
            ctx.font = `${ann.size * 10}px Arial`;
            ctx.fillText(ann.text, ann.x * width, ann.y * height);
        } else if (ann.points && ann.points.length > 1) {
            const points = ann.points;
            
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = ann.size * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (ann.type === 'highlighter') {
                ctx.globalAlpha = 0.15;
                ctx.globalCompositeOperation = 'multiply';
                ctx.lineWidth = ann.size * 6;
            } else {
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
            }
            
            ctx.beginPath();
            ctx.moveTo(points[0].x * width, points[0].y * height);
            
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x * width, points[i].y * height);
            }
            
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
    });
}

// --- HERRAMIENTAS ESPECIALES ---
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

// --- NAVEGACIÓN ---
function changePage(delta) {
    const newPage = AppState.currentPage + delta;
    if (newPage >= 0 && newPage < AppState.totalPages) {
        AppState.currentPage = newPage;
        renderCurrentPage();
        updatePageInfo();
    }
}

function updatePageInfo() {
    if (DOM.pageInfo) {
        DOM.pageInfo.textContent = `${AppState.currentPage + 1}/${AppState.totalPages}`;
    }
    if (DOM.prevPage) {
        DOM.prevPage.disabled = AppState.currentPage === 0;
    }
    if (DOM.nextPage) {
        DOM.nextPage.disabled = AppState.currentPage === AppState.totalPages - 1;
    }
}

// --- GUARDAR ---
async function saveAnnotations() {
    if (!AppState.currentDocId) {
        showMessage('❌ No hay documento cargado');
        return;
    }
    
    console.log('💾 Guardando anotaciones...');
    showMessage('Guardando...');
    
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
            showMessage('✅ Documento guardado');
            loadDocumentsList();
        } else {
            showMessage('❌ Error al guardar');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Error al guardar');
    }
}

// --- LISTA DE DOCUMENTOS ---
async function loadDocumentsList() {
    try {
        const response = await fetch('/list_documents');
        const data = await response.json();
        
        if (!DOM.documentsList) return;
        
        if (data.success && data.documents.length > 0) {
            DOM.documentsList.innerHTML = data.documents.map(doc => `
                <div class="document-item ${doc.id === AppState.currentDocId ? 'active' : ''}" 
                     onclick="loadSavedDocument('${doc.id}')" style="cursor:pointer; padding:12px; margin-bottom:8px; border:1px solid #ddd; border-radius:8px;">
                    <div style="font-weight:600; font-size:0.9rem;">${escapeHtml(doc.filename)}</div>
                    <div style="font-size:0.75rem; color:#666;">${formatDate(doc.date)}</div>
                </div>
            `).join('');
        } else {
            DOM.documentsList.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Sin documentos</div>';
        }
    } catch (error) {
        console.error('❌ Error cargando lista:', error);
    }
}

async function loadSavedDocument(docId) {
    console.log('📂 Cargando documento guardado:', docId);
    await loadDocument(docId);
}

// --- CHATBOT ---
async function sendQuestion() {
    const input = DOM.chatbotInput;
    if (!input) return;
    
    const question = input.value.trim();
    if (!question || !AppState.currentDocId) return;
    
    console.log('💬 Enviando pregunta:', question);
    
    addChatMessage('user', question);
    input.value = '';
    
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
        console.error('❌ Error:', error);
    }
}

function addChatMessage(type, text, extraClass = '') {
    if (!DOM.chatbotMessages) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type} ${extraClass}`;
    msgDiv.textContent = text;
    msgDiv.style.cssText = `
        padding: 10px;
        margin-bottom: 8px;
        border-radius: 8px;
        max-width: 85%;
        ${type === 'user' ? 'background:#4361ee; color:white; align-self:flex-end;' : 'background:#f0f0f0; color:#333;'}
    `;
    DOM.chatbotMessages.appendChild(msgDiv);
    DOM.chatbotMessages.scrollTop = DOM.chatbotMessages.scrollHeight;
}

function removeTypingMessage() {
    const typing = DOM.chatbotMessages.querySelector('.typing');
    if (typing) typing.remove();
}

function clearChat() {
    AppState.chatHistory = [];
    if (DOM.chatbotMessages) {
        DOM.chatbotMessages.innerHTML = '<div class="message bot">Historial limpiado.</div>';
    }
}

// --- UTILIDADES ---
function showMessage(msg) {
    console.log('📢', msg);
    // Puedes añadir un toast/notification aquí si quieres
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

// --- REDIMENSIONAMIENTO ---
window.addEventListener('resize', () => {
    if (AppState.currentDocId) {
        setupCanvas();
        redrawAnnotations();
    }
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (AppState.currentDocId) {
            setupCanvas();
            redrawAnnotations();
        }
    }, 500);
});

// --- INICIAR AL CARGAR ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportar para debugging
window.AppState = AppState;
window.loadDocument = loadDocument;
window.loadSavedDocument = loadSavedDocument;

console.log('✅ Anotador cargado y listo');