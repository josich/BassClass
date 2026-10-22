"""QA (4c593d9): lessons whose steps or "I can" lines grew between two commits.

Usage: python -I qa/tools/grown12.py <old-commit> <new-commit>
For each lesson, unit checkpoint and stage test (same parsing as step-diff10.py) prints the step and
"I can" counts at both commits when either grew, and whether `COUNTS_V143` in course/progress.js (at the
new commit) lists it. A done record without `n`/`c` (completed before bbb984b shipped) falls back to
COUNTS_V143, else to the CURRENT counts: such a lesson reopens when it grew and is not listed.
"""
import re
import subprocess
import sys

STEP = re.compile(r"^\s*\{ ex: '([^']+)'")


def counts_of(text):
    steps, cans = {}, {}
    stage = unit = cur = None
    in_can = False
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
            in_can = False
            continue
        if re.match(r"^\s*check: \{", line):
            cur = f"{unit}-check" if ind == 6 else f"{stage}-test"
            in_can = False
            continue
        if re.match(r"^\s*can: \[", line):
            in_can = True
            continue
        if in_can:
            if re.match(r"^\s*\],?\s*$", line):
                in_can = False
            elif re.match(r"^\s*'", line) and cur:
                cans[cur] = cans.get(cur, 0) + 1
            continue
        if STEP.match(line) and cur:
            steps[cur] = steps.get(cur, 0) + 1
    return steps, cans


def git(commit, path):
    return subprocess.run(['git', 'show', f'{commit}:{path}'], capture_output=True, text=True, encoding='utf-8').stdout


def at(commit):
    s, c = {}, {}
    for n in range(1, 7):
        a, b = counts_of(git(commit, f'web/js/course/stages/s{n}.js'))
        s.update(a)
        c.update(b)
    return s, c


(os_, oc), (ns, nc) = at(sys.argv[1]), at(sys.argv[2])
prog = git(sys.argv[2], 'web/js/course/progress.js')
m = re.search(r"const COUNTS_V143 = \{(.*?)\};", prog, re.S)
listed = set(re.findall(r"'([\w-]+)': \[", m.group(1))) if m else set()
rows = []
for lid in ns:
    if lid not in os_:
        rows.append((lid, 'NEW LESSON', '', ''))
        continue
    if ns[lid] > os_[lid] or nc.get(lid, 0) > oc.get(lid, 0):
        rows.append((lid, f"steps {os_[lid]}->{ns[lid]}", f"can {oc.get(lid, 0)}->{nc.get(lid, 0)}", 'listed' if lid in listed else 'NOT LISTED'))
print(f'{len(rows)} lessons grew or are new')
for r in rows:
    print('  '.join(r))
