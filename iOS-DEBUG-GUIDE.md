# iOS Debug Logger - Guía de USB-C Debugging

## 🔌 Sistema de Logging vía Safari Web Inspector

Este sistema captura logs detallados **antes** del crash y los hace accesibles via cable USB-C conectado a Mac/PC para debugging con Safari Web Inspector.

## 🎯 Activación Automática

El logger se activa automáticamente **solo** en:
- **iPhone 14 Series** (iOS 16-17)  
- **iPhone 15 Series** (iOS 16-17)
- **iPad** (iOS 16-17)

**NO se activa en:**
- iPhone 16+ (iOS 18+) - No tiene el problema
- Android devices
- Desktop browsers

## 🔌 Configuración USB-C Debugging

### **1. Preparación del iPhone**
1. Conectar iPhone al Mac/PC con cable USB-C/Lightning
2. En iPhone: `Ajustes > Safari > Avanzado > Web Inspector` = **ON**
3. Abrir la página web en Safari en el iPhone

### **2. Acceso desde Mac**
1. Abrir Safari en Mac
2. `Menú Desarrollo > [Tu iPhone] > Safari > [página web]`
3. Se abre Web Inspector con acceso a Console

### **3. Acceso desde PC Windows**
1. Descargar Safari para Windows o usar iTunes
2. Habilitar modo desarrollo 
3. Acceder al dispositivo conectado

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

## 🖥️ Comandos de Debugging USB-C

Una vez conectado con Safari Web Inspector, usar estos comandos en la **Console**:

### **Comandos Básicos**
```javascript
// Ver todos los logs formateados
iOSDebug.printLogs()

// Exportar reporte completo
iOSDebug.exportLogs()

// Ver logs en crudo (array)
iOSDebug.getLogs()

// Limpiar logs
iOSDebug.clearLogs()
```

### **Al Abrir la Página por Primera Vez**
El sistema automáticamente muestra en Console:
```
🚨 iOS DEBUG LOGGER ACTIVE
========================
Device: iPhone 15 Series - iOS 16.4

USB-C DEBUGGING COMMANDS:
iOSDebug.printLogs()       - Print all logs to console
iOSDebug.exportLogs()      - Export full report
iOSDebug.getLogs()         - Get raw logs array
iOSDebug.clearLogs()       - Clear all logs

WATCH FOR: Logs with emoji 🔴🟡 before crash
CRITICAL: Look for "About to hide overlay - CRITICAL POINT"
```

### **Si la Página se Recarga/Crash**
Al recargar, la consola muestra:
```
🔄 iOS DEBUG: LOGS FROM PREVIOUS SESSION DETECTED
================================================
This might be from a session that crashed/reloaded.

To view previous logs, run:
iOSDebug.printLogs()
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

## 🔍 Debugging Strategy con USB-C

### **Proceso Paso a Paso:**

1. **Conectar iPhone con cable USB-C**
2. **Habilitar Web Inspector** en iPhone 
3. **Abrir Safari Web Inspector** en Mac/PC
4. **Abrir la página** en iPhone Safari
5. **En Console ejecutar**: `iOSDebug.clearLogs()` para empezar limpio
6. **Reproducir el crash** (introducir contraseña, etc.)
7. **Si la página se recarga**, inmediatamente ejecutar: `iOSDebug.printLogs()`
8. **Copiar los logs** de la consola para análisis

### **Persistencia de Logs:**
- **localStorage**: Logs sobreviven crashes/recargas
- **Console Output**: Logs también en console con emojis para filtrar
- **Remote Logging**: Opcional via endpoint `/api/ios-debug-log`
- **Multi-layer**: Logs en 3 lugares simultáneamente para máxima captura

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

### **Buscar Específicamente:**
```
🔴 - JavaScript errors críticos
🟡 - "CRITICAL POINT" o "CRITICAL ERROR DETECTED"
🟢 - "Applying HARD CUT" seguido de error
🟠 - Tasks >100ms consecutivos
🟣 - Memory warnings

SECUENCIA CRÍTICA:
"Password correct" → "About to hide overlay" → Error en FixedZoom
```

### **Comandos Útiles Console:**
```javascript
// Filtrar solo errores críticos
iOSDebug.getLogs().filter(log => log.type === 'error')

// Ver logs de últimos 10 segundos
iOSDebug.getLogs().filter(log => Date.now() - log.timestamp < 10000)

// Buscar logs específicos de componente
iOSDebug.getLogs().filter(log => log.component === 'FixedZoom')

// Ver memory info si disponible
console.log(performance.memory)
```

## 🛠️ Soluciones Basadas en Logs

Una vez identificado el patrón específico de crash:

1. **Si error en FixedZoom HARD CUT:**
   - Delay adicional antes de applyZoom() en iOS 16-17
   - DOM stability check antes de DOM manipulation

2. **Si error en overlay transition:**
   - Throttle más agresivo en setOverlayVisible
   - Graceful fallback sin animaciones

3. **Si memory pressure:**
   - Reducir número de frames/operaciones simultáneas
   - Cleanup más frecuente de resources

4. **Si performance degradation:**
   - Espaciar más los timeouts/RAF
   - Usar menos requestAnimationFrame consecutivos
