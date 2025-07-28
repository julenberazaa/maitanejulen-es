import json
import re

def extract_code_generations():
    # Cargar generaciones
    with open('aiService_generations_recovery.json', 'r', encoding='utf-8') as f:
        generations = json.load(f)
    
    print('🔍 BUSCANDO GENERACIONES CON CÓDIGO...')
    print('=' * 80)
    
    code_generations = []
    
    for i, gen in enumerate(generations):
        content = gen.get('content', gen.get('text', ''))
        if not content:
            continue
            
        # Buscar generaciones que contengan código
        if any(keyword in content.lower() for keyword in ['function', 'const', 'class', 'import', 'export', 'css', 'html', 'jsx', 'tsx', '.tsx', '.css', '.js']):
            code_generations.append((i, gen))
    
    print(f'Encontradas {len(code_generations)} generaciones con código')
    
    # Mostrar las últimas 10 generaciones con código (antes de la recuperación)
    recent_code_gens = [g for g in code_generations if g[0] < 98]  # Antes del prompt de recuperación
    
    print(f'\n🤖 ÚLTIMAS {min(10, len(recent_code_gens))} GENERACIONES CON CÓDIGO:')
    print('=' * 80)
    
    for i, (gen_idx, gen) in enumerate(recent_code_gens[-10:]):
        content = gen.get('content', gen.get('text', ''))
        desc = gen.get('textDescription', f'Generación {gen_idx}')
        
        print(f'\n=== GENERACIÓN {gen_idx} ===')
        print(f'Descripción: {desc[:100]}...' if len(desc) > 100 else f'Descripción: {desc}')
        
        # Guardar contenido completo en archivo
        filename = f'generation_{gen_idx}_code.txt'
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f'GENERACIÓN {gen_idx}\n')
            f.write('=' * 50 + '\n')
            f.write(f'Descripción: {desc}\n')
            f.write('=' * 50 + '\n\n')
            f.write(content)
        
        # Mostrar preview
        if len(content) > 1000:
            print(f'Vista previa (primeros 500 chars): {content[:500]}...')
            print(f'💾 Contenido completo guardado en: {filename}')
        else:
            print(f'Contenido completo: {content}')
        
        print('-' * 80)

def extract_composer_data():
    print('\n\n📝 ANALIZANDO DATOS DEL COMPOSITOR...')
    print('=' * 80)
    
    with open('composer_composerData_recovery.json', 'r', encoding='utf-8') as f:
        composer_data = json.load(f)
    
    print(f'Estructura del compositor:')
    for key, value in composer_data.items():
        if isinstance(value, dict):
            print(f'  - {key}: diccionario con {len(value)} elementos')
        elif isinstance(value, list):
            print(f'  - {key}: lista con {len(value)} elementos')
        else:
            print(f'  - {key}: {type(value).__name__}')
    
    # Si hay datos de compositores, extraerlos
    if 'allComposers' in composer_data:
        composers = composer_data['allComposers']
        print(f'\nCompositores encontrados: {list(composers.keys()) if composers else "ninguno"}')
        
        for composer_id, composer_info in composers.items():
            if isinstance(composer_info, dict) and 'tabs' in composer_info:
                tabs = composer_info['tabs']
                print(f'\nCompositor {composer_id}: {len(tabs)} tabs')
                
                for tab_id, tab_info in tabs.items():
                    if 'diffs' in tab_info:
                        diffs = tab_info['diffs']
                        print(f'  Tab {tab_id}: {len(diffs)} diffs')
                        
                        # Guardar diffs importantes
                        for diff_idx, diff in enumerate(diffs):
                            if isinstance(diff, dict) and 'diff' in diff:
                                diff_content = diff['diff']
                                if len(diff_content) > 100:  # Solo diffs significativos
                                    filename = f'composer_diff_{composer_id}_{tab_id}_{diff_idx}.txt'
                                    with open(filename, 'w', encoding='utf-8') as f:
                                        f.write(f'DIFF DEL COMPOSITOR\n')
                                        f.write('=' * 50 + '\n')
                                        f.write(f'Compositor: {composer_id}\n')
                                        f.write(f'Tab: {tab_id}\n')
                                        f.write(f'Diff índice: {diff_idx}\n')
                                        f.write('=' * 50 + '\n\n')
                                        f.write(str(diff_content))
                                    print(f'    💾 Diff guardado en: {filename}')

if __name__ == "__main__":
    extract_code_generations()
    extract_composer_data()
    
    print('\n🎉 ¡EXTRACCIÓN DE CÓDIGO COMPLETADA!')
    print('=' * 80)
    print('Revisa los archivos generados para encontrar tu código perdido.') 