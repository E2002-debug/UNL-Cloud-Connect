import os
import glob

def resolve_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    out_lines = []
    in_conflict = False
    keep_mode = True
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_conflict = True
            keep_mode = True
            continue
        elif line.startswith('======='):
            if in_conflict:
                keep_mode = False
            else:
                out_lines.append(line)
            continue
        elif line.startswith('>>>>>>>'):
            if in_conflict:
                in_conflict = False
                keep_mode = True
            else:
                out_lines.append(line)
            continue
            
        if keep_mode:
            out_lines.append(line)
            
    with open(filepath, 'w') as f:
        f.writelines(out_lines)
        
files_to_fix = [
    'frontend-web/src/pages/Dashboard.jsx',
    'frontend-web/src/pages/Register.jsx',
    'frontend-web/src/pages/Login.jsx',
    'frontend-web/src/pages/Recover.jsx',
    'frontend-web/src/pages/ResetPassword.jsx',
    'backend/ms_gestion_usuarios/app/routers/auth.py'
]

for file in files_to_fix:
    if os.path.exists(file):
        resolve_file(file)
        print(f'Fixed {file}')
