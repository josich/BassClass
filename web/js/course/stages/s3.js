// Course Stage 3: Harmony on the neck (Level 3). See ../data.js for the format.
export default {
  id: 's3', title: 'Harmony on the neck', level: 3,
  desc: 'Legato and shifts, 16th-note funk, every note in every position, scales over two octaves and in sequences, the modes, the triads and 7th chords of every key, and lines that move between chords.',
  units: [
    {
      id: 'u-legato', title: 'Legato and shifts',
      goal: 'Hammer-ons, pull-offs, clean shifts and string skips.',
      lessons: [
        {
          id: 'trills', title: 'Hammer-ons and pull-offs',
          idea: 'One pluck, several notes: the fretting hand plays the rest.',
          concept: [
            'A hammer-on sounds a higher note by bringing a fretting finger down firmly onto the string; a pull-off sounds a lower one by pulling the finger off sideways, so it plucks the string as it leaves. Only the first note of each group is plucked.',
            'The aim is evenness: hammered and pulled notes as loud as the plucked one. Hammer from close to the string: precision beats force.',
          ],
          steps: [
            { ex: 'tech-trills', p: { pair: '12', pos: '5' }, sub: 2, from: 60, goal: 88, do: 'Fingers 1 and 2 at fret 5. Pluck the first note only, then let the fretting hand do the rest.' },
            { ex: 'tech-trills', p: { pair: '34', pos: '5' }, sub: 2, from: 56, goal: 80, do: 'Fingers 3 and 4, the weakest pair. Keep the hammered notes as loud as the plucked one.' },
          ],
          mistakes: [
            'Plucking every note. Only the first note of each group is plucked.',
            'Lifting the finger straight up for a pull-off: the note dies. Pull slightly sideways, towards the floor.',
          ],
        },
        {
          id: 'legato', title: 'Legato runs',
          idea: 'One pluck per string going up, pull-offs coming down.',
          concept: [
            'Legato chromatic: pluck only the first note on each string and hammer on the other three on the way up; on the way down, pluck the top note and pull off three times. It builds a strong fretting hand and the smooth phrasing of fusion and solo bass.',
            'Listen for dips in volume: the third and fourth hammered notes are the ones that fade.',
          ],
          steps: [
            { ex: 'tech-legato', p: { pos: '5' }, sub: 2, from: 56, goal: 84, do: 'One pluck per string. Every hammered and pulled note at the same volume as the plucked one.' },
          ],
          mistakes: [
            'Hammering from far away. Close and precise is louder than far and forceful.',
            'The last string ringing on when you move to the next. Mute it with the plucking hand.',
          ],
        },
        {
          id: 'shifts', title: 'Shifting along a string',
          idea: 'Move the whole hand, thumb included, on the last note before the shift.',
          concept: [
            'Smooth lines depend on clean shifts. Play 1-2-3-4, then move the whole hand so the index lands on the next group, and carry on up the string and back. Slide on the finger that just played, with light contact, and look at the target fret before you move.',
            'Low on the neck the frets are wide. Double bassists use fingers 1, 2 and 4 there (the Simandl fingering): three fingers for three frets, with fingers 3 and 4 working together on the third. Many electric players do the same in the first positions.',
          ],
          steps: [
            { ex: 'tech-shifting', p: { string: 'A', shift: '3' }, sub: 2, from: 60, goal: 88, do: 'Shift on the last note of each group: slide the whole hand, thumb included.' },
            { ex: 'tech-simandl', p: { pos: '1' }, sub: 2, from: 56, goal: 80, do: 'Fingers 1, 2 and 4 in half position. Compare how it feels with one finger per fret.' },
          ],
          mistakes: [
            'Leaving the thumb behind: the hand stretches instead of moving.',
            'A gap before each shift. Move during the last note of the group, not after it.',
          ],
        },
        {
          id: 'string-skip', title: 'String skipping',
          idea: 'The plucking hand finds a string two away without looking.',
          concept: [
            'Octaves, 10ths and wide arpeggios skip a string. The plucking hand has to land on the right string without looking, and the string in between must stay silent: rest a fretting-hand finger on it.',
            'Blocks (four notes per string) come first. Zig-zag, where every note changes string, is much harder: halve the tempo for it.',
          ],
          steps: [
            { ex: 'tech-string-skip', p: { style: 'block', pos: '5' }, sub: 2, from: 60, goal: 88, do: 'Four notes on a string, then skip one. Keep the skipped string silent.' },
            { ex: 'tech-string-skip', p: { style: 'zig', pos: '5' }, sub: 2, from: 50, goal: 72, do: 'Zig-zag: every note changes string. Slow is fine.' },
          ],
          mistakes: [
            'Looking at the plucking hand. Feel the distance; the eyes stay on the neck.',
            'The skipped string ringing. Rest a fretting finger lightly across it.',
          ],
        },
      ],
      check: {
        can: [
          'My hammer-ons and pull-offs are as loud as my plucked notes.',
          'I shift along a string without a gap in the time.',
          'I can skip strings with the string in between silent.',
        ],
        steps: [
          { ex: 'tech-legato', p: { pos: '5' }, sub: 2, from: 72, goal: 96 },
          { ex: 'tech-shifting', p: { string: 'E', shift: '4' }, sub: 2, from: 66, goal: 92 },
          { ex: 'tech-string-skip', p: { style: 'zig', pos: '5' }, sub: 2, from: 60, goal: 84 },
        ],
      },
    },
    {
      id: 'u-funk', title: '16ths and funk',
      goal: 'Triplet feels, the 16th-note grid, moving accents and ghost notes.',
      lessons: [
        {
          id: 'triplet-feel', title: 'Triplet feels',
          idea: 'Three notes in one beat, or three across two.',
          concept: [
            '8th-note triplets put three even notes in one beat. Quarter-note triplets stretch three notes across two beats: a lazy, floating feel heard in hip-hop, gospel and jazz. Think "triplets, but play every other one".',
            'Keep your foot on the beat and let the triplets float above it.',
          ],
          steps: [
            { ex: 'rh-triplets', p: {}, from: 60, goal: 84, do: 'Straight 8ths, 8th-note triplets and quarter-note triplets in turn. Feel where each one meets the beat.' },
          ],
          mistakes: [
            'Quarter-note triplets that turn into straight quarters. The second note should come before beat 2.',
            'Rushing the triplets. Count "1 trip let 2 trip let".',
          ],
        },
        {
          id: 'sixteenths', title: 'The 16th-note grid',
          idea: 'Four spots in every beat: 1 e & a.',
          concept: [
            'A beat of 16ths has four spots: 1, e, &, a. There are 15 ways to use them, and most funk, R&B and hip-hop rhythms are built from these cells. Each cell repeats for a bar so you can lock it in.',
            'Keep the plucking hand moving in 16ths even on the silent spots: the motion keeps your place.',
          ],
          steps: [
            { ex: 'rh-16th-grid', p: {}, from: 56, goal: 76, do: 'Count every spot out loud, "1 e & a", and play only the ones the cell asks for.' },
          ],
          mistakes: [
            'Stopping the hand on the silent spots and losing your place.',
            'Notes on the "e" and the "a" drifting towards the beat.',
          ],
        },
        {
          id: 'accents', title: 'Accents across the beat',
          idea: 'Groups of 3 make the accent move around the bar.',
          concept: [
            'Play steady 16ths and accent every third note: the accent lands on a different spot of the beat each time. It builds plucking-hand control and the rhythmic independence of funk and fusion.',
            'An accent is louder, not longer. Count "1 e & a" while the accents drift.',
          ],
          steps: [
            { ex: 'tech-accents', p: { group: '3', pos: '5' }, sub: 4, from: 56, goal: 72, do: 'Accent every third 16th. Keep the other notes soft and even.' },
            { ex: 'tech-accents', p: { group: '332', pos: '5' }, sub: 4, from: 56, goal: 72, do: '3+3+2: the accent pattern behind countless funk and Latin lines.' },
          ],
          mistakes: [
            'Holding the accented note longer, so the 16ths stop being even.',
            'Losing the count. Say the beat numbers aloud.',
          ],
        },
        {
          id: 'ghost-notes', title: 'Ghost notes and funk',
          idea: 'Both hands keep moving; only the fretting pressure decides what sounds.',
          concept: [
            'A ghost note is a muted, percussive note: the fretting finger touches the string without pressing it down. Keep a constant 16th-note motion and choose which notes sound: that is the secret of Rocco Prestia, Jaco and modern funk. The x dots are ghost notes.',
            'Land beat 1 with weight and keep everything else light.',
          ],
          steps: [
            { ex: 'tech-ghost-16ths', p: { pattern: 'a' }, sub: 4, from: 60, goal: 84, do: 'A note on every beat, ghost notes in between: pressure on, off, off, off.' },
            { ex: 'gr-funk', p: { style: 'funk16' }, from: 76, goal: 96, backing: 'chords', music: true, do: 'A funk groove with ghost notes over a one-chord vamp. Make it feel good before you make it fast.' },
          ],
          mistakes: [
            'Ghost notes with pitch: the finger pressed too hard.',
            'Ghost notes louder than the real notes. They are felt more than heard.',
          ],
        },
      ],
      check: {
        can: [
          'I can play quarter-note triplets against the beat.',
          'I count and play any 16th-note cell.',
          'My ghost notes are percussive and quiet.',
        ],
        steps: [
          { ex: 'rh-16th-grid', p: {}, from: 66, goal: 84 },
          { ex: 'tech-ghost-16ths', p: { pattern: 'b' }, sub: 4, from: 66, goal: 88 },
          { ex: 'gr-funk', p: { style: 'fill' }, from: 80, goal: 96, backing: 'chords' },
          { ex: 'rh-triplets', p: {}, from: 72, goal: 96 },
          { ex: 'mm-pressure', p: { part: 'all' }, from: 84, goal: 108, backing: 'chords', music: true, do: 'Make music: a pedal riff with a 16th kick, then an octave pedal in 16ths.' },
        ],
      },
    },
    {
      id: 'u-positions', title: 'Every note, every position',
      goal: 'Know every note in any position, every octave of a note, and read up the neck.',
      lessons: [
        {
          id: 'position-notes', title: 'Every note in one position',
          idea: 'The hand stays still and every note under it has a name.',
          concept: [
            'Reading and improvising happen in position: the hand stays still and every note within reach must be known at once. Play every fret of the position on every string, sharps going up and flats coming down, and name each note.',
            'Index on the first fret of the zone, one finger per fret. Once it is easy, switch Reveal to Quiz and find the notes yourself.',
          ],
          steps: [
            { ex: 'fb-position-notes', p: { zone: '5' }, sub: 2, from: 60, goal: 84, do: 'Frets 5–8. Name every note as you play it.' },
            { ex: 'fb-position-notes', p: { zone: '7' }, sub: 2, from: 60, goal: 84, do: 'Frets 7–10.' },
          ],
          mistakes: [
            'Moving the hand to reach a note. Everything is inside four frets.',
            'Naming only the natural notes. Every fret has a name.',
          ],
        },
        {
          id: 'all-octaves', title: 'One note, every octave',
          idea: 'Octave and unison shapes join the whole neck together.',
          concept: [
            'Play one note in every octave, from the lowest to the highest, and in every place that pitch can be played before moving up. You will see how the octave and unison shapes link the whole neck.',
            'Listen at the unisons: the same pitch has a different colour on each string.',
          ],
          steps: [
            { ex: 'fb-all-octaves', p: {}, sub: 1, from: 60, goal: 84, do: 'Choose any note under Options. Name it at every place you play it.' },
          ],
          mistakes: [
            'Hunting fret by fret. Use the shapes: the octave (two strings up, two frets up) and the unison (fret 5 = the next open string).',
          ],
        },
        {
          id: 'reading-up', title: 'Reading up the neck',
          idea: 'Find the position first, then read inside it.',
          concept: [
            'Higher up the neck the written notes climb above the staff onto ledger lines: the C on the first ledger line above is the G string at fret 5 (or the A string at fret 15). Each melody here stays inside one position: read it there, without sliding back to the first position.',
            'Ledger lines above the staff: C, E and G on the lines; B, D and F in the spaces.',
          ],
          steps: [
            { ex: 'rd-upper', p: { pos: '5', key: '0' }, from: 50, goal: 66, do: 'C major in 5th position: index finger on fret 5.' },
            { ex: 'rd-upper', p: { pos: '7', key: '7' }, from: 50, goal: 66, do: 'G major in 7th position: index finger on fret 7.' },
          ],
          mistakes: [
            'Jumping back to the first position for notes you know there. Find them in this position.',
            'Counting ledger lines from the staff every time. Learn the C one line above as an anchor.',
          ],
        },
      ],
      check: {
        can: [
          'I know every note in the 5th and 7th positions.',
          'I can find one note in all its octaves.',
          'I can read a simple melody in 5th position.',
        ],
        steps: [
          { ex: 'fb-position-notes', p: { zone: '7' }, sub: 2, from: 66, goal: 92 },
          { ex: 'rd-upper', p: { pos: '5', key: '0' }, from: 56, goal: 72 },
          { ex: 'fb-all-octaves', p: {}, sub: 1, from: 66, goal: 96 },
        ],
      },
    },
    {
      id: 'u-scales3', title: 'Scales across the neck',
      goal: 'Two-octave scales, the three fingerings and every key in one position.',
      lessons: [
        {
          id: 'two-octaves', title: 'Two-octave scales',
          idea: 'Two octaves need at least one shift: plan it.',
          concept: [
            'Two octaves cover most of the useful range of the bass, and they need at least one shift. The app chooses fingerings that shift as little as possible and uses the same fingering up and down: watch where the hand moves and practise those shifts slowly.',
            'Shift with the finger that just played, sliding lightly.',
          ],
          steps: [
            { ex: 'sc-two-octaves', p: { type: 'ionian', dir: 'updown' }, sub: 2, from: 60, goal: 88, do: 'Major over two octaves. Find the shift before you play.' },
            { ex: 'sc-two-octaves', p: { type: 'aeolian', dir: 'updown' }, sub: 2, from: 60, goal: 88, do: 'Natural minor over two octaves.' },
          ],
          mistakes: [
            'Shifting in a different place each time. Keep the same fingering every time.',
            'Speeding up on the way down.',
          ],
        },
        {
          id: 'scale-forms', title: 'The three scale fingerings',
          idea: 'Name a fingering by the finger on the root: one, two or four.',
          concept: [
            'Every scale has three fingerings, named after the finger that plays the root. The root stays on the same fret and the hand moves around it. In major, the root under finger 2 is the one-position shape you already know; the root under finger 1 reaches one fret further with the little finger; the root under finger 4 crosses four strings with one little-finger stretch.',
            'Know all three and you can start a scale wherever your hand already is.',
          ],
          steps: [
            { ex: 'tri-scale-forms', p: { type: 'ionian', form: 'all', root: 'E' }, sub: 1, from: 60, goal: 84, do: 'The three major fingerings in turn. Say "one", "two" or "four" before each.' },
            { ex: 'tri-scale-forms', p: { type: 'aeolian', form: 'all', root: 'E' }, sub: 1, from: 60, goal: 84, do: 'The three natural-minor fingerings.' },
          ],
          mistakes: [
            'Moving the root to suit a fingering. The root stays put; the hand moves around it.',
          ],
        },
        {
          id: 'keys-in-position', title: 'All 12 keys in one position',
          idea: 'Stay in five frets and play every key around the cycle.',
          concept: [
            'Stay inside one five-fret zone and play the scale of every key around the cycle of 4ths. The root starts sometimes on the E string, sometimes on the A string, and the fingering changes, but the hand stays still. This is how sight-readers and jazz players learn to see every key under their hand.',
            'Before each key, find its root inside the zone.',
          ],
          steps: [
            { ex: 'sc-keys-one-position', p: { type: 'ionian', zone: '2', order: 'cycle4' }, sub: 2, from: 56, goal: 80, do: 'Every major scale in frets 5–9, around the cycle of 4ths.' },
            { ex: 'sc-keys-one-position', p: { type: 'minorPent', zone: '2', order: 'cycle4' }, sub: 2, from: 60, goal: 84, do: 'Every minor pentatonic in the same zone.' },
          ],
          mistakes: [
            'Leaving the zone for a fingering you prefer. The zone decides the fingering.',
          ],
        },
      ],
      check: {
        can: [
          'I can play major and minor scales over two octaves in any key.',
          'I know the three fingerings of the major scale.',
          'I can play every major scale inside one zone.',
        ],
        steps: [
          { ex: 'sc-two-octaves', p: { type: 'ionian', dir: 'updown' }, sub: 2, from: 76, goal: 100 },
          { ex: 'sc-keys-one-position', p: { type: 'ionian', zone: '2', order: 'cycle4' }, sub: 2, from: 66, goal: 88 },
          { ex: 'tri-scale-forms', p: { type: 'ionian', form: 'all', root: 'E' }, sub: 1, from: 72, goal: 96 },
        ],
      },
    },
    {
      // (added 2026-10-28, user: pentatonic studies inspired by modern bass teaching, every line original)
      id: 'u-pent3', title: 'Pentatonic colours', added: 1793180000000,
      goal: 'One minor pentatonic box in three places over one chord, and grooves where the key\'s box fits every chord.',
      lessons: [
        {
          id: 'pent-three-boxes', title: 'One box, three places',
          idea: 'Over a minor chord the box fits on its root, a whole step up and on its 5th.',
          concept: [
            'The minor pentatonic on the root of a minor chord is the safe choice, and on its own it can sound like one box going up and down. The same shape fits two more places over the same chord. A whole step up it brings the 6th (the app names it 13): the Dorian sound of funk and soul. On the 5th it brings the 9th: bright and singing.',
            'No new shape to learn: the fingering stays the same and only the hand moves. Cycle the box through the three places first, then groove in the home box and borrow one colour note at a time.',
          ],
          steps: [
            { ex: 'sc-pent-three-boxes', p: { lick: '0' }, from: 60, goal: 84, backing: 'chords', do: 'The box on the root, a whole step up, on the 5th, then home. Same fingering: only the hand moves.' },
            { ex: 'sc-pent-three-boxes', p: { lick: '1' }, from: 64, goal: 88, backing: 'chords', do: 'Home box, plus the 6th (13) from the box a whole step up. Make that note sing.' },
            { ex: 'sc-pent-three-boxes', p: { lick: '2' }, from: 64, goal: 88, backing: 'chords', do: 'Home box, plus the 9th from the box on the 5th.' },
            { ex: 'sc-pent-three-boxes', p: { lick: '3' }, from: 64, goal: 88, backing: 'chords', music: true, do: 'Both colours in one groove. Then pick one colour note and build your own line around it.' },
          ],
          mistakes: [
            'Changing the fingering in each place. The shape is the same: move the hand, not the fingers.',
            'Using the colour notes all the time. One or two per phrase is plenty; the home box carries the groove.',
          ],
        },
        {
          id: 'pent-minor-grooves', title: 'One pentatonic, three chords',
          idea: 'Over i – ♭VII – ♭VI the key\'s minor pentatonic fits every chord.',
          concept: [
            'In i – ♭VII – ♭VI (Em7 – D – Cmaj7 in E minor) the roots fall a step at a time, and the minor pentatonic of the key fits all three chords: over the ♭VII its notes become the 9th, 11th, 5th and 13th, over the ♭VI the 3rd, 5th, 7th and 9th. So the line stays in one familiar box while the harmony moves under it.',
            'Each groove puts the roots on beat 1 and ends the phrase with a fill that leads back to the top. When a groove is easy, keep the chords and the form and make your own line: play too much first, then take notes away until only the best are left.',
          ],
          steps: [
            { ex: 'sc-pent-minor-grooves', p: { lick: '0' }, from: 66, goal: 92, backing: 'chords', do: 'Falling roots, and a fill to close the phrase. Keep the rests empty.' },
            { ex: 'sc-pent-minor-grooves', p: { lick: '1' }, from: 60, goal: 84, backing: 'chords', do: '16ths from the box: octaves and the notes between them.' },
            { ex: 'sc-pent-minor-grooves', p: { lick: '2' }, from: 66, goal: 92, backing: 'chords', music: true, do: 'Half-time, with space. Then play your own line over the same chords.' },
          ],
          mistakes: [
            'Losing the root on beat 1 when the chord changes. The fill may wander; the downbeats tell the band where it is.',
            'Filling every gap. The space is part of the groove.',
          ],
        },
      ],
      check: {
        can: [
          'I can move one minor pentatonic box to the root, a whole step up and the 5th of a minor chord.',
          'I can groove over i – ♭VII – ♭VI from the key\'s pentatonic and close the phrase with a fill.',
        ],
        steps: [
          { ex: 'sc-pent-three-boxes', p: { lick: '3' }, from: 72, goal: 96, backing: 'chords' },
          { ex: 'sc-pent-minor-grooves', p: { lick: '0' }, from: 76, goal: 100, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-sequences', title: 'Linear scales and sequences',
      goal: 'Scales along one string, three notes per string, sequences and intervals through the key.',
      lessons: [
        {
          id: 'one-string', title: 'Scales along one string',
          idea: 'Two frets for a whole step, one for a half step.',
          concept: [
            'Played along one string, a scale shows its structure plainly: two frets for a whole step, one for a half step. Gary Willis and Victor Wooten recommend it for understanding the neck horizontally and for practising shifts.',
            'Say the step sizes as you go: W W H W W W H.',
          ],
          steps: [
            { ex: 'sc-one-string', p: { type: 'ionian', string: 'A' }, sub: 2, from: 60, goal: 88, do: 'The major scale along the A string.' },
            { ex: 'sc-one-string', p: { type: 'aeolian', string: 'D', key: '7' }, sub: 2, from: 60, goal: 88, do: 'G natural minor along the D string: where are the half steps now?' },
          ],
          mistakes: [
            'Sliding one finger from note to note. Shift in groups (fingers 1-2-4 or 1-3-4).',
          ],
        },
        {
          id: 'three-per-string', title: 'Three notes per string',
          idea: 'Three notes on each string, and the scale climbs diagonally.',
          concept: [
            'With three notes per string the scale climbs diagonally up the neck, covering more range with fewer string crossings. It is the standard fingering for fast runs in fusion and metal, and it links the positions together.',
            'Some strings need a five-fret stretch: pivot on the thumb instead of straining.',
          ],
          steps: [
            { ex: 'sc-3nps', p: { type: 'ionian', oct: 'all' }, sub: 3, from: 56, goal: 76, do: 'Triplets fit the fingering on the way up: one group of three on each string.' },
          ],
          mistakes: [
            'Stretching with a stiff hand. Let the thumb pivot.',
          ],
        },
        {
          id: 'sequences', title: 'Scale sequences',
          idea: 'Break the scale into cells and it starts to sound like music.',
          concept: [
            'Running a scale straight up and down is only the start. Sequences break it into repeating cells (1-2-3, 2-3-4, 3-4-5…) that sound like melodies and stop you playing on autopilot. Every sequence works in every scale and key.',
            'Match the cell to the rhythm first: groups of 3 as triplets, groups of 4 as 8ths. Later, swap them for rhythmic tension.',
          ],
          steps: [
            { ex: 'sc-sequences', p: { pattern: 'g3', type: 'ionian', oct: '1' }, sub: 3, from: 60, goal: 84, do: 'Groups of 3 as triplets: each cell starts on the beat.' },
            { ex: 'sc-sequences', p: { pattern: 'g4', type: 'ionian', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'Groups of 4 in 8ths.' },
            { ex: 'sc-sequences', p: { pattern: 'turn', type: 'ionian', oct: '1' }, sub: 2, from: 72, goal: 100, do: '1-2-3-1 turns: a cell that turns back on itself.' },
          ],
          mistakes: [
            'Losing the cell halfway up. Say the first degree of each group.',
          ],
        },
        {
          id: 'diatonic-intervals', title: 'Intervals through the key',
          idea: 'In 3rds the major scale runs major, minor, minor, major, major, minor, minor.',
          concept: [
            'Move through the scale in pairs of notes a fixed number of steps apart: 1-3, 2-4, 3-5 (3rds), or 1-4, 2-5 (4ths), and so on. The alternating versions flip every second pair (1-3, 4-2, 3-5…), which is more melodic and great for fills.',
            'Name each interval quality as you go: in major the 3rds run M m m M M m m.',
          ],
          steps: [
            { ex: 'iv-diatonic', p: { pattern: 'thirds', scale: 'ionian', oct: '1' }, sub: 2, from: 66, goal: 92, do: '3rds through the major scale. Name each one major or minor.' },
            { ex: 'iv-diatonic', p: { pattern: 'sixthsAlt', scale: 'ionian', oct: '1' }, sub: 2, from: 60, goal: 84, do: '6ths, alternating: you will skip strings, so mute carefully.' },
          ],
          mistakes: [
            'Playing the pairs without hearing them. Sing the top note of a few pairs.',
          ],
        },
      ],
      check: {
        can: [
          'I can play a major scale along one string.',
          'I can play a scale in groups of 4 and in alternating 3rds.',
        ],
        steps: [
          { ex: 'sc-sequences', p: { pattern: 'g4', type: 'aeolian', oct: '1' }, sub: 2, from: 80, goal: 104 },
          { ex: 'iv-diatonic', p: { pattern: 'thirdsAlt', scale: 'ionian', oct: '1' }, sub: 2, from: 72, goal: 96 },
          { ex: 'sc-one-string', p: { type: 'ionian', string: 'A' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-modes', title: 'The modes',
      goal: 'The seven modes of the major scale and the note that gives each its colour.',
      lessons: [
        {
          id: 'relative-modes', title: 'One scale, seven homes',
          idea: 'Same notes, a different home note.',
          concept: [
            'A mode is a scale started from a different note. Play C major from C (Ionian), from D (Dorian), from E (Phrygian) and so on: the same notes, a different home. The degree labels are worked out again for each mode, so you see what makes it unique: Dorian has a ♭3 and a natural 6, Lydian a ♯4, Mixolydian a ♭7.',
            'Each mode fits the chord built on its degree: D Dorian over Dm7, G Mixolydian over G7.',
          ],
          steps: [
            { ex: 'md-relative', p: { dir: 'up', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'The seven modes of one key in turn. Watch the degree labels change.' },
          ],
          mistakes: [
            'Thinking of a mode as "the major scale from another note" only. Hear its own home note.',
          ],
        },
        {
          id: 'parallel-modes', title: 'Brightest to darkest',
          idea: 'Keep the root; each step darker lowers one note.',
          concept: [
            'Keep the root and change the mode. From brightest to darkest each mode lowers exactly one note: Lydian (♯4) → Ionian (4) → Mixolydian (♭7) → Dorian (♭3) → Aeolian (♭6) → Phrygian (♭2) → Locrian (♭5).',
            'With a drone on the root, the colour of each mode is the note that just changed.',
          ],
          steps: [
            { ex: 'md-parallel', p: { dir: 'bright', oct: '1' }, sub: 2, from: 72, goal: 100, backing: 'drone', music: true, do: 'Over a drone on the root: listen for the one note that changes each time.' },
          ],
          mistakes: [
            'Hearing all seven as "the same scale". Listen for the note that moved.',
          ],
        },
      ],
      check: {
        can: [
          'I can name the seven modes from brightest to darkest.',
          'I know the note that gives each mode its colour.',
        ],
        steps: [
          { ex: 'md-parallel', p: { dir: 'dark', oct: '1' }, sub: 2, from: 80, goal: 104, backing: 'drone' },
          { ex: 'md-relative', p: { dir: 'updown', oct: '1' }, sub: 2, from: 80, goal: 104 },
        ],
      },
    },
    {
      id: 'u-triads3', title: 'Triads all over the neck',
      goal: 'The three triad fingerings, inversions, one triad up the whole neck and the triads of a key.',
      lessons: [
        {
          id: 'triad-forms', title: 'The three triad fingerings',
          idea: 'Three fingerings for every triad, named by the finger on the root: no dead areas on the neck.',
          concept: [
            'A triad shape is named by the finger on its root. In major, root under finger 2: the 3rd and 5th are on the next string; root under finger 1: the 3rd is on the same string and the 5th on the next; root under finger 4: the shape crosses back towards the nut over three strings. In minor the three forms put the root under fingers 3, 1 and 4.',
            'Knowing all three means that wherever your hand is, one of the shapes fits. Name the form out loud as you play it.',
          ],
          steps: [
            { ex: 'tri-three-forms', p: { quality: 'maj', pattern: 'turn' }, sub: 1, from: 66, goal: 96, do: 'The three major fingerings, R-3-5-3. Say "two", "one", "four".' },
            { ex: 'tri-three-forms', p: { quality: 'min', pattern: 'turn' }, sub: 1, from: 66, goal: 96, do: 'The three minor fingerings: say "three", "one", "four".' },
          ],
          mistakes: [
            'Always reaching for the shape you know best. Use the one that fits where your hand is.',
          ],
        },
        {
          id: 'inversions', title: 'Inversions',
          idea: 'Start the chord from its 3rd or its 5th.',
          concept: [
            'An inversion starts a chord on a note other than the root: the 1st inversion on the 3rd (3-5-R), the 2nd on the 5th (5-R-3). In position all three stay around the root, the way bass lines use them to move smoothly from chord to chord.',
            'Keep the degree labels on: always know where the root is.',
          ],
          steps: [
            { ex: 'tri-inversions', p: { quality: 'maj', mode: 'position', root: 'A' }, sub: 2, from: 66, goal: 92, do: 'Root position, 1st and 2nd inversion around one root on the A string.' },
            { ex: 'tri-inversions', p: { quality: 'min', mode: 'climb', root: 'E' }, sub: 2, from: 66, goal: 92, do: 'Minor inversions climbing the neck.' },
          ],
          mistakes: [
            'Losing the root inside an inversion. It is still the chord\'s name, even when it is not the lowest note.',
          ],
        },
        {
          id: 'neck-chain', title: 'One triad, the whole neck',
          idea: 'Every compact shape of one chord, from the nut up.',
          concept: [
            'Take one chord and play every compact shape of it up the neck: you move between the three fingerings and between octaves. When you can do this in any key, you can find any chord anywhere.',
            'Look ahead: find the next shape while you play the current one.',
          ],
          steps: [
            { ex: 'tri-neck-chain', p: { quality: 'maj', dir: 'updown', pattern: 'up' }, sub: 2, from: 66, goal: 92, do: 'Up the neck and back with one major triad.' },
          ],
          mistakes: [
            'Stopping between shapes. The next shape starts on the next beat.',
          ],
        },
        {
          id: 'harmonised-triads', title: 'The triads of a key',
          idea: 'I ii iii IV V vi vii°: every chord built from the scale.',
          concept: [
            'Stack a 3rd and a 5th on every degree of the scale, using only notes from the scale: in major you get I, ii, iii, IV, V, vi and vii°. Play them and hear how each chord sounds inside the key.',
            'Say the Roman numeral of each chord as you play it.',
          ],
          steps: [
            { ex: 'tri-diatonic', p: { scale: 'ionian', order: 'up', pattern: 'up', inversion: '0', root: 'A' }, sub: 2, from: 66, goal: 96, do: 'I to I up the neck. Say each numeral.' },
            { ex: 'tri-diatonic', p: { scale: 'ionian', order: 'fourths', pattern: 'turn', inversion: '0', root: 'A' }, sub: 2, from: 66, goal: 92, do: 'In 4ths (1-4-7-3-6-2-5-1), the order chords most often move in.' },
          ],
          mistakes: [
            'Playing vii° as a minor chord. Its 5th is a fret lower: diminished.',
          ],
        },
      ],
      check: {
        can: [
          'I can play major and minor triads in all three fingerings.',
          'I can play the triads of a major key.',
          'I can play any triad in root position and both inversions.',
        ],
        steps: [
          { ex: 'tri-three-forms', p: { quality: 'min', pattern: 'turn' }, sub: 1, from: 76, goal: 104 },
          { ex: 'tri-diatonic', p: { scale: 'ionian', order: 'up', pattern: 'turn', inversion: '0', root: 'A' }, sub: 2, from: 72, goal: 100 },
          { ex: 'tri-inversions', p: { quality: 'min', mode: 'position', root: 'A' }, sub: 2, from: 72, goal: 96 },
          { ex: 'mm-jean', p: { part: 'all' }, from: 88, goal: 112, backing: 'chords', music: true, do: 'Make music: an 8th-note ostinato through the chords, exact and hypnotic.' },
        ],
      },
    },
    {
      id: 'u-sevenths3', title: '7th chords in the key',
      goal: 'The 7th chords of a key, broken chords, every key in one zone, and their sound.',
      lessons: [
        {
          id: 'diatonic-7ths', title: 'The 7th chords of a key',
          idea: 'Imaj7 iim7 iiim7 IVmaj7 V7 vim7 viiø7.',
          concept: [
            'Stack four notes in 3rds on each degree of the scale: in major you get Imaj7, iim7, iiim7, IVmaj7, V7, vim7 and viiø7. Every jazz standard and most soul and pop songs use these chords.',
            '"Up one, down the next" turns the chords into a bass line.',
          ],
          steps: [
            { ex: 'arp-diatonic-7ths', p: { scale: 'ionian', order: 'up', pattern: 'up' }, sub: 2, from: 66, goal: 92, do: 'Imaj7 to Imaj7. Name each chord.' },
            { ex: 'arp-diatonic-7ths', p: { scale: 'ionian', order: 'up', pattern: 'alt' }, sub: 2, from: 66, goal: 92, do: 'Up one, down the next.' },
          ],
          mistakes: [
            'Playing V7 with a major 7th. The V chord has a ♭7: the one dominant chord of the key.',
          ],
        },
        {
          id: 'broken-chords', title: 'Broken chords',
          idea: 'Start the chord from each of its notes in turn.',
          concept: [
            'A broken chord plays the chord tones in small cells instead of straight up and down: 1-3-5-3, then the same cell from the next chord tone, up to the top and back down to the root. It teaches you to start a chord from any of its notes.',
            'Say the degree of the first note of each cell, and keep the turn-back note from rushing.',
          ],
          steps: [
            { ex: 'arp-broken', p: { quality: 'maj', shape: 'broken', oct: '1' }, sub: 2, from: 66, goal: 96, do: 'A broken major triad.' },
            { ex: 'arp-broken', p: { quality: 'min7', shape: 'broken', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'A broken minor 7th: 1-3-5-3, then 3-5-7-5 and onwards.' },
          ],
          mistakes: [
            'Rushing the fourth note of each cell, where the line turns back.',
          ],
        },
        {
          id: 'zone-7ths', title: '7th chords around the cycle',
          idea: 'Every key\'s chord, without leaving five frets.',
          concept: [
            'The zone warm-up with four-note chords: stay inside the zone and play the arpeggio of every key around the cycle. You need every fingering, and you start to see each chord wherever your hand is.',
            'Say the chord name before you play it.',
          ],
          steps: [
            { ex: 'arp-zone-cycle', p: { quality: 'dom7', zone: '1', order: 'cycle4', pattern: 'up' }, sub: 2, from: 60, goal: 84, do: 'Dominant 7ths around the cycle of 4ths in zone 1.' },
            { ex: 'arp-zone-cycle', p: { quality: 'min7', zone: '2', order: 'cycle4', pattern: 'up' }, sub: 2, from: 60, goal: 84, do: 'Minor 7ths in zone 2.' },
          ],
          mistakes: [
            'Leaving the zone for a familiar fingering. Find the chord inside the zone.',
          ],
        },
        {
          id: 'hear-7ths', title: 'Hear the 7th chord',
          idea: 'First the triad, then the 7th.',
          concept: [
            'Major 7 is soft and dreamy, dominant 7 wants to move, minor 7 is mellow, half-diminished is dark and searching, diminished 7 is tense and symmetrical.',
            'Decide the triad first (major, minor or diminished), then the 7th, the third note of these voicings: a major 7th sits a half step under the root\'s octave, a minor 7th a whole step under it, a diminished 7th a step and a half.',
          ],
          steps: [
            { ex: 'ear-sevenths', p: { set: 'basic' }, do: 'maj7, 7 and m7, notes hidden. Name each before the answer appears.' },
            { ex: 'ear-sevenths', p: { set: 'five' }, do: 'All five 7th chords.' },
          ],
          mistakes: [
            'Mixing up maj7 and 7. Listen to the third note, the 7th: right under the octave (maj7) or a whole step under it (7). The top note is the 3rd in both.',
          ],
        },
      ],
      check: {
        can: [
          'I can play the 7th chords of any major key.',
          'I can start a 7th chord from any of its notes.',
          'I can hear the difference between maj7, 7, m7, m7♭5 and °7.',
        ],
        steps: [
          { ex: 'arp-diatonic-7ths', p: { scale: 'ionian', order: 'up', pattern: 'alt' }, sub: 2, from: 72, goal: 100 },
          { ex: 'ear-sevenths', p: { set: 'five' } },
          { ex: 'arp-broken', p: { quality: 'maj7', shape: 'broken', oct: '1' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-moving', title: 'Lines that move',
      goal: 'Chord tones through progressions, approach notes, double stops and grooves from around the world.',
      lessons: [
        {
          id: 'chord-tones', title: 'Chord tones through the changes',
          idea: 'Chord tones first, then scale tones, then chromatic notes.',
          concept: [
            'Every school builds bass lines the same way: chord tones first, then scale tones, then chromatic notes. Pick a progression and an outline pattern and play it through: the chord symbol appears above the neck, so say its numeral as you play.',
            'Choose the octave of each root that keeps your hand in one area.',
          ],
          steps: [
            { ex: 'hm-chord-tones', p: { prog: 'I-vi-IV-V', pattern: 'r353' }, from: 84, goal: 108, backing: 'chords', do: 'R-3-5-3 through I–vi–IV–V.' },
            { ex: 'hm-chord-tones', p: { prog: 'ii-V-I', pattern: 'r357' }, from: 84, goal: 108, backing: 'chords', do: 'R-3-5-7 through ii–V–I: the 7th chords of jazz.' },
          ],
          mistakes: [
            'Playing the shapes without hearing the chords. Turn the backing on and listen to each change.',
          ],
        },
        {
          id: 'approach-notes', title: 'Approach notes',
          idea: 'The note before the change makes the change.',
          concept: [
            'The note before a chord change is the most important passing note. Approach the next root from a half step below or above, or from its 5th: the sound of James Jamerson\'s Motown lines and the bridge to walking bass.',
            'The approach is short and leads; the target lands on beat 1.',
          ],
          steps: [
            { ex: 'gr-approach', p: { style: 'approach' }, from: 84, goal: 104, backing: 'chords', do: 'A chromatic approach on beat 4 into every chord.' },
            { ex: 'gr-approach', p: { style: 'motown' }, from: 84, goal: 100, backing: 'chords', music: true, do: 'A Motown line: dotted root, octave, approach. Play it with the chords.' },
          ],
          mistakes: [
            'Accenting the approach. It leads to the next root; the root gets the weight.',
          ],
        },
        {
          id: 'double-stops', title: 'Double stops',
          idea: 'Two notes at once add harmony to the line.',
          concept: [
            'Bass players add harmony with two notes at once: root and 5th (rock), root and octave, root and 10th (sweet and chordal), root and 7th (jazz shells). Each chord is struck with the right 3rd or 7th for its quality.',
            'Pluck both strings together with two fingers, or thumb and finger, and keep every other string muted.',
          ],
          steps: [
            { ex: 'hm-double-stops', p: { type: 'power', prog: 'I-V-vi-IV' }, from: 72, goal: 92, backing: 'chords', do: 'Power chords: root and 5th.' },
            { ex: 'hm-double-stops', p: { type: 'tenth', prog: 'I-V-vi-IV' }, from: 66, goal: 84, backing: 'chords', do: 'Root and 10th on the E and G strings.' },
          ],
          mistakes: [
            'The strings in between ringing. Mute them with the fretting hand.',
          ],
        },
        {
          id: 'world-grooves', title: 'Reggae, bossa nova and tumbao',
          idea: 'Feel comes from where you do not play.',
          concept: [
            'Reggae leaves beat 1 empty and sits deep in the groove. Bossa nova sways on root and 5th in a dotted rhythm. The Afro-Cuban tumbao anticipates the next chord on beat 4 and skips beat 1.',
            'All three teach how much of the feel comes from the beats you leave out.',
          ],
          steps: [
            { ex: 'gr-world', p: { style: 'reggae' }, from: 72, goal: 88, backing: 'chords', do: 'The one-drop: beat 1 is empty. Short, fat notes.' },
            { ex: 'gr-world', p: { style: 'bossa' }, from: 84, goal: 108, backing: 'chords', do: 'Bossa nova: root and 5th, dotted.' },
            { ex: 'gr-world', p: { style: 'tumbao' }, from: 84, goal: 100, backing: 'chords', music: true, do: 'The tumbao: the last note of each bar is already the next chord\'s root.' },
          ],
          mistakes: [
            'Filling the empty beat 1 in reggae. The space is the groove.',
          ],
        },
      ],
      check: {
        can: [
          'I can outline any progression with chord tones.',
          'I lead into chord changes with approach notes.',
          'I can play reggae, bossa nova and tumbao grooves.',
        ],
        steps: [
          { ex: 'hm-chord-tones', p: { prog: 'I-vi-IV-V', pattern: 'r353' }, from: 92, goal: 116, backing: 'chords' },
          { ex: 'gr-approach', p: { style: 'fifthApproach', prog: 'I-V-vi-IV' }, from: 92, goal: 112, backing: 'chords' },
          { ex: 'gr-world', p: { style: 'tumbao' }, from: 92, goal: 112, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-jazz-first', title: 'First steps in jazz and slap',
      goal: 'The two-feel, walking with chord tones, more styles, and your first slap.',
      lessons: [
        {
          id: 'two-feel', title: 'The two-feel',
          idea: 'Half notes on roots and 5ths: jazz with room to breathe.',
          concept: [
            'Before walking four to the bar, jazz bassists often play in two: half notes on beats 1 and 3, usually root and 5th, sometimes a chromatic approach to the next chord. It gives the tune space and teaches you the form and the root movement.',
            'Let each note ring for its full two beats, and say the chord names as you go.',
          ],
          steps: [
            { ex: 'wk-two-feel', p: { prog: 'ii-V-I' }, from: 96, goal: 132, backing: 'chords', do: 'ii–V–I in two. Let every note ring.' },
            { ex: 'wk-two-feel', p: { prog: 'autumn' }, from: 96, goal: 132, backing: 'chords', do: 'A longer form: ii–V–I–IV, then a minor ii–V–i (iiø–V–i) into the relative minor. Unit 30 looks at minor keys.' },
          ],
          mistakes: [
            'Cutting the half notes short. They last until the next note.',
          ],
        },
        {
          id: 'walking-chord-tones', title: 'Walking with chord tones',
          idea: 'Four notes a bar, all from the chord.',
          concept: [
            'Your first walking lines use only chord tones: the root on beat 1, then 3rd, 5th and octave. It already sounds like jazz, and it trains you to see each chord shape in time.',
            'Root on beat 1 of every bar, and keep the quarter notes long and even.',
          ],
          steps: [
            { ex: 'wk-chord-tones', p: { prog: 'I-vi-ii-V' }, from: 96, goal: 120, backing: 'chords', do: 'A walking line through I–vi–ii–V.' },
            { ex: 'wk-chord-tones', p: { prog: 'jazz-blues' }, from: 96, goal: 120, backing: 'chords', music: true, do: 'The jazz blues: walk it with the chords.' },
          ],
          mistakes: [
            'Short, choppy quarter notes. A walking line is legato.',
          ],
        },
        {
          id: 'styles', title: 'Country, samba and second line',
          idea: 'Every style has its own bass feel.',
          concept: [
            'Country plays root and 5th as half notes on beats 1 and 3, leaving 2 and 4 to the snare, with a pickup into the next chord. Samba is a two-feel in which a short 16th before each beat already plays the next note. The New Orleans second line bounces between root, 3rd, 5th and 6th over a street-parade beat.',
            'Play each one until it feels like the style, not just the notes.',
          ],
          steps: [
            { ex: 'gr-genres', p: { style: 'countryTwo' }, from: 84, goal: 112, backing: 'chords', do: 'Country two-beat: beats 2 and 4 stay empty for the snare.' },
            { ex: 'gr-genres', p: { style: 'samba' }, from: 80, goal: 100, backing: 'chords', do: 'Samba: the short 16th is light, the long note carries the beat.' },
            { ex: 'gr-genres', p: { style: 'secondLine' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'Second line: swing it a little and dig into beat 1.' },
          ],
          mistakes: [
            'Playing every style with the same feel. Listen to the backing and fit in.',
          ],
        },
        {
          id: 'slap-basics', title: 'Slap: thumb and pop', optional: true,
          idea: 'The thumb is a drumstick; the finger pops the string away and lets it snap back.',
          concept: [
            'Slap has two motions. The thumb (T) bounces off a low string like a drumstick, and the index or middle finger pops (P) a higher string by pulling it away from the fretboard so it snaps back. Start with the thumb alone, then thumb–pop octaves, the backbone of funk and disco slap. Optional, but a lot of fun.',
            'Rotate the forearm, like turning a door handle, rather than swinging from the elbow, and strike over the end of the fretboard.',
          ],
          steps: [
            { ex: 'sl-thumb-pop', p: { style: 'thumb' }, from: 72, goal: 96, backing: 'chords', do: 'The thumb alone, on the roots.' },
            { ex: 'sl-thumb-pop', p: { style: 'octPop' }, from: 72, goal: 96, backing: 'chords', do: 'Thumb the root, pop the octave.' },
          ],
          mistakes: [
            'Swinging from the elbow. The motion is a forearm rotation.',
            'Popping too hard: the string slaps the frets. A small pull is enough.',
          ],
        },
      ],
      check: {
        can: [
          'I can play a tune in two with roots and 5ths.',
          'I can walk a bass line with chord tones through a jazz blues.',
          'I can play country, samba and second-line grooves.',
        ],
        steps: [
          { ex: 'wk-chord-tones', p: { prog: 'jazz-blues' }, from: 104, goal: 132, backing: 'chords' },
          { ex: 'gr-genres', p: { style: 'samba' }, from: 88, goal: 108, backing: 'chords' },
          { ex: 'wk-two-feel', p: { prog: 'ii-V-I' }, from: 110, goal: 144, backing: 'chords' },
        ],
      },
    },
  ],
  check: {
    can: [
      'I play legato runs and shift without gaps.',
      'I play 16th-note funk with ghost notes.',
      'I can read in 5th position.',
      'I play two-octave scales, sequences and the modes.',
      'I play the triads and 7th chords of any key, in any fingering.',
      'I can walk a jazz blues with chord tones.',
    ],
    steps: [
      { ex: 'tech-legato', p: { pos: '7' }, sub: 2, from: 80, goal: 100 },
      { ex: 'gr-funk', p: { style: 'funk16' }, from: 88, goal: 100, backing: 'chords' },
      { ex: 'sc-sequences', p: { pattern: 'g3', type: 'dorian', oct: '1' }, sub: 3, from: 72, goal: 88 },
      { ex: 'arp-diatonic-7ths', p: { scale: 'ionian', order: 'fourths', pattern: 'alt' }, sub: 2, from: 80, goal: 104 },
      { ex: 'wk-chord-tones', p: { prog: 'jazz-blues' }, from: 110, goal: 138, backing: 'chords' },
      { ex: 'rd-upper', p: { pos: '5', key: '0' }, from: 60, goal: 76 },
      { ex: 'mm-together', p: { part: 'all' }, from: 66, goal: 84, backing: 'chords', music: true, do: 'Make music: a swampy riff with hammer-ons, lazy but never late.' },
      { ex: 'mm-longview', p: { part: 'all' }, from: 100, goal: 140, backing: 'chords', music: true, do: 'Make music: a busy verse line, then root 8ths in the chorus.' },
      { ex: 'mm-chain', p: { part: 'all' }, from: 100, goal: 140, backing: 'chords', music: true, do: 'Make music: a quiet pedal, then a bass break up the pentatonic.' },
    ],
  },
};
