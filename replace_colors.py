import os, re
colors = {
    r'#b0a2ff': '#6C47FF',
    r'176, 162, 255': '108, 71, 255',
    r'176,162,255': '108,71,255',
    r'#7556ff': '#4E2CD8',
    r'#a391ff': '#5A3BE5',
    r'#d2b7ff': '#9B82FF'
}
for root, dirs, files in os.walk('c:/GAPMINER/apps/web/src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for k, v in colors.items():
                content = re.sub(k, v, content, flags=re.IGNORECASE)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Updated {path}')
