// Course Stage 4: The whole neck (Level 4). See ../data.js for the format.
export default {
  id: 's4', title: 'The whole neck', level: 4,
  desc: 'Stamina and harmonics, advanced time and odd metres, every key across the neck, minor harmony, the modes at work, triads and 7ths in inversions and voice leading, 10ths, walking bass, and soul, odd-metre and slap grooves.',
  units: [
    {
      id: 'u-stamina', title: 'Stamina, stretch and harmonics',
      goal: 'A wider hand, minutes of steady 16ths, and the natural harmonics.',
      lessons: [
        {
          id: 'stretch', title: 'Stretching towards the nut',
          idea: 'One finger per fret, a fret lower each pass, and never through tension.',
          concept: [
            'Starting high on the neck, play 1-2-3-4 across all the strings and move down one fret per pass. As you approach the nut the frets get wider and the stretch grows. Stop as soon as you feel tension: over weeks you will reach the first position comfortably.',
            'Pivot from the thumb behind the neck and keep the wrist straight. Warm up first; never force a stretch.',
          ],
          steps: [
            { ex: 'tech-stretch', p: { from: '9', to: '5' }, sub: 2, from: 60, goal: 80, do: 'From fret 9 down to fret 5. Stop if anything hurts.' },
            { ex: 'tech-stretch', p: { from: '9', to: '1' }, sub: 2, from: 56, goal: 72, do: 'All the way to fret 1, only when the first step felt easy.' },
          ],
          mistakes: [
            'Stretching with the wrist bent. Keep it straight and let the thumb pivot.',
            'Practising through pain. Stop, shake the hand out, try again tomorrow.',
          ],
        },
        {
          id: 'endurance', title: 'Endurance 16ths',
          idea: 'Minutes of even 16ths: relax, breathe, keep the spacing.',
          concept: [
            'Rock, metal and dance music often need minutes of continuous 16ths. Play the root of each chord in 16ths and keep the volume and the spacing even from the first bar to the last.',
            'Breathe and relax the shoulder: tension kills endurance. Alternate strictly; at high tempos some players use three fingers (ring, middle, index).',
          ],
          steps: [
            { ex: 'tech-endurance', p: { prog: 'I-IV-V-I' }, sub: 4, from: 80, goal: 96, do: 'Loop it for a few minutes at a tempo you can keep, then raise it a little each day (the speed trainer helps).' },
          ],
          mistakes: [
            'Speeding up and tensing as you tire. Lower the tempo and stay loose.',
            'One finger doing all the work. Keep alternating.',
          ],
        },
        {
          id: 'harmonics', title: 'Natural harmonics',
          idea: 'Touch the string at its node, don\'t press, and pluck near the bridge.',
          concept: [
            'A natural harmonic sounds when you touch the string lightly at a node, without pressing, and pluck near the bridge. The 12th fret gives the octave, the 7th the octave plus a 5th and the 5th two octaves: these nodes are right over the fret wire. The 4th-fret harmonic (two octaves and a major 3rd) is just before the wire, and the lower ones sit just after the 3rd and 2nd wires: the neck draws each one as a triangle where you touch it.',
            'Harmonics are used for tuning, for melodies (Jaco\'s "Portrait of Tracy") and for chords. Diamond heads on the staff show them at the pitch they sound.',
          ],
          steps: [
            { ex: 'tech-harmonics', p: { order: 'fret' }, sub: 1, from: 50, goal: 72, do: 'Fret by fret across the strings: 12, 7, 5, 4.' },
            { ex: 'tech-harmonics', p: { order: 'string' }, sub: 1, from: 50, goal: 72, do: 'String by string.' },
            { ex: 'tech-harmonics', p: { set: 'all', order: 'fret' }, sub: 1, from: 50, goal: 72, do: 'Every harmonic up to the 12th fret. The lower ones are not over the wire: touch at the triangle.' },
          ],
          mistakes: [
            'Touching in the middle of the fret: the harmonic will not sound. Touch at the triangle.',
            'Pressing the string down. Just touch it.',
          ],
        },
      ],
      check: {
        can: [
          'I can stretch one finger per fret in the low positions without tension.',
          'I keep even 16ths for minutes.',
          'I can play the harmonics at frets 12, 7, 5 and 4.',
        ],
        steps: [
          { ex: 'tech-endurance', p: { prog: 'i-iv-v-min' }, sub: 4, from: 88, goal: 104 },
          { ex: 'tech-harmonics', p: { order: 'fret' }, sub: 1, from: 60, goal: 80 },
          { ex: 'tech-stretch', p: { from: '9', to: '1' }, sub: 2, from: 60, goal: 80 },
        ],
      },
    },
    {
      id: 'u-time4', title: 'Advanced time',
      goal: 'Odd groupings, displacement, odd metres and keeping time through the gaps.',
      lessons: [
        {
          id: 'groupings', title: 'Groups of 3 and 5 over 4/4',
          idea: 'The shape stays the same; where it starts moves around the bar.',
          concept: [
            'Play a 3-note shape (R-5-8) in continuous 16ths and it starts on a different 16th each time: "3 over 4". It takes 3 bars to come back to beat 1; groups of 5 and 7 take 5 and 7 bars. Fusion players and drummers use this to build tension without leaving the time.',
            'Accent the start of each group and keep counting "1 e & a".',
          ],
          steps: [
            { ex: 'rh-groupings', p: { group: '3' }, sub: 4, from: 56, goal: 72, do: 'R-5-8 in 16ths. Accent each R and keep counting the beats.' },
            { ex: 'rh-groupings', p: { group: '5' }, sub: 4, from: 56, goal: 72, do: 'Groups of 5: five bars before it comes round again.' },
          ],
          mistakes: [
            'Counting the groups instead of the beats. The beat count never changes; the groups drift over it.',
          ],
        },
        {
          id: 'displacement', title: 'Rhythmic displacement',
          idea: 'Same figure, a 16th later each bar: a new groove every time.',
          concept: [
            'Take a short figure and start it one 16th later in each bar. The notes stay the same, but each placement grooves completely differently. It is a classic way to get variations from one idea, and it sharpens your sense of where every 16th is.',
            'Count "1 e & a" out loud: the figure moves, your counting does not.',
          ],
          steps: [
            { ex: 'rh-displacement', p: { step: '0.25' }, from: 60, goal: 80, do: 'Displaced by a 16th each bar.' },
            { ex: 'rh-displacement', p: { step: '0.5' }, from: 60, goal: 84, do: 'Displaced by an 8th.' },
          ],
          mistakes: [
            'Moving the beat with the figure. Keep your foot on the beat.',
          ],
        },
        {
          id: 'odd-meters', title: 'Odd metres',
          idea: '5/4 as 3+2, 7/8 as 2+2+3, 7/4 as 4+3.',
          concept: [
            'Odd metres group the beats unevenly: 5/4 is usually felt as 3+2, 7/8 as 2+2+3 (or 3+2+2) and 7/4 as 4+3. The accented notes mark the groups. Think of "Take Five" (5/4) or "Money" (7/4).',
            'In 7/8 the metronome clicks every 8th note, so the tempo number is higher. Count the groups out loud until the "limp" feels natural.',
          ],
          steps: [
            { ex: 'rh-odd-meters', p: { meter: '5' }, from: 90, goal: 120, do: '5/4 as 3+2: "1-2-3-1-2".' },
            { ex: 'rh-odd-meters', p: { meter: '78' }, from: 120, goal: 160, do: '7/8 as 2+2+3. The click is on every 8th.' },
            { ex: 'rh-odd-meters', p: { meter: '74' }, from: 90, goal: 120, do: '7/4 as 4+3.' },
          ],
          mistakes: [
            'Rushing the last group. It is the shortest or the odd one: give it its full time.',
          ],
        },
        {
          id: 'gap-click', title: 'Keeping time through the gaps',
          idea: 'The click comes back only now and then: land exactly on it.',
          concept: [
            'Real time-keeping means steady playing with no reference. Here the metronome clicks only on beat 1 every few bars: keep playing 8ths through the silence and check whether you land exactly on the next click.',
            'When you can do it at "every 4 bars", your time is solid. Record yourself: are you rushing in the gaps?',
          ],
          steps: [
            { ex: 'rh-sparse-click', p: { every: '2' }, from: 72, goal: 96, do: 'A click every 2 bars. Arrive on it, not before.' },
            { ex: 'rh-sparse-click', p: { every: '4' }, from: 72, goal: 96, do: 'Every 4 bars.' },
          ],
          mistakes: [
            'Speeding up in the silence. Most players rush; relax and count.',
          ],
        },
      ],
      check: {
        can: [
          'I can play groups of 3 and 5 over 4/4 without losing beat 1.',
          'I can play in 5/4, 7/8 and 7/4.',
          'I keep time with a click only every 4 bars.',
        ],
        steps: [
          { ex: 'rh-groupings', p: { group: '5' }, sub: 4, from: 60, goal: 76 },
          { ex: 'rh-odd-meters', p: { meter: '78' }, from: 130, goal: 170 },
          { ex: 'rh-sparse-click', p: { every: '4' }, from: 84, goal: 108 },
          { ex: 'rh-odd-meters', p: { meter: '5' }, from: 100, goal: 132 },
          { ex: 'rh-odd-meters', p: { meter: '74' }, from: 100, goal: 132 },
          { ex: 'mm-money', p: { part: 'all' }, from: 92, goal: 118, backing: 'chords', music: true, do: 'Make music: a riff in 7/4, felt as 4 + 3.' },
        ],
      },
    },
    {
      id: 'u-keys', title: 'Keys across the neck',
      goal: 'Every key in any position: key boxes, the 7 major and 5 pentatonic positions, and reading in every key.',
      lessons: [
        {
          id: 'key-box', title: 'Key centres in one position',
          idea: 'See all the notes of the key under your hand, wherever they start.',
          concept: [
            'Gary Willis\' fingerboard approach: stop thinking of scales as patterns that start on the root. Instead, see all the notes of the key that lie under your hand in a position, wherever they begin. Play every key in one position around the cycle and the neck becomes a map of keys.',
            'Start on the lowest available note, not on the root, and keep the hand still.',
          ],
          steps: [
            { ex: 'fb-key-box', p: { zone: '5' }, sub: 2, from: 60, goal: 84, do: 'Every note of the key in frets 5–9. Choose the key under Options, or all 12.' },
            { ex: 'fb-key-box', p: { zone: '1' }, sub: 2, from: 60, goal: 84, do: 'The same in frets 1–5.' },
          ],
          mistakes: [
            'Starting from the root out of habit. Start from the lowest note in the position.',
          ],
        },
        {
          id: 'major-positions', title: 'The 7 positions of the major scale',
          idea: 'Seven boxes, one per scale degree, and the neck is one key.',
          concept: [
            'Each position starts on a different scale degree on the E string and covers every note of the key within one hand span. They are numbered from the root: Position 1 starts on the root, Position 2 on the next note, and so on. Together they connect the whole neck in one key.',
            'The positions overlap: the top of one box is the bottom of the next.',
          ],
          steps: [
            { ex: 'sc-positions', p: { pos: 'all', type: 'ionian' }, sub: 2, from: 60, goal: 88, do: 'All seven positions, climbing the neck.' },
            { ex: 'sc-positions', p: { pos: 'all', type: 'aeolian' }, sub: 2, from: 60, goal: 88, do: 'The same boxes in a minor key.' },
          ],
          mistakes: [
            'Learning each box as a separate shape. Notice which notes it shares with its neighbours.',
          ],
        },
        {
          id: 'pent-positions', title: 'The 5 pentatonic positions',
          idea: 'Five boxes tile the neck: riffs and fills anywhere.',
          concept: [
            'The pentatonic scale has five shapes that tile the neck, each starting on a different note of the scale. Position 1 is the box with the root under your first finger on the E string.',
            'The relative major uses the same boxes: C minor pentatonic and E♭ major pentatonic are the same five notes.',
          ],
          steps: [
            { ex: 'sc-pent-positions', p: { pos: 'all', type: 'minorPent' }, sub: 2, from: 66, goal: 92, do: 'All five minor pentatonic positions up the neck.' },
            { ex: 'sc-pent-positions', p: { pos: 'all', type: 'majorPent' }, sub: 2, from: 66, goal: 92, do: 'The major pentatonic: the same boxes, a different root.' },
          ],
          mistakes: [
            'Only ever using Position 1. Each box has its own riffs.',
          ],
        },
        {
          id: 'reading-keys', title: 'Reading in every key',
          idea: 'Say the key signature before the first note.',
          concept: [
            'Professional reading means any key. Each melody comes with its key signature (up to six sharps or flats) and moves across frets 1 to 9. Minor keys use the harmonic minor, so the raised 7th appears as an accidental, as in real music.',
            'Sharps come in the order F C G D A E B; flats B E A D G C F. Say the signature before you play: "three flats: B♭, E♭, A♭".',
          ],
          steps: [
            { ex: 'rd-keys', p: { mode: 'major' }, from: 56, goal: 72, do: 'Major keys. Choose a new key each day under Options.' },
            { ex: 'rd-keys', p: { mode: 'minor' }, from: 56, goal: 72, do: 'Minor keys: watch for the raised 7th.' },
          ],
          mistakes: [
            'Forgetting the key signature in the second bar. Check it at the start of every line.',
          ],
        },
      ],
      check: {
        can: [
          'I can see every note of a key in any position.',
          'I can play the 7 major and 5 pentatonic positions in any key.',
          'I can read a melody with up to six sharps or flats.',
        ],
        steps: [
          { ex: 'sc-positions', p: { pos: 'all', type: 'ionian' }, sub: 2, from: 72, goal: 100 },
          { ex: 'sc-pent-positions', p: { pos: 'all', type: 'minorPent' }, sub: 2, from: 80, goal: 104 },
          { ex: 'rd-keys', p: { mode: 'major' }, from: 60, goal: 80 },
          { ex: 'fb-key-box', p: { zone: '5' }, sub: 2, from: 66, goal: 92 },
          { ex: 'mm-flyaway', p: { part: 'all' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'Make music: a bluesy rock riff with an octave kick and a ghost-note push.' },
        ],
      },
    },
    {
      // (added 2026-10-28, user: pentatonic studies inspired by modern bass teaching, every line original)
      id: 'u-pent4', title: 'Pentatonic colours on any chord', added: 1793180000000,
      goal: 'One pentatonic over many chords, minor pentatonics on a major chord, and the groove-and-fill phrase.',
      lessons: [
        {
          id: 'pent-one-phrase', title: 'One phrase, many chords',
          idea: 'Keep the phrase; let the chord change its colour.',
          concept: [
            'Keep one short C minor pentatonic phrase and let the chord move under it. Over Cm7 it is at home; over A♭maj7 its notes become the 3rd, 5th, 13th, 7th and 9th; over F7sus4 and B♭7sus4 they sound open; over D♭maj7 the G is the Lydian ♯11. One shape, many colours.',
            'Play first and think later: loop each version, listen to how every chord changes the feeling of the same notes, then read the labels to see why. Then improvise from the same box over the same chords.',
          ],
          steps: [
            { ex: 'sc-pent-one-phrase', p: { lick: '0' }, from: 70, goal: 96, backing: 'chords', do: 'The same phrase over Cm7, then A♭maj7. Listen to the colour change.' },
            { ex: 'sc-pent-one-phrase', p: { lick: '1' }, from: 70, goal: 96, backing: 'chords', do: 'Four colours: Cm7, A♭maj7, F7sus4, D♭maj7. Watch the G become the ♯11.' },
            { ex: 'sc-pent-one-phrase', p: { lick: '2' }, from: 70, goal: 96, backing: 'chords', do: 'A new phrase over B♭7sus4, E♭maj7, Fm7 and Cm7.' },
            { ex: 'sc-pent-one-phrase', p: { lick: '3' }, from: 70, goal: 96, backing: 'chords', music: true, do: 'The whole tour. Then play phrases of your own from the box over the same chords.' },
          ],
          mistakes: [
            'Changing the phrase when the chord changes. Let the chord do the work.',
            'Practising without the chords. Turn the backing on: the colour is in the chord under the notes.',
          ],
        },
        {
          id: 'pent-major-chord', title: 'Minor pentatonics on a major chord',
          idea: 'On the 3rd, the 6th and the 7th of a major chord, the minor box adds colour.',
          concept: [
            'Over a major chord three minor pentatonics add colour without leaving it. Over C, the one on the 3rd (E minor) is bright and lifting; the one on the 6th (A minor, the relative minor) is open and sweet; the one on the 7th (B minor) brings the F♯, a ♯11: the floating Lydian sound, still major.',
            'Keep the groove plain (root, 5th and octave) and put the colour in the fill at the end of the phrase. The plainer the groove, the more the fill stands out.',
          ],
          steps: [
            { ex: 'sc-pent-major-chord', p: { lick: '0' }, from: 70, goal: 96, backing: 'chords', do: 'Three bars of roots and 5ths, then a fill from the minor pentatonic on the 3rd.' },
            { ex: 'sc-pent-major-chord', p: { lick: '1' }, from: 70, goal: 96, backing: 'chords', do: 'The fill from the minor pentatonic on the 6th: the scale in time, landing home.' },
            { ex: 'sc-pent-major-chord', p: { lick: '2' }, from: 70, goal: 96, backing: 'chords', do: 'The fill from the minor pentatonic on the 7th: the Lydian ♯4.' },
            { ex: 'sc-pent-major-chord', p: { lick: '3' }, from: 70, goal: 96, backing: 'chords', music: true, do: 'All three in turn, a groove between each.' },
          ],
          mistakes: [
            'Colour in every bar. A fill at the end of the phrase is enough.',
            'Not landing back on the root: the colour only works when the groove comes home.',
          ],
        },
        {
          id: 'pent-groove-fill', title: 'Groove bar, fill bar',
          idea: 'A bar that holds the band down, a bar that answers it up the neck.',
          concept: [
            'A classic bass phrase is two bars long: a groove low on the neck, then a fill up high that answers it. Here the groove stays on Cm7 and the chord under the fill changes from phrase to phrase (Cm7, D♭maj7, B♭7sus4, A♭maj7), while the fill stays in the C minor pentatonic.',
            'The move between registers is part of the exercise: shift during the last beat of the groove, land the fill in time and be back on the low root for beat 1.',
          ],
          steps: [
            { ex: 'sc-pent-groove-fill', p: { lick: '0' }, from: 66, goal: 92, backing: 'chords', do: 'Groove, then the fill over the same chord. Shift on the last beat of the groove.' },
            { ex: 'sc-pent-groove-fill', p: { lick: '1' }, from: 66, goal: 92, backing: 'chords', do: 'The fill over D♭maj7: Lydian colours from the same box.' },
            { ex: 'sc-pent-groove-fill', p: { lick: '2' }, from: 66, goal: 92, backing: 'chords', do: 'The fill over B♭7sus4.' },
            { ex: 'sc-pent-groove-fill', p: { lick: '4' }, from: 66, goal: 92, backing: 'chords', music: true, do: 'All four in a row. Then keep the groove and make up each fill.' },
          ],
          mistakes: [
            'Arriving late on beat 1 after the fill. The groove starts exactly on time.',
            'Shifting on the first note of the fill. Move during the last beat of the groove.',
          ],
        },
      ],
      check: {
        can: [
          'I can keep one pentatonic phrase while the chords change and hear each new colour.',
          'I can colour a major chord with the minor pentatonics on its 3rd, 6th and 7th.',
          'I can play a groove bar and a fill bar up the neck without losing beat 1.',
        ],
        steps: [
          { ex: 'sc-pent-one-phrase', p: { lick: '3' }, from: 80, goal: 104, backing: 'chords' },
          { ex: 'sc-pent-major-chord', p: { lick: '3' }, from: 80, goal: 104, backing: 'chords' },
          { ex: 'sc-pent-groove-fill', p: { lick: '4' }, from: 76, goal: 100, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-minor', title: 'Minor scales and minor harmony',
      goal: 'Harmonic and melodic minor, the chords they make, and minor-key progressions.',
      lessons: [
        {
          id: 'harmonic-melodic', title: 'Harmonic and melodic minor',
          idea: 'Raise the 7th: harmonic minor. Raise the 6th too: melodic minor.',
          concept: [
            'Harmonic minor raises the 7th of natural minor, which creates the exotic augmented 2nd (♭6 to 7, a three-fret gap) and a strong pull back to the root. Melodic minor also raises the 6th: it sounds like major with a ♭3, and it is the parent of the altered and Lydian dominant scales.',
            'Jazz players use melodic minor the same going up and coming down, as the app does.',
          ],
          steps: [
            { ex: 'sc-minor-family', p: { pattern: 'g4', type: 'harmonicMinor', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Harmonic minor in groups of 4. Feel the three-fret gap.' },
            { ex: 'sc-minor-family', p: { pattern: 'g4', type: 'melodicMinor', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Melodic minor: major with a ♭3.' },
          ],
          mistakes: [
            'Playing the augmented 2nd as a whole step. It is three frets.',
          ],
        },
        {
          id: 'minor-triads', title: 'The chords of the minor keys',
          idea: 'Raising the 7th turns v into V: the chord that pulls home.',
          concept: [
            'Natural minor gives i ii° ♭III iv v ♭VI ♭VII. Harmonic minor raises the 7th, so v becomes a major V and ♭III becomes augmented. Melodic minor also raises the 6th: i ii ♭III+ IV V vi° vii°. These chords are behind most minor-key music and jazz.',
            'Say the Roman numeral of each chord as you play it.',
          ],
          steps: [
            { ex: 'tri-diatonic-minor', p: { scale: 'harmonicMinor', order: 'up', pattern: 'up' }, sub: 2, from: 66, goal: 92, do: 'The triads of harmonic minor. Hear the major V.' },
            { ex: 'tri-diatonic-minor', p: { scale: 'melodicMinor', order: 'up', pattern: 'up' }, sub: 2, from: 66, goal: 92, do: 'The triads of melodic minor.' },
          ],
          mistakes: [
            'Playing the V of a minor key as minor. With the raised 7th it is major.',
          ],
        },
        {
          id: 'minor-harmony', title: 'Minor-key progressions',
          idea: 'The leading tone (the 3rd of V7) resolves up to the root.',
          concept: [
            'In a minor key the V chord is usually made major (V7) by raising the 7th. Play the chord tones of the most common minor progressions and hear the leading tone pull back to the root.',
            'The Andalusian cadence (i–♭VII–♭VI–V) is the sound of flamenco and countless rock songs. In jazz the i chord is often m6 or m(maj7): the minor triad with the major 6th or the raised 7th on top.',
          ],
          steps: [
            { ex: 'hm-minor-keys', p: { prog: 'i-iv-V-i', pattern: 'r357' }, from: 84, goal: 104, backing: 'chords', do: 'i–iv–V–i with R-3-5-7. Find the raised 7th in the V chord.' },
            { ex: 'hm-minor-keys', p: { prog: 'i-bVII-bVI-V', pattern: 'r357' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'The Andalusian cadence with the chords.' },
          ],
          mistakes: [
            'Missing the raised 7th over V. It is the note that makes the cadence work.',
          ],
        },
      ],
      check: {
        can: [
          'I can play harmonic and melodic minor in any key.',
          'I know the chords of the minor keys and why V is major.',
          'I can outline minor-key progressions with chord tones.',
        ],
        steps: [
          { ex: 'sc-minor-family', p: { pattern: 'thirds', type: 'harmonicMinor', oct: '1' }, sub: 2, from: 72, goal: 96 },
          { ex: 'hm-minor-keys', p: { prog: 'minor-ii-V-i', pattern: 'r357' }, from: 92, goal: 112, backing: 'chords' },
          { ex: 'tri-diatonic-minor', p: { scale: 'harmonicMinor', order: 'up', pattern: 'up' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-modes4', title: 'The modes at work',
      goal: 'Each mode on its own terms, the right scale on every chord, and progressions by ear.',
      lessons: [
        {
          id: 'mode-study', title: 'Each mode on its own',
          idea: 'Dorian is 1 2 ♭3 4 5 6 ♭7, not "C major from D".',
          concept: [
            'Drill each mode like a scale in its own right: straight, in sequences, in one key or all 12. Learn its formula (Dorian: 1 2 ♭3 4 5 6 ♭7) and its chord (Dorian with m7, Lydian with maj7♯11, Mixolydian with 7).',
            'That is what makes a mode usable: you think from its own root.',
          ],
          steps: [
            { ex: 'md-study', p: { type: 'dorian', pattern: 'g4', oct: '1', root: 'E' }, sub: 2, from: 66, goal: 92, do: 'Dorian in groups of 4.' },
            { ex: 'md-study', p: { type: 'mixolydian', pattern: 'thirds', oct: '1', root: 'E' }, sub: 2, from: 66, goal: 92, do: 'Mixolydian in 3rds.' },
            { ex: 'md-study', p: { type: 'lydian', pattern: 'g3', oct: '1', root: 'E' }, sub: 3, from: 60, goal: 80, do: 'Lydian in groups of 3, as triplets.' },
          ],
          mistakes: [
            'Thinking of the parent major scale while you play. Think from the mode\'s own root.',
          ],
        },
        {
          id: 'chord-scale', title: 'The right scale on every chord',
          idea: 'Each chord implies a scale, chosen by its job in the key.',
          concept: [
            'Each chord implies a scale, chosen by its function in the key: I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, viiø Locrian; in a minor key a V7 that resolves to a minor chord takes Phrygian dominant (harmonic minor from its 5th note, with ♭9 and ♭13; Stage 5 looks at it closely). Chords from outside the key take the scale of their quality.',
            'Notice how few notes change between neighbouring chords: that is why scalar lines flow.',
          ],
          steps: [
            { ex: 'md-chord-scale', p: { prog: 'ii-V-I' }, from: 80, goal: 100, backing: 'chords', do: 'Dorian, Mixolydian, Ionian over ii–V–I. Which notes change?' },
            { ex: 'md-chord-scale', p: { prog: 'autumn' }, from: 80, goal: 96, backing: 'chords', do: 'A longer progression, into the relative minor.' },
          ],
          mistakes: [
            'Choosing the scale by the chord\'s name alone. The function in the key decides (iii is Phrygian, not Dorian).',
          ],
        },
        {
          id: 'hear-progressions', title: 'Hear the progression',
          idea: 'The bass line is the progression: sing the roots back.',
          concept: [
            'Hearing progressions is hearing the bass. Each chord plays as its root, then the chord above it, with the notes hidden. Follow the root movement and the quality of each chord, and name the progression in Roman numerals before the answer appears.',
            'Listen for the V chord: it pulls back to I. In minor keys, ♭VI and ♭VII are major chords a whole step apart.',
          ],
          steps: [
            { ex: 'ear-progressions', p: { set: 'pop' }, do: 'Pop and rock progressions: name the numerals.' },
            { ex: 'ear-progressions', p: { set: 'jazz' }, do: 'Jazz progressions: ii–V–I and turnarounds.' },
          ],
          mistakes: [
            'Trying to hear every chord at once. Follow the roots first.',
          ],
        },
      ],
      check: {
        can: [
          'I know the formula and chord of each mode.',
          'I choose the right scale for each chord of a progression.',
          'I can name common progressions by ear.',
        ],
        steps: [
          { ex: 'md-chord-scale', p: { prog: 'ii-V-I' }, from: 88, goal: 112, backing: 'chords' },
          { ex: 'ear-progressions', p: { set: 'jazz' } },
          { ex: 'md-study', p: { type: 'dorian', pattern: 'g4', oct: '1', root: 'E' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-triads4', title: 'Triads in the key',
      goal: 'The triads of a key in inversions and in 4ths, open voicings and two octaves.',
      lessons: [
        {
          id: 'key-inversions', title: 'The triads of a key in inversions',
          idea: 'Every chord from its 3rd, then from its 5th.',
          concept: [
            'Play every chord of the key in 1st inversion (3-5-R) or 2nd inversion (5-R-3). You get new shapes and new lines: these are the inversions that make bass lines move smoothly.',
            'Say the Roman numeral of each chord as you play it.',
          ],
          steps: [
            { ex: 'tri-diatonic-inversions', p: { scale: 'ionian', order: 'up', pattern: 'turn', inversion: '1' }, sub: 2, from: 66, goal: 92, do: '1st inversion through the key.' },
            { ex: 'tri-diatonic-inversions', p: { scale: 'ionian', order: 'up', pattern: 'turn', inversion: '2' }, sub: 2, from: 66, goal: 92, do: '2nd inversion through the key.' },
          ],
          mistakes: [
            'Losing track of the root. The chord\'s name is its root, even when another note is the lowest.',
          ],
        },
        {
          id: 'key-fourths', title: 'The key in 4ths',
          idea: 'I-IV-vii°-iii-vi-ii-V-I: the order real progressions move in.',
          concept: [
            'Root movement by 4ths (or 5ths down) is the backbone of real progressions: vi–ii–V–I, iii–vi–ii–V. This drills the cycle inside one key, so the progressions you meet later already feel familiar.',
            'Up one, down the next turns the cycle into a line.',
          ],
          steps: [
            { ex: 'tri-diatonic-4ths', p: { scale: 'ionian', pattern: 'alt', inversion: '0' }, sub: 2, from: 66, goal: 96, do: 'The triads of the key in 4ths.' },
            { ex: 'tri-diatonic-4ths', p: { scale: 'aeolian', pattern: 'alt', inversion: '0' }, sub: 2, from: 66, goal: 96, do: 'The same in natural minor.' },
          ],
          mistakes: [
            'Hearing it as random chords. Listen to the roots falling by 5ths: that is the pull of the cycle.',
          ],
        },
        {
          id: 'open-triads', title: 'Open triads and two octaves',
          idea: 'Move the 3rd up an octave: R-5-10.',
          concept: [
            'Move the 3rd up an octave and you get the open voicing R-5-10: a wide, orchestral sound that crosses strings and teaches the hand to leap. Play it through the key.',
            'A triad over two octaves needs a shift at the octave: plan it, and use the same shift on the way down.',
          ],
          steps: [
            { ex: 'tri-open-spread', p: { key: '5', scale: 'ionian', order: 'up', pattern: 'up', inversion: '0', root: 'E' }, sub: 2, from: 60, goal: 88, do: 'R-5-10 through F major, from the E string: frets 1 to 15.' },
            { ex: 'tri-two-octaves', p: { quality: 'maj', root: 'E' }, sub: 2, from: 60, goal: 88, do: 'Two octaves of a major triad. Shift on the octave.' },
          ],
          mistakes: [
            'Jumping for the shift. Slide on the finger that just played.',
          ],
        },
      ],
      check: {
        can: [
          'I can play the triads of a key in any inversion.',
          'I can play the triads of a key in 4ths.',
          'I can play open triads and two-octave triads.',
        ],
        steps: [
          { ex: 'tri-diatonic-inversions', p: { scale: 'ionian', order: 'fourths', pattern: 'alt', inversion: '1' }, sub: 2, from: 72, goal: 100 },
          { ex: 'tri-two-octaves', p: { key: '7', quality: 'min', root: 'E' }, sub: 2, from: 72, goal: 96 },
          { ex: 'tri-open-spread', p: { key: '5', scale: 'ionian', order: 'up', pattern: 'up', inversion: '0', root: 'E' }, sub: 2, from: 66, goal: 92 },
        ],
      },
    },
    {
      id: 'u-voicelead', title: 'Voice leading',
      goal: 'One note per string, the nearest chord tone, ii–V–I lines and guide tones.',
      lessons: [
        {
          id: 'string-sets', title: 'Triads on every string set',
          idea: 'One note per string, three strings at a time.',
          concept: [
            'Here each note of the triad sits on its own string, across three neighbouring strings. On each string set you play root position and both inversions. These are the shapes chordal bassists and soloists use.',
            'Use one finger per note, so each shape could ring as a chord.',
          ],
          steps: [
            { ex: 'tri-string-sets', p: { quality: 'maj' }, sub: 2, from: 60, goal: 84, do: 'Major triads on each string set.' },
            { ex: 'tri-string-sets', p: { quality: 'min' }, sub: 2, from: 60, goal: 84, do: 'Minor triads.' },
          ],
          mistakes: [
            'Two notes on one string. In these shapes every note has its own string.',
          ],
        },
        {
          id: 'voice-led-triads', title: 'Voice-led triads',
          idea: 'Start each chord on the chord tone nearest to where you are.',
          concept: [
            'Instead of always starting on the root, start each new triad on the chord tone closest to the last note. That picks the right inversion by itself, and the cycle of 4ths becomes one continuous melodic line: the way bass players, pianists and arrangers connect chords.',
            'Then put it to work over real progressions.',
          ],
          steps: [
            { ex: 'tri-voice-led-cycle', p: { order: 'cycle4', quality: 'maj', pattern: 'alt', voicing: 'nearest' }, sub: 2, from: 66, goal: 96, do: 'Twelve major triads around the cycle, each from the nearest note.' },
            { ex: 'tri-progressions', p: { prog: 'I-V-vi-IV', pattern: 'turn', voicing: 'nearest' }, sub: 1, from: 84, goal: 108, backing: 'chords', music: true, do: 'Voice-led triads over I–V–vi–IV with the chords.' },
          ],
          mistakes: [
            'Jumping back to the root out of habit. Compare "Root only": hear how much the hand jumps.',
          ],
        },
        {
          id: 'ii-v-i-lines', title: 'ii–V–I arpeggios',
          idea: 'The most important progression in jazz, through all 12 keys.',
          concept: [
            'The ii–V–I is the most important progression in jazz and very common in pop and soul. Arpeggiate each chord, starting each new one from the tone nearest the previous note, and go through all 12 keys.',
            'Listen for the guide tones (3rds and 7ths): they move by step.',
          ],
          steps: [
            { ex: 'arp-ii-v-i', p: { type: 'major', key: 'cycle4', pattern: 'alt', voicing: 'nearest' }, from: 72, goal: 96, do: 'Major ii–V–I in all 12 keys.' },
            { ex: 'arp-voice-led', p: { prog: 'autumn', pattern: 'alt' }, from: 72, goal: 96, backing: 'chords', do: 'Voice-led 7th arpeggios through a longer form, every chord its full length.' },
          ],
          mistakes: [
            'Restarting every chord from its root. Continue from the nearest chord tone.',
          ],
        },
        {
          id: 'guide-tones', title: 'Guide tones and shells',
          idea: 'The 3rd and 7th tell you the chord; they move by half steps.',
          concept: [
            'The 3rd and the 7th define a chord\'s quality. In a ii–V–I the 7th of one chord falls a half step to the 3rd of the next, and the 3rd stays to become the 7th. Playing only these guide tones shows how harmony moves.',
            'A shell voicing keeps root, 7th and 3rd: the root on the E string, the 7th two strings up on the D string and the 3rd, as a 10th, on the G string.',
          ],
          steps: [
            { ex: 'arp-guide-tones', p: { prog: 'ii-V-I', start: '3' }, from: 72, goal: 96, backing: 'chords', do: 'Guide tones from the 3rd. Sing the line.' },
            { ex: 'hm-shells', p: { prog: 'ii-V-I' }, from: 60, goal: 80, backing: 'chords', do: 'Shell voicings R-7-10: arpeggio, then all three together.' },
          ],
          mistakes: [
            'Hearing guide tones as random notes. They move by half steps or stay put.',
          ],
        },
      ],
      check: {
        can: [
          'I can play triads on every string set.',
          'I connect chords by moving to the nearest chord tone.',
          'I can play guide tones and shells through a ii–V–I.',
        ],
        steps: [
          { ex: 'tri-progressions', p: { prog: 'I-vi-ii-V', pattern: 'turn', voicing: 'nearest' }, sub: 1, from: 96, goal: 116, backing: 'chords' },
          { ex: 'arp-guide-tones', p: { prog: 'ii-V-I', start: '3' }, from: 80, goal: 104, backing: 'chords' },
          { ex: 'tri-string-sets', p: { quality: 'maj' }, sub: 2, from: 66, goal: 92 },
          { ex: 'hm-shells', p: { prog: 'ii-V-I' }, from: 66, goal: 88, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-sevenths4', title: '7th chords over two octaves',
      goal: '7th chords in all their inversions and over two octaves.',
      lessons: [
        {
          id: 'seventh-inversions', title: '7th chord inversions',
          idea: 'Root position and three inversions, climbing the neck.',
          concept: [
            'Each inversion starts on the next chord tone. Climb through root position and the three inversions, then come back down: it builds your view of a chord across two octaves, which voice leading and chordal playing need.',
            'Keep the degree labels on and know where the root is at all times.',
          ],
          steps: [
            { ex: 'arp-inversions', p: { quality: 'maj7' }, sub: 2, from: 60, goal: 88, do: 'Major 7th inversions.' },
            { ex: 'arp-inversions', p: { quality: 'min7' }, sub: 2, from: 60, goal: 88, do: 'Minor 7th inversions.' },
          ],
          mistakes: [
            'Losing the root in the 3rd inversion, which starts on the 7th.',
          ],
        },
        {
          id: 'two-octave-7ths', title: 'Two-octave 7th arpeggios',
          idea: 'Plan the shift at the octave and keep it the same coming down.',
          concept: [
            'Two-octave arpeggios are typical of the intermediate grades of graded exams. Play the first octave in position, shift at the octave and repeat the shape higher.',
            'Plan the shift and keep it identical on the way down.',
          ],
          steps: [
            { ex: 'arp-two-octaves', p: { quality: 'maj7', shape: 'updown' }, sub: 2, from: 60, goal: 88, do: 'Major 7 over two octaves.' },
            { ex: 'arp-two-octaves', p: { quality: 'dom7', shape: 'updown' }, sub: 2, from: 60, goal: 88, do: 'Dominant 7 over two octaves.' },
          ],
          mistakes: [
            'A new fingering on the way down. Mirror the way up.',
          ],
        },
        {
          id: 'key-7th-inversions', title: 'The 7th chords of a key in inversions',
          idea: 'Smooth, scale-like lines from chords.',
          concept: [
            'Inversions of 7th chords give smooth, scale-like bass lines. Move through the key with each chord in the same inversion, then mix them.',
            'Start each chord from its 3rd, its 5th or its 7th.',
          ],
          steps: [
            { ex: 'arp-diatonic-inversions', p: { scale: 'ionian', order: 'up', pattern: 'alt', inversion: '1' }, sub: 2, from: 66, goal: 92, do: 'Every chord from its 3rd.' },
            { ex: 'arp-diatonic-inversions', p: { scale: 'ionian', order: 'up', pattern: 'alt', inversion: '3' }, sub: 2, from: 66, goal: 92, do: 'Every chord from its 7th.' },
          ],
          mistakes: [
            'Playing the shapes without the sound. Name each chord as you go.',
          ],
        },
      ],
      check: {
        can: [
          'I can play any 7th chord in all its inversions.',
          'I can play 7th arpeggios over two octaves.',
        ],
        steps: [
          { ex: 'arp-inversions', p: { quality: 'min7' }, sub: 2, from: 72, goal: 96 },
          { ex: 'arp-two-octaves', p: { quality: 'dom7', shape: 'updown' }, sub: 2, from: 72, goal: 96 },
        ],
      },
    },
    {
      id: 'u-tenths', title: '10ths and octaves',
      goal: 'Diatonic 10ths and scales in octaves, broken and as double stops.',
      lessons: [
        {
          id: 'tenths', title: 'Diatonic 10ths',
          idea: 'Root on the E string, 10th on the G string: big, piano-like harmony.',
          concept: [
            'A 10th is a 3rd plus an octave. Play the scale on the E string and add the diatonic 10th on the G string: one fret higher for a major 10th, the same fret for a minor 10th. Broken or as double stops, it is the sound of Jaco\'s ballads and Motown-era chordal bass.',
            'Pluck the E string with the thumb and the G string with a finger, and mute the A and D strings with the fretting hand.',
          ],
          steps: [
            { ex: 'iv-tenths', p: { mode: 'broken', scale: 'ionian' }, sub: 2, from: 60, goal: 84, do: 'Broken 10ths up the major scale.' },
            { ex: 'iv-tenths', p: { mode: 'stop', scale: 'ionian' }, sub: 2, from: 56, goal: 72, do: 'As double stops: both notes together.' },
          ],
          mistakes: [
            'The middle strings ringing. Lay the fretting fingers across them.',
          ],
        },
        {
          id: 'scale-octaves', title: 'Scales in octaves',
          idea: 'Every note with its octave: a strong, unison-like sound.',
          concept: [
            'Play each note of the scale together with its octave as a double stop. It is the big unison sound of rock riffs and solo bass, and it drills the octave shape until it is automatic.',
            'Pluck the two strings together with two fingers (or thumb and finger) and mute the string in between with the index finger.',
          ],
          steps: [
            { ex: 'iv-scale-octaves', p: { scale: 'ionian', root: 'E' }, sub: 1, from: 60, goal: 84, do: 'The major scale in octaves.' },
            { ex: 'iv-scale-octaves', p: { scale: 'minorPent', root: 'E' }, sub: 1, from: 60, goal: 84, do: 'Minor pentatonic in octaves: riff material.' },
          ],
          mistakes: [
            'One note louder than the other. Both at the same volume.',
          ],
        },
      ],
      check: {
        can: [
          'I can play diatonic 10ths in any key.',
          'I can play a scale in octaves with the middle string silent.',
        ],
        steps: [
          { ex: 'iv-tenths', p: { mode: 'stop', scale: 'ionian' }, sub: 2, from: 60, goal: 84 },
          { ex: 'iv-scale-octaves', p: { scale: 'minorPent', root: 'E' }, sub: 1, from: 66, goal: 92 },
        ],
      },
    },
    {
      id: 'u-walking4', title: 'Walking bass',
      goal: 'Approach notes, scale steps and complete walking lines.',
      lessons: [
        {
          id: 'walk-approach', title: 'Walking with approach notes',
          idea: 'Chord tones on beats 1–3, an approach on beat 4.',
          concept: [
            'Play chord tones on beats 1 to 3 and on beat 4 approach the next chord\'s root from a half step below or above. The approach note creates the forward motion that makes walking bass swing.',
            'Know the next root before you choose the approach, and mix approaches from below and above.',
          ],
          steps: [
            { ex: 'wk-approach', p: { prog: 'jazz-blues' }, from: 100, goal: 126, backing: 'chords', do: 'A jazz blues with chromatic approaches on beat 4.' },
          ],
          mistakes: [
            'Approaching the wrong root. Look ahead to the next chord first.',
          ],
        },
        {
          id: 'walk-scalar', title: 'Scale steps in walking lines',
          idea: 'Scale steps connect the chord tones smoothly.',
          concept: [
            'Lines like R-2-3-5, or 8-7-6-5 coming down, are the melodic side of walking and balance the jumps of arpeggio lines. Each chord takes its scale by function, as in Lesson 31.2: Dorian on a ii, Mixolydian on a V, Aeolian on a minor i, and Phrygian dominant on a V7 that resolves to a minor chord.',
            'Land a chord tone on beat 1; the scale steps lead into the next chord.',
          ],
          steps: [
            { ex: 'wk-scalar', p: { prog: 'autumn' }, from: 100, goal: 126, backing: 'chords', do: 'Scalar lines through ii–V–I–IV–iiø–V–i.' },
          ],
          mistakes: [
            'Scale steps that land a passing note on beat 1. Beat 1 belongs to the root.',
          ],
        },
        {
          id: 'walk-mixed', title: 'Complete walking lines',
          idea: 'Arpeggios, scale runs and approaches, chosen bar by bar.',
          concept: [
            'Real walking bass mixes all the devices: arpeggios, scale runs, chromatic approaches and dominant (5th) approaches, chosen bar by bar. These lines rotate between them over standard progressions.',
            'Follow the contour: a line that climbs should come back down.',
          ],
          steps: [
            { ex: 'wk-mixed', p: { prog: 'jazz-blues' }, from: 104, goal: 132, backing: 'chords', music: true, do: 'A jazz blues walking line with every device.' },
            { ex: 'wk-mixed', p: { prog: 'I-vi-ii-V' }, from: 104, goal: 132, backing: 'chords', do: 'A turnaround, I–vi–ii–V, one chord per bar.' },
          ],
          mistakes: [
            'Playing the same device every bar. Mix them, and listen to the shape of the line.',
          ],
        },
      ],
      check: {
        can: [
          'I can walk through a jazz blues with approach notes.',
          'I mix arpeggios, scale steps and approaches in one line.',
        ],
        steps: [
          { ex: 'wk-mixed', p: { prog: 'autumn' }, from: 112, goal: 140, backing: 'chords' },
          { ex: 'wk-approach', p: { prog: 'jazz-blues' }, from: 108, goal: 132, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-grooves4', title: 'Soul, odd metres and slap',
      goal: 'Soul and neo-soul feel, grooves in odd metres, and slap with hammers and pull-offs.',
      lessons: [
        {
          id: 'soul', title: 'Soul and neo-soul',
          idea: 'Space and feel: behind the beat, but the root lands on 1.',
          concept: [
            'Soul bass is about space and feel. The neo-soul line (D\'Angelo, Pino Palladino) sits behind the beat with ghost notes and leans on the chord\'s 7th. The soul ballad holds the root for two beats, then walks through the 3rd and a chromatic approach into the next chord.',
            'Play slightly late, but always land the root on 1, and let the long notes ring.',
          ],
          steps: [
            { ex: 'gr-soul', p: { style: 'neoSoul' }, from: 66, goal: 84, backing: 'chords', music: true, do: 'Neo-soul: laid back, with ghost notes.' },
            { ex: 'gr-soul', p: { style: 'soulBallad' }, from: 60, goal: 76, backing: 'chords', do: 'A soul ballad: long roots and passing tones.' },
          ],
          mistakes: [
            'Laid back turning into late on beat 1. The root lands on time.',
          ],
        },
        {
          id: 'odd-grooves', title: 'Grooves in odd metres',
          idea: 'Loop it until it feels natural rather than counted.',
          concept: [
            'Odd metres (5/4, 7/8, 7/4) are everywhere in prog, fusion, Balkan and film music, and 6/8 is the compound metre of ballads and Afro-Cuban grooves. Each groove puts its strongest notes at the start of the beat groups.',
            'Say the groups as you play, and watch the last group: that is where most players rush.',
          ],
          steps: [
            { ex: 'gr-odd-meters', p: { meter: '54' }, from: 100, goal: 132, do: 'A 5/4 groove (3+2).' },
            { ex: 'gr-odd-meters', p: { meter: '68' }, from: 100, goal: 132, do: '6/8: two groups of three.' },
            { ex: 'gr-odd-meters', p: { meter: '78' }, from: 120, goal: 160, do: '7/8 (2+2+3).' },
          ],
          mistakes: [
            'Counting every beat with the same weight. Feel the groups.',
          ],
        },
        {
          id: 'slap-grooves', title: 'Slap grooves', optional: true,
          idea: 'Thumb ghosts, hammers, pops and pull-offs fill the 16th grid.',
          concept: [
            'Real slap lines fill the 16th grid with thumb ghosts (x), hammered notes (H), pops (P) and pull-offs (PO). These patterns combine them over a funk vamp. Optional, for players who slap.',
            'The x is a thumb on a muted string: percussive, no pitch. Hammer from the thumb note to the next with no pluck.',
          ],
          steps: [
            { ex: 'sl-grooves', p: { style: 'tmp' }, from: 70, goal: 92, backing: 'chords', do: 'Thumb, mute, pop in 16ths.' },
            { ex: 'sl-grooves', p: { style: 'hammer' }, from: 70, goal: 88, backing: 'chords', do: 'Thumb, hammer, pop, pull-off.' },
          ],
          mistakes: [
            'Uneven 16ths between thumb, pop and hammer. The grid stays perfectly even.',
          ],
        },
      ],
      check: {
        can: [
          'I can play neo-soul and soul-ballad lines with the right feel.',
          'I can groove in 5/4, 6/8 and 7/8.',
        ],
        steps: [
          { ex: 'gr-soul', p: { style: 'neoSoul' }, from: 76, goal: 92, backing: 'chords' },
          { ex: 'gr-odd-meters', p: { meter: '78' }, from: 130, goal: 170 },
          { ex: 'gr-soul', p: { style: 'soulBallad' }, from: 66, goal: 84, backing: 'chords' },
        ],
      },
    },
  ],
  check: {
    can: [
      'I can play 16ths for minutes and keep time with a sparse click.',
      'I can play in odd metres and with displaced figures.',
      'I can play any key in any position, and read in every key.',
      'I can choose the right scale for every chord of a progression.',
      'I connect chords by voice leading, and I can play guide tones.',
      'I can walk a complete line through a jazz blues.',
    ],
    steps: [
      { ex: 'rh-sparse-click', p: { every: '4' }, from: 90, goal: 116 },
      { ex: 'sc-positions', p: { pos: 'all', type: 'aeolian' }, sub: 2, from: 80, goal: 104 },
      { ex: 'md-chord-scale', p: { prog: 'minor-ii-V-i' }, from: 92, goal: 112, backing: 'chords' },
      { ex: 'arp-voice-led', p: { prog: 'jazz-blues', pattern: 'alt' }, from: 84, goal: 108, backing: 'chords' },
      { ex: 'wk-mixed', p: { prog: 'jazz-blues' }, from: 120, goal: 148, backing: 'chords' },
      { ex: 'rh-displacement', p: { step: '0.25' }, from: 72, goal: 92 },
      { ex: 'rd-keys', p: { mode: 'minor' }, from: 60, goal: 80 },
      { ex: 'mm-criminal', p: { part: 'all' }, from: 84, goal: 112, backing: 'chords', music: true, do: 'Make music: a 16th-note octave engine, then a half-time groove with ghost notes.' },
      { ex: 'mm-goodtimes', p: { part: 'all' }, from: 84, goal: 108, backing: 'chords', music: true, do: 'Make music: disco 16ths with octave flicks over two chords.' },
    ],
  },
};
