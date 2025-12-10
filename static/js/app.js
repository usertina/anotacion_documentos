// ========================================
// ANOTADOR UNIVERSAL - VERSIÓN SIMPLE
// ========================================

console.log('🚀 Anotador v3.0 - Versión Simple');

// Estado
const State = {
    docId: null,
    page: 0,
    pages: 0,
    annotations: [],
    tool: 'pen',
    color: '#FFEB3B',
    size: 3,
    drawing: false,
    lastPoint: null,
    currentAnn: null,
    images: [],
    text: '',
    filename: ''
};

let DOM = {};

// ========================================
// NAVEGACIÓN - TECLAS Y CLICKS
// ========================================

// TECLADO: Flechas izquierda/derecha
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        console.log('⌨️ FLECHA IZQUIERDA');
        goToPrevPage();
    } else if (e.key === 'ArrowRight') {
        console.log('⌨️ FLECHA DERECHA');
        goToNextPage();
    }
});

function goToPrevPage() {
    console.log('◀️ PREV - Página actual:', State.page);
    if (State.page > 0) {
        State.page--;
        render();
        updateNav();
    }
}

function goToNextPage() {
    console.log('▶️ NEXT - Página actual:', State.page, 'Total:', State.pages);
    if (State.page < State.pages - 1) {
        State.page++;
        render();
        updateNav();
    }
}

function updateNav() {
    if (DOM.pageInfo) DOM.pageInfo.textContent = `${State.page + 1}/${State.pages}`;
    if (DOM.prevPage) DOM.prevPage.disabled = State.page === 0;
    if (DOM.nextPage) DOM.nextPage.disabled = State.page === State.pages - 1;
}

// ========================================
// INIT
// ========================================

function init() {
    console.log('📦 Init');
    
    DOM = {
        fileInput: document.getElementById('fileInput'),
        selectFileBtn: document.getElementById('selectFileBtn'),
        saveBtn: document.getElementById('saveBtn'),
        documentContainer: document.getElementById('documentContainer'),
        uploadPrompt: document.getElementById('uploadPrompt'),
        documentViewer: document.getElementById('documentViewer'),
        textContent: document.getElementById('textContent'),
        canvas: document.getElementById('annotationCanvas'),
        documentTitle: document.getElementById('documentTitle'),
        pageInfo: document.getElementById('pageInfo'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        chatInput: document.getElementById('chatbotInput'),
        chatMessages: document.getElementById('chatbotMessages'),
        sendBtn: document.getElementById('sendQuestionBtn'),
        documentsList: document.getElementById('documentsList'),
        brushSize: document.getElementById('brushSize'),
        brushSizeValue: document.getElementById('brushSizeValue')
    };
    
    // Listeners básicos
    DOM.selectFileBtn?.addEventListener('click', () => DOM.fileInput?.click());
    DOM.fileInput?.addEventListener('change', handleFile);
    DOM.uploadPrompt?.addEventListener('click', () => DOM.fileInput?.click());
    DOM.saveBtn?.addEventListener('click', save);
    
    // Navegación - MÚLTIPLES FORMAS
    if (DOM.prevPage) {
        DOM.prevPage.onclick = goToPrevPage;
        DOM.prevPage.addEventListener('click', goToPrevPage);
    }
    if (DOM.nextPage) {
        DOM.nextPage.onclick = goToNextPage;
        DOM.nextPage.addEventListener('click', goToNextPage);
    }
    
    // Herramientas
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            State.tool = btn.dataset.tool;
            document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Colores
    document.querySelectorAll('.color-btn-mini').forEach(btn => {
        btn.addEventListener('click', () => {
            State.color = btn.dataset.color;
            updateColorDisplay(btn.dataset.color);
        });
    });
    
    // Grosor
    DOM.brushSize?.addEventListener('input', (e) => {
        State.size = parseInt(e.target.value);
        if (DOM.brushSizeValue) DOM.brushSizeValue.textContent = `${State.size}px`;
    });
    
    // Canvas
    if (DOM.canvas) {
        DOM.canvas.addEventListener('mousedown', startDraw);
        DOM.canvas.addEventListener('mousemove', draw);
        DOM.canvas.addEventListener('mouseup', endDraw);
        DOM.canvas.addEventListener('mouseleave', endDraw);
        DOM.canvas.addEventListener('touchstart', startDrawTouch, {passive: false});
        DOM.canvas.addEventListener('touchmove', drawTouch, {passive: false});
        DOM.canvas.addEventListener('touchend', endDraw, {passive: false});
    }
    
    // Chatbot
    DOM.sendBtn?.addEventListener('click', sendChat);
    DOM.chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });
    
    // Selector de color modal
    initColorPicker();
    
    // FABs
    document.getElementById('fabChatbot')?.addEventListener('click', () => {
        document.getElementById('chatbotModal').classList.toggle('open');
    });
    document.getElementById('fabDocuments')?.addEventListener('click', () => {
        document.getElementById('documentsModal').classList.toggle('open');
    });
    
    // Cerrar modales
    document.getElementById('closeChatbot')?.addEventListener('click', () => {
        document.getElementById('chatbotModal').classList.remove('open');
    });
    document.getElementById('closeDocuments')?.addEventListener('click', () => {
        document.getElementById('documentsModal').classList.remove('open');
    });
    
    // Acciones
    document.getElementById('shareWhatsApp')?.addEventListener('click', shareWhatsApp);
    document.getElementById('shareEmail')?.addEventListener('click', shareEmail);
    document.getElementById('downloadBtn')?.addEventListener('click', downloadDoc);
    document.getElementById('deleteBtn')?.addEventListener('click', deleteDoc);
    document.getElementById('clearAllBtn')?.addEventListener('click', clearPage);
    
    loadDocs();
    
    console.log('✅ Init completo');
}

