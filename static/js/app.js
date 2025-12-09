// ========================================
// HOTFIX MÓVIL - CANVAS Y REDIMENSIONAMIENTO
// ========================================

// --- 1. FIX CANVAS BORROSO ---
function setupCanvas() {
    const canvas = document.getElementById('annotationCanvas');
    const content = document.getElementById('textContent');
    
    if (!canvas || !content) return;
    
    // Obtener el tamaño real del contenedor
    const rect = content.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Tamaño físico del canvas (CSS)
    canvas.style.width = content.offsetWidth + 'px';
    canvas.style.height = content.offsetHeight + 'px';
    
    // Tamaño del canvas en píxeles (para evitar blur)
    canvas.width = content.offsetWidth * dpr;
    canvas.height = content.offsetHeight * dpr;
    
    // Escalar el contexto para dispositivos de alta densidad
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    console.log('Canvas configurado:', {
        cssWidth: canvas.style.width,
        cssHeight: canvas.style.height,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        dpr: dpr
    });
    
    // Redibujar anotaciones después de reconfigurar
    if (typeof redrawAnnotations === 'function') {
        setTimeout(() => redrawAnnotations(), 100);
    }
}

// --- 2. REDIMENSIONAR AL CARGAR IMAGEN ---
function renderCurrentPage() {
    if (AppState.documentImages && AppState.documentImages.length > 0) {
        const imgData = AppState.documentImages[AppState.currentPage];
        const content = document.getElementById('textContent');
        
        content.innerHTML = `<img src="${imgData}" alt="Página ${AppState.currentPage + 1}" 
                             style="max-width:100%; width:100%; height:auto; display:block;">`;
        
        // Esperar a que la imagen cargue completamente
        const img = content.querySelector('img');
        img.onload = function() {
            console.log('Imagen cargada:', img.naturalWidth, 'x', img.naturalHeight);
            setTimeout(() => {
                setupCanvas();
                if (typeof redrawAnnotations === 'function') {
                    redrawAnnotations();
                }
            }, 200);
        };
    } else {
        const content = document.getElementById('textContent');
        content.innerHTML = `<div style="white-space: pre-wrap; padding: 20px;">${escapeHtml(AppState.documentText || '')}</div>`;
        setTimeout(() => {
            setupCanvas();
            if (typeof redrawAnnotations === 'function') {
                redrawAnnotations();
            }
        }, 200);
    }
    
    updatePageInfo();
}

// --- 3. FIX COORDENADAS TOUCH ---
function getCanvasPosition(e) {
    const canvas = document.getElementById('annotationCanvas');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
}

function getCanvasPositionFromTouch(touch) {
    const canvas = document.getElementById('annotationCanvas');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    return {
        x: (touch.clientX - rect.left) / rect.width,
        y: (touch.clientY - rect.top) / rect.height
    };
}

// --- 4. DIBUJAR CON DPR CORRECTO ---
function drawLine(from, to, annotation) {
    const canvas = document.getElementById('annotationCanvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Usar tamaño CSS, no canvas
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

// --- 5. REDIBUJAR ANOTACIONES CON DPR ---
function redrawAnnotations() {
    const canvas = document.getElementById('annotationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Limpiar correctamente
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Usar tamaño CSS
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

// --- 6. LISTENER DE REDIMENSIONAMIENTO ---
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log('Ventana redimensionada:', window.innerWidth, 'x', window.innerHeight);
        if (AppState && AppState.currentDocId) {
            setupCanvas();
            if (typeof redrawAnnotations === 'function') {
                redrawAnnotations();
            }
        }
    }, 300);
});

// --- 7. LISTENER DE ORIENTACIÓN ---
window.addEventListener('orientationchange', () => {
    console.log('Orientación cambiada');
    setTimeout(() => {
        if (AppState && AppState.currentDocId) {
            setupCanvas();
            if (typeof redrawAnnotations === 'function') {
                redrawAnnotations();
            }
        }
    }, 500);
});

// --- 8. DEBUG INFO ---
function showDebugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('Screen:', window.screen.width, 'x', window.screen.height);
    console.log('Window:', window.innerWidth, 'x', window.innerHeight);
    console.log('DPR:', window.devicePixelRatio);
    console.log('Orientation:', window.orientation || 'N/A');
    
    const canvas = document.getElementById('annotationCanvas');
    const content = document.getElementById('textContent');
    
    if (canvas) {
        console.log('Canvas CSS:', canvas.style.width, 'x', canvas.style.height);
        console.log('Canvas Pixels:', canvas.width, 'x', canvas.height);
    }
    
    if (content) {
        console.log('Content:', content.offsetWidth, 'x', content.offsetHeight);
    }
    
    console.log('==================');
}

// Ejecutar debug al cargar
setTimeout(showDebugInfo, 1000);

// Hacer disponible globalmente
window.debugCanvas = showDebugInfo;

// --- 9. AUTO-FIX AL CARGAR DOCUMENTO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Cargado - Iniciando hotfix móvil');
    
    // Override de funciones originales si existen
    if (typeof window.setupCanvas !== 'function') {
        window.setupCanvas = setupCanvas;
    }
    
    if (typeof window.renderCurrentPage !== 'function') {
        window.renderCurrentPage = renderCurrentPage;
    }
    
    // Forzar scroll visible
    const container = document.getElementById('documentContainer');
    if (container) {
        container.style.overflow = 'auto';
        container.style.webkitOverflowScrolling = 'touch';
    }
    
    console.log('Hotfix móvil aplicado');
});

// --- 10. PREVENIR ZOOM ACCIDENTAL ---
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.addEventListener('dblclick', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

console.log('✅ Hotfix móvil cargado');