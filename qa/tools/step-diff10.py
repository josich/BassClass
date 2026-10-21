"""QA (341ccfe): course steps changed in place between two commits.

Usage: python -I qa/tools/step-diff10.py <old-commit> <new-commit>
Reads web/js/course/stages/s1..s6.js at both commits (git show), lists each lesson's steps by index
(the stored key "<lesson>.<i>") and prints every step whose exercise, preset options (p) or notes
per beat (sub) differ, every step removed, and how many were appended. Text-only changes (do, from,
goal) are listed separately.
"""
import re
import subprocess
import sys

STEP = re.compile(r"^\s*\{ ex: '([^']+)'(.*)\},?\s*$")


def field(rest, name):
    m = re.search(name + r": (\{[^}]*\}|'(?:[^'\\]|\\.)*'|[\w.]+)", rest)
    return m.group(1) if m else None


def steps_of(text):
    out = {}
    stage = unit = cur = None
    for line in text.splitlines():
        ind = len(line) - len(line.lstrip(' '))
        m = re.match(r"^\s*id: '([^']+)'", line)
        if m:
            if ind == 2:
                stage = m.group(1)
            elif ind == 6:
                unit = m.group(1)
            elif ind == 10:
                cur = m.group(1)
            continue
        if re.match(r"^\s*check: \{", line):
            cur = f"{unit}-check" if ind == 6 else f"{stage}-test"
            continue
        m = STEP.match(line)
        if m and cur:
            rest = m.group(2)
            out.setdefault(cur, []).append({
                'ex': m.group(1), 'p': field(rest, 'p'), 'sub': field(rest, 'sub'),
                'from': field(rest, 'from'), 'goal': field(rest, 'goal'), 'backing': field(rest, 'backing'),
            })
    return out


def at(commit):
    allsteps = {}
    for n in range(1, 7):
        txt = subprocess.run(['git', 'show', f'{commit}:web/js/course/stages/s{n}.js'], capture_output=True, text=True, encoding='utf-8').stdout
        allsteps.update(steps_of(txt))
    return allsteps


old, new = at(sys.argv[1]), at(sys.argv[2])
changed, tempo, removed, appended = [], [], [], 0
for lid, st in old.items():
    ns = new.get(lid)
    if ns is None:
        removed.append(f'{lid} (lesson gone)')
        continue
    for i, s in enumerate(st):
        if i >= len(ns):
            removed.append(f'{lid}.{i}')
            continue
        t = ns[i]
        if (s['ex'], s['p'], s['sub']) != (t['ex'], t['p'], t['sub']):
            changed.append(f"{lid}.{i}: {s['ex']} p={s['p']} sub={s['sub']}  ->  {t['ex']} p={t['p']} sub={t['sub']}")
        elif (s['from'], s['goal'], s['backing']) != (t['from'], t['goal'], t['backing']):
            tempo.append(f"{lid}.{i}: from/goal/backing {s['from']}/{s['goal']}/{s['backing']} -> {t['from']}/{t['goal']}/{t['backing']}")
    appended += max(0, len(ns) - len(st))
print(f'lessons old {len(old)} new {len(new)}; steps old {sum(map(len, old.values()))} new {sum(map(len, new.values()))}; appended {appended}')
print(f'\nCHANGED IN PLACE ({len(changed)}):')
print('\n'.join(changed))
print(f'\nTEMPO/BACKING ONLY ({len(tempo)}):')
print('\n'.join(tempo))
print(f'\nREMOVED ({len(removed)}):')
print('\n'.join(removed))
