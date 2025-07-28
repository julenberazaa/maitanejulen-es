import json

def show_recent_prompts():
    with open('aiService_prompts_recovery.json', 'r', encoding='utf-8') as f:
        prompts = json.load(f)
    
    print('🔍 ÚLTIMOS 15 PROMPTS (antes del restore checkpoint):')
    print('=' * 80)
    
    for i, prompt in enumerate(prompts[-15:], len(prompts)-14):
        text = prompt.get('text', '').strip()
        if len(text) > 300:
            text = text[:300] + '...'
        
        print(f'\n{i:3d}: {text}')
        print('-' * 80)

if __name__ == "__main__":
    show_recent_prompts() 