// ========================================
// SUBIR Y CARGAR
// ========================================

function handleFile(e) {
    const file = e.target.files[0];
    if (file) upload(file);
}

async function upload(file) {
    console.log('⬆️', file.name);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const res = await fetch('/upload', {method: 'POST', body: formData});
        const data = await res.json();
        
        if (data.success) {
            State.docId = data.doc_id;
            State.filename = data.filename;
            await loadDoc(data.doc_id);
            notify(`✅ ${data.filename}`);
        } else {
            notify('❌ Error');
        }
    } catch (error) {
        console.error('❌', error);
        notify('❌ Error');
    }
}

async function loadDoc(docId) {
    console.log('📖', docId);
    
    try {
        const res = await fetch(`/get_document/${docId}`);
        const doc = await res.json();
        
        if (doc.error) return notify('❌ Error');
        
        State.docId = docId;
        State.filename = doc.original_name;
        State.text = doc.text_content || '';
        State.annotations = doc.annotations || [];
        State.images = doc.image_data || [];
        State.pages = State.images.length || 1;
        State.page = 0;
        
        DOM.uploadPrompt.style.display = 'none';
        DOM.documentViewer.style.display = 'block';
        DOM.documentTitle.textContent = State.filename;
        
        render();
        updateNav();
        updateActionButtons(true);
        
    } catch (error) {
        console.error('❌', error);
    }
}

// ========================================
// RENDER
// ========================================

function render() {
    console.log('🖼️ Renderizando página:', State.page);
    
    if (State.images.length > 0) {
        const img = State.images[State.page];
        DOM.textContent.innerHTML = `<img src="${img}" style="max-width:100%; width:100%; height:auto; display:block;">`;
        
        DOM.textContent.querySelector('img').onload = () => {
            setupCanvas();
            redraw();
        };
    } else {
        DOM.textContent.innerHTML = `<div style="padding:20px; white-space:pre-wrap;">${escapeHtml(State.text)}</div>`;
        setupCanvas();
        redraw();
    }
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    DOM.canvas.style.width = DOM.textContent.offsetWidth + 'px';
    DOM.canvas.style.height = DOM.textContent.offsetHeight + 'px';
    DOM.canvas.width = DOM.textContent.offsetWidth * dpr;
    DOM.canvas.height = DOM.textContent.offsetHeight * dpr;
    
    const ctx = DOM.canvas.getContext('2d');
    ctx.scale(dpr, dpr);
}

