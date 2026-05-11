
import sys

def count_tokens(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    backticks = content.count('`')
    braces_open = content.count('{')
    braces_close = content.count('}')
    parens_open = content.count('(')
    parens_close = content.count(')')
    
    print(f"Backticks: {backticks} (Odd means error)")
    print(f"Braces: {braces_open} open, {braces_close} close")
    print(f"Parens: {parens_open} open, {parens_close} close")

if __name__ == "__main__":
    count_tokens(sys.argv[1])
