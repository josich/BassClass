// Course Stage 5: Jazz language (Level 5). See ../data.js for the format.
export default {
  id: 's5', title: 'Jazz language', level: 5,
  desc: 'Advanced hands and polyrhythms, symmetric and outside sounds, bebop scales and approaches, the modes of melodic and harmonic minor, superimposition, modern triad and arpeggio vocabulary, colour chords, advanced walking, and jazz licks and solo devices.',
  units: [
    {
      id: 'u-hands5', title: 'Advanced hands and polyrhythms',
      goal: 'Permutations across the strings, p-i-m arpeggios, polyrhythms and sweeps.',
      lessons: [
        {
          id: 'perm-across', title: 'Permutations across the strings',
          idea: 'Each finger keeps its fret; every note moves to the next string.',
          concept: [
            'A harder take on the 24 permutations: the four fingers stay in their frets (one finger per fret), but every note moves to the next string. Permutation 1-3-2-4 becomes E string finger 1, A finger 3, D finger 2, G finger 4. Both hands cross strings on every note: one of the most demanding coordination drills there is.',
            'Rake on the way back down, and pick the permutations that are hardest for you rather than all 24.',
          ],
          steps: [
            { ex: 'tech-permutations-across', p: { perm: '1324', pos: '5' }, sub: 2, from: 56, goal: 76, do: '1-3-2-4 across the strings.' },
            { ex: 'tech-permutations-across', p: { perm: '4231', pos: '5' }, sub: 2, from: 56, goal: 72, do: '4-2-3-1: start with the little finger.' },
          ],
          mistakes: [
            'Moving a finger out of its fret to make a string change easier. Each finger owns its fret.',
          ],
        },
        {
          id: 'pim', title: 'Thumb, index and middle',
          idea: 'Thumb for the bass, fingers for the upper strings, like a classical guitarist.',
          concept: [
            'Chordal and solo bassists use the thumb (p) for the bass notes and the index and middle fingers (i, m) for the upper strings. One plucking finger per string lets you play wide arpeggios at speed. The pattern spreads each chord as root (p), 5th (i), 10th (m), 5th (i).',
            'Keep the thumb slightly ahead of the fingers so the hand does not collapse, and let the notes ring.',
          ],
          steps: [
            { ex: 'tech-pim', p: { prog: 'I-vi-IV-V' }, sub: 2, from: 66, goal: 92, do: 'p-i-m-i on each chord, in 8ths.' },
            { ex: 'tech-pim', p: { prog: 'ii-V-I' }, sub: 4, from: 56, goal: 72, do: 'The same in 16ths over ii–V–I.' },
          ],
          mistakes: [
            'Plucking every string with i and m. The thumb takes the bass note.',
          ],
        },
        {
          id: 'polyrhythms', title: 'Polyrhythms',
          idea: 'N even notes over M beats: the click keeps the beat, you play the other layer.',
          concept: [
            'A polyrhythm spreads N even notes over M beats. 3:2 is three notes across two beats (the hemiola), 4:3 is four over three, 5:4 is five notes per bar of four. The click keeps the beat while you play the other layer: advanced time feel, heard in Afro-Cuban music, prog and modern jazz.',
            'Find the common grid first: 3:2 lives on a grid of six. Clap the click and say the polyrhythm before you play it.',
          ],
          steps: [
            { ex: 'rh-polyrhythm', p: { ratio: '3:2' }, from: 56, goal: 76, do: 'Three over two beats.' },
            { ex: 'rh-polyrhythm', p: { ratio: '4:3' }, from: 56, goal: 72, do: 'Four over three.' },
            { ex: 'rh-polyrhythm', p: { ratio: '5:4' }, from: 50, goal: 66, do: 'Five over a bar of four.' },
          ],
          mistakes: [
            'Letting the notes drift back onto the click. Only the first note of each group meets it.',
          ],
        },
        {
          id: 'sweeps', title: 'Sweep picking',
          idea: 'One note per string, one motion: the hand falls through the strings like a brush.',
          concept: [
            'An arpeggio with one note per string can be played in a single motion. With a pick, the pick falls through the strings going up (↓ ↓ ↓ ↓) and comes back through them going down (↑ ↑ ↑). With the fingers the same economy is raking: alternate i and m going up the strings, and let one finger fall through them coming down.',
            'Each note must stop as the next one sounds, or the arpeggio blurs into a strummed chord: lift or roll each fretting finger as soon as its note has played. Start with the R-5-8-10 triad (one hand shape on four strings), then 7th chords.',
          ],
          steps: [
            { ex: 'tech-sweep', p: { shape: 'spread', hand: 'pick', prog: 'i-bVI-bIII-bVII' }, from: 50, goal: 72, do: 'R-5-8-10 with a pick: ↓ up the strings, ↑ back down. Stop each note as the next one sounds.' },
            { ex: 'tech-sweep', p: { shape: 'seventh', hand: 'pick', prog: 'ii-V-I' }, from: 50, goal: 72, do: '7th chords R-5-7-10 through ii–V–I.' },
            { ex: 'tech-sweep', p: { shape: 'spread', hand: 'fingers', prog: 'I-V-vi-IV' }, from: 50, goal: 72, do: 'The same with the fingers: alternate going up, rake coming down.' },
          ],
          mistakes: [
            'Letting the notes ring together. A sweep is a line, not a strum.',
            'Rushing the turn at the top: the last note up and the first note down get the same time as the others.',
          ],
        },
      ],
      check: {
        can: [
          'I can play finger permutations across the strings.',
          'I play chord arpeggios with p-i-m.',
          'I can play 3:2, 4:3 and 5:4 against the click.',
          'I can sweep a triad and a 7th chord across four strings, with a pick or with the fingers.',
        ],
        steps: [
          { ex: 'tech-permutations-across', p: { perm: 'all', pos: '5' }, sub: 2, from: 60, goal: 76 },
          { ex: 'rh-polyrhythm', p: { ratio: '5:4' }, from: 56, goal: 72 },
          { ex: 'tech-pim', p: { prog: 'I-vi-IV-V' }, sub: 2, from: 76, goal: 100 },
          { ex: 'mm-schism', p: { part: '1' }, from: 140, goal: 190, backing: 'chords', music: true, do: 'Make music: a riff in 7/8, felt as 2 + 2 + 3. The tempo counts 8th notes.' },
          { ex: 'tech-sweep', p: { shape: 'seventh', hand: 'pick', prog: 'ii-V-I' }, from: 56, goal: 76 },
        ],
      },
    },
    {
      id: 'u-outside', title: 'Symmetric and outside sounds',
      goal: 'Interval cycles, symmetric scales, side-stepping and scales from beyond major and minor.',
      lessons: [
        {
          id: 'interval-cycles', title: 'Interval cycles',
          idea: 'Stack one interval again and again: shapes that repeat along the neck.',
          concept: [
            'Stack the same interval over and over: 4ths give C F B♭ E♭…, minor 3rds the diminished cycle C E♭ G♭ A, major 3rds the augmented C E G♯. These symmetric chains run through modern jazz (Coltrane, Brecker) and are perfect for hand-to-ear coordination.',
            'Find the repeating hand shape: on the bass the cycles are geometric.',
          ],
          steps: [
            { ex: 'iv-cycles', p: { iv: '4' }, sub: 2, from: 66, goal: 88, do: 'The cycle of 4ths, up and back.' },
            { ex: 'iv-cycles', p: { iv: 'b3' }, sub: 2, from: 66, goal: 88, do: 'Minor 3rds: the diminished cycle.' },
          ],
          mistakes: [
            'Reading each note. See the shape and repeat it.',
          ],
        },
        {
          id: 'symmetric', title: 'Diminished and whole-tone scales',
          idea: 'Symmetric scales: one shape, repeated every few frets.',
          concept: [
            'The half-whole diminished scale alternates half and whole steps and fits dominant 7♭9 chords; the whole-half version fits diminished chords. The whole-tone scale is all whole steps: the sound of augmented chords. Because they are symmetric, their shapes repeat along the neck: every 3 frets for the diminished scales, 2 for whole tone.',
            'Sequences that skip a note sound very modern on these scales.',
          ],
          steps: [
            { ex: 'sc-symmetric', p: { type: 'dimHW', pattern: 'straight', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Half-whole diminished.' },
            { ex: 'sc-symmetric', p: { type: 'wholeTone', pattern: 'straight', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'The whole-tone scale.' },
            { ex: 'sc-symmetric', p: { type: 'dimHW', pattern: 'skip', oct: '1' }, sub: 2, from: 60, goal: 84, do: 'Half-whole, skipping one note.' },
          ],
          mistakes: [
            'Mixing up half-whole and whole-half. Half-whole starts with a half step: it goes over the dominant.',
          ],
        },
        {
          id: 'side-stepping', title: 'Pentatonic side-stepping',
          idea: 'Step outside on purpose, then resolve.',
          concept: [
            'Side-stepping is a classic way to play outside: shift the whole pentatonic up a half step for a moment, creating tension, then resolve back into the key. It works because the shape is strong and the resolution is clear. The backing stays on the home key, so you hear the tension.',
            'Make the outside bar sound intentional (strong rhythm, clear shape) and resolve to a chord tone on beat 1.',
          ],
          steps: [
            { ex: 'sc-pent-sidestep', p: { side: '1', oct: '1' }, from: 72, goal: 100, backing: 'chords', music: true, do: 'Home, a half step up, home. Listen to the tension and the release.' },
            { ex: 'sc-pent-sidestep', p: { side: '6', oct: '1' }, from: 72, goal: 100, backing: 'chords', do: 'A tritone away: the furthest outside.' },
          ],
          mistakes: [
            'Sounding lost outside. Keep the rhythm strong and the shape clear.',
          ],
        },
        {
          id: 'world-scales', title: 'World scales',
          idea: 'Augmented 2nds (three-fret gaps) give each scale its colour.',
          concept: [
            'These scales are at home in Arabic, Turkish, Balkan, klezmer and flamenco music, full of augmented 2nds. Double harmonic major (1 ♭2 3 4 5 ♭6 7) has two of them; Phrygian dominant (the 5th mode of harmonic minor) is the Spanish sound; the Hungarian minor is double harmonic started from its 4th note.',
            'Play each one over a drone of the root to hear its character.',
          ],
          steps: [
            { ex: 'sc-exotic', p: { type: 'doubleHarmonic', pattern: 'straight', oct: '1' }, sub: 2, from: 60, goal: 88, backing: 'drone', do: 'Double harmonic major over a drone.' },
            { ex: 'sc-exotic', p: { type: 'phrygianDom', pattern: 'straight', oct: '1' }, sub: 2, from: 60, goal: 88, backing: 'drone', do: 'Phrygian dominant: flamenco.' },
            { ex: 'sc-exotic', p: { type: 'hungarianMinor', pattern: 'straight', oct: '1' }, sub: 2, from: 60, goal: 88, backing: 'drone', do: 'Hungarian minor.' },
          ],
          mistakes: [
            'Playing the augmented 2nd as a whole step. It is three frets.',
          ],
        },
      ],
      check: {
        can: [
          'I can play the diminished and whole-tone scales and their repeating shapes.',
          'I can side-step a pentatonic and resolve it.',
          'I know the sound of double harmonic and Phrygian dominant.',
        ],
        steps: [
          { ex: 'sc-symmetric', p: { type: 'dimHW', pattern: 'skip', oct: '1' }, sub: 2, from: 72, goal: 96 },
          { ex: 'sc-pent-sidestep', p: { side: '1', oct: '1' }, from: 84, goal: 108, backing: 'chords' },
          { ex: 'sc-exotic', p: { type: 'phrygianDom', pattern: 'straight', oct: '1' }, sub: 2, from: 72, goal: 96, backing: 'drone' },
        ],
      },
    },
    {
      id: 'u-bebop', title: 'Bebop',
      goal: 'Bebop scales, the 6th-diminished scale, diminished-chord tricks and chromatic approaches.',
      lessons: [
        {
          id: 'bebop-scales', title: 'Bebop scales',
          idea: 'Eight notes: descending 8ths land chord tones on the beats.',
          concept: [
            'The bebop dominant scale adds a major 7th to Mixolydian; bebop major adds a ♯5 to major. With eight notes, an 8th-note run descending from the root lands chord tones on the downbeats: the secret of bebop lines and of good walking bass.',
            'Start on the root on a downbeat and descend, the bebop way.',
          ],
          steps: [
            { ex: 'sc-bebop', p: { type: 'bebopDom', oct: '1' }, sub: 2, from: 72, goal: 104, do: 'Bebop dominant. Check which notes fall on the beats.' },
            { ex: 'sc-bebop', p: { type: 'bebopMajor', oct: '1' }, sub: 2, from: 72, goal: 104, do: 'Bebop major.' },
          ],
          mistakes: [
            'Starting the run off the beat. The chord tones only land on the beats when the root does.',
          ],
        },
        {
          id: 'sixth-diminished', title: 'The 6th-diminished scale',
          idea: 'C6 and B°7 alternate: every passing note resolves to a chord tone.',
          concept: [
            'Barry Harris taught adding a ♭6 to the major scale (C D E F G A♭ A B). Its notes alternate between a C6 chord (C E G A) and a B°7 chord (B D F A♭). Played in 8ths, the chord tones land on the beats and every diminished note resolves to a chord tone a step away.',
            'Accent the C6 notes; feel the diminished notes as passing.',
          ],
          steps: [
            { ex: 'sc-sixth-diminished', p: { pattern: 'straight', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'Straight up and down. Accent the 6th-chord notes.' },
            { ex: 'sc-sixth-diminished', p: { pattern: 'sixdim', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Every other note: C6 and B°7 shapes alternate.' },
          ],
          mistakes: [
            'Leaving out the ♭6. It is what makes the chords alternate.',
          ],
        },
        {
          id: 'dim-dominants', title: 'One diminished chord, four dominants',
          idea: 'Lower any note of a °7 by a half step and it becomes a dominant 7.',
          concept: [
            'A diminished 7th chord is symmetric (all minor 3rds). Lower any one of its four notes by a half step and it becomes a dominant 7th: from B°7, lowering B gives B♭7, D gives D♭7, F gives E7 and A♭ gives G7. Four related dominants a minor 3rd apart: the key to bebop harmony and tritone substitution.',
            'And a °7 built on the leading tone is a 7♭9 without its root (C♯°7 = A7♭9), which resolves to the minor chord.',
          ],
          steps: [
            { ex: 'arp-dim-dominants', p: {}, sub: 2, from: 60, goal: 84, do: 'The °7, then each dominant it turns into.' },
            { ex: 'arp-dim-to-minor', p: { key: 'cycle4' }, sub: 2, from: 60, goal: 84, do: '°7 up, minor triad down, around the cycle.' },
          ],
          mistakes: [
            'Hunting for four new shapes. It is one shape with one note lowered each time.',
          ],
        },
        {
          id: 'approach-arps', title: 'Approach notes and enclosures',
          idea: 'Approach every chord tone: tension, then release on the beat.',
          concept: [
            'Precede every chord tone with a chromatic neighbour, or enclose it (above, below, target). The approach notes create tension and the chord tones resolve it: this is how bebop players and walking bassists use all 12 notes and still sound inside.',
            'Every chord tone lands on a beat. Accent the targets and play the approaches lighter.',
          ],
          steps: [
            { ex: 'tri-approach', p: { scale: 'ionian', approach: 'below', order: 'up' }, from: 72, goal: 96, do: 'Triads, each tone approached from a half step below.' },
            { ex: 'arp-approach', p: { approach: 'below', prog: 'ii-V-I' }, from: 72, goal: 100, backing: 'chords', do: 'ii–V–I arpeggios with approaches, all keys.' },
            { ex: 'arp-approach', p: { approach: 'enclosure', prog: 'ii-V-I' }, from: 66, goal: 88, backing: 'chords', do: 'Enclosures as triplets: target, above, below, target.' },
          ],
          mistakes: [
            'Accenting the approach notes. The targets carry the weight.',
          ],
        },
      ],
      check: {
        can: [
          'I can play the bebop dominant and bebop major scales with chord tones on the beats.',
          'I know the four dominants hidden in a diminished chord.',
          'I can approach and enclose chord tones through a ii–V–I.',
        ],
        steps: [
          { ex: 'sc-bebop', p: { type: 'bebopDom', oct: '1' }, sub: 2, from: 84, goal: 112 },
          { ex: 'arp-approach', p: { approach: 'enclosure', prog: 'ii-V-I' }, from: 72, goal: 96, backing: 'chords' },
          { ex: 'arp-dim-dominants', p: {}, sub: 2, from: 66, goal: 92 },
          { ex: 'mm-duke', p: { part: 'all' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'Make music: a unison horn line with chromatic passing notes.' },
        ],
      },
    },
    {
      id: 'u-modes5', title: 'Modern modes',
      goal: 'Pitch axis, and the modes of melodic and harmonic minor.',
      lessons: [
        {
          id: 'pitch-axis', title: 'Pitch axis',
          idea: 'One bass note; the mode above it changes every bar.',
          concept: [
            'The pitch-axis idea keeps one bass note while the mode above it changes. Each bar is a different mode on the same root, so your ear follows the colour changes while your hand reorganises around a fixed root.',
            'Accent the characteristic note of each mode.',
          ],
          steps: [
            { ex: 'md-pitch-axis', p: { set: 'major', oct: '1' }, sub: 2, from: 72, goal: 100, backing: 'drone', do: 'The major modes over one root, bright to dark.' },
            { ex: 'md-pitch-axis', p: { set: 'mix', oct: '1' }, sub: 2, from: 72, goal: 100, backing: 'drone', music: true, do: 'A dramatic mix of modes over one root.' },
          ],
          mistakes: [
            'Hearing only the scale. Listen to the colour each mode gives the same bass note.',
          ],
        },
        {
          id: 'melodic-modes', title: 'The modes of melodic minor',
          idea: 'Lydian dominant, Locrian ♮2, altered: modern jazz from one scale.',
          concept: [
            'Melodic minor produces the key scales of modern jazz: Lydian dominant (4th mode) over 7♯11 chords, Locrian ♮2 (6th mode) over m7♭5 and the altered scale (7th mode) over altered dominants. Play all seven from the same parent and hear one set of notes make seven colours.',
            'Shortcuts: the altered scale is melodic minor a half step above the root (G altered = A♭ melodic minor); Lydian dominant is melodic minor from the 5th (G7♯11 = D melodic minor).',
          ],
          steps: [
            { ex: 'md-melodic-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'The seven modes of melodic minor.' },
          ],
          mistakes: [
            'Learning seven new shapes. It is one scale from seven starting points.',
          ],
        },
        {
          id: 'harmonic-modes', title: 'The modes of harmonic minor',
          idea: 'Spanish, Middle-Eastern and neo-classical colours.',
          concept: [
            'Harmonic minor\'s modes give Spanish, Middle-Eastern and neo-classical colours. The 5th mode, Phrygian dominant, is the sound of the V7♭9 chord in minor keys and of flamenco.',
            'Listen for the augmented 2nd (three frets): it moves to a different place in every mode.',
          ],
          steps: [
            { ex: 'md-harmonic-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'The seven modes of harmonic minor.' },
          ],
          mistakes: [
            'Losing the augmented 2nd in the higher modes. Find it in each one first.',
          ],
        },
      ],
      check: {
        can: [
          'I can hear the modes change over one bass note.',
          'I know where melodic minor goes over 7alt, 7♯11 and m7♭5.',
          'I can play the modes of harmonic minor.',
        ],
        steps: [
          { ex: 'md-pitch-axis', p: { set: 'mix', oct: '1' }, sub: 2, from: 80, goal: 104, backing: 'drone' },
          { ex: 'md-melodic-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 80, goal: 104 },
          { ex: 'md-harmonic-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 80, goal: 104 },
        ],
      },
    },
    {
      id: 'u-superimpose', title: 'Superimposition',
      goal: 'Pentatonics and melodic minor placed over chords for modern colours.',
      lessons: [
        {
          id: 'pent-super', title: 'Pentatonics over chords',
          idea: 'Three major pentatonics fit every chord; each brings out different notes.',
          concept: [
            'Every mode of the major scale holds three major pentatonics, and each brings out different notes of the chord. Over Dm7 (Dorian) F major pentatonic has the ♭3 and ♭7, C the 9 and 11, G the 13. Over an altered dominant only one fits: the major pentatonic a tritone above the root.',
            'Some choices hold an avoid note, like the 11 over a major or dominant chord: pass through it, do not land on it.',
          ],
          steps: [
            { ex: 'md-pentatonic-superimposition', p: { prog: 'ii-V-I', choice: '0' }, from: 80, goal: 104, backing: 'chords', do: 'The first choice on each chord: the most chord tones.' },
            { ex: 'md-pentatonic-superimposition', p: { prog: 'ii-V-I', choice: 'all' }, from: 80, goal: 104, backing: 'chords', music: true, do: 'All three in turn. Hear how each colours the chord.' },
          ],
          mistakes: [
            'Landing on the 11 over a major chord. Pass through it.',
          ],
        },
        {
          id: 'melodic-super', title: 'One melodic minor, seven chords',
          idea: 'Learn one shape and where to put it.',
          concept: [
            'Melodic minor is the parent of the most-used modern chord-scales. Instead of seven modes, learn one shape and where to put it: on the root over m(maj7), on the 5th over 7♯11, on the ♭3 over m7♭5, a half step above the root over 7alt.',
            'Say the parent before you play: "G7alt, A♭ melodic minor".',
          ],
          steps: [
            { ex: 'md-melodic-superimposition', p: { set: 'minor251' }, from: 76, goal: 100, backing: 'chords', do: 'Minor-key ii–V–i: three melodic minors, one per chord.' },
            { ex: 'md-melodic-superimposition', p: { set: 'dominants' }, from: 76, goal: 100, backing: 'chords', do: 'Four dominant colours on one root.' },
          ],
          mistakes: [
            'Counting from the chord\'s root. Count from the parent\'s root, then hear it against the chord.',
          ],
        },
      ],
      check: {
        can: [
          'I can choose a pentatonic for each chord of a ii–V–I.',
          'I know which melodic minor to play over 7alt, 7♯11 and m7♭5.',
        ],
        steps: [
          { ex: 'md-pentatonic-superimposition', p: { prog: 'ii-V-I', choice: 'all' }, from: 84, goal: 112, backing: 'chords' },
          { ex: 'md-melodic-superimposition', p: { set: 'minor251' }, from: 80, goal: 104, backing: 'chords' },
          { ex: 'md-melodic-superimposition', p: { set: 'dominants' }, from: 80, goal: 104, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-triads5', title: 'Triad vocabulary',
      goal: 'Triad permutations, rudiments and triad pairs.',
      lessons: [
        {
          id: 'triad-perms', title: 'Triad permutations',
          idea: 'Three notes, six orders: break the habit of always going up.',
          concept: [
            'Three notes can be played in six orders. Each order is a different melodic shape and a different fingering challenge. Running them through the chords of a key breaks the habit of always going up from the root and gives you a stock of cells for fills and solos.',
            '"Rotate" uses a new permutation on every chord: hard, and very musical.',
          ],
          steps: [
            { ex: 'tri-permutations', p: { scale: 'ionian', perm: '102', order: 'up' }, sub: 3, from: 60, goal: 80, do: '3-1-5 through the key, in triplets.' },
            { ex: 'tri-permutations', p: { scale: 'ionian', perm: 'rotate', order: 'up' }, sub: 3, from: 56, goal: 76, do: 'A new order on every chord.' },
          ],
          mistakes: [
            'Defaulting to 1-3-5. Each order is its own shape: learn it.',
          ],
        },
        {
          id: 'triad-rudiments', title: 'Triad rudiments',
          idea: 'Drum stickings on chords: R = next chord tone, L = the root.',
          concept: [
            'Drummers build their vocabulary from rudiments. Here every rudiment is mapped onto a chord: an "R" stroke plays the next chord tone going up and an "L" stroke plays the root as a pedal. The result is a set of melodic and rhythmic patterns that outline each chord, great for warm-ups and grooves.',
            'Accent the first note of each sticking group, and count out loud: the odd-length rudiments shift across the beat.',
          ],
          steps: [
            { ex: 'tri-rudiments', p: { scale: 'ionian', rudiment: 'paradiddle', order: 'up' }, sub: 4, from: 56, goal: 72, do: 'The paradiddle on every chord of the key.' },
            { ex: 'tri-rudiments', p: { scale: 'ionian', rudiment: 'fivestroke', order: 'up' }, sub: 4, from: 52, goal: 68, do: 'The five-stroke roll: it shifts across the beat.' },
          ],
          mistakes: [
            'Losing the beat with the odd-length groups. Count "1 e & a" out loud.',
          ],
        },
        {
          id: 'triad-pairs', title: 'Triad pairs',
          idea: 'Two triads with no common notes make a six-note scale.',
          concept: [
            'A triad pair is two triads with no common notes, such as F and G over C. Together they make a six-note scale, and alternating them in climbing inversions creates the angular modern lines heard from Coltrane to modern fusion.',
            'Each pair suggests a mode over the root of the key: F and G over C sound Ionian, C and D sound Lydian, D♭ and C sound Phrygian dominant.',
          ],
          steps: [
            { ex: 'tri-pairs', p: { pair: 'IV-V', dir: 'updown' }, sub: 3, from: 56, goal: 80, do: 'IV and V over the key: F and G over C.' },
            { ex: 'tri-pairs', p: { pair: 'I-II', dir: 'updown' }, sub: 3, from: 56, goal: 80, do: 'I and II: the Lydian sound.' },
          ],
          mistakes: [
            'Playing the two triads as separate exercises. Alternate them: that is the sound.',
          ],
        },
      ],
      check: {
        can: [
          'I can play triads in any of their six orders.',
          'I can play triad pairs and hear the mode they suggest.',
        ],
        steps: [
          { ex: 'tri-permutations', p: { scale: 'ionian', perm: 'rotate', order: 'up' }, sub: 3, from: 60, goal: 84 },
          { ex: 'tri-pairs', p: { pair: 'I-II', dir: 'updown' }, sub: 3, from: 60, goal: 84 },
        ],
      },
    },
    {
      id: 'u-colours', title: 'Colour chords',
      goal: 'The chords of every scale, sus and quartal stacks, and upper structures.',
      lessons: [
        {
          id: 'modal-triads', title: 'The triads of unusual scales',
          idea: 'Unusual scales make unusual chord sets.',
          concept: [
            'Any seven-note scale can be harmonised. Lydian dominant contains a major II, the altered scale has several diminished and augmented triads, and Phrygian dominant has a major I with a major ♭II above it. Use it to hear and own the chords behind modern jazz and film music.',
            'Say the Roman numeral of each chord as you play it.',
          ],
          steps: [
            { ex: 'tri-diatonic-modes', p: { scale: 'lydianDom', order: 'up', pattern: 'up', inversion: '0' }, sub: 2, from: 66, goal: 92, do: 'The triads of Lydian dominant.' },
            { ex: 'tri-diatonic-modes', p: { scale: 'phrygianDom', order: 'up', pattern: 'up', inversion: '0' }, sub: 2, from: 66, goal: 92, do: 'The triads of Phrygian dominant.' },
          ],
          mistakes: [
            'Assuming the major-key pattern. Every scale has its own set: listen to each chord.',
          ],
        },
        {
          id: 'quartal', title: 'Sus and quartal stacks',
          idea: 'No 3rd, no major or minor: ideal for modal music.',
          concept: [
            'Replace the 3rd and you get sus chords: sus4 (1-4-5) and sus2 (1-2-5). Stack two perfect 4ths instead and you get quartal chords (1-4-♭7). None of them is major or minor, which makes them ideal for modal music and fusion.',
            'A stack of perfect 4ths lies flat across neighbouring strings, on the same fret; where the scale gives an augmented 4th (F–B in C major) the top note moves up a fret.',
          ],
          steps: [
            { ex: 'tri-sus-quartal', p: { scale: 'dorian', order: 'up', pattern: 'up', inversion: '0', stack: 'quartal' }, sub: 2, from: 66, goal: 92, do: 'Quartal stacks through Dorian.' },
            { ex: 'tri-sus-quartal', p: { scale: 'ionian', order: 'up', pattern: 'up', inversion: '0', stack: 'sus4' }, sub: 2, from: 66, goal: 92, do: 'Sus4 stacks through the major scale.' },
          ],
          mistakes: [
            'Expecting every stack to be flat. Watch for the augmented 4th.',
          ],
        },
        {
          id: 'upper-structures', title: 'Upper-structure triads',
          idea: 'A simple triad on top of a bass note makes a rich chord.',
          concept: [
            'Pianists and arrangers get rich chords by putting a simple triad on top of a bass note. D major over C gives the 9, ♯11 and 13: over a Cmaj7 chord that is C Lydian (maj7♯11), over C7 it is C13♯11, so the lower chord decides. A major over C7 gives 13♭9. Play the pedal root, then the upper triad, so you hear and see the whole colour.',
            'Let the low root ring while you play the triad, and name the tensions: D/C = 9, ♯11, 13.',
          ],
          steps: [
            { ex: 'tri-upper-structures', p: { us: 'II/I' }, sub: 2, from: 60, goal: 84, do: 'D over C: Lydian.' },
            { ex: 'tri-upper-structures', p: { key: '0', us: 'VI/7' }, sub: 2, from: 60, goal: 84, do: 'A over C7: 13♭9.' },
          ],
          mistakes: [
            'Muting the pedal. The colour is the triad against the ringing bass note.',
          ],
        },
      ],
      check: {
        can: [
          'I can harmonise any scale in triads.',
          'I can play quartal and sus stacks through a mode.',
          'I can name the tensions an upper-structure triad adds.',
        ],
        steps: [
          { ex: 'tri-diatonic-modes', p: { scale: 'lydianDom', order: 'up', pattern: 'alt', inversion: '0' }, sub: 2, from: 72, goal: 96 },
          { ex: 'tri-upper-structures', p: { us: 'VI/7' }, sub: 2, from: 66, goal: 88 },
          { ex: 'tri-sus-quartal', p: { scale: 'dorian', order: 'up', pattern: 'up', inversion: '0', stack: 'quartal' }, sub: 2, from: 72, goal: 96 },
        ],
      },
    },
    {
      id: 'u-arps5', title: 'Extended and altered arpeggios',
      goal: '9ths, 11ths and 13ths, upper-structure arpeggios, 7th-chord permutations and altered dominants.',
      lessons: [
        {
          id: 'extended', title: '9ths, 11ths and 13ths',
          idea: 'Above the 7th the stack continues: 9, 11, 13.',
          concept: [
            'Above the 7th the stack goes on: 9, 11, 13. Through the harmonised scale this gives maj9, m9, m11, dominant 13 and other colours. These arpeggios reach well beyond the octave: a reach and shifting workout that reveals the tensions behind jazz and neo-soul chords.',
            'The 9 is the 2nd an octave up, the 11 the 4th, the 13 the 6th. Listen for the clash of the 11 on major chords.',
          ],
          steps: [
            { ex: 'arp-extended', p: { ext: '9', scale: 'ionian', order: 'up' }, sub: 2, from: 60, goal: 88, do: '9th chords through the key.' },
            { ex: 'arp-extended', p: { ext: '13', scale: 'dorian', order: 'up' }, sub: 2, from: 56, goal: 80, do: '13th chords through Dorian.' },
          ],
          mistakes: [
            'Losing the shape over two octaves. Plan the shift before you play.',
          ],
        },
        {
          id: 'upper-arps', title: 'Upper-structure arpeggios',
          idea: 'Start on the 3rd: over Cmaj7, Em7 sounds Cmaj9.',
          concept: [
            'Play the arpeggio that starts on the 3rd of a chord (3-5-7-9) and you get its upper structure: over Cmaj7 you play Em7 and hear Cmaj9. Through the key it is a quick way to sound modern, and it trains you to think of chords as layers.',
            'Compare: R-3-5-7, then 3-5-7-9 on the same chord.',
          ],
          steps: [
            { ex: 'arp-upper-structure', p: { scale: 'ionian', pattern: 'alt' }, sub: 2, from: 66, goal: 92, do: '3-5-7-9 on every chord of the key.' },
          ],
          mistakes: [
            'Hearing it as the wrong chord. Play the root first, then the upper structure: hear the layers.',
          ],
        },
        {
          id: 'arp-perms', title: '7th-chord permutations',
          idea: 'Reorder the chord tones for wider, composed-sounding shapes.',
          concept: [
            'Reordering the four chord tones gives new melodic shapes with wider intervals. Run them through the 7th chords of the key to break out of "always up from the root" and build the vocabulary that makes lines sound composed.',
            'These cells make great 16th-note fills.',
          ],
          steps: [
            { ex: 'arp-permutations', p: { scale: 'ionian', perm: '1032', order: 'up' }, sub: 2, from: 66, goal: 92, do: '3-1-7-5 through the key.' },
            { ex: 'arp-permutations', p: { scale: 'ionian', perm: 'rotate', order: 'up' }, sub: 2, from: 60, goal: 88, do: 'A new order on every chord.' },
          ],
          mistakes: [
            'Rushing the wide leaps. Every note full length.',
          ],
        },
        {
          id: 'altered-dominants', title: 'Altered dominants resolving',
          idea: 'Hear the tension, then the release on I.',
          concept: [
            'Altered dominant chords add tension before resolving to the tonic. Each arpeggio is played and then resolved to the I chord a 5th below, so you hear the tension and the release.',
            'Find the altered note and where it resolves (the ♯5 rises to the 3rd of I).',
          ],
          steps: [
            { ex: 'arp-altered-dominants', p: { alt: 'dom7b9' }, sub: 2, from: 60, goal: 84, do: '7♭9 resolving.' },
            { ex: 'arp-altered-dominants', p: { alt: 'dom7s5' }, sub: 2, from: 60, goal: 84, do: '7♯5 resolving.' },
          ],
          mistakes: [
            'Playing the alteration without hearing it resolve. Follow it to the I chord.',
          ],
        },
      ],
      check: {
        can: [
          'I can play 9th and 13th arpeggios through a key.',
          'I can play upper-structure arpeggios and 7th-chord permutations.',
          'I can hear an altered dominant resolve.',
        ],
        steps: [
          { ex: 'arp-extended', p: { ext: '13', scale: 'dorian', order: 'up' }, sub: 2, from: 60, goal: 84 },
          { ex: 'arp-altered-dominants', p: { alt: 'dom7b9' }, sub: 2, from: 66, goal: 92 },
          { ex: 'arp-upper-structure', p: { scale: 'ionian', pattern: 'alt' }, sub: 2, from: 72, goal: 100 },
          { ex: 'arp-permutations', p: { scale: 'ionian', perm: '1032', order: 'up' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-harmony5', title: 'Colour in progressions',
      goal: 'Secondary dominants, borrowed chords, tritone subs, and funk through the changes.',
      lessons: [
        {
          id: 'colour-chords', title: 'Chords from outside the key',
          idea: 'Real songs leave the key for a moment.',
          concept: [
            'A secondary dominant (VI7, III7) points strongly at the next chord. A borrowed chord (♭VI, ♭VII, iv) takes a colour from the parallel minor. A tritone substitution (♭II7) replaces V7 with a chord a tritone away that shares its guide tones (G7 and D♭7 share B and F).',
            'Outline each progression and listen for the chord that is not in the key.',
          ],
          steps: [
            { ex: 'hm-colour-chords', p: { key: '0', prog: 'I-VI7-ii-V', pattern: 'r357' }, from: 84, goal: 104, backing: 'chords', do: 'I–VI7–ii–V in C: find the C♯ in A7.' },
            { ex: 'hm-colour-chords', p: { prog: 'I-bVI-bVII-I', pattern: 'r357' }, from: 84, goal: 104, backing: 'chords', do: 'Borrowed ♭VI and ♭VII.' },
            { ex: 'hm-colour-chords', p: { prog: 'ii-bII7-I', pattern: 'r357' }, from: 84, goal: 104, backing: 'chords', do: 'The tritone substitute.' },
          ],
          mistakes: [
            'Playing the diatonic note over a colour chord. Find the note that changed.',
          ],
        },
        {
          id: 'funk-changes', title: 'Funk through the changes',
          idea: 'Keep the groove while the harmony moves.',
          concept: [
            'Holding a 16th-note funk feel over one chord is one skill; keeping it while the harmony moves is another. The same syncopated, ghost-note pattern goes to every chord of a progression, so your hands find each new root without breaking the groove.',
            'Look ahead one bar: find the next root while you groove on this one.',
          ],
          steps: [
            { ex: 'gr-funk-changes', p: { style: 'funkOct', prog: 'blues' }, from: 76, goal: 96, backing: 'chords', music: true, do: 'Octave funk through a 12-bar blues.' },
            { ex: 'gr-funk-changes', p: { style: 'funk16', prog: 'I-vi-IV-V' }, from: 76, goal: 96, backing: 'chords', do: 'Ghost-note funk through I–vi–IV–V.' },
          ],
          mistakes: [
            'The groove sagging at each chord change. The change happens inside the groove.',
          ],
        },
      ],
      check: {
        can: [
          'I can spot and outline secondary dominants, borrowed chords and tritone subs.',
          'I keep a funk groove through a progression.',
        ],
        steps: [
          { ex: 'hm-colour-chords', p: { prog: 'I-VI7-ii-V', pattern: 'r3575' }, from: 84, goal: 104, backing: 'chords' },
          { ex: 'gr-funk-changes', p: { style: 'funkOct', prog: 'blues' }, from: 84, goal: 104, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-walking5', title: 'Advanced walking',
      goal: 'Enclosures, two chords per bar, minor walking and triplet skips.',
      lessons: [
        {
          id: 'walk-enclosures', title: 'Walking with enclosures',
          idea: 'Frame the next root from both sides, land on beat 1.',
          concept: [
            'An enclosure frames the target from both sides before landing on it. In walking bass the last two beats of a bar (above, below) lead into the next root on beat 1: a signature bebop sound.',
            'Hear the target before you play the enclosure.',
          ],
          steps: [
            { ex: 'wk-enclosures', p: { prog: 'ii-V-I' }, from: 104, goal: 132, backing: 'chords', do: 'ii–V–I with enclosures into each root.' },
          ],
          mistakes: [
            'Enclosing the wrong note. Know the next root first.',
          ],
        },
        {
          id: 'walk-two-per-bar', title: 'Two chords per bar',
          idea: 'Root on the chord, approach on the next beat.',
          concept: [
            'When chords change every two beats there is only room for the root and an approach note. Rhythm changes and the ii–V cycle through all 12 keys are the standard tests of this skill.',
            'Start slowly: the changes come fast.',
          ],
          steps: [
            { ex: 'wk-two-per-bar', p: { prog: 'rhythm-A' }, from: 96, goal: 126, backing: 'chords', do: 'Rhythm changes, A section.' },
            { ex: 'wk-two-per-bar', p: { prog: 'cycle-251' }, from: 96, goal: 120, backing: 'chords', do: 'ii–V in all 12 keys.' },
          ],
          mistakes: [
            'Trying to fit arpeggios in two beats. Root, approach, next root.',
          ],
        },
        {
          id: 'walk-minor', title: 'Minor walking',
          idea: 'The half-diminished ii and a V7♭9 that pulls to the minor tonic.',
          concept: [
            'Minor keys bring the half-diminished ii chord and a V7♭9 that pulls hard to the minor tonic. Walk through the minor ii–V–i and the minor blues with the same devices, adapted to the darker chord tones.',
            'On m7♭5 the 5th is flat; the 3rd of V7 is the leading tone of the key.',
          ],
          steps: [
            { ex: 'wk-minor', p: { prog: 'minor-ii-V-i' }, from: 100, goal: 126, backing: 'chords', do: 'Minor ii–V–i.' },
            { ex: 'wk-minor', p: { prog: 'minor-blues' }, from: 100, goal: 126, backing: 'chords', music: true, do: 'The minor blues.' },
          ],
          mistakes: [
            'A natural 5th on the m7♭5. Watch the dots.',
          ],
        },
        {
          id: 'walk-skips', title: 'Triplet skips',
          idea: 'A ghosted triplet adds bounce without breaking the line.',
          concept: [
            'Great walking bassists decorate the quarter-note line with triplet skips: a note on the beat, ghosted on the last triplet. It adds bounce and swing without breaking the line.',
            'The skip is a ghost, barely audible. In real playing use it sparingly; here it comes every other bar.',
          ],
          steps: [
            { ex: 'wk-triplet-skips', p: { prog: 'jazz-blues' }, from: 104, goal: 132, backing: 'chords', do: 'A jazz blues with triplet skips.' },
          ],
          mistakes: [
            'Skips as loud as the line. They are ghosts.',
          ],
        },
      ],
      check: {
        can: [
          'I can walk rhythm changes with two chords per bar.',
          'I can walk a minor ii–V–i and a minor blues.',
          'I use enclosures and triplet skips in a walking line.',
        ],
        steps: [
          { ex: 'wk-two-per-bar', p: { prog: 'rhythm-A' }, from: 112, goal: 144, backing: 'chords' },
          { ex: 'wk-enclosures', p: { prog: 'ii-V-I' }, from: 112, goal: 140, backing: 'chords' },
          { ex: 'wk-minor', p: { prog: 'minor-ii-V-i' }, from: 112, goal: 140, backing: 'chords' },
          { ex: 'wk-triplet-skips', p: { prog: 'jazz-blues' }, from: 112, goal: 140, backing: 'chords' },
          { ex: 'wk-minor', p: { prog: 'minor-blues' }, from: 112, goal: 140, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-licks', title: 'Jazz licks',
      goal: 'The vocabulary of the ii–V–I, the minor ii–V–i, the blues and turnarounds.',
      lessons: [
        {
          id: 'licks-251', title: 'Licks on the ii–V–I',
          idea: 'The ii–V–I is the sentence jazz is written in.',
          concept: [
            'These licks show the main ways to say a ii–V–I: run up the ii chord and resolve through the V\'s ♭9, enclose the target 3rd, follow the guide tones, play 1-2-3-5 cells, descend the bebop scale.',
            'Learn one lick slowly in C, sing it, then move it through all 12 keys. Finally slip it into your walking lines and solos.',
          ],
          steps: [
            { ex: 'lk-ii-v-i', p: { lick: '0', feel: 'swing' }, from: 96, goal: 120, backing: 'chords', do: 'Arpeggio up, ♭9 down. Watch where the ♭9 and the 3rd fall.' },
            { ex: 'lk-ii-v-i', p: { lick: '1', feel: 'swing' }, from: 96, goal: 120, backing: 'chords', do: 'An enclosure into the 3rd.' },
          ],
          mistakes: [
            'Learning a lick in one key only. Move it through all 12.',
          ],
        },
        {
          id: 'licks-minor', title: 'Licks on the minor ii–V–i',
          idea: 'Darker and more chromatic: the ♭9 falls to the 5th.',
          concept: [
            'Minor ii–V–i progressions are darker and more chromatic: a half-diminished ii, a V with a ♭9 (often altered) and a minor i with a major 6th or 7th. These licks use Locrian ♮2, harmonic minor, the diminished arpeggio and the altered scale.',
            'The ♭9 of the V (A♭ over G7♭9) falling to the 5th (G) of Cm is the signature move.',
          ],
          steps: [
            { ex: 'lk-minor-ii-v-i', p: { lick: '0', feel: 'swing' }, from: 92, goal: 116, backing: 'chords', do: 'Locrian ♮2 into melodic minor.' },
            { ex: 'lk-minor-ii-v-i', p: { lick: '2', feel: 'swing' }, from: 92, goal: 116, backing: 'chords', do: 'Diminished arpeggios on the V.' },
          ],
          mistakes: [
            'Missing the natural B (the 3rd of G7) against the minor key. It is meant to be there.',
          ],
        },
        {
          id: 'licks-blues', title: 'Blues licks and turnarounds',
          idea: 'The blue ♭3 bends into the major 3rd.',
          concept: [
            'Over a dominant 7th you can mix the major 3rd with the blue ♭3, use the blues scale and approach chord tones chromatically. A turnaround is the two-bar link at the end of a chorus that leads back to the start: Imaj7 – VI7 – iim7 – V7 in a standard (in a blues the I is a 7th chord, I7 – VI7 – ii7 – V7), often with tritone substitutes.',
            'Lay back slightly behind the click on blues phrases.',
          ],
          steps: [
            { ex: 'lk-blues', p: { lick: '0', feel: 'swing' }, from: 92, goal: 112, backing: 'chords', do: 'A riff from the major blues scale, into the IV.' },
            { ex: 'lk-turnarounds', p: { lick: '0', feel: 'swing' }, from: 96, goal: 120, backing: 'chords', do: 'A turnaround with ♭9s: it loops.' },
          ],
          mistakes: [
            'Playing the ♭3 and the 3 as separate notes. Slide or hammer from one into the other.',
          ],
        },
      ],
      check: {
        can: [
          'I can play a ii–V–I lick in all 12 keys.',
          'I know the signature moves of the minor ii–V–i.',
          'I can play a blues lick and a turnaround in time.',
        ],
        steps: [
          { ex: 'lk-ii-v-i', p: { lick: '0', key: 'cycle4', feel: 'swing' }, from: 100, goal: 126, backing: 'chords' },
          { ex: 'lk-turnarounds', p: { lick: '0', feel: 'swing' }, from: 100, goal: 126, backing: 'chords' },
          { ex: 'lk-minor-ii-v-i', p: { lick: '0', feel: 'swing' }, from: 100, goal: 124, backing: 'chords' },
          { ex: 'lk-blues', p: { lick: '0', feel: 'swing' }, from: 100, goal: 120, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-solo', title: 'Solo devices',
      goal: 'Solos that sound like a bassist: devices, motifs and implied changes.',
      lessons: [
        {
          id: 'solo-devices', title: 'Bass solo devices',
          idea: 'Grow the solo out of the bass line.',
          concept: [
            'Bass solos often grow out of the bass line itself: a two-feel that breaks into a walking pickup, a walking line decorated with triplet skips, or a low pedal note alternating with chord tones above it so the harmony stays clear. These devices make a solo sound like a bassist rather than a horn player.',
            'Keep the time feel of a walking line even while soloing.',
          ],
          steps: [
            { ex: 'lk-bass-solo', p: { lick: '0', feel: 'swing' }, from: 96, goal: 120, backing: 'chords', do: 'Two-feel into a walking pickup.' },
            { ex: 'lk-bass-solo', p: { lick: '2', feel: 'swing' }, from: 96, goal: 120, backing: 'chords', do: 'A pedal-point fill.' },
          ],
          mistakes: [
            'Losing the time when you start soloing. The pulse stays as steady as the walking line.',
          ],
        },
        {
          id: 'motif', title: 'Developing a motif',
          idea: 'One idea that grows sounds composed.',
          concept: [
            'A solo sounds composed when one idea grows, instead of new notes in every bar. Take a short motif and keep it while the harmony moves: on each chord\'s tones, up the scale, pushed an 8th early or laid back an 8th late, and answered after a bar of silence.',
            'The rests are part of the exercise: leave them empty. Sing the motif first.',
          ],
          steps: [
            { ex: 'lk-motif', p: { lick: '0', feel: 'swing' }, from: 92, goal: 116, backing: 'chords', do: 'One motif through ii–V–I.' },
            { ex: 'lk-motif', p: { lick: '4', feel: 'swing' }, from: 92, goal: 116, backing: 'chords', music: true, do: 'Question and answer, with a bar of silence.' },
          ],
          mistakes: [
            'Filling the silences. The answer needs the space before it.',
          ],
        },
        {
          id: 'implied', title: 'Implied changes over a vamp',
          idea: 'The band holds one chord; your line can travel.',
          concept: [
            'Over a vamp the band holds one chord, but your line can imply a cadence into it: its V7, its ii–V, or the tritone substitute of the V. Play the vamp for two bars, imply the cadence in the third and resolve in the fourth. With the chords backing on, you hear the tension and the release.',
            'Resolve by step: the ♭9 of the V falls to the 5th, its 3rd rises to the root. Once or twice a chorus is plenty.',
          ],
          steps: [
            { ex: 'lk-implied', p: { lick: '1', feel: 'swing' }, from: 88, goal: 112, backing: 'chords', do: 'A vamp on the minor i, with an implied V7♭9.' },
            { ex: 'lk-implied', p: { lick: '3', feel: 'swing' }, from: 88, goal: 112, backing: 'chords', do: 'A dominant vamp with an implied cadence.' },
          ],
          mistakes: [
            'Not resolving. The implied chord only makes sense when you land.',
          ],
        },
        {
          id: 'slap-advanced', title: 'Advanced slap', optional: true,
          idea: 'Thumb ghosts keep the grid; hammers, pulls and pops make the notes.',
          concept: [
            'Denser 16th patterns where the thumb ghosts keep the grid, hammer-ons and pull-offs make notes without plucking, and pops accent the off-beats. The second pattern ends each bar with a fill down the minor pentatonic. Optional, for players who slap.',
            'Keep the thumb bouncing on every ghost: it is your hi-hat.',
          ],
          steps: [
            { ex: 'sl-advanced', p: { style: 'ghostFunk' }, from: 64, goal: 84, backing: 'chords', do: 'Ghost-note slap funk.' },
            { ex: 'sl-advanced', p: { style: 'popFill' }, from: 64, goal: 84, backing: 'chords', do: 'A pop fill down the pentatonic.' },
          ],
          mistakes: [
            'Uneven ghosts. They are the grid.',
          ],
        },
      ],
      check: {
        can: [
          'I can build a solo from bass-line devices.',
          'I can develop one motif through the changes.',
          'I can imply a cadence over a vamp and resolve it.',
        ],
        steps: [
          { ex: 'lk-motif', p: { lick: '0', feel: 'swing' }, from: 96, goal: 124, backing: 'chords' },
          { ex: 'lk-implied', p: { lick: '1', feel: 'swing' }, from: 92, goal: 120, backing: 'chords' },
          { ex: 'lk-bass-solo', p: { lick: '0', feel: 'swing' }, from: 100, goal: 124, backing: 'chords' },
        ],
      },
    },
  ],
  check: {
    can: [
      'I can play polyrhythms and permutations across the strings.',
      'I use symmetric scales, side-stepping and world scales.',
      'I play bebop scales, approaches and enclosures.',
      'I know the modes of melodic and harmonic minor and how to superimpose them.',
      'I walk through rhythm changes and minor progressions.',
      'I can play jazz licks in all keys and develop a motif.',
    ],
    steps: [
      { ex: 'rh-polyrhythm', p: { ratio: '4:3' }, from: 60, goal: 80 },
      { ex: 'sc-bebop', p: { type: 'bebopMajor', oct: '1' }, sub: 2, from: 84, goal: 112 },
      { ex: 'md-melodic-superimposition', p: { set: 'minor251' }, from: 88, goal: 112, backing: 'chords' },
      { ex: 'wk-minor', p: { prog: 'minor-blues' }, from: 112, goal: 140, backing: 'chords' },
      { ex: 'lk-minor-ii-v-i', p: { lick: '0', key: 'cycle4', feel: 'swing' }, from: 100, goal: 120, backing: 'chords' },
      { ex: 'tech-permutations-across', p: { perm: '1324', pos: '5' }, sub: 2, from: 66, goal: 84 },
      { ex: 'sc-symmetric', p: { type: 'wholeTone', pattern: 'straight', oct: '1' }, sub: 2, from: 80, goal: 104 },
      { ex: 'lk-motif', p: { lick: '0', feel: 'swing' }, from: 100, goal: 128, backing: 'chords' },
      { ex: 'wk-two-per-bar', p: { prog: 'rhythm-A' }, from: 120, goal: 152, backing: 'chords' },
      { ex: 'mm-cantstop', p: { part: 'all' }, from: 72, goal: 92, backing: 'chords', music: true, do: 'Make music: funk-rock 16ths with ghost notes, then octave snaps in the chorus.' },
      { ex: 'mm-hysteria', p: { part: 'all' }, from: 70, goal: 94, backing: 'chords', music: true, do: 'Make music: non-stop 16th arpeggios. Even, clean, for the whole song.' },
      { ex: 'mm-whatsgoingon', p: { part: 'all' }, from: 80, goal: 100, backing: 'chords', music: true, do: 'Make music: a melodic Motown line with chromatic approaches and ghosted triplets.' },
    ],
  },
};
