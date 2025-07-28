import json
import re
from datetime import datetime

def recover_page_tsx():
    print('🔍 BUSCANDO VERSIONES DE page.tsx ANTES DE LAS 15:00 DEL 28/07/2025')
    print('=' * 80)
    
    target_timestamp = 1753726800000  # 28/07/2025 15:00 en milisegundos Unix
    
    # Cargar generaciones
    with open('aiService_generations_recovery.json', 'r', encoding='utf-8') as f:
        generations = json.load(f)
    
    # Cargar datos del compositor
    with open('composer_composerData_recovery.json', 'r', encoding='utf-8') as f:
        composer_data = json.load(f)
    
    page_tsx_versions = []
    
    # 1. Buscar en generaciones
    print('\n📋 ANALIZANDO GENERACIONES...')
    for i, gen in enumerate(generations):
        # Verificar timestamp si existe
        timestamp = gen.get('unixMs', 0)
        if timestamp > target_timestamp:
            continue
            
        content = gen.get('content', gen.get('text', ''))
        desc = gen.get('textDescription', '')
        
        # Buscar menciones a page.tsx o código TSX/React
        if ('page.tsx' in content.lower() or 'page.tsx' in desc.lower() or 
            ('export default' in content and 'function' in content) or
            ('import' in content and 'return (' in content and 'tsx' in content.lower())):
            
            # Extraer código de page.tsx si está presente
            page_tsx_code = extract_page_tsx_code(content)
            if page_tsx_code and len(page_tsx_code) > 100:  # Solo código significativo
                page_tsx_versions.append({
                    'source': 'generation',
                    'index': i,
                    'timestamp': timestamp,
                    'description': desc,
                    'code': page_tsx_code,
                    'code_length': len(page_tsx_code)
                })
                readable_time = datetime.fromtimestamp(timestamp / 1000) if timestamp else "Sin timestamp"
                print(f'  ✅ Generación {i}: {len(page_tsx_code)} chars - {readable_time} - {desc[:50]}...')
    
    # 2. Buscar en datos del compositor
    print('\n📝 ANALIZANDO DATOS DEL COMPOSITOR...')
    if 'allComposers' in composer_data:
        composers_list = composer_data['allComposers']
        print(f'  Encontrados {len(composers_list)} compositores')
        
        for composer in composers_list:
            if isinstance(composer, dict):
                composer_id = composer.get('composerId', 'unknown')
                composer_name = composer.get('name', 'Sin nombre')
                last_updated = composer.get('lastUpdatedAt', 0)
                
                # Solo procesar compositores actualizados antes del timestamp objetivo
                if last_updated > target_timestamp:
                    continue
                
                print(f'  📝 Compositor: {composer_name} (ID: {composer_id[:8]}...)')
                readable_time = datetime.fromtimestamp(last_updated / 1000) if last_updated else "Sin fecha"
                print(f'      Última actualización: {readable_time}')
                
                # Buscar tabs en el compositor - necesitamos cargar desde otra fuente
                # Los datos de tabs pueden estar en una estructura diferente
    
    # 3. Buscar en todas las generaciones patrones de código TSX extenso
    print('\n🔍 BUSCANDO CÓDIGO TSX EXTENSO EN TODAS LAS GENERACIONES...')
    for i, gen in enumerate(generations):
        timestamp = gen.get('unixMs', 0)
        if timestamp > target_timestamp:
            continue
            
        content = gen.get('content', gen.get('text', ''))
        desc = gen.get('textDescription', '')
        
        # Buscar código extenso que parezca ser componente React
        if len(content) > 500 and is_likely_page_tsx(content):
            page_tsx_versions.append({
                'source': 'generation_tsx',
                'index': i,
                'timestamp': timestamp,
                'description': desc,
                'code': content,
                'code_length': len(content)
            })
            readable_time = datetime.fromtimestamp(timestamp / 1000) if timestamp else "Sin timestamp"
            print(f'  ✅ Código TSX extenso {i}: {len(content)} chars - {readable_time}')
    
    # 4. Ordenar por cantidad de código (descendente)
    page_tsx_versions.sort(key=lambda x: x['code_length'], reverse=True)
    
    print(f'\n🎯 ENCONTRADAS {len(page_tsx_versions)} VERSIONES CON CÓDIGO')
    print('=' * 80)
    
    # Mostrar las 5 versiones con más código
    for i, version in enumerate(page_tsx_versions[:5]):
        print(f'\n=== VERSIÓN {i+1} (más código) ===')
        print(f'Fuente: {version["source"]}')
        print(f'Tamaño: {version["code_length"]} caracteres')
        
        if version['timestamp']:
            readable_time = datetime.fromtimestamp(version['timestamp'] / 1000)
            print(f'Timestamp: {readable_time}')
        
        if 'index' in version:
            print(f'Generación: {version["index"]}')
        
        if 'description' in version:
            desc = version['description']
            print(f'Descripción: {desc[:100]}{"..." if len(desc) > 100 else ""}')
        
        # Guardar la versión completa
        filename = f'page_tsx_version_{i+1}_{version["source"]}.tsx'
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(version['code'])
        
        print(f'💾 Guardado en: {filename}')
        
        # Mostrar preview de las primeras líneas significativas
        lines = version['code'].split('\n')
        significant_lines = [line for line in lines[:20] if line.strip() and not line.strip().startswith('//')]
        preview = '\n'.join(significant_lines[:10])
        print(f'Vista previa:\n{preview}')
        print('-' * 80)
    
    # Guardar la versión con más código como la "recuperada"
    if page_tsx_versions:
        best_version = page_tsx_versions[0]
        with open('page_tsx_RECOVERED.tsx', 'w', encoding='utf-8') as f:
            f.write(best_version['code'])
        
        print(f'\n🎉 ¡VERSIÓN CON MÁS CÓDIGO RECUPERADA!')
        print(f'💾 Guardada como: page_tsx_RECOVERED.tsx')
        print(f'📊 Tamaño: {best_version["code_length"]} caracteres')
        
        if best_version['timestamp']:
            readable_time = datetime.fromtimestamp(best_version['timestamp'] / 1000)
            print(f'🕐 Fecha: {readable_time}')
        
        return best_version
    else:
        print('❌ No se encontraron versiones de código antes del timestamp especificado')
        return None

