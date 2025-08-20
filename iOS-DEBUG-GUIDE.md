# iOS Debug Logger - Guía de Uso

## 🚨 Sistema de Logging para Crashes en iOS Safari

Este sistema detecta automáticamente condiciones problemáticas en iOS Safari (específicamente iPhone 14-15 con iOS 16-17) y muestra logs detallados **antes** de que ocurra el crash.

## 🎯 Activación Automática

El logger se activa automáticamente **solo** en:
- **iPhone 14 Series** (iOS 16-17)  
- **iPhone 15 Series** (iOS 16-17)
- **iPad** (iOS 16-17)

**NO se activa en:**
- iPhone 16+ (iOS 18+) - No tiene el problema
- Android devices
- Desktop browsers

## 🔍 Señales de Warning Detectadas

### **Condiciones que Disparan el Overlay:**
- **3+ errores JavaScript en <1 segundo**
- **5+ performance issues (tasks >50ms)**
- **Errores críticos de DOM manipulation**
- **Memory pressure warnings**
- **Errores específicos de FixedZoom/FramesOverlay**

### **Tipos de Logs Monitoreados:**
- 🔴 **ERROR**: Errores JavaScript críticos
- 🟡 **WARNING**: Condiciones sospechosas
- 🔵 **INFO**: Estados normales de componentes
- 🟢 **DOM**: Manipulaciones DOM críticas  
- 🟣 **MEMORY**: Problemas de memoria
- 🟠 **PERFORMANCE**: Tasks lentas (>50ms)

## 📱 Cómo Usar el Overlay

### **Aparición Automática**
- El overlay aparece automáticamente cuando se detectan condiciones críticas
- Icono 🚨 rojo aparece en la esquina superior derecha

### **Controles**
- **📋 Copy**: Copia todos los logs al clipboard
- **✕ Hide**: Oculta el overlay (botón 🚨 permanece visible)
- **🚨 Show**: Mostrar overlay oculto

### **Información Mostrada**
```
🚨 iOS Debug Logger
═══════════════════
iPhone 15 Series - iOS 16.4
Errors: 3 | Perf Issues: 5

[ERROR] 14:23:45 - FixedZoom critical error
[WARNING] 14:23:46 - Critical error count reached
[DOM] 14:23:47 - Applying HARD CUT: 8450px
```

## 📋 Formato del Reporte Completo

Al hacer clic en **📋 Copy** se genera un reporte completo:

```
iOS DEBUG REPORT
================
Device: iPhone 15 Series
iOS Version: 16.4
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_4...)
Timestamp: 2025-01-16T14:23:45.123Z
Total Logs: 25
Error Count: 3
Performance Issues: 5

LOGS:
=====
2025-01-16T14:23:45.123Z [ERROR] [FixedZoom] DOM manipulation error
Stack: Error: Cannot set property 'height' of null
Details: { element: "#fixed-layout-wrapper", operation: "height" }

2025-01-16T14:23:46.456Z [WARNING] [TimelinePage] About to hide overlay - CRITICAL POINT
...
```

## 🔧 Para Desarrolladores

### **Añadir Logs Personalizados**
```typescript
import { iOSDebugLog } from '@/components/ios-debug-logger'

// Usar en cualquier componente
iOSDebugLog('error', 'Mensaje de error', 'ComponentName', { details: 'extra info' })
iOSDebugLog('warning', 'Condición sospechosa', 'ComponentName')
iOSDebugLog('info', 'Estado normal', 'ComponentName')
```

### **Puntos Críticos Monitoreados**
- **FixedZoom**: Aplicación de HARD CUT, manipulaciones DOM
- **FramesOverlay**: Carga de imágenes, retries, webp fallbacks
- **TimelinePage**: Transición de contraseña, reactivación de scroll
- **Global**: Errores JavaScript, memory warnings, performance issues

### **Acceso Programático**
```typescript
// Mostrar/ocultar overlay manualmente
(window as any).__iOSDebugLogger?.show()
(window as any).__iOSDebugLogger?.hide()

// Verificar si está activo
if ((window as any).__iOSDebugLogger?.isActive) {
  // Logger está activo en este dispositivo
}
```

## 🐛 Debugging Strategy

1. **Reproduce el crash** en iPhone 14-15
2. **Observa el overlay** - aparecerá automáticamente antes del crash
3. **Copia los logs** usando el botón 📋
4. **Analiza la secuencia** de eventos antes del crash
5. **Identifica el patrón** - qué operaciones coinciden siempre antes del crash
6. **Implementa la solución específica** para ese patrón

## 📊 Interpretación de Logs

### **Secuencia Típica de Crash:**
```
[INFO] Password correct - starting fade to black
[WARNING] About to hide overlay - CRITICAL POINT  ← Punto crítico
[DOM] Reactivating scroll after overlay hidden
[ERROR] FixedZoom critical error: Cannot read property 'height'  ← Crash inminente
[PERFORMANCE] Long task detected: 156.7ms  ← Safari saturado
```

### **Análisis:**
- El crash ocurre típicamente tras "About to hide overlay"
- FixedZoom intenta aplicar HARD CUT cuando el DOM está inestable
- Performance degradation indica saturación del render thread

## 🛠️ Próximos Pasos

Una vez identificado el patrón específico de crash, implementar:
- **Fallback graceful** para iOS 16-17
- **Delay adicional** antes de FixedZoom activation
- **DOM stability check** antes de HARD CUT
- **Memory pressure detection** y reducir operaciones
