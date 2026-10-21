// Course Stage 1: First steps (Level 1). See ../data.js for the format.
export default {
  id: 's1', title: 'First steps', level: 1,
  desc: 'Hold the bass, keep steady time, learn the notes on the low strings and play your first scales, chords and bass lines.',
  units: [
    {
      id: 'u-hands', title: 'Your two hands',
      goal: 'Hold and tune the bass, pluck evenly with two fingers and fret with one finger per fret.',
      lessons: [
        {
          id: 'hold', title: 'Holding and tuning the bass', tuner: true,
          idea: 'Relaxed shoulders, the neck pointing slightly up, and a bass in tune.',
          concept: [
            'Sitting, rest the bass on your right thigh (the left one if you play left-handed) with the neck pointing slightly upwards, the headstock about level with your shoulder. Standing, set the strap so the bass sits at the same height as when you sit: everything you practise then works both ways.',
            'The plucking forearm rests on the top edge of the body, so the hand falls over the strings by itself. The fretting thumb sits behind the neck, not wrapped over it, and the wrist stays fairly straight. Shoulders down, nothing tense.',
            'Tune before every practice. Open the tuner, pluck one open string at a time and turn its tuning key until the needle sits in the middle: E, A, D, G from the thickest string (low B and high C on 5- and 6-string basses). Tune up to the note: if a string is sharp, go below the note and come back up.',
          ],
          steps: [
            { ex: 'fb-open-strings', p: { reps: '2' }, sub: 1, from: 50, goal: 66, do: 'Tuned? Play each open string twice and let it ring for its full length. Check your posture between notes.' },
          ],
          mistakes: [
            'A neck pointing at the floor: the fretting wrist has to bend sharply. Raise the neck.',
            'The thumb wrapped over the top of the neck. Keep it behind the neck, roughly behind the middle finger.',
            'Skipping the tuning. Everything you learn by ear depends on it.',
          ],
        },
        {
          id: 'pluck', title: 'Plucking with two fingers',
          idea: 'Alternate index and middle, and make the two fingers sound the same.',
          concept: [
            'Most bass is played with the index (i) and middle (m) fingers of the plucking hand, taking turns: i-m-i-m. Alternating doubles your speed and keeps the hand relaxed. Rest the thumb on the pickup or on the E string, and pull each finger across the string so it comes to rest on the next string.',
            'The aim is not speed but sameness: every note the same volume, the same length and exactly with the click. With your eyes closed, nobody should be able to tell which finger played.',
          ],
          steps: [
            { ex: 'tech-alt-pluck', p: { start: 'i', reps: '8' }, sub: 2, from: 60, goal: 80, do: 'Eight notes on each open string, starting with the index. The i/m tags show which finger plucks.' },
            { ex: 'tech-alt-pluck', p: { start: 'm', reps: '4' }, sub: 2, from: 60, goal: 80, do: 'Now start with the middle finger, four notes per string. Neither finger should lead.' },
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
            'From the thickest string to the thinnest, a 4-string bass is tuned E-A-D-G (a 5-string adds a low B, a 6-string a low B and a high C). Each string is five frets above the one below it: fret 5 of a string gives the next open string. That distance is called a 4th (you will meet intervals in Unit 11), and it is why the same shapes work all over the neck.',
            'A phrase to remember them: Eat All Day, Grandma. Tune up first, as in the last lesson: the tuner button sits at the top of every exercise.',
          ],
          steps: [
            { ex: 'fb-open-strings', p: { reps: '4' }, sub: 1, from: 60, goal: 76, do: 'Four plucks on each string. Say its name out loud as you play.' },
            { ex: 'fb-open-strings', p: { reps: '1' }, sub: 1, from: 60, goal: 80, do: 'One pluck per string: now you cross strings on every note. Keep alternating i-m.' },
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
            { ex: 'tech-1234', p: { pos: '5' }, sub: 2, from: 60, goal: 80, do: 'Start at fret 5, where the frets are closer together. Keep each finger down until the next one sounds.' },
            { ex: 'tech-1234', p: { pos: '1' }, sub: 2, from: 60, goal: 72, do: 'Now at fret 1, where the hand opens wider. Stretch from the knuckles, not by moving the arm.' },
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
          'I can tune my bass with the tuner, and I sit (or stand) without tension.',
          'I alternate i-m without thinking about it, even when I change string.',
          'I can name the open strings without looking.',
          'I keep one finger per fret, with my fingers close to the strings.',
        ],
        steps: [
          { ex: 'tech-alt-pluck', p: { start: 'i', reps: '4' }, sub: 2, from: 72, goal: 92 },
          { ex: 'tech-1234', p: { pos: '3' }, sub: 2, from: 66, goal: 88 },
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
            { ex: 'rh-pyramid', p: { max: '4', note: 'A0' }, from: 56, goal: 72, do: 'Count every subdivision out loud. The first note of each group lands on the click.' },
            { ex: 'rh-pyramid', p: { max: '4', note: 'E5' }, from: 56, goal: 66, do: 'The same on a fretted A (E string, fret 5): now the fretting hand has to hold the note steady too.' },
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
          { ex: 'rh-pyramid', p: { max: '4' }, from: 60, goal: 76 },
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
            { ex: 'fb-naturals', p: { string: 'E', range: '0' }, sub: 1, from: 60, goal: 80, do: 'Say each note\'s name as you play it. Notice the half steps E–F and B–C.' },
            { ex: 'fb-naturals', p: { string: 'A', range: '0' }, sub: 1, from: 60, goal: 80, do: 'The same alphabet starting from A. Where are the half steps now?' },
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
            { ex: 'fb-chromatic-string', p: { string: 'A' }, sub: 1, from: 66, goal: 84, do: 'Sharps going up, flats coming down. Say every name.' },
            { ex: 'fb-chromatic-string', p: { string: 'E' }, sub: 1, from: 66, goal: 84, do: 'Now on the E string.' },
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
            { ex: 'fb-landmarks', p: { order: 'string' }, sub: 1, from: 60, goal: 80, do: 'One string at a time: name each landmark before its dot appears.' },
            { ex: 'fb-landmarks', p: { order: 'fret' }, sub: 1, from: 60, goal: 80, do: 'Now fret by fret across the strings: fret 5 is A, D, G, C.' },
          ],
          mistakes: [
            'Counting frets from the nut. Start from the nearest dot instead.',
            'Learning the E string only. The A string is just as important: many bass lines start there.',
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
            { ex: 'fb-octaves', p: { pair: '0' }, sub: 2, from: 66, goal: 84, do: 'E string to D string: index on the low note, ring or little finger on the octave.' },
            { ex: 'fb-octaves', p: { pair: '1' }, sub: 2, from: 66, goal: 84, do: 'Now from the A string to the G string.' },
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
          { ex: 'fb-naturals', p: { string: 'A', range: '0' }, sub: 1, from: 72, goal: 96 },
          { ex: 'fb-landmarks', p: { order: 'fret' }, sub: 1, from: 72, goal: 96 },
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
            'Roman numerals name chords by their place in the key: count up the key\'s scale from its first note (the scale itself comes in Unit 5). In A major, I is A, IV is D and V is E; a lowercase numeral is a minor chord (vi in A is F♯m). So I–IV–V–I means the same moves in every key. The chord names appear above the neck as you play.',
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
            'The 5th is the closest friend of the root. On the bass it sits one string up and two frets up (the shape guitarists use for power chords), or at the same fret on the string below. Both are the same note, an octave apart.',
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
            { ex: 'sc-one-octave', p: { type: 'ionian', key: '0', root: 'A', oct: '1' }, sub: 1, from: 60, goal: 84, do: 'C major from the A string. Sing "do re mi" along with it.' },
            { ex: 'sc-one-octave', p: { type: 'ionian', key: '7', root: 'E', oct: '1' }, sub: 1, from: 60, goal: 84, do: 'G major from the E string: the same shape, one string lower.' },
            { ex: 'sc-one-octave', p: { type: 'ionian', root: 'A', oct: '1' }, sub: 1, from: 60, goal: 84, do: 'Pick any key under Options. The shape does not change, only its place on the neck.' },
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
            { ex: 'sc-open-position', p: { type: 'ionian', key: '7', oct: '1' }, sub: 1, from: 60, goal: 84, do: 'G major in open position. Let no open string ring into the next note.' },
            { ex: 'sc-open-position', p: { type: 'aeolian', key: '4', oct: '1' }, sub: 1, from: 60, goal: 84, do: 'E natural minor: hear how much darker it is than major.' },
          ],
          mistakes: [
            'Open strings ringing on. An open string cannot be stopped by the fretting hand: touch it with the plucking hand.',
            'Losing the fingering around the open strings. Switch the dot labels to fingers (Fing) and follow them: in these two keys the hand sits in second position, index on fret 2.',
          ],
        },
        {
          id: 'pentatonics', title: 'Pentatonic scales',
          idea: 'Five notes, no clashes: the sound of rock, blues and pop.',
          concept: [
            'Leave out the 4th and 7th of the major scale and you get the major pentatonic: five notes with no half steps between them, so they rarely clash, the sound of folk, country and pop melodies. The minor pentatonic (1 ♭3 4 5 ♭7) is home for rock and blues players.',
            'They share their notes: C major pentatonic and A minor pentatonic are the same five notes starting from a different root. The minor box, two notes per string, is a shape you will use for years.',
          ],
          steps: [
            { ex: 'sc-one-octave', p: { type: 'minorPent', key: '9', root: 'E', oct: '1' }, sub: 1, from: 60, goal: 88, do: 'A minor pentatonic from the E string: fingers 1-4, 1-3, 1-3.' },
            { ex: 'sc-one-octave', p: { type: 'majorPent', key: '0', root: 'A', oct: '1' }, sub: 1, from: 60, goal: 88, do: 'C major pentatonic: the same notes as A minor pentatonic, from another root.' },
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
          { ex: 'sc-one-octave', p: { type: 'ionian', root: 'A', oct: '1' }, sub: 1, from: 72, goal: 96 },
          { ex: 'sc-one-octave', p: { type: 'minorPent', root: 'E', oct: '1' }, sub: 1, from: 72, goal: 100 },
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
            { ex: 'hm-build-a-chord', p: { scale: 'ionian', key: '0', root: 'A' }, sub: 2, from: 60, goal: 84, do: 'The scale, then 1-3-5, then 1-3-5-7: hear the chord grow out of the scale.' },
            { ex: 'hm-build-a-chord', p: { scale: 'aeolian', key: '9', root: 'E' }, sub: 2, from: 60, goal: 84, do: 'Now from A natural minor: 1-♭3-5-♭7.' },
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
            { ex: 'tri-shape', p: { quality: 'maj', root: 'A', shape: 'updown' }, sub: 1, from: 60, goal: 88, do: 'Major triad up and down. Say "root, 3rd, 5th" as you play.' },
            { ex: 'tri-shape', p: { quality: 'min', root: 'A', shape: 'updown' }, sub: 1, from: 60, goal: 88, do: 'Minor: only the 3rd changes.' },
            { ex: 'tri-shape', p: { quality: 'maj', root: 'E', shape: 'octave' }, sub: 1, from: 60, goal: 88, do: '1-3-5-8-5-3: up to the octave and back, from the E string.' },
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
            'Major sounds bright and settled, minor darker and more serious. The only difference is the 3rd: a major 3rd is four frets above the root, a minor 3rd three. In sound it drops by one fret.',
            'Watch the blue dot, the 3rd: it is the only note that changes. On the neck it jumps to a new place, because the minor shape is fingered from finger 1 (the ♭3 sits on the root\'s string), but the root and the 5th stay where they were.',
            'Train your ear along with your hands: whenever you play a triad, say "major" or "minor" before you reach the 3rd.',
          ],
          steps: [
            { ex: 'tri-maj-min', p: { root: 'A' }, sub: 1, from: 66, goal: 90, do: 'Major, then minor on the same root: listen to the one note that changes, the 3rd (blue).' },
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
          { ex: 'tri-shape', p: { quality: 'maj', shape: 'octave' }, sub: 1, from: 72, goal: 100 },
          { ex: 'tri-maj-min', p: {}, sub: 1, from: 76, goal: 100 },
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
            'Bass guitar is written an octave above its sound, so the notes sit on the staff rather than far below it. The open E is on the first ledger line below the staff (a short extra line for a note below the five), the open A in the bottom space, the open D on the middle line and the open G in the top space.',
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
      'I can play a root line through a song at 112 BPM with even 8ths.',
      'I can play the major scale and major and minor triads in any key.',
      'I keep time with the click on beat 1 only.',
      'I can read first-position notes on the staff.',
    ],
    steps: [
      { ex: 'gr-roots', p: { style: 'rock8', prog: 'I-V-vi-IV' }, from: 92, goal: 112, backing: 'chords' },
      { ex: 'sc-one-octave', p: { type: 'ionian', root: 'E', oct: '1' }, sub: 1, from: 80, goal: 100 },
      { ex: 'tri-shape', p: { quality: 'min', shape: 'octave' }, sub: 1, from: 80, goal: 100 },
      { ex: 'rh-pulse', p: { click: '1' }, from: 76, goal: 92 },
      { ex: 'rd-naturals', p: { range: 'all' }, from: 60, goal: 72 },
    ],
  },
};
