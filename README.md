# Mapa Galáctico 3D de Star Wars

Una aplicación web interactiva que permite explorar la galaxia de Star Wars en 3D con un agente de IA especializado como guía.

## 🌟 Características Principales

### 🚀 Exploración 3D Interactiva
- **Navegación fluida** en 3D con controles intuitivos (zoom, rotación, paneo)
- **10 sistemas estelares icónicos** completamente renderizados
- **9 regiones galácticas** visualizadas con volúmenes semi-transparentes
- **Efectos visuales espaciales** con nebulosas, estrellas de fondo y núcleo galáctico

### 🤖 Agente IA Especializado (C-3PO)
- **Conocimiento experto** del universo Star Wars
- **Respuestas contextuales** basadas en el sistema seleccionado
- **Navegación guiada** automática a ubicaciones mencionadas
- **Interfaz conversacional** natural y temática

### 📊 Información Detallada de Sistemas
- **Datos completos** de cada sistema estelar
- **Información política** y afiliaciones
- **Datos demográficos** y especies dominantes
- **Significado histórico** y eventos importantes
- **Coordenadas galácticas** precisas

### 🎨 Diseño Temático Star Wars
- **Paleta de colores** inspirada en el universo (oro imperial, azul rebelde)
- **Efectos de brillo** y gradientes espaciales
- **Transiciones suaves** y animaciones cinematográficas
- **Interfaz holográfica** con bordes y efectos de desenfoque

## 🛠️ Tecnologías Utilizadas

### Frontend Core
- **React 18** - Framework de interfaz de usuario
- **TypeScript** - Tipado estático
- **Vite** - Herramienta de construcción y desarrollo

### Renderizado 3D
- **Three.js** - Motor de renderizado 3D WebGL
- **React Three Fiber** - Integración React-Three.js
- **React Three Drei** - Utilidades y helpers 3D

### Interfaz de Usuario
- **Tailwind CSS** - Framework de estilos utilitarios
- **Shadcn/UI** - Componentes de UI modernos
- **Lucide React** - Iconografía

### Navegación y Estado
- **React Router DOM** - Enrutamiento de aplicación
- **React Hooks** - Gestión de estado local

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm
- Navegador moderno con soporte WebGL

### Instalación
```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd star-wars-galaxy-map

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construcción para producción
npm run preview      # Vista previa de la construcción
npm run lint         # Análisis de código
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                 # Componentes UI base (Shadcn)
│   ├── GalaxyMap3D.tsx    # Componente principal del mapa 3D
│   ├── AIAgent.tsx        # Agente IA C-3PO
│   └── SystemInfo.tsx     # Panel de información de sistemas
├── data/
│   └── galaxyData.ts      # Datos de sistemas y regiones galácticas
├── pages/
│   ├── GalaxyExplorer.tsx # Página principal del explorador
│   └── Index.tsx          # Página de entrada
├── hooks/                 # Hooks personalizados de React
├── lib/                   # Utilidades y configuraciones
└── index.css             # Estilos globales y sistema de diseño
```

## 🎮 Guía de Uso

### Navegación Básica
- **Zoom**: Rueda del ratón o pellizco en móvil
- **Rotación**: Clic izquierdo y arrastre
- **Paneo**: Clic derecho y arrastre
- **Selección**: Clic izquierdo en cualquier sistema estelar

### Interacción con el Agente IA
1. Selecciona un sistema en el mapa 3D
2. Haz preguntas sobre el sistema en el chat
3. El agente puede navegar automáticamente a ubicaciones mencionadas
4. Explora información histórica, política y cultural

### Sistemas Incluidos
- **Coruscant** - Capital galáctica y centro político
- **Tatooine** - Mundo desértico del Outer Rim
- **Alderaan** - Mundo pacífico destruido por la Estrella de la Muerte
- **Naboo** - Mundo natal de Padmé Amidala y Palpatine
- **Kamino** - Mundo oceánico de los clones
- **Geonosis** - Mundo industrial droide
- **Mustafar** - Mundo volcánico donde Vader nació
- **Kashyyyk** - Mundo forestal de los Wookiees
- **Dagobah** - Mundo pantanoso refugio de Yoda
- **Hoth** - Mundo helado base rebelde

## 🎨 Sistema de Diseño

### Colores Principales
- **Fondo Espacial**: `hsl(220 25% 8%)` - Azul oscuro profundo
- **Oro Imperial**: `hsl(45 95% 55%)` - Acentos dorados
- **Azul Rebelde**: `hsl(210 100% 45%)` - Elementos secundarios
- **Verde Jedi**: `hsl(120 100% 40%)` - Acentos especiales

### Efectos Visuales
- **Gradientes espaciales** para fondos
- **Sombras con brillo** para elementos importantes
- **Transiciones suaves** entre estados
- **Animaciones flotantes** para objetos interactivos

## 🔧 Optimizaciones de Rendimiento

### Renderizado 3D
- **Level of Detail (LOD)** adaptativo basado en distancia
- **Culling inteligente** para objetos fuera de vista
- **Instancing de geometría** para objetos repetidos
- **Gestión de memoria** automática para texturas

### Experiencia de Usuario
- **Carga progresiva** de assets 3D
- **Transiciones suaves** entre vistas
- **Controles adaptativos** según el dispositivo
- **Fallbacks** para dispositivos de menor capacidad

## 🚀 Roadmap Futuro

### Funcionalidades Planificadas
- [ ] **Más sistemas estelares** (objetivo: 100+ sistemas)
- [ ] **Línea de tiempo histórica** interactiva
- [ ] **Rutas comerciales** visualizadas
- [ ] **Batallas históricas** con animaciones
- [ ] **Modo VR** para inmersión completa
- [ ] **Tours guiados** temáticos
- [ ] **Marcadores personalizados** del usuario
- [ ] **Exportación de datos** y capturas

### Mejoras Técnicas
- [ ] **WebGL 2.0** para efectos avanzados
- [ ] **Service Workers** para funcionamiento offline
- [ ] **Streaming de datos** dinámico
- [ ] **Integración con APIs** externas de Star Wars

## 🤝 Contribución

### Cómo Contribuir
1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Áreas de Contribución
- **Datos galácticos**: Añadir más sistemas y información
- **Efectos visuales**: Mejorar shaders y animaciones
- **IA**: Expandir conocimiento del agente
- **UI/UX**: Mejorar interfaz y experiencia
- **Rendimiento**: Optimizaciones adicionales
- **Documentación**: Guías y tutoriales

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Reconocimientos

- **Lucasfilm/Disney** - Por crear el universo Star Wars
- **Three.js** - Por el motor de renderizado 3D
- **React Three Fiber** - Por la integración React-Three.js
- **Shadcn/UI** - Por los componentes de interfaz
- **Comunidad Star Wars** - Por mantener vivo el universo

## 📞 Contacto

- **Proyecto**: [URL del proyecto]
- **Issues**: [URL de issues]
- **Documentación**: [URL de documentación]

---

**"En una galaxia muy, muy lejana... ahora al alcance de un clic."**

---

## 🔍 Datos Técnicos Adicionales

### Rendimiento Objetivo
- **60 FPS** en dispositivos modernos
- **< 3 segundos** tiempo de carga inicial
- **< 500ms** respuesta del agente IA
- **Soporte** para dispositivos desde 2018+

### Navegadores Soportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Especificaciones Mínimas
- **RAM**: 4GB
- **GPU**: Integrada moderna o dedicada
- **Conexión**: Banda ancha recomendada
- **Pantalla**: 1024x768 mínimo