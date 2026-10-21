// Course Stage 6: Mastery (Level 6). See ../data.js for the format.
export default {
  id: 's6', title: 'Mastery', level: 6,
  desc: 'Everything in every key without stopping, Messiaen\'s modes, harmonic major and altered chord-scales, Coltrane and rhythm changes, chordal bass, and the vocabulary of bebop and modern jazz.',
  units: [
    {
      id: 'u-all-keys', title: 'Scales in every key',
      goal: 'Odd groupings and alternating 3rds around all 12 keys without stopping.',
      lessons: [
        {
          id: 'odd-groupings', title: 'Odd groupings in 16ths',
          idea: 'Groups of 5 in 16ths, around all 12 keys: time, neck and stamina at once.',
          concept: [
            'Phrase the scale in groups of 5 while playing 16ths. Each group starts on a different part of the beat, and you go around all 12 keys without stopping. It tests time, knowledge of the neck and stamina at the same time.',
            'Accent the first note of each group and keep counting the beat. Keep one position and let the sequence decide when you shift.',
          ],
          steps: [
            { ex: 'sc-odd-groupings', p: { pattern: 'g5', type: 'ionian', oct: '1' }, sub: 4, from: 56, goal: 76, do: 'Groups of 5 in 16ths, around the cycle of 4ths.' },
            { ex: 'sc-odd-groupings', p: { pattern: 'g3', type: 'dorian', oct: '1' }, sub: 4, from: 56, goal: 76, do: 'Groups of 3 in 16ths, Dorian in every key.' },
          ],
          mistakes: [
            'Letting the groups pull the beat. The accents move; the beat does not.',
          ],
        },
        {
          id: 'alternating-3rds', title: 'Alternating 3rds in all keys',
          idea: 'Wide, zig-zag lines, every key, no stopping.',
          concept: [
            'Alternating-direction intervals make wide, melodic lines that are hard to play cleanly. Taking them around all 12 keys without stopping is a mastery drill for ears, eyes and hands.',
            'Name each 3rd as you play it (in major: M m m M M m m), keep the hand still and shift only where the key forces you to.',
          ],
          steps: [
            { ex: 'sc-alternating-all-keys', p: { type: 'ionian', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'Alternating 3rds in every major key.' },
            { ex: 'sc-alternating-all-keys', p: { type: 'melodicMinor', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'The same in melodic minor.' },
          ],
          mistakes: [
            'Stopping at each new key. The next key starts on the next beat.',
          ],
        },
      ],
      check: {
        can: [
          'I can phrase scales in groups of 3 and 5 through all 12 keys.',
          'I can play alternating 3rds in every key without stopping.',
        ],
        steps: [
          { ex: 'sc-odd-groupings', p: { pattern: 'g5', type: 'aeolian', oct: '1' }, sub: 4, from: 60, goal: 84 },
          { ex: 'sc-alternating-all-keys', p: { type: 'harmonicMinor', oct: '1' }, sub: 2, from: 80, goal: 108 },
        ],
      },
    },
    {
      id: 'u-chords-all-keys', title: 'Chords in every key',
      goal: 'Every inversion, every chord of every key, and the triad rudiments around the cycle.',
      lessons: [
        {
          id: 'cycle-inversions', title: 'Every inversion, every key',
          idea: 'Up through the inversions of one key, down through the next.',
          concept: [
            'Play root position, 1st and 2nd inversion climbing in one key, then descend through the inversions of the next key in the cycle, starting from the nearest note. Your eyes and ears have to stay one chord ahead.',
            'Start at 60 BPM in triplets and let the speed trainer add 4 BPM per loop. Turn the labels off once the shapes are automatic.',
          ],
          steps: [
            { ex: 'tri-cycle-all-inversions', p: { quality: 'maj', order: 'cycle4' }, sub: 3, from: 60, goal: 84, do: 'Major triads around the cycle of 4ths.' },
            { ex: 'tri-cycle-all-inversions', p: { quality: 'min', order: 'cycle4' }, sub: 3, from: 60, goal: 84, do: 'Minor triads.' },
          ],
          mistakes: [
            'Thinking about the current chord only. Find the next one while you play this one.',
          ],
        },
        {
          id: 'triads-all-keys', title: 'The triads of every key',
          idea: '3 inversions × 9 scales × 12 keys.',
          concept: [
            'The full diatonic-triad drill as a mastery test: every key around the cycle of 4ths, chords alternating up and down, in inversion. Change the inversion and the scale to multiply it.',
            'When it flows at 100 BPM in 8th-note triplets, you know triads on the bass.',
          ],
          steps: [
            { ex: 'tri-diatonic-all-keys', p: { scale: 'ionian', order: 'up', pattern: 'alt', inversion: '1' }, sub: 3, from: 66, goal: 92, do: '1st inversion, every major key.' },
            { ex: 'tri-diatonic-all-keys', p: { scale: 'harmonicMinor', order: 'up', pattern: 'alt', inversion: '2' }, sub: 3, from: 60, goal: 84, do: '2nd inversion, every harmonic minor key.' },
          ],
          mistakes: [
            'Losing the Roman numerals at speed. Keep saying them, in your head if not aloud.',
          ],
        },
        {
          id: 'rudiments-all-keys', title: 'Triad rudiments in all keys',
          idea: 'Technique, rhythm and harmony at once: no coasting.',
          concept: [
            'Take the triad rudiments around the cycle of 4ths. Technique, rhythm and harmony are all stressed at once, and muscle memory is no help. Aim for 16ths at 90 BPM.',
            'Accent the first note of each sticking group and count out loud: the odd-length rudiments shift across the beat.',
          ],
          steps: [
            { ex: 'tri-rudiments-all-keys', p: { scale: 'ionian', rudiment: 'paradiddle', order: 'up' }, sub: 4, from: 60, goal: 84, do: 'The paradiddle in every key.' },
          ],
          mistakes: [
            'Losing the sticking when the key changes. The rudiment keeps going; only the chords change.',
          ],
        },
        {
          id: 'sevenths-all-keys', title: 'The 7th chords of every key',
          idea: 'Imaj7 up, iim7 down, iiim7 up… then the next key.',
          concept: [
            'Every diatonic 7th chord of every key, without stopping: Imaj7 up, iim7 down, iiim7 up, then the next key in the cycle. Switch inversions and scales (harmonic and melodic minor) for a complete workout.',
            'Up one, down the next turns the chords into one line, but they still climb the neck: plan where each key starts.',
          ],
          steps: [
            { ex: 'arp-diatonic-all-keys', p: { scale: 'ionian', order: 'up', inversion: '0' }, sub: 4, from: 56, goal: 76, do: 'Every major key, root position, in 16ths.' },
            { ex: 'arp-diatonic-all-keys', p: { scale: 'melodicMinor', order: 'up', inversion: '1' }, sub: 4, from: 52, goal: 72, do: 'Melodic minor, from the 3rd.' },
          ],
          mistakes: [
            'Slowing down at the key changes. Practise those joins on their own.',
          ],
        },
      ],
      check: {
        can: [
          'I can play every triad inversion through the cycle.',
          'I can play the triads and 7th chords of every key without stopping.',
          'I can play triad rudiments in all 12 keys.',
        ],
        steps: [
          { ex: 'tri-diatonic-all-keys', p: { scale: 'ionian', order: 'fourths', pattern: 'alt', inversion: '2' }, sub: 3, from: 72, goal: 100 },
          { ex: 'tri-rudiments-all-keys', p: { scale: 'ionian', rudiment: 'paradiddle', order: 'up' }, sub: 4, from: 64, goal: 90 },
          { ex: 'arp-diatonic-all-keys', p: { scale: 'harmonicMinor', order: 'up', inversion: '0' }, sub: 4, from: 60, goal: 80 },
          { ex: 'tri-cycle-all-inversions', p: { quality: 'maj', order: 'cycle4' }, sub: 3, from: 66, goal: 92 },
        ],
      },
    },
    {
      id: 'u-modern', title: 'Modern colours',
      goal: 'Messiaen\'s modes, the modes of harmonic major, and altered chord-scales.',
      lessons: [
        {
          id: 'messiaen', title: 'Messiaen\'s modes',
          idea: 'A cell that repeats inside the octave: find it, and the scale follows.',
          concept: [
            'The composer Olivier Messiaen used seven scales built from a cell that repeats inside the octave, so they can be transposed only a few times before the same notes come back. Modes 1 and 2 are the whole-tone and diminished scales of jazz; modes 3 to 7 give the floating, colourful harmony of his music.',
            'Find the repeating cell on the neck: mode 3 repeats every 4 frets, modes 4 to 7 every 6.',
          ],
          steps: [
            { ex: 'sc-messiaen', p: { type: 'messiaen3', pattern: 'straight', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Mode 3: nine notes, a cell every 4 frets.' },
            { ex: 'sc-messiaen', p: { type: 'messiaen5', pattern: 'straight', oct: '1' }, sub: 2, from: 66, goal: 92, do: 'Mode 5: six notes, a tiny cell repeated a tritone higher.' },
          ],
          mistakes: [
            'Reading note by note. See the cell and repeat it.',
          ],
        },
        {
          id: 'harmonic-major', title: 'The modes of harmonic major',
          idea: 'Major with a ♭6: major with a dark edge.',
          concept: [
            'Harmonic major is the major scale with a ♭6 (C D E F G A♭ B). With major, harmonic minor and melodic minor it completes the four parent scales of modern harmony. It keeps the major I chord but borrows the minor iv and the °7 on the 7th degree.',
            'Its 5th mode, Mixolydian ♭2, fits a V7♭9 resolving to a major chord (G7♭9 → C).',
          ],
          steps: [
            { ex: 'md-harmonic-major-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 72, goal: 100, do: 'The seven modes of harmonic major.' },
          ],
          mistakes: [
            'Hearing it as minor. The 3rd is major; only the 6th is lowered.',
          ],
        },
        {
          id: 'altered-chord-scale', title: 'Altered dominants: the scales',
          idea: 'Altered over 7alt, half-whole over 7♭9, whole tone over 7♯5.',
          concept: [
            'Modern jazz colours the dominant with altered scales: the altered scale over 7alt (♭9 ♯9 ♭5 ♭13), half-whole diminished over 7♭9, and whole tone over 7♯5 and 7♭5. Each progression puts a different altered dominant between ii and I, so you hear the tension and the resolution.',
            'The notes over the V are named as tensions, the way jazz players say them.',
          ],
          steps: [
            { ex: 'md-altered-chord-scale', p: { prog: 'ii-V7alt-I' }, from: 84, goal: 104, backing: 'chords', do: 'The altered scale over V7alt.' },
            { ex: 'md-altered-chord-scale', p: { prog: 'ii-V7b9-I' }, from: 84, goal: 104, backing: 'chords', do: 'Half-whole diminished over V7♭9.' },
          ],
          mistakes: [
            'Resolving loosely. The altered notes resolve by step into the I chord.',
          ],
        },
      ],
      check: {
        can: [
          'I can find the repeating cell of Messiaen\'s modes.',
          'I know the modes of harmonic major.',
          'I choose the right scale for each altered dominant.',
        ],
        steps: [
          { ex: 'md-altered-chord-scale', p: { prog: 'ii-V7b9-I' }, from: 92, goal: 112, backing: 'chords' },
          { ex: 'md-harmonic-major-modes', p: { dir: 'up', oct: '1' }, sub: 2, from: 80, goal: 104 },
          { ex: 'sc-messiaen', p: { type: 'messiaen3', pattern: 'straight', oct: '1' }, sub: 2, from: 72, goal: 100 },
        ],
      },
    },
    {
      id: 'u-coltrane', title: 'Coltrane and rhythm changes',
      goal: 'The major-3rd axis, Giant Steps and rhythm changes at tempo.',
      lessons: [
        {
          id: 'major-thirds', title: 'The major-3rd axis',
          idea: 'Three keys equally far apart: B, G, E♭.',
          concept: [
            'Dividing the octave into three major 3rds gives three keys equally far apart (B, G, E♭). Coltrane built "Giant Steps" on them. Play their triads voice-led, ascending and descending, until the movement feels natural.',
            'Each move is a major 3rd: hear the bright, floating modulation.',
          ],
          steps: [
            { ex: 'tri-major-thirds', p: { quality: 'maj', dir: 'down' }, sub: 3, from: 72, goal: 112, do: 'Down in major 3rds.' },
            { ex: 'tri-major-thirds', p: { quality: 'min', dir: 'up' }, sub: 3, from: 72, goal: 112, do: 'Minor triads, up in major 3rds.' },
          ],
          mistakes: [
            'Jumping to root position each time. Move to the nearest chord tone.',
          ],
        },
        {
          id: 'giant-steps-arps', title: 'Giant Steps arpeggios',
          idea: 'Three key centres, V7 chords in between, often two chords per bar.',
          concept: [
            '"Giant Steps" moves between three keys a major 3rd apart, with V7 chords connecting them, often two chords per bar. Arpeggiating the changes in a continuous, voice-led line is a classic mastery test.',
            'Know the three tonics (B, G, E♭) and keep the 8ths even.',
          ],
          steps: [
            { ex: 'arp-giant-steps', p: { pattern: 'up' }, from: 80, goal: 120, backing: 'chords', do: 'R-3-5-7 on every chord of Giant Steps.' },
            { ex: 'arp-giant-steps', p: { pattern: 'alt' }, from: 80, goal: 120, backing: 'chords', do: 'Up one, down the next.' },
          ],
          mistakes: [
            'Getting lost in the form. Say the key centres as you reach them.',
          ],
        },
        {
          id: 'giant-steps-walk', title: 'Walking over Coltrane changes',
          idea: 'Roots on the beats, approach notes for every move.',
          concept: [
            'Walking through "Giant Steps" is a classic mastery test: fast root movement between three key centres. Keep the roots on the beats and use approach notes for every move.',
            'Practise at a comfortable tempo, then climb with the speed trainer.',
          ],
          steps: [
            { ex: 'wk-giant-steps', p: {}, from: 112, goal: 144, backing: 'chords', music: true, do: 'Walk Giant Steps with the chords.' },
          ],
          mistakes: [
            'Rushing the two-chord bars. The beat stays steady.',
          ],
        },
        {
          id: 'rhythm-changes-arps', title: 'Rhythm changes at tempo',
          idea: 'A chord every two beats, outlined in one continuous line.',
          concept: [
            'The A section of "I Got Rhythm" changes chord every two beats. Outlining it with voice-led arpeggios at tempo is a standard benchmark in jazz programmes. Then move it around the cycle.',
            'Let the line breathe at the ends of phrases.',
          ],
          steps: [
            { ex: 'arp-rhythm-changes', p: { pattern: 'alt' }, from: 104, goal: 144, backing: 'chords', do: 'Voice-led arpeggios through the A section.' },
          ],
          mistakes: [
            'Arpeggiating every chord from its root. Continue from the nearest chord tone.',
          ],
        },
      ],
      check: {
        can: [
          'I can play triads around the major-3rd axis.',
          'I can arpeggiate and walk Giant Steps.',
          'I can outline rhythm changes at tempo.',
        ],
        steps: [
          { ex: 'wk-giant-steps', p: {}, from: 128, goal: 160, backing: 'chords' },
          { ex: 'arp-rhythm-changes', p: { pattern: 'alt' }, from: 112, goal: 152, backing: 'chords' },
          { ex: 'tri-major-thirds', p: { quality: 'maj', dir: 'down' }, sub: 3, from: 80, goal: 120 },
          { ex: 'arp-giant-steps', p: { pattern: 'up' }, from: 96, goal: 132, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-chordal', title: 'Chordal bass',
      goal: 'Chords across the strings, and double thumbing for slappers.',
      lessons: [
        {
          id: 'chordal', title: 'Chordal bass: R-5-10 and R-7-10',
          idea: 'Root on E or A, 5th or 7th in the middle, the 3rd as a 10th on top.',
          concept: [
            'Solo and chordal bassists (Jaco, Victor Wooten, Steve Lawson) voice chords across the strings: root on the E or A string, 5th or 7th in the middle, the 3rd as a 10th on top. The exercise strums each voicing, then arpeggiates it, through jazz and pop progressions.',
            'Use the thumb for the root and index and middle for the upper notes; let the 10th sing a little louder.',
          ],
          steps: [
            { ex: 'hm-chordal-bass', p: { voicing: '5', prog: 'I-vi-IV-V' }, from: 60, goal: 84, backing: 'chords', do: 'R-5-10 through I–vi–IV–V.' },
            { ex: 'hm-chordal-bass', p: { voicing: '7', prog: 'ii-V-I' }, from: 60, goal: 80, backing: 'chords', music: true, do: 'R-7-10 through ii–V–I.' },
          ],
          mistakes: [
            'An uneven chord: the root booms, the 10th disappears. Balance the fingers.',
          ],
        },
        {
          id: 'double-thumb', title: 'Double thumbing', optional: true,
          idea: 'The thumb works both ways, like a pick.',
          concept: [
            'Double thumbing uses the thumb in both directions: a downstroke that rests on the next string, then an upstroke with the thumbnail side. With pops it allows continuous 16th-note slap lines at high speed. Optional, for players who slap.',
            'Start painfully slowly, thumb only, and keep the wrist loose.',
          ],
          steps: [
            { ex: 'sl-double-thumb', p: { style: 'double' }, from: 50, goal: 72, backing: 'chords', do: 'Down–up with the thumb, pops in between.' },
          ],
          mistakes: [
            'A stiff wrist. The thumb moves like a pick from a loose hand.',
          ],
        },
      ],
      check: {
        can: [
          'I can play chords across the strings with p-i-m through a progression.',
        ],
        steps: [
          { ex: 'hm-chordal-bass', p: { voicing: '7', prog: 'autumn' }, from: 66, goal: 88, backing: 'chords' },
        ],
      },
    },
    {
      id: 'u-masters', title: 'The vocabulary of the masters',
      goal: 'Bebop and modern jazz vocabulary, in every key.',
      lessons: [
        {
          id: 'bebop-vocab', title: 'Bebop vocabulary',
          idea: 'Enclosures, the bebop scale, upper structures and the ♭9 resolution.',
          concept: [
            'Bebop players built a shared vocabulary: enclosures (surround the target from above and below), the bebop dominant scale (an added major 7th so chord tones fall on the beats), upper-structure arpeggios and the ♭9 resolution. "The Lick" is the most famous cliché in jazz: every player knows it, so it is worth knowing too.',
            'In every enclosure the target falls on the beat.',
          ],
          steps: [
            { ex: 'lk-bebop', p: { lick: '0', feel: 'swing' }, from: 100, goal: 132, backing: 'chords', do: '"The Lick".' },
            { ex: 'lk-bebop', p: { lick: '1', feel: 'swing' }, from: 100, goal: 132, backing: 'chords', do: 'A chain of enclosures on the V.' },
            { ex: 'lk-bebop', p: { lick: '2', feel: 'swing' }, from: 100, goal: 132, backing: 'chords', do: 'The bebop dominant scale from the 3rd: chord tones on the beats.' },
          ],
          mistakes: [
            'Learning the licks in C only. Take each one through all 12 keys.',
          ],
        },
        {
          id: 'modern-vocab', title: 'Modern sounds',
          idea: 'Superimposition, triad pairs, the altered scale, Coltrane\'s cycle, side-slipping.',
          concept: [
            'Post-bop and fusion players stretch the harmony: pentatonics a step apart over one chord, two alternating triads, the altered scale over dominants, Coltrane\'s major-3rd key centres, side-slipping a half step outside and back, and fast 16th-note arpeggio runs in the style of Jaco.',
            'Side-slipping only works if you come back in clearly: land the resolution on a strong beat.',
          ],
          steps: [
            { ex: 'lk-modern', p: { lick: '0', feel: 'swing' }, from: 84, goal: 108, backing: 'chords', do: 'Pentatonic superimposition.' },
            { ex: 'lk-modern', p: { lick: '1', feel: 'swing' }, from: 84, goal: 108, backing: 'chords', do: 'Triad pairs I and II: Lydian.' },
            { ex: 'lk-modern', p: { lick: '4', feel: 'swing' }, from: 84, goal: 108, backing: 'chords', music: true, do: 'Coltrane\'s major-3rd cycle.' },
          ],
          mistakes: [
            'Playing outside without coming back. The resolution is what makes it sound intended.',
          ],
        },
      ],
      check: {
        can: [
          'I can play bebop vocabulary in all 12 keys.',
          'I use modern devices and resolve them clearly.',
        ],
        steps: [
          { ex: 'lk-bebop', p: { lick: '2', key: 'cycle4', feel: 'swing' }, from: 108, goal: 138, backing: 'chords' },
          { ex: 'lk-modern', p: { lick: '1', feel: 'swing' }, from: 92, goal: 116, backing: 'chords' },
        ],
      },
    },
  ],
  check: {
    can: [
      'I can play scales, triads and 7th chords through all 12 keys without stopping.',
      'I know Messiaen\'s modes, harmonic major and the altered chord-scales.',
      'I can walk and arpeggiate Giant Steps and rhythm changes at tempo.',
      'I can play chordal bass across the strings.',
      'I can play bebop and modern jazz vocabulary in every key.',
    ],
    steps: [
      { ex: 'sc-odd-groupings', p: { pattern: 'g5', type: 'melodicMinor', oct: '1' }, sub: 4, from: 66, goal: 88 },
      { ex: 'tri-diatonic-all-keys', p: { scale: 'melodicMinor', order: 'fourths', pattern: 'alt', inversion: '1' }, sub: 3, from: 76, goal: 100 },
      { ex: 'md-altered-chord-scale', p: { prog: 'ii-V7alt-I', key: 'cycle4' }, from: 96, goal: 120, backing: 'chords' },
      { ex: 'wk-giant-steps', p: {}, from: 140, goal: 180, backing: 'chords' },
      { ex: 'lk-modern', p: { lick: '4', key: 'cycle4', feel: 'swing' }, from: 96, goal: 120, backing: 'chords' },
      { ex: 'hm-chordal-bass', p: { voicing: '7', prog: 'ii-V-I' }, from: 66, goal: 88, backing: 'chords' },
    ],
  },
};
