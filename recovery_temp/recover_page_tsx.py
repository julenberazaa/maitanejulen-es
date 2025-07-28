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
        
        # Buscar menciones a page.tsx
        if 'page.tsx' in content.lower() or 'page.tsx' in desc.lower():
            # Extraer código de page.tsx si está presente
            page_tsx_code = extract_page_tsx_code(content)
            if page_tsx_code:
                page_tsx_versions.append({
                    'source': 'generation',
                    'index': i,
                    'timestamp': timestamp,
                    'description': desc,
                    'code': page_tsx_code,
                    'code_length': len(page_tsx_code)
                })
                print(f'  ✅ Generación {i}: {len(page_tsx_code)} chars - {desc[:50]}...')
    
    # 2. Buscar en datos del compositor
    print('\n📝 ANALIZANDO DATOS DEL COMPOSITOR...')
    if 'allComposers' in composer_data:
        composers = composer_data['allComposers']
        
        for composer_id, composer_info in composers.items():
            if isinstance(composer_info, dict) and 'tabs' in composer_info:
                tabs = composer_info['tabs']
                
                for tab_id, tab_info in tabs.items():
                    # Buscar tabs relacionados con page.tsx
                    if 'page.tsx' in tab_id.lower():
                        print(f'  📁 Tab encontrado: {tab_id}')
                        
                        if 'diffs' in tab_info:
                            diffs = tab_info['diffs']
                            
                            for diff_idx, diff in enumerate(diffs):
                                if isinstance(diff, dict):
                                    # Verificar timestamp del diff
                                    diff_timestamp = diff.get('timestamp', diff.get('unixMs', 0))
                                    if diff_timestamp > target_timestamp:
                                        continue
                                    
                                    diff_content = diff.get('diff', diff.get('content', ''))
                                    if diff_content and len(str(diff_content)) > 100:
                                        page_tsx_versions.append({
                                            'source': 'composer_diff',
                                            'composer_id': composer_id,
                                            'tab_id': tab_id,
                                            'diff_index': diff_idx,
                                            'timestamp': diff_timestamp,
                                            'code': str(diff_content),
                                            'code_length': len(str(diff_content))
                                        })
                                        print(f'    ✅ Diff {diff_idx}: {len(str(diff_content))} chars')
    
    # 3. Ordenar por cantidad de código (descendente)
    page_tsx_versions.sort(key=lambda x: x['code_length'], reverse=True)
    
    print(f'\n🎯 ENCONTRADAS {len(page_tsx_versions)} VERSIONES DE page.tsx')
    print('=' * 80)
    
    # Mostrar las 5 versiones con más código
    for i, version in enumerate(page_tsx_versions[:5]):
        print(f'\n=== VERSIÓN {i+1} (más código) ===')
        print(f'Fuente: {version["source"]}')
        print(f'Tamaño: {version["code_length"]} caracteres')
        
        if version['timestamp']:
            readable_time = datetime.fromtimestamp(version['timestamp'] / 1000)
            print(f'Timestamp: {readable_time}')
        
        if version['source'] == 'generation':
            print(f'Generación: {version["index"]}')
            print(f'Descripción: {version["description"][:100]}...')
        else:
            print(f'Compositor: {version["composer_id"]}')
            print(f'Tab: {version["tab_id"]}')
        
        # Guardar la versión completa
        filename = f'page_tsx_version_{i+1}_{version["source"]}.tsx'
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(version['code'])
        
        print(f'💾 Guardado en: {filename}')
        
        # Mostrar preview
        preview = version['code'][:500]
        print(f'Vista previa:\n{preview}...')
        print('-' * 80)
    
    # Guardar la versión con más código como la "recuperada"
    if page_tsx_versions:
        best_version = page_tsx_versions[0]
        with open('page_tsx_RECOVERED.tsx', 'w', encoding='utf-8') as f:
            f.write(best_version['code'])
        
        print(f'\n🎉 ¡VERSIÓN CON MÁS CÓDIGO RECUPERADA!')
        print(f'💾 Guardada como: page_tsx_RECOVERED.tsx')
        print(f'📊 Tamaño: {best_version["code_length"]} caracteres')
        
        return best_version
    else:
        print('❌ No se encontraron versiones de page.tsx antes del timestamp especificado')
        return None

def extract_page_tsx_code(content):
    """Extrae código de page.tsx del contenido"""
    # Buscar bloques de código que parezcan ser page.tsx
    
    # Patrón 1: Bloques de código TypeScript/React
    tsx_patterns = [
        r'```(?:tsx|typescript|ts)\s*([\s\S]*?)```',
        r'```\s*(export\s+default\s+function[\s\S]*?)```',
        r'```\s*(import[\s\S]*?export\s+default[\s\S]*?)```'
    ]
    
    for pattern in tsx_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            if ('export default' in match and 'function' in match) or 'return (' in match:
                return match.strip()
    
    # Patrón 2: Si el contenido completo parece ser código TSX
    if ('export default' in content and 'function' in content) or \
       ('import' in content and 'return (' in content):
        return content.strip()
    
    return None

if __name__ == "__main__":
    recover_page_tsx() 