function redraw() {
    const ctx = DOM.canvas.getContext('2d');
    const rect = DOM.canvas.getBoundingClientRect();
    
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    
    State.annotations.filter(a => a.page === State.page).forEach(ann => {
        if (ann.type === 'text') {
            ctx.fillStyle = ann.color;
            ctx.font = `${ann.size * 10}px Arial`;
            ctx.fillText(ann.text, ann.x * rect.width, ann.y * rect.height);
        } else if (ann.points && ann.points.length > 1) {
            ctx.strokeStyle = ann.color;
            ctx.lineWidth = ann.size * 2;
            ctx.lineCap = 'round';
            
            if (ann.type === 'highlighter') {
                ctx.globalAlpha = 0.15;
                ctx.lineWidth = ann.size * 6;
            } else {
                ctx.globalAlpha = 1;
            }
            
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x * rect.width, ann.points[0].y * rect.height);
            ann.points.forEach((p, i) => {
                if (i > 0) ctx.lineTo(p.x * rect.width, p.y * rect.height);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });
}

// ========================================
// DIBUJO
// ========================================

function startDraw(e) {
    if (!State.docId) return;
    State.drawing = true;
    const pos = getPos(e);
    
    if (State.tool === 'text') {
        const text = prompt('Texto:');
        if (text) {
            State.annotations.push({
                type: 'text',
                color: State.color,
                size: State.size,
                page: State.page,
                x: pos.x,
                y: pos.y,
                text: text
            });
            redraw();
        }
        State.drawing = false;
        return;
    }
    
    if (State.tool === 'eraser') {
        erase(pos);
        return;
    }
    
    State.currentAnn = {
        type: State.tool,
        color: State.color,
        size: State.size,
        page: State.page,
        points: [pos]
    };
    State.lastPoint = pos;
}

function draw(e) {
    if (!State.drawing || !State.currentAnn) return;
    
    const pos = getPos(e);
    State.currentAnn.points.push(pos);
    
    const ctx = DOM.canvas.getContext('2d');
    const rect = DOM.canvas.getBoundingClientRect();
    
    ctx.strokeStyle = State.currentAnn.color;
    ctx.lineWidth = State.currentAnn.size * 2;
    ctx.lineCap = 'round';
    
    if (State.currentAnn.type === 'highlighter') {
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = State.currentAnn.size * 6;
    }
    
    ctx.beginPath();
    ctx.moveTo(State.lastPoint.x * rect.width, State.lastPoint.y * rect.height);
    ctx.lineTo(pos.x * rect.width, pos.y * rect.height);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    State.lastPoint = pos;
}

function endDraw() {
    if (State.currentAnn && State.currentAnn.points && State.currentAnn.points.length > 0) {
        State.annotations.push(State.currentAnn);
    }
    State.drawing = false;
    State.currentAnn = null;
    State.lastPoint = null;
}

function startDrawTouch(e) {
    e.preventDefault();
    if (!State.docId) return;
    const touch = e.touches[0];
    startDraw(touch);
}

function drawTouch(e) {
    e.preventDefault();
    if (!State.drawing) return;
    const touch = e.touches[0];
    draw(touch);
}

function getPos(e) {
    const rect = DOM.canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
}

function erase(pos) {
    const threshold = 0.05;
    State.annotations = State.annotations.filter(ann => {
        if (ann.page !== State.page) return true;
        if (ann.type === 'text') {
            const dist = Math.sqrt(Math.pow(ann.x - pos.x, 2) + Math.pow(ann.y - pos.y, 2));
            return dist > threshold;
        } else if (ann.points) {
            return !ann.points.some(p => {
                const dist = Math.sqrt(Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2));
                return dist < threshold;
            });
        }
        return true;
    });
    redraw();
}

function clearPage() {
    if (!confirm('¿Limpiar página?')) return;
    State.annotations = State.annotations.filter(a => a.page !== State.page);
    redraw();
}

// ========================================
// GUARDAR
// ========================================

async function save() {
    if (!State.docId) return notify('❌ Sin documento');
    
    try {
        const res = await fetch('/save_annotations', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                doc_id: State.docId,
                annotations: State.annotations
            })
        });
        
        const data = await res.json();
        notify(data.success ? '✅ Guardado' : '❌ Error');
        if (data.success) loadDocs();
    } catch (error) {
        notify('❌ Error');
    }
}

