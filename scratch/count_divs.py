
with open(r'c:\Users\Administrator\Desktop\ALFAZA CELL\alfaza-link-official\src\pages\laporan.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

open_divs = content.count('<div')
close_divs = content.count('</div>')

print(f"Open: {open_divs}")
print(f"Close: {close_divs}")
