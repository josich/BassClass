"""QA (341ccfe): every unit checkpoint and stage test, its "I can" lines next to its steps.

Usage: python -I qa/tools/checks10.py [commit]   (default: the working tree)
Flags checkpoints whose number of "I can" lines differs from their number of steps.
"""
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')
commit = sys.argv[1] if len(sys.argv) > 1 else None


def read(n):
    if commit:
        return subprocess.run(['git', 'show', f'{commit}:web/js/course/stages/s{n}.js'], capture_output=True, text=True, encoding='utf-8').stdout
    return open(f'web/js/course/stages/s{n}.js', encoding='utf-8').read()


total = mism = 0
for n in range(1, 7):
    txt = read(n).splitlines()
    stage = unit = None
    i = 0
    while i < len(txt):
        line = txt[i]
        ind = len(line) - len(line.lstrip(' '))
        m = re.match(r"^\s*id: '([^']+)'", line)
        if m:
            if ind == 2:
                stage = m.group(1)
            elif ind == 6:
                unit = m.group(1)
        if re.match(r"^\s*check: \{", line):
            cid = f"{unit}-check" if ind == 6 else f"{stage}-test"
            can, steps, mode, j = [], [], None, i + 1
            while j < len(txt) and not (len(txt[j]) - len(txt[j].lstrip(' ')) == ind and txt[j].strip().startswith('}')):
                t = txt[j].strip()
                if t.startswith('can:'):
                    mode = 'can'
                elif t.startswith('steps:'):
                    mode = 'steps'
                elif mode == 'can' and t.startswith("'"):
                    can.append(t.strip(',').strip("'"))
                elif mode == 'steps' and t.startswith('{ ex:'):
                    m2 = re.match(r"\{ ex: '([^']+)', p: (\{[^}]*\})", t)
                    steps.append(f"{m2.group(1)} {m2.group(2)}" if m2 else t[:80])
                j += 1
            total += 1
            flag = ''
            if len(can) != len(steps):
                mism += 1
                flag = f'  <-- {len(can)} can / {len(steps)} steps'
            print(f"{cid}:{flag}")
            for k in range(max(len(can), len(steps))):
                print(f"   {k}: {can[k] if k < len(can) else '-'}  ||  {steps[k] if k < len(steps) else '-'}")
            i = j
        i += 1
print(f'\n{total} checkpoints/tests, {mism} with a different number of "I can" lines and steps')
