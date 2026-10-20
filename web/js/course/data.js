// The guided Course: stages → units → lessons → steps, built from the exercises of the Library.
// A step opens one exercise with preset options (`p`, only the options that matter: the rest stay
// the player's own). It starts at `from` BPM; its pass mark is the `goal` tempo, which the app
// records, plus the player's own "clean" tick (no goal: one full loop). A step marked `music`
// puts the lesson to work in a musical setting, with the backing it names.
// Nothing is locked: the Course only recommends the next lesson.
// Ids are stored in the player's progress: never rename one.

export const STAGES = [
  // ================================================================ Stage 1
  {
    id: 's1', title: 'First steps', level: 1,
    desc: 'Hold the bass, keep steady time, learn the notes on the low strings and play your first scales, chords and bass lines.',
    units: [
      {
        id: 'u-hands', title: 'Your two hands',
        goal: 'Pluck evenly with two fingers and fret with one finger per fret.',
        lessons: [
          {
            id: 'pluck', title: 'Plucking with two fingers',
            idea: 'Alternate index and middle, and make the two fingers sound the same.',
            concept: [
              'Most bass is played with the index (i) and middle (m) fingers of the plucking hand, taking turns: i-m-i-m. Alternating doubles your speed and keeps the hand relaxed. Rest the thumb on the pickup or on the E string, and pull each finger across the string so it comes to rest on the next string.',
              'The aim is not speed but sameness: every note the same volume, the same length and exactly with the click. With your eyes closed, nobody should be able to tell which finger played.',
            ],
            steps: [
              { ex: 'tech-alt-pluck', p: { start: 'i', reps: '8' }, from: 60, goal: 80, do: 'Eight notes on each open string, starting with the index. The i/m tags show which finger plucks.' },
              { ex: 'tech-alt-pluck', p: { start: 'm', reps: '4' }, from: 60, goal: 80, do: 'Now start with the middle finger, four notes per string. Neither finger should lead.' },
            ],
            mistakes: [
              'Using the same finger twice when you change string. Keep alternating, even across strings.',
              'Pulling the string away from the body: it snaps back against the frets. Pluck across the string, towards the next one.',
              'A tense, lifted hand. Let the wrist hang loose and keep the thumb resting.',
            ],
          },
          {
            id: 'open-strings', title: 'The open strings',
            idea: 'E-A-D-G, each string a 4th above the one below.',
            concept: [
              'From the thickest string to the thinnest, a 4-string bass is tuned E-A-D-G (a 5-string adds a low B, a 6-string a low B and a high C). Each string is a 4th above the one below it, which is why the same shapes work all over the neck.',
              'A phrase to remember them: Eat All Day, Grandma. Tune up before you practise: the tuner button sits at the top of every exercise.',
            ],
            steps: [
              { ex: 'fb-open-strings', p: { reps: '4' }, from: 60, goal: 76, do: 'Four plucks on each string. Say its name out loud as you play.' },
              { ex: 'fb-open-strings', p: { reps: '1' }, from: 60, goal: 80, do: 'One pluck per string: now you cross strings on every note. Keep alternating i-m.' },
            ],
            mistakes: [
              'Letting the open strings ring into each other. After each note, rest the plucking finger on the next string and touch the string you left.',
              'Looking down to find the strings. Feel them: the thickest one is the nearest to your face.',
            ],
          },
          {
            id: 'one-finger', title: 'One finger per fret',
            idea: 'Four fingers cover four frets: that is the home position of the hand.',
            concept: [
              'The fretting hand covers four frets with four fingers: index on the first, middle on the second, ring on the third, little finger on the fourth. This "one finger per fret" position is the home of the hand, and almost every exercise in the app uses it.',
              'Press just behind the fret, not on top of it and not halfway between two frets, and only as hard as a clean note needs. The thumb rests behind the neck, roughly behind the middle finger.',
            ],
            steps: [
              { ex: 'tech-1234', p: { pos: '5' }, from: 60, goal: 80, do: 'Start at fret 5, where the frets are closer together. Keep each finger down until the next one sounds.' },
              { ex: 'tech-1234', p: { pos: '1' }, from: 60, goal: 72, do: 'Now at fret 1, where the hand opens wider. Stretch from the knuckles, not by moving the arm.' },
            ],
            mistakes: [
              'Lifting each finger high off the string. Keep the fingers hovering close: less movement now, more speed later.',
              'Squeezing with the thumb. If the hand tires quickly, press lighter.',
              'A buzzing note: the finger is too far from the fret. Move it right behind the fret.',
            ],
          },
        ],
        check: {
          can: [
            'I alternate i-m without thinking about it, even when I change string.',
            'I can name the open strings without looking.',
            'I keep one finger per fret, with my fingers close to the strings.',
          ],
          steps: [
            { ex: 'tech-alt-pluck', p: { start: 'i', reps: '4' }, from: 72, goal: 92 },
            { ex: 'tech-1234', p: { pos: '3' }, from: 66, goal: 88 },
          ],
        },
      },
      {
        id: 'u-time', title: 'Steady time',
        goal: 'Play with the click, feel the subdivisions and make the rests silent.',
        lessons: [
          {
            id: 'pulse', title: 'The pulse',
            idea: 'Your note and the click should sound as one.',
            concept: [
              'A bass player\'s first job is time. The bass and the kick drum tell the band where the beat is, so a steady quarter note matters more than any fast lick.',
              'Play with the click until your note sits inside it: one sound, not a click and then a note. Then let the click do less of the work: only on beats 2 and 4 (where a snare drum plays), then only on beat 1. Your inner clock fills in the rest.',
            ],
            steps: [
              { ex: 'rh-pulse', p: { click: 'all' }, from: 72, goal: 96, do: 'A click on every beat. Make your note and the click land as one sound.' },
              { ex: 'rh-pulse', p: { click: '24' }, from: 72, goal: 96, do: 'The click only plays beats 2 and 4. Count 1 and 3 in your head and tap your foot.' },
              { ex: 'rh-pulse', p: { click: '1' }, from: 60, goal: 84, do: 'Only beat 1 clicks. Keep the other three beats exactly even.' },
            ],
            mistakes: [
              'Rushing when the click goes quiet. Relax and count out loud.',
              'Notes that die early. A quarter note lasts until the next beat: hold it, then stop the string.',
            ],
          },
          {
            id: 'subdivisions', title: 'Dividing the beat',
            idea: 'The beat stays the same: only the number of notes inside it changes.',
            concept: [
              'Every beat can be split. Two notes per beat are 8ths (count "1 &"), three are triplets ("1 trip let"), four are 16ths ("1 e & a"). The pulse does not move; only the number of notes inside each beat changes.',
              'The pyramid climbs from one to four notes per beat and back. Count out loud and feel where each group starts: always exactly on the click.',
            ],
            steps: [
              { ex: 'rh-pyramid', p: { max: '4', note: 'A0' }, from: 60, goal: 80, do: 'Count every subdivision out loud. The first note of each group lands on the click.' },
              { ex: 'rh-pyramid', p: { max: '4', note: 'E5' }, from: 60, goal: 76, do: 'The same on a fretted A (E string, fret 5): now the fretting hand has to hold the note steady too.' },
            ],
            mistakes: [
              'Speeding up on the 16ths. If the four notes squash together, lower the tempo.',
              'Triplets that sound like two short notes and a long one. Make all three equal.',
            ],
          },
          {
            id: 'rests', title: 'Notes and rests',
            idea: 'A rest is a silence you make, not a gap where the note rings on.',
            concept: [
              'Silence is part of the bass line. On a rest the note must stop: release the pressure of the fretting finger without lifting it off, or touch the string with a plucking finger.',
              'Listen to the space between the notes. A groove that stops cleanly sounds tight; one that rings on sounds muddy.',
            ],
            steps: [
              { ex: 'rh-rests', p: { note: 'A0' }, from: 72, goal: 92, do: 'Play the notes and stop the string exactly on each rest. Count all four beats, the silent ones too.' },
              { ex: 'rh-rests', p: { note: 'A3' }, from: 72, goal: 92, do: 'On a fretted C: release the finger to stop each note, without lifting it off the string.' },
            ],
            mistakes: [
              'An open string ringing through the rest. Touch it with a plucking finger.',
              'Cutting the note short before a rest. Hold each note for its full length.',
            ],
          },
        ],
        check: {
          can: [
            'My notes land with the click, even when it only plays on beat 1.',
            'I can count 8ths, triplets and 16ths out loud while I play them.',
            'My rests are silent.',
          ],
          steps: [
            { ex: 'rh-pulse', p: { click: '2bars' }, from: 66, goal: 80 },
            { ex: 'rh-pyramid', p: { max: '4' }, from: 66, goal: 88 },
            { ex: 'rh-rests', p: {}, from: 80, goal: 100 },
          ],
        },
      },
      {
        id: 'u-notes', title: 'Notes on the neck',
        goal: 'Name every note on the E and A strings and find its octave.',
        lessons: [
          {
            id: 'alphabet', title: 'The musical alphabet',
            idea: 'Seven letters, and only E–F and B–C sit on neighbouring frets.',
            concept: [
              'Music uses seven letters: A B C D E F G, then A again. Between most neighbouring letters there is a fret in between (a whole step, two frets). Only E–F and B–C sit on neighbouring frets (a half step).',
              'So from the open E: F is fret 1, G fret 3, A fret 5, B fret 7, C fret 8, D fret 10, and at fret 12 E again, one octave higher. Fret 12 repeats the open string.',
            ],
            steps: [
              { ex: 'fb-naturals', p: { string: 'E', range: '0' }, from: 60, goal: 80, do: 'Say each note\'s name as you play it. Notice the half steps E–F and B–C.' },
              { ex: 'fb-naturals', p: { string: 'A', range: '0' }, from: 60, goal: 80, do: 'The same alphabet starting from A. Where are the half steps now?' },
            ],
            mistakes: [
              'Forgetting that E–F and B–C have no fret between them.',
              'Counting frets from the nut every time. Learn a few anchors instead (the next lessons).',
            ],
          },
          {
            id: 'sharps-flats', title: 'Sharps and flats',
            idea: 'One fret up is sharp (♯), one fret down is flat (♭).',
            concept: [
              'The frets between the natural notes have two names. One fret above G is G♯ (sharp: one fret higher); one fret below A is A♭ (flat: one fret lower). G♯ and A♭ are the same sound.',
              'Going up, players usually name them as sharps; coming down, as flats. With the natural notes and these two rules, every fret has a name.',
            ],
            steps: [
              { ex: 'fb-chromatic-string', p: { string: 'A' }, from: 66, goal: 84, do: 'Sharps going up, flats coming down. Say every name.' },
              { ex: 'fb-chromatic-string', p: { string: 'E' }, from: 66, goal: 84, do: 'Now on the E string.' },
            ],
            mistakes: [
              'Thinking there is a note between E and F or between B and C. There is no fret there.',
              'Mixing the names. Use sharps going up and flats coming down until it is automatic.',
            ],
          },
          {
            id: 'landmarks', title: 'Landmark frets',
            idea: 'Learn the notes under the dots: every other note is one fret away.',
            concept: [
              'The dots on the neck at frets 3, 5, 7, 9 and 12 are your map. Learn the notes under them on each string and every other note is one fret away from one you know.',
              'E string: G, A, B, C♯, E. A string: C, D, E, F♯, A. D string: F, G, A, B, D. G string: B♭, C, D, E, G.',
            ],
            steps: [
              { ex: 'fb-landmarks', p: { order: 'string' }, from: 60, goal: 80, do: 'One string at a time: name each landmark before its dot appears.' },
              { ex: 'fb-landmarks', p: { order: 'fret' }, from: 60, goal: 80, do: 'Now fret by fret across the strings: fret 5 is A, D, G, C.' },
            ],
            mistakes: [
              'Counting frets from the nut. Start from the nearest dot instead.',
              'Learning the E string only. The A string is just as important: half of all bass lines start there.',
            ],
          },
          {
            id: 'octaves', title: 'The octave shape',
            idea: 'Two strings up, two frets up: the same note, an octave higher.',
            concept: [
              'From any note, go two strings up and two frets up and you find the same note an octave higher: A on the E string (fret 5) and A on the D string (fret 7). The shape is the same everywhere on the neck.',
              'Octaves double what you know: learn the E and A strings and you also know the D and G strings. They are also the start of the root–octave lines of disco and rock.',
            ],
            steps: [
              { ex: 'fb-octaves', p: { pair: '0' }, from: 66, goal: 84, do: 'E string to D string: index on the low note, ring or little finger on the octave.' },
              { ex: 'fb-octaves', p: { pair: '1' }, from: 66, goal: 84, do: 'Now from the A string to the G string.' },
            ],
            mistakes: [
              'Letting the string in between ring. Mute it with the side of the index finger.',
              'Going two frets the wrong way. The octave is always higher on the neck (towards the body).',
            ],
          },
        ],
        check: {
          can: [
            'I can name any natural note on the E and A strings within a second.',
            'I know the landmark notes at frets 3, 5, 7, 9 and 12.',
            'I can find the octave of any note on the E or A string.',
          ],
          steps: [
            { ex: 'fb-naturals', p: { string: 'A', range: '0' }, from: 72, goal: 96 },
            { ex: 'fb-landmarks', p: { order: 'fret' }, from: 72, goal: 96 },
          ],
        },
      },
      {
        id: 'u-lines', title: 'Your first bass lines',
        goal: 'Play roots, 5ths and octaves through real progressions.',
        lessons: [
          {
            id: 'roots', title: 'Roots with the drums',
            idea: 'Every chord has a root: playing it steadily is the bass player\'s first job.',
            concept: [
              'Every chord has a root, the note that names it: A for A major, D for D major. Playing just the roots, in steady 8ths, is the foundation of countless rock and pop songs.',
              'Roman numerals name chords by their place in the key: in A major, I is A, IV is D and V is E. So I–IV–V–I means the same moves in every key. The chord names appear above the neck as you play.',
            ],
            steps: [
              { ex: 'gr-roots', p: { style: 'rock8', prog: 'I-IV-V-I', key: '9' }, from: 80, goal: 110, backing: 'chords', do: 'Rock 8ths through I–IV–V–I in A. Keep every note the same length and volume.' },
              { ex: 'gr-roots', p: { style: 'rock8', prog: 'I-V-vi-IV', key: '9' }, from: 80, goal: 110, backing: 'chords', do: 'I–V–vi–IV, the most used progression in pop. Look ahead: the next dot shows where to go.' },
            ],
            mistakes: [
              'Arriving late on the new chord. Move your hand during the last note of the old one.',
              'Uneven 8ths. Alternate i-m strictly, even when the string changes.',
            ],
          },
          {
            id: 'root-fifth', title: 'Root and 5th',
            idea: 'The 5th is the root\'s best friend: one string up and two frets up, or the same fret one string down.',
            concept: [
              'The 5th is the closest friend of the root. On the bass it sits one string up and two frets up (the power-chord shape), or at the same fret on the string below. Both are the same note, an octave apart.',
              'Root on beat 1 and the 5th below on beat 3 is the two-beat line of country and folk. R-5-8-5 (root, 5th, octave, 5th) is a line that fits under almost any chord.',
            ],
            steps: [
              { ex: 'gr-roots', p: { style: 'rootFifth' }, from: 66, goal: 100, backing: 'chords', do: 'Root, then the 5th below it. Let each note ring for its full two beats.' },
              { ex: 'gr-roots', p: { style: 'r585', prog: 'I-vi-IV-V' }, from: 72, goal: 104, backing: 'chords', do: 'R-5-8-5 in quarters: one hand shape for each chord.' },
            ],
            mistakes: [
              'Moving the whole hand to reach the 5th. Keep the shape under your fingers.',
              'Notes ringing into each other. Stop each note as the next one starts.',
            ],
          },
          {
            id: 'lead-in', title: 'Leading into the next chord',
            idea: 'A note a step away from the next root tells the ear the change is coming.',
            concept: [
              'A line becomes music when it leads somewhere. On the last 8th before a chord change, play a note a step away from the next root, and the ear hears the change coming.',
              'The dots labelled → are these approach notes. Keep them light: the root still does the work.',
            ],
            steps: [
              { ex: 'gr-roots', p: { style: 'pop8', prog: 'I-V-vi-IV' }, from: 84, goal: 112, backing: 'chords', do: 'Pop 8ths: roots, with an approach note into each new chord.' },
              { ex: 'gr-roots', p: { style: 'pop8', prog: 'vi-IV-I-V' }, from: 84, goal: 112, backing: 'chords', music: true, do: 'Play along with the chords, then try a few loops without looking at the neck.' },
            ],
            mistakes: [
              'Accenting the approach note. It should be softer than the root it leads to.',
              'Rushing the last 8th. The approach note sits in time like every other note.',
            ],
          },
        ],
        check: {
          can: [
            'I can play the roots of a progression from its Roman numerals.',
            'I can find the 5th and the octave of a root without looking.',
            'My 8ths stay even through the chord changes.',
          ],
          steps: [
            { ex: 'gr-roots', p: { style: 'rock8', prog: 'I-V-vi-IV' }, from: 96, goal: 120, backing: 'chords' },
            { ex: 'gr-roots', p: { style: 'r585', prog: 'I-IV-V-I' }, from: 90, goal: 112, backing: 'chords' },
          ],
        },
      },
      {
        id: 'u-scales', title: 'Your first scales',
        goal: 'Play the major, minor and pentatonic scales in one position, in any key.',
        lessons: [
          {
            id: 'major-scale', title: 'The major scale',
            idea: 'Whole, whole, half, whole, whole, whole, half: the ruler for everything else.',
            concept: [
              'The major scale is the "do re mi" sound and the ruler for everything else in music: intervals, chords and modes are all measured against it. Its steps are whole, whole, half, whole, whole, whole, half.',
              'On the bass it fits under one hand. With the root under the middle finger on the E or A string, the fingering is 2-4, 1-2-4, 1-3-4, with no shift. Because the shape never changes, you can play it in any key by moving it.',
            ],
            steps: [
              { ex: 'sc-one-octave', p: { type: 'ionian', key: '0', root: 'A', oct: '1' }, from: 60, goal: 84, do: 'C major from the A string. Sing "do re mi" along with it.' },
              { ex: 'sc-one-octave', p: { type: 'ionian', key: '7', root: 'E', oct: '1' }, from: 60, goal: 84, do: 'G major from the E string: the same shape, one string lower.' },
              { ex: 'sc-one-octave', p: { type: 'ionian', root: 'A', oct: '1' }, from: 60, goal: 84, do: 'Pick any key under Options. The shape does not change, only its place on the neck.' },
            ],
            mistakes: [
              'Changing the fingering each time. Switch the dot labels to fingers (Fing) and follow them.',
              'Playing the scale without hearing it. Sing along, or say the degree numbers.',
            ],
          },
          {
            id: 'open-position', title: 'Scales with open strings',
            idea: 'Near the nut, open strings take the place of fretted notes.',
            concept: [
              'Near the nut, open strings can replace fretted notes. E, A, G, C, F and D sit comfortably there, and many songs written on the guitar use these keys.',
              'Natural minor is the darker sister of the major scale: its 3rd, 6th and 7th are a fret lower. E minor in open position is one of the first sounds of rock.',
            ],
            steps: [
              { ex: 'sc-open-position', p: { type: 'ionian', key: '7', oct: '1' }, from: 60, goal: 84, do: 'G major in open position. Let no open string ring into the next note.' },
              { ex: 'sc-open-position', p: { type: 'aeolian', key: '4', oct: '1' }, from: 60, goal: 84, do: 'E natural minor: hear how much darker it is than major.' },
            ],
            mistakes: [
              'Open strings ringing on. An open string cannot be stopped by the fretting hand: touch it with the plucking hand.',
              'Fretting with the wrong finger after an open string. Keep one finger per fret in frets 1–4.',
            ],
          },
          {
            id: 'pentatonics', title: 'Pentatonic scales',
            idea: 'Five notes, no clashes: the sound of rock, blues and pop.',
            concept: [
              'Leave out the 4th and 7th of the major scale and you get the major pentatonic: five notes that never clash, the sound of folk, country and pop melodies. The minor pentatonic (1 ♭3 4 5 ♭7) is home for rock and blues players.',
              'They share their notes: C major pentatonic and A minor pentatonic are the same five notes starting from a different root. The minor box, two notes per string, is a shape you will use for years.',
            ],
            steps: [
              { ex: 'sc-one-octave', p: { type: 'minorPent', key: '9', root: 'E', oct: '1' }, from: 60, goal: 88, do: 'A minor pentatonic from the E string: fingers 1-4, 1-3, 1-3.' },
              { ex: 'sc-one-octave', p: { type: 'majorPent', key: '0', root: 'A', oct: '1' }, from: 60, goal: 88, do: 'C major pentatonic: the same notes as A minor pentatonic, from another root.' },
              { ex: 'gr-octaves', p: { style: 'riff', prog: 'vamp-min' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'A riff built from the minor pentatonic. Listen to how the box turns into a bass line.' },
            ],
            mistakes: [
              'Playing pentatonics as fast as possible. Play them as music: in time, with every note full length.',
              'Losing the root. Always know where the root of the box is.',
            ],
          },
        ],
        check: {
          can: [
            'I can play a one-octave major scale from the E and A strings in any key.',
            'I know the steps of the major scale: W W H W W W H.',
            'I can play the minor pentatonic box from the E string.',
          ],
          steps: [
            { ex: 'sc-one-octave', p: { type: 'ionian', root: 'A', oct: '1' }, from: 72, goal: 96 },
            { ex: 'sc-one-octave', p: { type: 'minorPent', root: 'E', oct: '1' }, from: 72, goal: 100 },
          ],
        },
      },
      {
        id: 'u-chords', title: 'Your first chords',
        goal: 'Build triads from the scale and hear major against minor.',
        lessons: [
          {
            id: 'build-chord', title: 'How a chord is built',
            idea: 'Skip a note, play a note: 1, 3, 5 is a triad and 7 makes it a 7th chord.',
            concept: [
              'A chord is a stack of every other note of a scale: 1, 3 and 5 make a triad; add the 7 and you have a 7th chord. Bass players mostly play chords one note at a time, as arpeggios.',
              'This is why the scale came first: every chord tone is a scale note, so the chord shape sits inside the scale shape you already know.',
            ],
            steps: [
              { ex: 'hm-build-a-chord', p: { scale: 'ionian', key: '0', root: 'A' }, from: 60, goal: 84, do: 'The scale, then 1-3-5, then 1-3-5-7: hear the chord grow out of the scale.' },
              { ex: 'hm-build-a-chord', p: { scale: 'aeolian', key: '9', root: 'E' }, from: 60, goal: 84, do: 'Now from A natural minor: 1-♭3-5-♭7.' },
            ],
            mistakes: [
              'Learning chord shapes as dots without names. Say the degree of each note.',
            ],
          },
          {
            id: 'triad-shapes', title: 'Triad shapes',
            idea: 'Major and minor triads differ by one note, the 3rd.',
            concept: [
              'Major triad with the root under finger 2: the 3rd is one string up and one fret back (finger 1), the 5th one string up and two frets forward (finger 4). Minor with the root under finger 1: the ♭3 is three frets up on the same string, the 5th one string up and two frets forward.',
              'Like the scale, each shape moves to any key unchanged. Go up to the octave (1-3-5-8) and the shape becomes a complete bass line.',
            ],
            steps: [
              { ex: 'tri-shape', p: { quality: 'maj', root: 'A', shape: 'updown' }, from: 60, goal: 88, do: 'Major triad up and down. Say "root, 3rd, 5th" as you play.' },
              { ex: 'tri-shape', p: { quality: 'min', root: 'A', shape: 'updown' }, from: 60, goal: 88, do: 'Minor: only the 3rd changes.' },
              { ex: 'tri-shape', p: { quality: 'maj', root: 'E', shape: 'octave' }, from: 60, goal: 88, do: '1-3-5-8-5-3: up to the octave and back, from the E string.' },
            ],
            mistakes: [
              'Starting the major shape with finger 1: the 3rd then needs a stretch backwards. Root on finger 2 for major.',
              'Losing the sound. Play slowly enough to hear major and minor each time.',
            ],
          },
          {
            id: 'major-minor', title: 'Hear major and minor',
            idea: 'Major sounds bright, minor darker: the 3rd decides.',
            concept: [
              'Major sounds bright and settled, minor darker and more serious. The only difference is the 3rd: a major 3rd is four frets above the root, a minor 3rd three.',
              'Train your ear along with your hands: whenever you play a triad, say "major" or "minor" before you reach the 3rd.',
            ],
            steps: [
              { ex: 'tri-maj-min', p: { root: 'A' }, from: 66, goal: 90, do: 'Major, then minor on the same root: listen to the one note that changes.' },
              { ex: 'ear-triads', p: { set: 'mm' }, do: 'Ear check: a triad plays with its notes hidden. Say "major" or "minor" before the answer appears.' },
            ],
            mistakes: [
              'Guessing from the shape you see. In the ear check, close your eyes.',
            ],
          },
        ],
        check: {
          can: [
            'I can play major and minor triads from the E and A strings in any key.',
            'I can hear whether a triad is major or minor.',
            'I know that a chord is built from every other note of a scale.',
          ],
          steps: [
            { ex: 'tri-shape', p: { quality: 'maj', shape: 'octave' }, from: 72, goal: 100 },
            { ex: 'tri-maj-min', p: {}, from: 76, goal: 100 },
          ],
        },
      },
      {
        id: 'u-reading', title: 'Reading the bass clef',
        goal: 'Read the natural notes in first position.',
        lessons: [
          {
            id: 'clef', title: 'The bass clef',
            idea: 'The open strings are your anchors on the staff.',
            concept: [
              'Bass music is written in the bass clef. Its lines from the bottom are G B D F A ("Good Boys Do Fine Always"), its spaces A C E G ("All Cows Eat Grass").',
              'Bass guitar is written an octave above its sound, so the notes sit on the staff rather than far below it. The open E is on the first ledger line below the staff, the open A in the bottom space, the open D on the middle line and the open G in the top space.',
            ],
            steps: [
              { ex: 'rd-naturals', p: { range: 'ea' }, from: 50, goal: 66, do: 'E and A strings only. Read the note and play it before its dot appears.' },
            ],
            mistakes: [
              'Counting lines from the bottom for every note. Learn the open strings as anchors and read from them.',
              'Looking at the neck instead of the staff. Trust your hand.',
            ],
          },
          {
            id: 'first-position', title: 'Reading in first position',
            idea: 'Frets 0 to 3 on four strings: the whole first position on the staff.',
            concept: [
              'In first position (frets 0–3) each written note has one place to play it, so reading here is about connecting the staff to your fingers.',
              'Read one note ahead: while you play a note, your eyes are already on the next one.',
            ],
            steps: [
              { ex: 'rd-naturals', p: { range: 'all' }, from: 50, goal: 66, do: 'All four strings in first position. Keep the tempo even, even when a note takes you a moment.' },
            ],
            mistakes: [
              'Stopping when you miss a note. Keep going: the next note comes on time anyway.',
            ],
          },
        ],
        check: {
          can: [
            'I can read the open strings and the natural notes in first position.',
            'I read one note ahead while playing.',
          ],
          steps: [
            { ex: 'rd-naturals', p: { range: 'all' }, from: 56, goal: 72 },
          ],
        },
      },
    ],
    check: {
      can: [
        'I can play a root line through a song at 110 BPM with even 8ths.',
        'I can play the major scale and major and minor triads in any key.',
        'I keep time with the click on beat 1 only.',
        'I can read first-position notes on the staff.',
      ],
      steps: [
        { ex: 'gr-roots', p: { style: 'r585', prog: 'I-V-vi-IV' }, from: 92, goal: 112, backing: 'chords' },
        { ex: 'sc-one-octave', p: { type: 'ionian', root: 'E', oct: '1' }, from: 80, goal: 100 },
        { ex: 'tri-shape', p: { quality: 'min', shape: 'octave' }, from: 80, goal: 100 },
        { ex: 'rh-pulse', p: { click: '1' }, from: 76, goal: 92 },
        { ex: 'rd-naturals', p: { range: 'all' }, from: 60, goal: 72 },
      ],
    },
  },

  // ================================================================ Stage 2
  {
    id: 's2', title: 'Building blocks', level: 2,
    desc: 'Stronger hands, off-beats and swing, the whole neck, intervals, every triad and 7th chord, the blues, your first grooves and reading in keys.',
    units: [
      {
        id: 'u-hands2', title: 'Stronger hands',
        goal: 'Cross strings smoothly, mute cleanly and move up the neck.',
        lessons: [
          {
            id: 'raking', title: 'Crossing strings',
            idea: 'Alternate going up, rake coming down.',
            concept: [
              'Moving to a higher string, keep alternating i-m. Moving to a lower-pitched string, let the finger that just played fall onto it and pluck again: a rake. It saves motion and keeps the time even.',
              'The i/m tags above the dots show which finger plucks. Follow them slowly first: the habit is what matters.',
            ],
            steps: [
              { ex: 'tech-raking', p: { fret: '0', pattern: 'wave' }, from: 70, goal: 96, do: 'Open strings up and down. Watch the i/m tags on the way down.' },
              { ex: 'tech-raking', p: { fret: '5', pattern: 'arp' }, from: 70, goal: 96, do: 'An arpeggio shape at fret 5: raking makes it smooth.' },
            ],
            mistakes: [
              'Raking with a flick that makes the second note louder. All notes the same volume.',
            ],
          },
          {
            id: 'muting', title: 'Muting',
            idea: 'Every string you are not playing stays silent.',
            concept: [
              'A clean bass line is as much about the strings you do not play as the ones you do. The plucking thumb rests on the lower strings, the fretting hand\'s spare fingers lie lightly across the higher ones.',
              'Stopping a note is a skill too: lift the pressure of the fretting finger, or touch an open string with a plucking finger, exactly on the rest.',
            ],
            steps: [
              { ex: 'tech-muting', p: { pattern: 'open', length: 'half' }, from: 72, goal: 96, do: 'Open strings: play, then stop each one exactly on the rest.' },
              { ex: 'tech-muting', p: { pattern: 'skip', length: 'half' }, from: 72, goal: 92, do: 'Skip a string: the one in between must stay silent.' },
              { ex: 'tech-muting', p: { pattern: 'fretted', length: 'half' }, from: 72, goal: 92, do: 'Fretted notes: release the finger to stop them, without lifting it off.' },
            ],
            mistakes: [
              'Hearing a ring only after you stop playing. Listen during the rests, not after.',
            ],
          },
          {
            id: 'climb', title: 'Up the neck',
            idea: 'Shift the whole hand by one fret and keep one finger per fret.',
            concept: [
              'The classic warm-up climbs across the strings, moves the whole hand up one fret, comes back, and shifts again. It teaches the hand to move as a unit, which every later shift depends on.',
              'Shift during the last note before the move, with the thumb sliding along, so the new position arrives in time.',
            ],
            steps: [
              { ex: 'tech-1234-climb', p: { top: '5', dir: 'up' }, from: 80, goal: 100, do: 'Up to fret 5 and back. Keep the thumb moving with the hand.' },
              { ex: 'tech-1234-climb', p: { top: '9', dir: 'up' }, from: 80, goal: 100, do: 'Now to fret 9: the frets get closer as you climb.' },
            ],
            mistakes: [
              'A gap at every shift. Move during the note before, not after it.',
            ],
          },
          {
            id: 'independence', title: 'Finger independence',
            idea: 'Every finger order, so no finger is the weak one.',
            concept: [
              'Fingers 3 and 4 share a tendon, so they like to move together. Permutations (1243, 1324…) and the spider walk train each finger to move on its own.',
              'Play these slowly and cleanly: the aim is control, not speed. A few minutes a day is enough.',
            ],
            steps: [
              { ex: 'tech-permutations', p: { perm: '1243', pos: '5' }, from: 66, goal: 88, do: '1-2-4-3: the little finger before the ring finger.' },
              { ex: 'tech-spider', p: { pattern: 'a', pos: '5' }, from: 66, goal: 84, do: 'The spider: two fingers on one string, two on the next.' },
              { ex: 'tech-finger-pairs', p: { pair: '34', pos: '5' }, from: 66, goal: 84, do: 'Fingers 3 and 4 alone: the hardest pair.' },
            ],
            mistakes: [
              'Lifting the other fingers high while one plays. Keep them close to the string.',
              'Practising through pain. Stop and shake the hand out if it hurts.',
            ],
          },
        ],
        check: {
          can: [
            'I rake down and alternate up without thinking.',
            'Strings I am not playing stay silent.',
            'I can shift the hand without a gap in the time.',
          ],
          steps: [
            { ex: 'tech-raking', p: { pattern: 'arp' }, from: 84, goal: 104 },
            { ex: 'tech-muting', p: { pattern: 'skip' }, from: 80, goal: 100 },
            { ex: 'tech-permutations', p: { perm: 'all', pos: '5' }, from: 66, goal: 84 },
          ],
        },
      },
      {
        id: 'u-feel', title: 'Off-beats and feels',
        goal: 'Play on the "&", swing, dotted rhythms and anticipations.',
        lessons: [
          {
            id: 'offbeats', title: 'Playing on the "&"',
            idea: 'Rest on the beat, play exactly halfway between the clicks.',
            concept: [
              'An off-beat note sits exactly halfway between two clicks, on the "&". Count "1 & 2 &" out loud and play only on the "&": it is the bounce of reggae, disco hi-hats and many funk lines.',
              'The trick is to feel the beat you are not playing. Tap your foot on the beat and pluck when the foot comes up.',
            ],
            steps: [
              { ex: 'rh-offbeats', p: {}, from: 76, goal: 100, do: 'Foot down on the beat, note on the "&". Keep the off-beats exactly halfway.' },
            ],
            mistakes: [
              'Drifting onto the beat. If the notes start to sound with the click, slow down and count aloud.',
            ],
          },
          {
            id: 'swing', title: 'Swing and shuffle',
            idea: 'Long-short 8ths: the first and last notes of a triplet.',
            concept: [
              'In swing and shuffle the 8ths are not equal: the first is long, the second short, like the first and third notes of a triplet. Say "doo-ba doo-ba" and feel the bounce.',
              'Blues, rock\'n\'roll and jazz all swing. The written music usually shows straight 8ths with the word "Swing" or "Shuffle" above.',
            ],
            steps: [
              { ex: 'rh-shuffle', p: {}, from: 84, goal: 110, do: 'Feel the triplet underneath: the second note comes late, on the last triplet.' },
              { ex: 'gr-blues', p: { style: 'shuffle', prog: 'blues' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'The shuffle line through a 12-bar blues. Keep the long-short feel all the way.' },
            ],
            mistakes: [
              'Swinging too hard, so it sounds like a dotted 8th and a 16th. Think triplets.',
            ],
          },
          {
            id: 'dotted', title: 'Dotted rhythms',
            idea: 'A dot adds half the note\'s value: long, then short.',
            concept: [
              'A dot makes a note half as long again: a dotted quarter lasts a beat and a half. Followed by an 8th it makes the Charleston rhythm, the push behind countless swing and pop lines.',
              'Count the 8ths through the long note ("1 & 2") so the short note lands exactly on its "&".',
            ],
            steps: [
              { ex: 'rh-dotted', p: {}, from: 72, goal: 96, do: 'Count the 8ths through each dotted note so the short note lands on time.' },
            ],
            mistakes: [
              'Cutting the dotted note short. Hold it for its full length.',
            ],
          },
          {
            id: 'syncopation', title: 'Syncopation',
            idea: 'Notes that arrive early make a groove push forward.',
            concept: [
              'Syncopation puts the weight between the beats. An anticipation plays the next chord\'s note on the "&" before the beat, tied across: the change arrives early and the groove leans forward.',
              'Keep the beat steady in your body while the notes move around it: count, tap your foot, and let the accents fall where they are written.',
            ],
            steps: [
              { ex: 'rh-syncopation', p: {}, from: 76, goal: 100, do: 'Accents between the beats and notes that arrive early. Keep counting the beat.' },
            ],
            mistakes: [
              'Moving the beat along with the syncopation. The beat never moves; only the notes do.',
            ],
          },
        ],
        check: {
          can: [
            'I can play on the "&" without drifting onto the beat.',
            'My swing 8ths feel like triplets.',
            'I can count dotted rhythms and anticipations while I play them.',
          ],
          steps: [
            { ex: 'rh-offbeats', p: {}, from: 88, goal: 108 },
            { ex: 'rh-syncopation', p: {}, from: 84, goal: 104 },
          ],
        },
      },
      {
        id: 'u-neck', title: 'The whole neck',
        goal: 'Find any note anywhere, on every string.',
        lessons: [
          {
            id: 'unisons', title: 'One note, several places',
            idea: 'Fret 5 on one string is the next open string.',
            concept: [
              'Fret 5 on the E string is the open A; fret 5 on the A string is the open D. Every note below fret 12 exists on two or three strings, and choosing the right one is what keeps your hand still.',
              'On a bass every pair of neighbouring strings is a 4th apart (the low B and high C of 5- and 6-string basses too), so the rule is always fret 5.',
            ],
            steps: [
              { ex: 'fb-unison', p: { string: 'E' }, from: 66, goal: 84, do: 'Each note, then the same pitch on the next string. Listen: they should sound identical.' },
              { ex: 'fb-unison', p: { string: 'A' }, from: 66, goal: 84, do: 'Now from the A string.' },
            ],
            mistakes: [
              'Thinking the higher string gives a higher note. Same pitch, different string.',
            ],
          },
          {
            id: 'find-every', title: 'Find every note',
            idea: 'Use octaves and unisons to find a note everywhere it lives.',
            concept: [
              'With the octave shape and the fret-5 rule you can find any note everywhere it lives. Start from the one you know on the E or A string, then jump: octave up, unison across.',
              'This is the step that frees you from the first position. Say the note name each time you play it.',
            ],
            steps: [
              { ex: 'fb-find-note', p: { range: '12' }, from: 66, goal: 84, do: 'Every place this note lives, from the nut to fret 12. Change the key under Options for a new note.' },
              { ex: 'fb-note-sweep', p: {}, from: 60, goal: 80, do: 'One note on every string, up and back, then the next note around the cycle.' },
            ],
            mistakes: [
              'Hunting fret by fret. Use the shapes: octave and unison.',
            ],
          },
          {
            id: 'zone-roots', title: 'All 12 roots in one zone',
            idea: 'Five frets hold all twelve notes.',
            concept: [
              'Any five-fret zone holds all twelve notes. Playing roots around the cycle of 4ths (C F B♭ E♭ A♭ D♭ G♭ B E A D G) without leaving the zone teaches you where each note sits close to your hand.',
              'The cycle of 4ths is the order chords most often move in, so this is real preparation for playing songs.',
            ],
            steps: [
              { ex: 'fb-cycle-zone', p: { zone: '1', order: 'cycle4' }, from: 60, goal: 80, do: 'Zone 1 (frets 1–5), around the cycle of 4ths. Say each name.' },
              { ex: 'fb-cycle-zone', p: { zone: '2', order: 'cycle4' }, from: 60, goal: 80, do: 'The same in zone 2 (frets 5–9).' },
            ],
            mistakes: [
              'Leaving the zone for a note you know elsewhere. Find it inside the zone.',
            ],
          },
          {
            id: 'note-quiz', title: 'Note-finder quiz',
            idea: 'Find the note before the beat arrives.',
            concept: [
              'Time to test yourself: the name appears, and you have until the beat to find it. Start with a small range and natural notes, then widen.',
              'Speed up only when you find nine notes out of ten in time.',
            ],
            steps: [
              { ex: 'fb-quiz', p: { range: '7', strings: 'all', notes: 'nat' }, from: 50, goal: 66, do: 'Natural notes, frets 0–7 on every string.' },
              { ex: 'fb-quiz', p: { range: '12', strings: 'all', notes: 'all' }, from: 50, goal: 66, do: 'All twelve notes up to fret 12.' },
            ],
            mistakes: [
              'Waiting for the dot. Commit to a fret before it appears, then check.',
            ],
          },
        ],
        check: {
          can: [
            'I can find any note on any string up to fret 12.',
            'I know the fret-5 unison and the octave shape by heart.',
            'I can play all 12 roots in one zone.',
          ],
          steps: [
            { ex: 'fb-quiz', p: { range: '12', strings: 'all', notes: 'all' }, from: 56, goal: 72 },
            { ex: 'fb-cycle-zone', p: { zone: '3', order: 'cycle4' }, from: 66, goal: 84 },
          ],
        },
      },
      {
        id: 'u-intervals', title: 'Intervals',
        goal: 'See and hear the distance between two notes.',
        lessons: [
          {
            id: 'interval-shapes', title: 'Interval shapes',
            idea: 'Every interval is a fixed shape on the bass.',
            concept: [
              'An interval is the distance between two notes. Because the strings are tuned in 4ths, each interval is a fixed shape: the 5th one string up and two frets up, the major 3rd one string up and one fret back, the minor 3rd one string up and two frets back.',
              'Learn each shape with its sound. Sing the second note before you play it.',
            ],
            steps: [
              { ex: 'iv-shapes', p: { iv: '5', dir: 'up' }, from: 66, goal: 88, do: 'The perfect 5th: root, 5th, root, 5th.' },
              { ex: 'iv-shapes', p: { iv: '3', dir: 'up' }, from: 66, goal: 88, do: 'The major 3rd: bright.' },
              { ex: 'iv-shapes', p: { iv: 'b3', dir: 'up' }, from: 66, goal: 88, do: 'The minor 3rd: darker. Compare it with the major 3rd.' },
            ],
            mistakes: [
              'Learning the shapes without the sound. Sing every interval.',
            ],
          },
          {
            id: 'interval-family', title: 'Every interval from one root',
            idea: 'From ♭2 to the octave, all in one hand position.',
            concept: [
              'From one root, the twelve intervals climb a fret at a time: ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7, octave. Every chord and scale is a selection of them.',
              'Name each one as you play it: "minor 2nd, major 2nd…"',
            ],
            steps: [
              { ex: 'iv-all-from-root', p: { root: 'E' }, from: 72, goal: 92, do: 'Name each interval as you play it.' },
              { ex: 'iv-moving', p: { iv: '3', string: 'E' }, from: 76, goal: 96, do: 'One shape, moved up a fret at a time: the same distance from every root.' },
            ],
            mistakes: [
              'Saying "3" for both 3rds. Major or minor: name the quality.',
            ],
          },
          {
            id: 'interval-ear', title: 'Hear the interval',
            idea: 'Sing the second note before it sounds.',
            concept: [
              'The root plays, then the interval. Sing or name the second note before it sounds, then check yourself when its dot appears.',
              'Begin with 3rds, 4ths, 5ths and the octave: they are the intervals bass lines use most.',
            ],
            steps: [
              { ex: 'iv-ear-quiz', p: { set: 'basic' }, do: '3rds, 4ths, 5ths and the octave. Sing, name, then play.' },
              { ex: 'iv-ear-quiz', p: { set: 'all' }, do: 'Every interval within the octave.' },
            ],
            mistakes: [
              'Guessing from the fret. Close your eyes and listen first.',
            ],
          },
        ],
        check: {
          can: [
            'I can play any interval up to the octave from any root.',
            'I can hear 3rds, 4ths, 5ths and octaves.',
          ],
          steps: [
            { ex: 'iv-all-from-root', p: { root: 'A' }, from: 80, goal: 100 },
            { ex: 'iv-ear-quiz', p: { set: 'basic' } },
          ],
        },
      },
      {
        id: 'u-triads2', title: 'Every triad',
        goal: 'Play and hear the four triad types anywhere on the neck.',
        lessons: [
          {
            id: 'triad-types', title: 'Diminished, augmented and sus',
            idea: 'Two 3rds stacked: major + minor, minor + major, minor + minor, major + major.',
            concept: [
              'A triad is two 3rds stacked. Major: a major 3rd, then a minor 3rd. Minor: minor, then major. Diminished: two minor 3rds (tense, narrow). Augmented: two major 3rds (open, unresolved). A sus chord replaces the 3rd with a 2nd or 4th.',
              'Each one is a movable shape. Learn its sound together with its shape.',
            ],
            steps: [
              { ex: 'tri-qualities', p: { quality: 'dim', shape: 'updown' }, from: 66, goal: 88, do: 'Diminished: R-♭3-♭5.' },
              { ex: 'tri-qualities', p: { quality: 'aug', shape: 'updown' }, from: 66, goal: 88, do: 'Augmented: R-3-♯5.' },
              { ex: 'tri-qualities', p: { quality: 'sus4', shape: 'updown' }, from: 66, goal: 88, do: 'Sus4: the 4th takes the place of the 3rd.' },
            ],
            mistakes: [
              'Mixing up diminished and minor. Diminished also lowers the 5th.',
            ],
          },
          {
            id: 'four-types', title: 'Four types from one root',
            idea: 'Change one note at a time and hear each colour.',
            concept: [
              'Major, minor, diminished, augmented on the same root: from one to the next only one note moves by a fret. Hearing that one note change is the best ear training for chords.',
            ],
            steps: [
              { ex: 'tri-four-types', p: { root: 'A' }, from: 70, goal: 92, do: 'Major → minor → diminished → augmented. Say each name before it plays.' },
              { ex: 'ear-triads', p: { set: 'all' }, do: 'Ear check: all four types, notes hidden. Name each one before the answer appears.' },
            ],
            mistakes: [
              'Rushing past the sound. Let each chord ring in your ear before the next.',
            ],
          },
          {
            id: 'triad-cycle', title: 'Triads around the cycle',
            idea: 'All twelve triads in one five-fret zone.',
            concept: [
              'Now combine the triad shapes with the zone idea: all twelve major triads without leaving five frets. The zone decides which shape each chord takes, which is exactly what happens in a real song.',
            ],
            steps: [
              { ex: 'tri-zone-cycle', p: { quality: 'maj', zone: '1', order: 'cycle4', pattern: 'turn' }, from: 72, goal: 96, do: 'Major triads around the cycle of 4ths in zone 1.' },
              { ex: 'tri-zone-cycle', p: { quality: 'min', zone: '1', order: 'cycle4', pattern: 'turn' }, from: 72, goal: 96, do: 'Minor triads, same zone.' },
            ],
            mistakes: [
              'Jumping out of the zone for a familiar shape. Find the shape inside it.',
            ],
          },
        ],
        check: {
          can: [
            'I can play major, minor, diminished and augmented triads from any root.',
            'I can hear the four triad types.',
            'I can play all twelve major triads in one zone.',
          ],
          steps: [
            { ex: 'tri-four-types', p: {}, from: 80, goal: 100 },
            { ex: 'tri-zone-cycle', p: { quality: 'maj', zone: '2', order: 'cycle4' }, from: 80, goal: 100 },
          ],
        },
      },
      {
        id: 'u-sevenths', title: '7th chords',
        goal: 'Play the five 7th chords and hear the chords of a key.',
        lessons: [
          {
            id: 'five-sevenths', title: 'The five 7th chords',
            idea: 'maj7 → 7 → m7 → m7♭5 → °7: lower one note at a time.',
            concept: [
              'Add a 7th to a triad and you get the chords of jazz, soul and funk. Start from maj7 and lower one note at a time: the 7 gives the dominant 7, the 3 gives the minor 7, the 5 gives the half-diminished m7♭5, and the 7 again gives the diminished 7.',
              'The dominant 7 (R-3-5-♭7) is the chord of the blues: you will use it in the next unit.',
            ],
            steps: [
              { ex: 'arp-7th-qualities', p: { root: 'A' }, from: 70, goal: 90, do: 'Lower one note at a time. Say each chord\'s name.' },
            ],
            mistakes: [
              'Learning five unrelated shapes. See each one as the one before with one note lowered.',
            ],
          },
          {
            id: 'seventh-shapes', title: '7th arpeggios',
            idea: 'Three shapes cover most songs: maj7, 7 and m7.',
            concept: [
              'Most songs use three 7th chords: major 7, dominant 7 and minor 7. Learn each as a one-octave shape you can move to any key.',
            ],
            steps: [
              { ex: 'arp-7th', p: { quality: 'dom7', shape: 'updown', oct: '1', root: 'A' }, from: 72, goal: 96, do: 'Dominant 7: R-3-5-♭7.' },
              { ex: 'arp-7th', p: { quality: 'min7', shape: 'updown', oct: '1', root: 'A' }, from: 72, goal: 96, do: 'Minor 7: R-♭3-5-♭7.' },
              { ex: 'arp-7th', p: { quality: 'maj7', shape: 'updown', oct: '1', root: 'A' }, from: 72, goal: 96, do: 'Major 7: R-3-5-7.' },
            ],
            mistakes: [
              'Confusing the 7 and the ♭7. The major 7th is one fret below the octave, the ♭7 two frets below.',
            ],
          },
          {
            id: 'key-chords', title: 'The chords of a key',
            idea: 'Major, minor, minor, major, major, minor, diminished.',
            concept: [
              'Build a triad on every note of the major scale and you get the chords of the key: I major, ii minor, iii minor, IV major, V major, vi minor, vii diminished. That is why songs in C use C, Dm, Em, F, G and Am.',
              'Root and 3rd are enough to hear each chord\'s quality.',
            ],
            steps: [
              { ex: 'hm-chord-qualities', p: { scale: 'ionian' }, from: 72, goal: 92, do: 'Root and 3rd on every degree. Say "major" or "minor" each time.' },
            ],
            mistakes: [
              'Memorising the pattern without hearing it. Listen to the 3rd change.',
            ],
          },
        ],
        check: {
          can: [
            'I can play maj7, 7 and m7 arpeggios in any key.',
            'I know which chords are major, minor and diminished in a major key.',
          ],
          steps: [
            { ex: 'arp-7th-qualities', p: {}, from: 80, goal: 100 },
            { ex: 'arp-7th', p: { quality: 'dom7', oct: '1' }, from: 84, goal: 104 },
          ],
        },
      },
      {
        id: 'u-blues', title: 'Progressions and the blues',
        goal: 'Hear common progressions and play the 12-bar blues.',
        lessons: [
          {
            id: 'progressions', title: 'Common progressions',
            idea: 'A handful of progressions carries most songs.',
            concept: [
              'A few progressions carry a huge number of songs: I–IV–V, I–V–vi–IV, ii–V–I, the minor i–♭VII–♭VI–V. Learn their sound through the roots and you will start to recognise them on the radio.',
              'Say the Roman numerals as you play: the numbers are the same in every key.',
            ],
            steps: [
              { ex: 'hm-progression-roots', p: { prog: 'I-V-vi-IV', rhythm: '1' }, from: 84, goal: 108, backing: 'chords', do: 'I–V–vi–IV in quarter notes. Say the numerals.' },
              { ex: 'hm-progression-roots', p: { prog: 'ii-V-I', rhythm: '1' }, from: 84, goal: 108, backing: 'chords', do: 'ii–V–I: the progression of jazz.' },
              { ex: 'hm-progression-roots', p: { prog: 'i-bVII-bVI-V', rhythm: '1' }, from: 84, goal: 108, backing: 'chords', do: 'The Andalusian cadence: a minor line walking down.' },
            ],
            mistakes: [
              'Reading the chord names without hearing the movement. Close your eyes on the last loops.',
            ],
          },
          {
            id: 'twelve-bar', title: 'The 12-bar blues',
            idea: 'Four bars of I, two of IV, two of I, V, IV, I, V.',
            concept: [
              'The 12-bar blues is the form behind blues, rock\'n\'roll and a lot of jazz: four bars of I, two of IV, two of I, then V, IV, I and V to start again. Each chord is a dominant 7.',
              'Outline each chord with R-3-5-♭7 and the form will soon be in your ears.',
            ],
            steps: [
              { ex: 'hm-12-bar-blues', p: { prog: 'blues', pattern: 'r357' }, from: 92, goal: 112, backing: 'chords', do: 'R-3-5-♭7 on each chord. Count the bars: 1 to 12.' },
            ],
            mistakes: [
              'Losing your place in the form. Count bars out loud, and know where bar 9 (the V) is.',
            ],
          },
          {
            id: 'blues-scale', title: 'The blues scale',
            idea: 'The minor pentatonic plus one blue note.',
            concept: [
              'Add the ♭5 to the minor pentatonic and you have the blues scale: 1 ♭3 4 ♭5 5 ♭7. The ♭5 is the "blue note": pass through it, don\'t sit on it.',
              'The major blues scale (1 2 ♭3 3 5 6) is the brighter cousin, used over major blues and country.',
            ],
            steps: [
              { ex: 'sc-blues', p: { type: 'blues', root: 'E', oct: '1' }, from: 60, goal: 88, do: 'The blues scale from the E string.' },
              { ex: 'sc-blues', p: { type: 'majorBlues', root: 'E', oct: '1' }, from: 60, goal: 88, do: 'The major blues scale: hear the brighter colour.' },
            ],
            mistakes: [
              'Holding the ♭5 as if it were home. It is a passing note.',
            ],
          },
          {
            id: 'blues-lines', title: 'Blues bass lines',
            idea: 'Boogie and shuffle: the lines that built rock\'n\'roll.',
            concept: [
              'The boogie-woogie line (R-3-5-6-♭7-6-5-3) and the shuffle (R-R-5-5-6-6-5-5) move the same shape through the 12 bars. Swing them, keep them steady, and you can play with any blues band.',
            ],
            steps: [
              { ex: 'gr-blues', p: { style: 'boogie', prog: 'blues' }, from: 84, goal: 112, backing: 'chords', do: 'The boogie line: one shape, moved to each chord.' },
              { ex: 'gr-blues', p: { style: 'boogieSwing', prog: 'blues' }, from: 84, goal: 108, backing: 'chords', music: true, do: 'The same line swung. Play along with the chords.' },
            ],
            mistakes: [
              'Changing the shape on the IV chord. It is the same shape, one string higher.',
            ],
          },
        ],
        check: {
          can: [
            'I can play through the 12-bar blues without losing my place.',
            'I know the blues scale and where its blue note is.',
            'I recognise I–IV–V and I–V–vi–IV by ear.',
          ],
          steps: [
            { ex: 'hm-12-bar-blues', p: { prog: 'blues', pattern: 'r357' }, from: 100, goal: 120, backing: 'chords' },
            { ex: 'gr-blues', p: { style: 'boogie', prog: 'blues' }, from: 96, goal: 120, backing: 'chords' },
          ],
        },
      },
      {
        id: 'u-grooves', title: 'Groove toolbox',
        goal: 'Octaves, riffs, dynamics and the pick.',
        lessons: [
          {
            id: 'octave-grooves', title: 'Disco octaves',
            idea: 'Root and octave in 8ths: string skipping with a beat.',
            concept: [
              'Root–octave 8ths are the sound of disco and a lot of funk and rock. The plucking hand skips a string on every note, so muting the string in between matters.',
              'Index on the root, ring or little finger on the octave; let the fretting hand release between notes for a bouncy, short sound.',
            ],
            steps: [
              { ex: 'tech-octaves', p: { pair: 'E' }, from: 96, goal: 112, do: 'Root–octave 8ths moving up the neck. Keep the string in between silent.' },
              { ex: 'gr-octaves', p: { style: 'octaves' }, from: 96, goal: 116, backing: 'chords', music: true, do: 'Disco octaves through a progression. Short, even, with the bounce.' },
            ],
            mistakes: [
              'The middle string ringing. Rest the fretting index across it.',
            ],
          },
          {
            id: 'riffs', title: 'Riffs',
            idea: 'Keep the shape, move it to each chord.',
            concept: [
              'A riff is a short phrase that repeats and moves with the chords. Keep its shape and move it to each root: R-5-♭7-8 or a minor pentatonic figure works on every chord of a blues or rock tune.',
            ],
            steps: [
              { ex: 'gr-octaves', p: { style: 'r5b7', prog: 'blues' }, from: 92, goal: 112, backing: 'chords', do: 'R-5-♭7-8 through a 12-bar blues.' },
              { ex: 'gr-octaves', p: { style: 'riff', prog: 'i-iv-v-min' }, from: 92, goal: 112, backing: 'chords', music: true, do: 'A minor pentatonic riff moved to each chord.' },
            ],
            mistakes: [
              'Changing the riff on each chord. The shape stays; only the root moves.',
            ],
          },
          {
            id: 'dynamics', title: 'Loud and soft',
            idea: 'Volume comes from the plucking hand, not the amp.',
            concept: [
              'Dynamics turn notes into music. Play the same phrase from very soft (pp) to very loud (ff) and back, without changing the tempo: the plucking hand decides the volume.',
              'Soft notes still need a full tone; loud notes should not rattle the frets.',
            ],
            steps: [
              { ex: 'tech-dynamics', p: { pos: '5' }, from: 66, goal: 84, do: 'pp → ff → pp. Keep the tempo steady as the volume changes.' },
            ],
            mistakes: [
              'Speeding up as you get louder. Volume and tempo are separate.',
            ],
          },
          {
            id: 'pick', title: 'Playing with a pick', optional: true,
            idea: 'Down-strokes for punch, alternate picking for speed.',
            concept: [
              'Many rock, punk and metal players use a pick: down-strokes for a driving attack, alternate picking (down-up) for speed, and the gallop (an 8th and two 16ths) for metal. Optional, but worth knowing.',
            ],
            steps: [
              { ex: 'gr-pick', p: { style: 'pickDown' }, from: 100, goal: 140, backing: 'chords', do: 'Punk 8ths with down-strokes only.' },
              { ex: 'gr-pick', p: { style: 'pickAlt' }, from: 100, goal: 140, backing: 'chords', do: 'Alternate picking: down on the beat, up on the "&".' },
              { ex: 'gr-pick', p: { style: 'gallop' }, from: 90, goal: 120, backing: 'chords', do: 'The gallop: an 8th and two 16ths.' },
            ],
            mistakes: [
              'Gripping the pick hard. Hold it just firmly enough not to drop it.',
            ],
          },
        ],
        check: {
          can: [
            'I can play octave grooves with the string in between silent.',
            'I can move a riff through a progression.',
            'I control my volume from very soft to very loud.',
          ],
          steps: [
            { ex: 'gr-octaves', p: { style: 'octaves' }, from: 104, goal: 120, backing: 'chords' },
            { ex: 'gr-octaves', p: { style: 'r5b7', prog: 'blues' }, from: 100, goal: 120, backing: 'chords' },
          ],
        },
      },
      {
        id: 'u-reading2', title: 'Reading in keys',
        goal: 'Read sharps, flats and key signatures.',
        lessons: [
          {
            id: 'accidentals', title: 'Sharps and flats on the staff',
            idea: 'An accidental lasts until the end of the bar.',
            concept: [
              'A ♯ or ♭ before a note raises or lowers it one fret, and it lasts until the bar line. A natural sign (♮) cancels it.',
              'The same fret can be written two ways (G♯ or A♭). Read what is written, play what it means.',
            ],
            steps: [
              { ex: 'rd-accidentals', p: { range: 'ea' }, from: 50, goal: 66, do: 'E and A strings, with sharps and flats.' },
              { ex: 'rd-accidentals', p: { range: 'all' }, from: 50, goal: 66, do: 'Every note of the first position.' },
            ],
            mistakes: [
              'Forgetting that an accidental holds for the whole bar.',
            ],
          },
          {
            id: 'key-signatures', title: 'Melodies with a key signature',
            idea: 'The key signature tells you which notes are always sharp or flat.',
            concept: [
              'At the start of each line, the key signature lists the notes that are sharp or flat throughout: one ♯ (F♯) is G major, one ♭ (B♭) is F major. Read it before the first note, then keep it in mind.',
              'Read in shapes: steps, small leaps and repeated notes, not one note at a time.',
            ],
            steps: [
              { ex: 'rd-melodies', p: { key: '0' }, from: 60, goal: 76, do: 'C major: no sharps or flats.' },
              { ex: 'rd-melodies', p: { key: '7' }, from: 60, goal: 76, do: 'G major: every F is F♯.' },
              { ex: 'rd-melodies', p: { key: '5' }, from: 60, goal: 76, do: 'F major: every B is B♭.' },
            ],
            mistakes: [
              'Forgetting the key signature halfway through. Check it again at the start of every line.',
            ],
          },
        ],
        check: {
          can: [
            'I read sharps, flats and naturals in first position.',
            'I can read a simple melody in C, G or F major.',
          ],
          steps: [
            { ex: 'rd-melodies', p: { key: '2' }, from: 60, goal: 76 },
            { ex: 'rd-melodies', p: { key: '10' }, from: 60, goal: 76 },
          ],
        },
      },
    ],
    check: {
      can: [
        'I can play the 12-bar blues with a boogie line at 112 BPM.',
        'I can find any note up to fret 12 and play every triad type from it.',
        'I can play maj7, 7 and m7 arpeggios in any key.',
        'I can swing, play off-beats and read a melody with a key signature.',
      ],
      steps: [
        { ex: 'gr-blues', p: { style: 'boogieSwing', prog: 'blues' }, from: 96, goal: 116, backing: 'chords' },
        { ex: 'tri-zone-cycle', p: { quality: 'min', zone: '2', order: 'cycle4' }, from: 84, goal: 104 },
        { ex: 'arp-7th', p: { quality: 'min7', oct: '1' }, from: 84, goal: 104 },
        { ex: 'rh-shuffle', p: {}, from: 96, goal: 120 },
        { ex: 'rd-melodies', p: { key: '10' }, from: 66, goal: 80 },
      ],
    },
  },
];

// ---------------------------------------------------------------- flattened view
// Every lesson (checkpoints included) in course order, with its place: unit numbers run on across
// the stages, lessons count inside their unit ("3.2"), a unit checkpoint is "3.✓".
export const LESSONS = [];
export const UNITS = [];
{
  let u = 0;
  for (const stage of STAGES) {
    const stageLessons = [];
    for (const unit of stage.units) {
      u++;
      const list = unit.lessons.map((l, i) => ({ ...l, kind: 'lesson', unit, stage, num: `${u}.${i + 1}` }));
      if (unit.check) list.push({ ...unit.check, id: `${unit.id}-check`, kind: 'check', title: `Checkpoint: ${unit.title}`, unit, stage, num: `${u}.✓`, idea: unit.goal });
      UNITS.push({ ...unit, n: u, stage, list });
      LESSONS.push(...list);
      stageLessons.push(...list);
    }
    if (stage.check) {
      const test = { ...stage.check, id: `${stage.id}-test`, kind: 'test', title: `Stage test: ${stage.title}`, unit: null, stage, num: '★', idea: stage.desc };
      LESSONS.push(test);
      stageLessons.push(test);
    }
    stage.lessons = stageLessons;
  }
}
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
