# 📝 Anotador de Documentos Inteligente

Una aplicación web completa para subir, anotar y analizar documentos (PDF, DOCX, TXT, imágenes) con un chatbot AI integrado.

## ✨ Características

### 📄 Gestión de Documentos
- **Subida múltiple de formatos**: PDF, DOCX, TXT, PNG, JPG, JPEG
- **Drag & Drop**: Arrastra archivos directamente a la zona gris
- **Conversión automática**: PDFs se convierten a imágenes para mejor anotación
- **Navegación por páginas**: Para documentos de múltiples páginas

### 🎨 Herramientas de Anotación
- **Lápiz**: Dibujo libre con diferentes grosores
- **Resaltador**: Resalta texto con transparencia
- **Texto**: Añade notas de texto en cualquier posición
- **Borrador**: Elimina anotaciones individuales
- **5 colores**: Amarillo, rosa, verde, azul, negro
- **Control de grosor**: Ajusta el tamaño del trazo (1-20px)

### 🤖 Chatbot AI Integrado
- Haz preguntas sobre el contenido del documento
- Mantiene historial de conversación
- Respuestas en español
- Powered by Google Gemini

### 💾 Gestión de Archivos
- **Guardar anotaciones**: Persiste tus cambios
- **Descargar PDF anotado**: Exporta con todas las anotaciones aplicadas
- **Lista de documentos**: Ve todos tus documentos guardados
- **Cargar documentos previos**: Continúa trabajando en documentos guardados

### 📱 Diseño Responsive
- ✅ Funciona perfectamente en desktop (pantallas grandes)
- ✅ Optimizado para tablets
- ✅ Soporte completo para móviles
- ✅ **Soporte táctil completo**: Dibuja con los dedos en dispositivos táctiles
- ✅ Interfaz adaptativa según el tamaño de pantalla

## 🚀 Instalación

### Prerrequisitos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Paso 1: Clonar o descargar

```bash
git clone <tu-repositorio>
cd document-annotator
```

### Paso 2: Crear entorno virtual (recomendado)

```bash
python -m venv venv

# En Windows:
venv\Scripts\activate

# En Linux/Mac:
source venv/bin/activate
```

### Paso 3: Instalar dependencias

```bash
pip install -r requirements.txt
```

### Paso 4: Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tu editor favorito
nano .env  # o vim, code, etc.
```

**Configuración mínima requerida:**
```env
SECRET_KEY=tu_clave_secreta_random_aqui
GEMINI_API_KEY=tu_api_key_de_gemini  # Opcional, solo si quieres el chatbot
```

### Paso 5: Ejecutar la aplicación

```bash
python app.py
```

La aplicación estará disponible en: **http://localhost:5001**

## 📁 Estructura del Proyecto

```
document-annotator/
│
├── app.py                 # Aplicación Flask principal
├── routes.py              # Rutas y endpoints de la API
├── utils.py               # Funciones utilitarias
├── requirements.txt       # Dependencias Python
├── .env.example          # Ejemplo de configuración
│
├── templates/
│   └── index.html        # Interfaz HTML
│
├── static/
│   ├── css/
│   │   └── styles.css    # Estilos CSS
│   └── js/
│       └── app.js        # Lógica JavaScript frontend
│
├── uploads/              # Documentos subidos (se crea automáticamente)
└── annotated_docs/       # PDFs anotados (se crea automáticamente)
```

## 🎯 Cómo Usar

### 1. Subir un Documento

**Opción A - Click:**
1. Haz click en el botón "Subir" en la cabecera
2. Selecciona tu archivo
3. Espera a que se procese

**Opción B - Drag & Drop:**
1. Arrastra tu archivo a la zona gris central
2. Suelta el archivo
3. Se procesará automáticamente

### 2. Anotar el Documento

1. **Selecciona una herramienta** (Lápiz, Resaltador, Texto, Borrador)
2. **Elige un color** de la paleta
3. **Ajusta el grosor** con el slider
4. **Dibuja o escribe** directamente sobre el documento
   - En desktop: Usa el mouse
   - En móvil/tablet: Usa el dedo directamente

### 3. Navegar entre Páginas

- Usa las flechas ◀ ▶ en la cabecera del documento
- O el contador de páginas muestra: "Página actual / Total"

### 4. Guardar tu Trabajo

1. Haz click en "Guardar" en la cabecera
2. Tus anotaciones se guardan automáticamente
3. El documento aparecerá en el panel derecho "Guardados"

### 5. Descargar PDF Anotado

1. En el panel derecho, encuentra tu documento
2. Haz click en el icono de descarga ⬇️
3. Se generará un PDF con todas tus anotaciones aplicadas

### 6. Chatear con el Documento (Requiere API Key)

1. Sube un documento
2. En el panel izquierdo, ve a la sección de chat
3. Escribe tu pregunta
4. El chatbot responderá basándose en el contenido del documento

## 🔧 Configuración Avanzada

### Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo API Key
4. Cópialo y pégalo en tu archivo `.env`

### Personalizar Configuración

Edita el archivo `.env`:

```env
# Tamaño máximo de archivo (en MB)
MAX_CONTENT_LENGTH_MB=32

# Cambiar carpetas
UPLOAD_FOLDER=mis_uploads
ANNOTATED_FOLDER=mis_anotados

# Cambiar modelo de Gemini
GEMINI_MODEL=gemini-2.0-flash-exp
```

## 🐛 Solución de Problemas

### "No se puede subir el archivo"
- Verifica que el formato sea compatible: PDF, DOCX, TXT, PNG, JPG
- Comprueba que el archivo no exceda 16MB (o el límite configurado)
- Revisa los permisos de la carpeta `uploads/`

### "Error al procesar PDF"
- Instala poppler (requerido para pdf2image):
  ```bash
  # Ubuntu/Debian:
  sudo apt-get install poppler-utils
  
  # Mac:
  brew install poppler
  
  # Windows: Descarga desde https://github.com/oschwartz10612/poppler-windows
  ```

### "El chatbot no funciona"
- Verifica que tengas una API Key de Gemini válida en `.env`
- Comprueba tu conexión a internet
- Revisa que el modelo esté disponible

### "Las anotaciones no se ven en móvil"
- Asegúrate de que JavaScript esté habilitado
- Intenta hacer zoom out si el documento está muy ampliado
- Reinicia la página

## 🎨 Personalización

### Cambiar Colores

Edita `static/css/styles.css`:

```css
:root {
    --primary: #4361ee;      /* Color principal */
    --secondary: #3a0ca3;    /* Color secundario */
    --bg-dark: #525659;      /* Fondo zona documento */
}
```

### Añadir Nuevos Colores de Anotación

Edita `templates/index.html`:

```html
<div class="color-palette">
    <!-- Añade nuevos colores aquí -->
    <div class="color-btn" style="background:#FF5722" data-color="#FF5722"></div>
</div>
```

## 🔐 Seguridad

⚠️ **Importante para Producción:**

1. Cambia `SECRET_KEY` por una clave aleatoria fuerte
2. No expongas tu `GEMINI_API_KEY` públicamente
3. Implementa autenticación de usuarios
4. Usa HTTPS en producción
5. Limita el tamaño de uploads
6. Implementa rate limiting

## 📝 Licencia

Este proyecto está bajo licencia MIT. Siéntete libre de usarlo, modificarlo y distribuirlo.

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

¿Problemas o preguntas? Abre un issue en GitHub o contacta al desarrollador.

## 🙏 Créditos

Desarrollado por Qubiz.Team para facilitar la anotación y análisis de documentos.

---

**¡Disfruta anotando tus documentos! 📝✨**