def extract_page_tsx_code(content):
    """Extrae código de page.tsx del contenido"""
    # Patrón 1: Bloques de código TypeScript/React en markdown
    tsx_patterns = [
        r'```(?:tsx|typescript|ts|javascript|jsx)\s*([\s\S]*?)```',
        r'```\s*(export\s+default\s+function[\s\S]*?)```',
        r'```\s*(import[\s\S]*?export\s+default[\s\S]*?)```'
    ]
    
    for pattern in tsx_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            if (('export default' in match and 'function' in match) or 
                ('return (' in match or 'return(' in match) or
                ('import' in match and len(match) > 200)):
                return match.strip()
    
    # Patrón 2: Si el contenido completo parece ser código TSX
    if is_likely_page_tsx(content):
        return content.strip()
    
    return None

def is_likely_page_tsx(content):
    """Determina si el contenido es probablemente código de page.tsx"""
    indicators = [
        'export default function',
        'export default',
        'import React',
        'import {',
        'from \'react\'',
        'from "react"',
        'return (',
        'return(',
        '<div',
        'className=',
        'useState',
        'useEffect'
    ]
    
    score = sum(1 for indicator in indicators if indicator in content)
    
    # También verificar que no sea solo texto o documentación
    has_jsx_like = any(tag in content for tag in ['<div', '<span', '<p', '<h1', '<h2', '<section', '<main'])
    has_function_structure = 'function' in content and ('return' in content or '{' in content)
    
    return score >= 3 and (has_jsx_like or has_function_structure) and len(content) > 100

if __name__ == "__main__":
    recover_page_tsx() 