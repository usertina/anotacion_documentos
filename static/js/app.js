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
// ========================================
// PARCHE: FUNCIONES COMPARTIR, GUARDAR, BORRAR, CHATBOT
// Añadir DESPUÉS de app.js
// ========================================

console.log('🔧 Cargando parche de funciones...');

// --- COMPARTIR POR WHATSAPP ---
window.shareWhatsApp = async function() {
    console.log('📱 Compartir por WhatsApp');
    
    if (!AppState.currentDocId) {
        alert('⚠️ Primero carga un documento');
        return;
    }
    
    try {
        // Generar PDF del documento con anotaciones
        showMessage('Generando PDF...');
        
        const response = await fetch('/export_pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_id: AppState.currentDocId,
                annotations: AppState.annotations
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }
        
        const blob = await response.blob();
        const file = new File([blob], `${AppState.filename}_anotado.pdf`, { type: 'application/pdf' });
        
        // Verificar si Web Share API está disponible
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: AppState.filename,
                text: 'Documento anotado',
                files: [file]
            });
            showMessage('✅ Compartido');
        } else {
            // Fallback: abrir WhatsApp Web con texto
            const text = encodeURIComponent(`Documento: ${AppState.filename}\n\n📄 Documento anotado disponible`);
            const whatsappUrl = `https://wa.me/?text=${text}`;
            window.open(whatsappUrl, '_blank');
            showMessage('💬 Abriendo WhatsApp...');
        }
        
    } catch (error) {
        console.error('❌ Error al compartir:', error);
        
        // Fallback simple
        const text = encodeURIComponent(`📄 Documento: ${AppState.filename}\n\nRevisado y anotado`);
        const whatsappUrl = `https://wa.me/?text=${text}`;
        window.open(whatsappUrl, '_blank');
        showMessage('💬 Abriendo WhatsApp (solo texto)');
    }
};

// --- COMPARTIR POR EMAIL ---
window.shareEmail = async function() {
    console.log('📧 Compartir por Email');
    
    if (!AppState.currentDocId) {
        alert('⚠️ Primero carga un documento');
        return;
    }
    
    try {
        // Intentar generar PDF
        showMessage('Preparando email...');
        
        const subject = encodeURIComponent(`Documento: ${AppState.filename}`);
        const body = encodeURIComponent(
            `Hola,\n\n` +
            `Te envío el documento "${AppState.filename}" revisado y anotado.\n\n` +
            `Documento procesado con el sistema de anotaciones.\n\n` +
            `Saludos`
        );
        
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        // Intentar usar Web Share API si está disponible
        if (navigator.share) {
            try {
                const response = await fetch('/export_pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        doc_id: AppState.currentDocId,
                        annotations: AppState.annotations
                    })
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], `${AppState.filename}_anotado.pdf`, { type: 'application/pdf' });
                    
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: AppState.filename,
                            text: 'Documento anotado',
                            files: [file]
                        });
                        showMessage('✅ Compartido');
                        return;
                    }
                }
            } catch (shareError) {
                console.log('Share API no disponible, usando mailto');
            }
        }
        
        // Fallback: mailto simple
        window.location.href = mailtoLink;
        showMessage('📧 Abriendo email...');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al preparar email');
    }
};

