import re
import sys

def scope_css(css_content, comment_marker):
    parts = css_content.split(comment_marker, 1)
    if len(parts) < 2:
        return css_content
        
    base_css = parts[0]
    light_css = parts[1]
    
    # We want to process each rule in light_css
    # A rule looks like "selector, selector { styles }"
    
    def process_rule(match):
        selectors = match.group(1).strip()
        body = match.group(2)
        
        # skip media queries
        if selectors.startswith('@media'):
            return f"{selectors} {{{body}}}"
            
        new_selectors = []
        for sel in selectors.split(','):
            sel = sel.strip()
            if not sel: continue
            
            if sel == ':root':
                new_selectors.append('html[data-theme="light"]')
            elif sel == 'body':
                new_selectors.append('html[data-theme="light"] body')
            else:
                new_selectors.append(f'html[data-theme="light"] {sel}')
                
        return ',\n'.join(new_selectors) + ' {' + body + '}'

    # Regex to find CSS rules: matches "selector { body }"
    # Handles simple nesting but assumes no nested rules except @media
    # Wait, simple regex might fail with @media.
    # Actually, it's easier to just use standard regex if there are no nested rules.
    # Let's split by '}' and then by '{'
    
    scoped_css = []
    
    # Split by }
    blocks = light_css.split('}')
    for block in blocks:
        if '{' not in block:
            scoped_css.append(block)
            continue
            
        selectors_str, body = block.split('{', 1)
        selectors_str = selectors_str.strip()
        
        if selectors_str.startswith('@media'):
            # @media query block start
            scoped_css.append(block + '}')
            continue
            
        new_selectors = []
        for sel in selectors_str.split(','):
            sel = sel.strip()
            if not sel: continue
            
            # Remove any comments before the selector
            comment_prefix = ''
            if '/* ' in sel:
                # Naive comment extraction
                pass
            
            if sel == ':root':
                new_selectors.append('html[data-theme="light"]')
            elif sel == 'body':
                new_selectors.append('html[data-theme="light"] body')
            else:
                new_selectors.append(f'html[data-theme="light"] {sel}')
                
        scoped_css.append(',\n'.join(new_selectors) + ' {' + body + '}')
        
    return base_css + comment_marker + ''.join(scoped_css)

files = [
    ('src/css/landing.css', '/* Light minimal theme */'),
    ('src/css/auth.css', '/* Light minimal theme */'),
    ('src/css/dashboard.css', '/* Light dashboard theme */'),
    ('src/css/tracker.css', '/* Nardo light theme */')
]

for file_path, marker in files:
    with open(file_path, 'r', encoding='utf8') as f:
        content = f.read()
    new_content = scope_css(content, marker)
    with open(file_path, 'w', encoding='utf8') as f:
        f.write(new_content)
    print(f"Processed {file_path}")
