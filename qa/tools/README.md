Scripts written by the QA agents (monkey runs, checkers). Not part of the app.
- engrave-check2.js (d25bf3c): staff checker for TPQ 3360 (compound 12/8, fill rests, circled ghost / open diamond heads, seconds on both stem sides, accidental collisions).
- walk-check.js (d25bf3c): walking / groove / slap line rules (approach resolution and spelling, leaps, two-feel, 2-beat chord tones, 5th approach).
- monkey7.js (d25bf3c): monkey6 plus a dispatched scroll event after strip scrolls and a visible-strip glyph check.
- monkey8.js (91ad82b): monkey7 plus the guided Course (course block, session, map, lesson steps, goal button, placement); checks Back never leaves the app (Navigation API index vs history.state.depth) and that lesson steps never write the exercise's params/lastBpm or the Backing setting.
