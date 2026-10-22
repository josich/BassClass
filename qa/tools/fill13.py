"""QA (1e91dad): which completed lessons would reopen after the load-time count fill.

Usage: python -I qa/tools/fill13.py <new-commit> <old-commit> [<old-commit> ...]
A done record without `n`/`c` was written by a version before bbb984b. On load (1e91dad) it gets
COUNTS_V143[id] if listed, else the CURRENT counts. The record really covered the counts the lesson
had when it was completed (at the old commit). The lesson reopens when the filled count is larger
than that (a step or "I can" line it never had must now be clean / ticked). Prints every such lesson
per old commit. Lessons that did not exist at the old commit cannot have such a record.
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
    r = subprocess.run(['git', 'show', f'{commit}:{path}'], capture_output=True, text=True, encoding='utf-8')
    return r.stdout


def at(commit):
    s, c = {}, {}
    for n in range(1, 7):
        a, b = counts_of(git(commit, f'web/js/course/stages/s{n}.js'))
        s.update(a)
        c.update(b)
    return s, c


new = sys.argv[1]
ns, nc = at(new)
prog = git(new, 'web/js/course/progress.js')
m = re.search(r"const COUNTS_V143 = \{(.*?)\};", prog, re.S)
table = {k: (int(a), int(b)) for k, a, b in re.findall(r"'([\w-]+)': \[(\d+), (\d+)\]", m.group(1))} if m else {}
print(f'{len(table)} lessons in COUNTS_V143 at {new}')
for old in sys.argv[2:]:
    os_, oc = at(old)
    bad, lenient = [], []
    for lid in os_:
        if lid not in ns:
            continue
        fill = table.get(lid, (ns[lid], nc.get(lid, 0)))
        had = (os_[lid], oc.get(lid, 0))
        if fill[0] > had[0] or fill[1] > had[1]:
            bad.append(f"{lid} had {had} filled {fill}{' (table)' if lid in table else ' (current)'}")
        elif lid in table and (fill[0] < had[0] or fill[1] < had[1]):
            lenient.append(f"{lid} had {had} table {fill}")
    print(f'--- records written at {old}: {len(bad)} would reopen')
    for b in bad:
        print('  REOPEN', b)
    for x in lenient:
        print('  (lenient)', x)