// --- DESCARGAR DOCUMENTO ---
window.downloadDocument = async function() {
    console.log('💾 Descargar documento');
    
    if (!AppState.currentDocId) {
        alert('⚠️ Primero carga un documento');
        return;
    }
    
    try {
        showMessage('Generando PDF...');
        
        const response = await fetch('/export_pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_id: AppState.currentDocId,
                annotations: AppState.annotations
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al generar PDF');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${AppState.filename}_anotado.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showMessage('✅ Documento descargado');
        
    } catch (error) {
        console.error('❌ Error al descargar:', error);
        alert('❌ Error al descargar documento');
    }
};

// --- BORRAR DOCUMENTO ---
window.deleteDocument = async function() {
    console.log('🗑️ Borrar documento');
    
    if (!AppState.currentDocId) {
        alert('⚠️ No hay documento cargado');
        return;
    }
    
    const confirmDelete = confirm(`¿Estás seguro de borrar "${AppState.filename}"?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        showMessage('Borrando...');
        
        const response = await fetch('/delete_document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_id: AppState.currentDocId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('✅ Documento borrado');
            
            // Reset state
            AppState.currentDocId = null;
            AppState.filename = '';
            AppState.annotations = [];
            AppState.documentImages = [];
            AppState.documentText = '';
            AppState.currentPage = 0;
            AppState.totalPages = 0;
            
            // Mostrar pantalla de subida
            if (DOM.documentViewer) DOM.documentViewer.style.display = 'none';
            if (DOM.uploadPrompt) DOM.uploadPrompt.style.display = 'flex';
            
            // Actualizar lista de documentos
            if (typeof loadDocumentsList === 'function') {
                loadDocumentsList();
            }
            
            // Cerrar modal si está abierto
            closeDocumentsModal();
            
        } else {
            throw new Error(data.error || 'Error al borrar');
        }
        
    } catch (error) {
        console.error('❌ Error al borrar:', error);
        alert('❌ Error al borrar documento: ' + error.message);
    }
};

// --- MEJORAR FUNCIÓN DE GUARDAR ---
if (typeof saveAnnotations !== 'undefined') {
    console.log('🔄 Mejorando función saveAnnotations...');
    
    const originalSave = saveAnnotations;
    
    window.saveAnnotations = async function() {
        console.log('💾 Guardando anotaciones (versión mejorada)...');
        
        if (!AppState.currentDocId) {
            alert('⚠️ No hay documento cargado');
            return;
        }
        
        if (AppState.annotations.length === 0) {
            const confirmSave = confirm('No hay anotaciones. ¿Guardar de todos modos?');
            if (!confirmSave) return;
        }
        
        try {
            showMessage('💾 Guardando...');
            
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
                showMessage('✅ Guardado correctamente');
                
                // Mostrar notificación temporal
                showTemporaryNotification('✅ Documento guardado', 2000);
                
                // Actualizar lista de documentos
                if (typeof loadDocumentsList === 'function') {
                    loadDocumentsList();
                }
            } else {
                throw new Error(data.error || 'Error al guardar');
            }
            
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            showMessage('❌ Error al guardar');
            alert('❌ Error al guardar: ' + error.message);
        }
    };
}

// --- CHATBOT MEJORADO ---
if (typeof sendQuestion !== 'undefined') {
    console.log('🔄 Mejorando función sendQuestion...');
    
    window.sendQuestion = async function() {
        const input = DOM.chatbotInput;
        if (!input) {
            console.error('❌ chatbotInput no encontrado');
            return;
        }
        
        const question = input.value.trim();
        
        if (!question) {
            alert('⚠️ Escribe una pregunta');
            return;
        }
        
        if (!AppState.currentDocId) {
            alert('⚠️ Primero carga un documento');
            return;
        }
        
        console.log('💬 Enviando pregunta:', question);
        
        // Añadir mensaje del usuario
        addChatMessage('user', question);
        input.value = '';
        
        // Mensaje de escritura
        const typingId = 'typing-' + Date.now();
        addChatMessage('bot', '...', 'typing', typingId);
        
        try {
            const response = await fetch('/ask_chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doc_id: AppState.currentDocId,
                    question: question,
                    chat_history: AppState.chatHistory || []
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Remover mensaje de escritura
            removeMessageById(typingId);
            
            if (data.success) {
                addChatMessage('bot', data.answer);
                AppState.chatHistory = AppState.chatHistory || [];
                AppState.chatHistory.push({ question, answer: data.answer });
            } else {
                addChatMessage('bot', '❌ Error: ' + (data.error || 'Sin respuesta'));
            }
            
        } catch (error) {
            console.error('❌ Error en chatbot:', error);
            removeMessageById(typingId);
            addChatMessage('bot', '❌ Error al comunicar con el servidor: ' + error.message);
        }
    };
}

// Helper para remover mensaje por ID
function removeMessageById(id) {
    const msg = document.getElementById(id);
    if (msg) msg.remove();
}

// Helper mejorado para añadir mensajes
function addChatMessage(type, text, extraClass = '', id = '') {
    if (!DOM.chatbotMessages) {
        console.error('❌ chatbotMessages no encontrado');
        return;
    }
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type} ${extraClass}`;
    msgDiv.textContent = text;
    if (id) msgDiv.id = id;
    
    msgDiv.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 12px;
        max-width: 85%;
        word-wrap: break-word;
        ${type === 'user' ? 
            'background: #4361ee; color: white; align-self: flex-end; margin-left: auto;' : 
            'background: #f0f0f0; color: #333; align-self: flex-start;'}
        ${extraClass === 'typing' ? 'font-style: italic; opacity: 0.7;' : ''}
    `;
    
    DOM.chatbotMessages.appendChild(msgDiv);
    DOM.chatbotMessages.scrollTop = DOM.chatbotMessages.scrollHeight;
}

// --- NOTIFICACIÓN TEMPORAL ---
function showTemporaryNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 1rem;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

// Añadir animaciones
if (!document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        @keyframes slideUp {
            from {
                transform: translate(-50%, 0);
                opacity: 1;
            }
            to {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// --- ADJUNTAR LISTENERS A BOTONES ---
function attachActionListeners() {
    console.log('🔗 Adjuntando listeners de acciones...');
    
    // Botón guardar (si existe en DOM)
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn && !saveBtn.dataset.listenerAttached) {
        saveBtn.addEventListener('click', saveAnnotations);
        saveBtn.dataset.listenerAttached = 'true';
        console.log('✅ Listener: saveBtn');
    }
    
    // Botones de compartir
    const shareWhatsAppBtns = document.querySelectorAll('[data-action="share-whatsapp"], .share-whatsapp, #shareWhatsApp');
    shareWhatsAppBtns.forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.addEventListener('click', shareWhatsApp);
            btn.dataset.listenerAttached = 'true';
            console.log('✅ Listener: shareWhatsApp');
        }
    });
    
    const shareEmailBtns = document.querySelectorAll('[data-action="share-email"], .share-email, #shareEmail');
    shareEmailBtns.forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.addEventListener('click', shareEmail);
            btn.dataset.listenerAttached = 'true';
            console.log('✅ Listener: shareEmail');
        }
    });
    
    // Botón descargar
    const downloadBtns = document.querySelectorAll('[data-action="download"], .download-btn, #downloadBtn');
    downloadBtns.forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.addEventListener('click', downloadDocument);
            btn.dataset.listenerAttached = 'true';
            console.log('✅ Listener: downloadBtn');
        }
    });
    
    // Botón borrar
    const deleteBtns = document.querySelectorAll('[data-action="delete"], .delete-btn, #deleteBtn');
    deleteBtns.forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.addEventListener('click', deleteDocument);
            btn.dataset.listenerAttached = 'true';
            console.log('✅ Listener: deleteBtn');
        }
    });
    
    // Chatbot - botón enviar
    const sendBtn = document.getElementById('sendQuestionBtn');
    if (sendBtn && !sendBtn.dataset.listenerAttached) {
        sendBtn.addEventListener('click', sendQuestion);
        sendBtn.dataset.listenerAttached = 'true';
        console.log('✅ Listener: sendQuestionBtn');
    }
    
    // Chatbot - Enter en input
    const chatInput = document.getElementById('chatbotInput');
    if (chatInput && !chatInput.dataset.listenerAttached) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendQuestion();
            }
        });
        chatInput.dataset.listenerAttached = 'true';
        console.log('✅ Listener: chatbotInput Enter');
    }
}

// Adjuntar listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachActionListeners);
} else {
    attachActionListeners();
}

// También adjuntar después de 1 segundo (por si se cargan dinámicamente)
setTimeout(attachActionListeners, 1000);

console.log('✅ Parche de funciones cargado');
console.log('📋 Funciones disponibles:');
console.log('  • shareWhatsApp()');
console.log('  • shareEmail()');
console.log('  • downloadDocument()');
console.log('  • deleteDocument()');
console.log('  • saveAnnotations()');
console.log('  • sendQuestion()');