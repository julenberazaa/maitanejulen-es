import sqlite3
import json
from datetime import datetime

def extract_critical_data():
    conn = sqlite3.connect('state.vscdb')
    cursor = conn.cursor()
    
    # Los datos más importantes para recuperar el trabajo
    important_keys = ['aiService.prompts', 'composer.composerData', 'aiService.generations']
    
    print("🔍 EXTRAYENDO DATOS CRÍTICOS PARA RECUPERACIÓN...")
    print("=" * 60)
    
    for key in important_keys:
        print(f'\n=== EXTRAYENDO: {key} ===')
        cursor.execute('SELECT value FROM ItemTable WHERE key = ?', (key,))
        result = cursor.fetchone()
        
        if result:
            try:
                data = json.loads(result[0])
                
                # Guardar en archivo separado
                filename = f'{key.replace(".", "_")}_recovery.json'
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f'✅ Datos guardados en: {filename}')
                
                # Mostrar vista previa de la estructura
                if isinstance(data, dict):
                    print(f'📊 Tipo: Diccionario con {len(data)} claves')
                    for k in list(data.keys())[:10]:  # Primeras 10 claves
                        print(f'  - {k}')
                    if len(data) > 10:
                        print(f'  ... y {len(data)-10} claves más')
                        
                elif isinstance(data, list):
                    print(f'📊 Tipo: Lista con {len(data)} elementos')
                    if len(data) > 0:
                        print(f'Primer elemento: {type(data[0])}')
                        if isinstance(data[0], dict) and len(data[0]) > 0:
                            first_keys = list(data[0].keys())[:5]
                            print(f'Claves del primer elemento: {first_keys}')
                
                # Si es aiService.prompts, mostrar algunos ejemplos
                if key == 'aiService.prompts' and isinstance(data, list):
                    print("\n🔍 VISTA PREVIA DE PROMPTS:")
                    for i, prompt in enumerate(data[-3:]):  # Últimos 3 prompts
                        if isinstance(prompt, dict):
                            prompt_text = prompt.get('text', prompt.get('content', str(prompt)[:100]))
                            print(f"  Prompt {len(data)-3+i+1}: {str(prompt_text)[:200]}...")
                        else:
                            print(f"  Prompt {len(data)-3+i+1}: {str(prompt)[:200]}...")
                
                # Si es aiService.generations, mostrar algunos ejemplos
                if key == 'aiService.generations' and isinstance(data, list):
                    print("\n🤖 VISTA PREVIA DE GENERACIONES:")
                    for i, gen in enumerate(data[-3:]):  # Últimas 3 generaciones
                        if isinstance(gen, dict):
                            gen_text = gen.get('text', gen.get('content', str(gen)[:100]))
                            print(f"  Generación {len(data)-3+i+1}: {str(gen_text)[:200]}...")
                        else:
                            print(f"  Generación {len(data)-3+i+1}: {str(gen)[:200]}...")
                            
            except Exception as e:
                print(f'❌ Error procesando {key}: {e}')
                # Guardar como texto raw
                filename = f'{key.replace(".", "_")}_recovery_raw.txt'
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(str(result[0]))
                print(f'📄 Datos guardados como texto en: {filename}')
        else:
            print(f'❌ No se encontraron datos para: {key}')
    
    conn.close()
    print('\n🎉 ¡EXTRACCIÓN COMPLETADA!')
    print('=' * 60)
    print('📂 Archivos generados:')
    import os
    for filename in os.listdir('.'):
        if filename.endswith('_recovery.json') or filename.endswith('_recovery_raw.txt'):
            size = os.path.getsize(filename)
            print(f'  - {filename} ({size:,} bytes)')

if __name__ == "__main__":
    extract_critical_data() 