async function shareWhatsApp() {
    if (!State.docId) return notify('❌ Sin documento');
    const text = encodeURIComponent(`📄 ${State.filename}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    notify('💬 WhatsApp');
}

async function shareEmail() {
    if (!State.docId) return notify('❌ Sin documento');
    const subject = encodeURIComponent(`Documento: ${State.filename}`);
    window.location.href = `mailto:?subject=${subject}`;
    notify('📧 Email');
}

async function downloadDoc() {
    if (!State.docId) return notify('❌ Sin documento');
    
    try {
        const res = await fetch('/export_pdf', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                doc_id: State.docId,
                annotations: State.annotations
            })
        });
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${State.filename}_anotado.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        notify('✅ Descargado');
    } catch (error) {
        notify('❌ Error');
    }
}

async function deleteDoc() {
    if (!State.docId) return;
    if (!confirm(`¿Borrar "${State.filename}"?`)) return;
    
    try {
        const res = await fetch('/delete_document', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({doc_id: State.docId})
        });
        
        const data = await res.json();
        
        if (data.success) {
            State.docId = null;
            State.filename = '';
            State.annotations = [];
            State.images = [];
            
            DOM.documentViewer.style.display = 'none';
            DOM.uploadPrompt.style.display = 'flex';
            
            updateActionButtons(false);
            loadDocs();
            notify('✅ Borrado');
        }
    } catch (error) {
        notify('❌ Error');
    }
}

function updateActionButtons(show) {
    ['shareWhatsApp', 'shareEmail', 'downloadBtn', 'deleteBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = show ? 'inline-flex' : 'none';
    });
}

// ========================================
// CHATBOT
// ========================================

async function sendChat() {
    const question = DOM.chatInput.value.trim();
    if (!question || !State.docId) return;
    
    addMsg('user', question);
    DOM.chatInput.value = '';
    
    const typingId = 'typing-' + Date.now();
    addMsg('bot', '...', typingId);
    
    try {
        const res = await fetch('/ask_chatbot', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                doc_id: State.docId,
                question: question
            })
        });
        
        const data = await res.json();
        document.getElementById(typingId)?.remove();
        
        if (data.success) {
            addMsg('bot', data.answer);
        } else {
            addMsg('bot', '❌ Error');
        }
    } catch (error) {
        document.getElementById(typingId)?.remove();
        addMsg('bot', '❌ Error');
    }
}

function addMsg(type, text, id = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = text;
    if (id) msgDiv.id = id;
    
    msgDiv.style.cssText = `
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 8px;
        max-width: 85%;
        ${type === 'user' ? 'background:#4361ee; color:white; margin-left:auto;' : 'background:#f0f0f0;'}
    `;
    
    DOM.chatMessages.appendChild(msgDiv);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

// ========================================
// DOCUMENTOS
// ========================================

async function loadDocs() {
    try {
        const res = await fetch('/list_documents');
        const data = await res.json();
        
        if (data.success && data.documents.length > 0) {
            DOM.documentsList.innerHTML = data.documents.map(doc => `
                <div onclick="loadDoc('${doc.id}')" style="cursor:pointer; padding:12px; margin:8px 0; border:1px solid #ddd; border-radius:8px;">
                    <div style="font-weight:600;">${escapeHtml(doc.filename)}</div>
                    <div style="font-size:0.75rem; color:#666;">${new Date(doc.date).toLocaleDateString()}</div>
                </div>
            `).join('');
        } else {
            DOM.documentsList.innerHTML = '<p style="padding:20px; text-align:center; color:#999;">Sin documentos</p>';
        }
    } catch (error) {
        console.error('❌', error);
    }
}

// ========================================
// COLOR PICKER
// ========================================

function initColorPicker() {
    if (typeof iro === 'undefined') {
        setTimeout(initColorPicker, 200);
        return;
    }
    
    console.log('🎨 Color picker');
    
    const openBtn = document.getElementById('openColorPickerBtn');
    const modal = document.getElementById('colorPickerModal');
    const closeBtn = document.getElementById('closeColorPicker');
    const applyBtn = document.getElementById('applyColorBtn');
    
    if (!openBtn || !modal) return;
    
    openBtn.addEventListener('click', () => modal.classList.add('open'));
    closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
    
    const picker = new iro.ColorPicker('#colorPicker', {
        width: 220,
        color: State.color,
        layout: [
            {component: iro.ui.Box},
            {component: iro.ui.Slider, options: {sliderType: 'hue'}}
        ]
    });
    
    const preview = document.getElementById('colorPreview');
    const hexInput = document.getElementById('hexInput');
    const rgbValue = document.getElementById('rgbValue');
    
    picker.on('color:change', color => {
        const hex = color.hexString.toUpperCase();
        if (preview) preview.style.background = hex;
        if (hexInput) hexInput.value = hex;
        if (rgbValue) rgbValue.textContent = `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
    });
    
    applyBtn?.addEventListener('click', () => {
        const hex = picker.color.hexString.toUpperCase();
        State.color = hex;
        updateColorDisplay(hex);
        modal.classList.remove('open');
        notify(`🎨 ${hex}`);
    });
    
    // CUENTAGOTAS
    if ('EyeDropper' in window) {
        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'tool-btn';
        eyeBtn.innerHTML = '<i class="fas fa-eye-dropper"></i><span>Cuentagotas</span>';
        eyeBtn.style.marginTop = '8px';
        
        eyeBtn.addEventListener('click', async () => {
            try {
                const eyeDropper = new EyeDropper();
                const result = await eyeDropper.open();
                const hex = result.sRGBHex.toUpperCase();
                picker.color.hexString = hex;
                State.color = hex;
                updateColorDisplay(hex);
                notify(`🎨 ${hex}`);
            } catch {}
        });
        
        const colorGroup = document.querySelector('.tool-group');
        if (colorGroup) colorGroup.appendChild(eyeBtn);
        
        console.log('✅ Cuentagotas añadido');
    }
    
    window.colorPicker = picker;
}

function updateColorDisplay(hex) {
    const display = document.getElementById('currentColorDisplay');
    const hexDisplay = document.getElementById('hexDisplayCompact');
    if (display) display.style.background = hex;
    if (hexDisplay) hexDisplay.textContent = hex;
}

// ========================================
// UTILS
// ========================================

function notify(msg) {
    console.log('📢', msg);
    const notif = document.createElement('div');
    notif.textContent = msg;
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 600;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// START
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.State = State;
window.loadDoc = loadDoc;
window.goToPrevPage = goToPrevPage;
window.goToNextPage = goToNextPage;

console.log('✅ Listo - Usa flechas del teclado ◀️▶️ para navegar');