import sqlite3
import json
from datetime import datetime

def explore_cursor_db(db_path):
    print(f"Explorando base de datos: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Primero, veamos qué tablas hay
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"\nTablas encontradas: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Exploremos la tabla ItemTable que típicamente contiene los datos
        print("\n" + "="*50)
        print("Explorando ItemTable...")
        print("="*50)
        
        # Busquemos entradas relacionadas con chat o datos de código
        cursor.execute("""
            SELECT key, LENGTH(value) as value_length 
            FROM ItemTable 
            WHERE key LIKE '%chat%' 
               OR key LIKE '%code%' 
               OR key LIKE '%content%'
               OR key LIKE '%session%'
               OR key LIKE '%conversation%'
            ORDER BY key;
        """)
        
        chat_entries = cursor.fetchall()
        print(f"Entradas relacionadas con chat/código encontradas: {len(chat_entries)}")
        
        for key, length in chat_entries:
            print(f"  Clave: {key} (tamaño: {length} bytes)")
        
        # Intentemos extraer los datos más prometedores
        print("\n" + "="*50)
        print("Extrayendo contenido de chat/código...")
        print("="*50)
        
        # Busquemos las claves más relevantes
        relevant_keys = [key for key, _ in chat_entries if 'chat' in key.lower() or 'conversation' in key.lower()]
        
        for key in relevant_keys[:5]:  # Limitamos a las primeras 5 para no sobrecargar
            print(f"\n--- Contenido de {key} ---")
            cursor.execute("SELECT value FROM ItemTable WHERE key = ?", (key,))
            result = cursor.fetchone()
            
            if result:
                try:
                    # Intentamos decodificar como JSON
                    content = json.loads(result[0])
                    print(f"Tipo: {type(content)}")
                    
                    if isinstance(content, dict):
                        # Si es un diccionario, busquemos campos relevantes
                        for field in ['messages', 'content', 'code', 'text', 'data']:
                            if field in content:
                                print(f"Campo '{field}' encontrado!")
                                field_content = content[field]
                                if isinstance(field_content, str):
                                    # Mostramos los primeros 500 caracteres
                                    preview = field_content[:500]
                                    print(f"Vista previa: {preview}")
                                    if len(field_content) > 500:
                                        print("... (contenido truncado)")
                                elif isinstance(field_content, list):
                                    print(f"Lista con {len(field_content)} elementos")
                                    # Si es una lista de mensajes, mostramos algunos
                                    for i, item in enumerate(field_content[-3:]):  # Últimos 3 elementos
                                        if isinstance(item, dict):
                                            print(f"  Elemento {len(field_content)-3+i+1}: {list(item.keys())}")
                                        else:
                                            print(f"  Elemento {len(field_content)-3+i+1}: {str(item)[:100]}")
                                
                    elif isinstance(content, list):
                        print(f"Lista con {len(content)} elementos")
                        # Mostramos algunos elementos
                        for i, item in enumerate(content[-3:]):
                            print(f"  Elemento {len(content)-3+i+1}: {str(item)[:100]}")
                            
                except json.JSONDecodeError:
                    # Si no es JSON, intentamos mostrarlo como texto
                    text_content = result[0]
                    if isinstance(text_content, bytes):
                        try:
                            text_content = text_content.decode('utf-8')
                        except:
                            text_content = str(text_content)
                    
                    print(f"Contenido de texto (primeros 500 chars): {str(text_content)[:500]}")
                    if len(str(text_content)) > 500:
                        print("... (contenido truncado)")
                except Exception as e:
                    print(f"Error procesando contenido: {e}")
            
            print("-" * 50)
        
        conn.close()
        
    except Exception as e:
        print(f"Error explorando la base de datos: {e}")

def extract_all_chat_data(db_path, output_file):
    """Extrae todos los datos de chat a un archivo para revisión manual"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT key, value 
            FROM ItemTable 
            WHERE key LIKE '%chat%' 
               OR key LIKE '%conversation%'
               OR key LIKE '%session%'
        """)
        
        results = cursor.fetchall()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Datos de chat extraídos el {datetime.now()}\n")
            f.write("="*80 + "\n\n")
            
            for key, value in results:
                f.write(f"CLAVE: {key}\n")
                f.write("-" * 50 + "\n")
                
                try:
                    if isinstance(value, bytes):
                        value = value.decode('utf-8')
                    
                    # Intentar parsear como JSON para mejor formato
                    try:
                        parsed = json.loads(value)
                        f.write(json.dumps(parsed, indent=2, ensure_ascii=False))
                    except:
                        f.write(str(value))
                        
                except Exception as e:
                    f.write(f"Error procesando valor: {e}\n")
                
                f.write("\n" + "="*80 + "\n\n")
        
        print(f"Datos completos extraídos a: {output_file}")
        conn.close()
        
    except Exception as e:
        print(f"Error extrayendo datos: {e}")

if __name__ == "__main__":
    db_path = "state.vscdb"
    
    # Exploración inicial
    explore_cursor_db(db_path)
    
    # Extracción completa para revisión manual
    print("\n" + "="*50)
    print("Extrayendo todos los datos para revisión manual...")
    extract_all_chat_data(db_path, "chat_data_recovery.txt")
    print("="*50) 