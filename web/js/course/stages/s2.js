// Course Stage 2: Building blocks (Level 2). See ../data.js for the format.
export default {
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
            'In Lesson 1.2 you alternated strictly; the rake is the one exception, for crossing to a lower-pitched string. The i/m tags above the dots show which finger plucks. Follow them slowly first: the habit is what matters.',
          ],
          steps: [
            { ex: 'tech-raking', p: { fret: '0', pattern: 'wave' }, sub: 2, from: 70, goal: 96, do: 'Open strings up and down. Watch the i/m tags on the way down.' },
            { ex: 'tech-raking', p: { fret: '5', pattern: 'arp' }, sub: 2, from: 70, goal: 96, do: 'Across the strings at fret 5 and back: raking makes it smooth.' },
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
            { ex: 'tech-1234-climb', p: { top: '5', dir: 'up' }, sub: 2, from: 80, goal: 100, do: 'Up to fret 5 and back. Keep the thumb moving with the hand.' },
            { ex: 'tech-1234-climb', p: { top: '9', dir: 'up' }, sub: 2, from: 80, goal: 100, do: 'Now to fret 9: the frets get closer as you climb.' },
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
            { ex: 'tech-permutations', p: { perm: '1243', pos: '5' }, sub: 2, from: 66, goal: 88, do: '1-2-4-3: the little finger before the ring finger.' },
            { ex: 'tech-spider', p: { pattern: 'a', pos: '5' }, sub: 2, from: 66, goal: 84, do: 'The spider: two fingers on one string, two on the next.' },
            { ex: 'tech-finger-pairs', p: { pair: '34', pos: '5' }, sub: 2, from: 66, goal: 84, do: 'Fingers 3 and 4 alone: the hardest pair.' },
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
          { ex: 'tech-raking', p: { pattern: 'arp' }, sub: 2, from: 84, goal: 104 },
          { ex: 'tech-muting', p: { pattern: 'skip' }, from: 80, goal: 100 },
          { ex: 'tech-permutations', p: { perm: 'all', pos: '5' }, sub: 2, from: 66, goal: 84 },
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
            { ex: 'gr-blues', p: { style: 'shuffle', prog: 'vamp-dom' }, from: 84, goal: 104, backing: 'chords', music: true, do: 'A shuffle line on one chord: R-R-5-5-6-6-5-5, where the 6th is two frets above the 5th. Keep the long-short feel all the way.' },
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
          { ex: 'rh-shuffle', p: {}, from: 92, goal: 116 },
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
            'Fret 5 on the E string is the open A; fret 5 on the A string is the open D. So most notes can be played on two or three strings (only the lowest few, open E to G♯, live on the E string alone), and choosing the right one is what keeps your hand still.',
            'On a bass every pair of neighbouring strings is a 4th apart (the low B and high C of 5- and 6-string basses too), so the rule is always fret 5.',
          ],
          steps: [
            { ex: 'fb-unison', p: { string: 'E' }, sub: 2, from: 66, goal: 84, do: 'Each note, then the same pitch on the next string. Listen: they should sound identical.' },
            { ex: 'fb-unison', p: { string: 'A' }, sub: 2, from: 66, goal: 84, do: 'Now from the A string.' },
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
            { ex: 'fb-find-note', p: { range: '12' }, sub: 1, from: 66, goal: 84, do: 'Every place this note lives, from the nut to fret 12. Change the key under Options for a new note.' },
            { ex: 'fb-note-sweep', p: {}, sub: 1, from: 60, goal: 80, do: 'One note on every string, up and back, then the next note around the cycle.' },
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
            { ex: 'fb-cycle-zone', p: { zone: '1', order: 'cycle4' }, sub: 0.25, from: 60, goal: 80, do: 'Zone 1 (frets 1–5), around the cycle of 4ths. Say each name.' },
            { ex: 'fb-cycle-zone', p: { zone: '2', order: 'cycle4' }, sub: 0.25, from: 60, goal: 80, do: 'The same in zone 2 (frets 5–9).' },
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
            { ex: 'fb-quiz', p: { range: '7', strings: 'all', notes: 'nat' }, sub: 0.5, from: 50, goal: 66, do: 'Natural notes, frets 0–7 on every string.' },
            { ex: 'fb-quiz', p: { range: '12', strings: 'all', notes: 'all' }, sub: 0.5, from: 50, goal: 66, do: 'All twelve notes up to fret 12.' },
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
          { ex: 'fb-quiz', p: { range: '12', strings: 'all', notes: 'all' }, sub: 0.5, from: 56, goal: 72 },
          { ex: 'fb-cycle-zone', p: { zone: '3', order: 'cycle4' }, sub: 0.25, from: 66, goal: 84 },
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
            'An interval is the distance between two notes. Because the strings are tuned in 4ths, each interval is a fixed shape: the 5th one string up and two frets up, the major 3rd one string up and one fret back, the minor 3rd three frets up on the same string (or one string up and two frets back).',
            'Learn each shape with its sound. Sing the second note before you play it.',
          ],
          steps: [
            { ex: 'iv-shapes', p: { iv: '5', dir: 'up' }, sub: 1, from: 66, goal: 88, do: 'The perfect 5th: root, 5th, root, 5th.' },
            { ex: 'iv-shapes', p: { iv: '3', dir: 'up' }, sub: 1, from: 66, goal: 88, do: 'The major 3rd: bright.' },
            { ex: 'iv-shapes', p: { iv: 'b3', dir: 'up' }, sub: 1, from: 66, goal: 88, do: 'The minor 3rd: darker. Compare it with the major 3rd.' },
          ],
          mistakes: [
            'Learning the shapes without the sound. Sing every interval.',
          ],
        },
        {
          id: 'interval-family', title: 'Every interval from one root',
          idea: 'From ♭2 to the octave, all around one hand position.',
          concept: [
            'From one root, the twelve intervals climb a fret at a time: ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7, octave. Every chord and scale is a selection of them.',
            'Name each one as you play it: "minor 2nd, major 2nd…"',
          ],
          steps: [
            { ex: 'iv-all-from-root', p: { root: 'E' }, sub: 2, from: 72, goal: 92, do: 'Name each interval as you play it.' },
            { ex: 'iv-moving', p: { iv: '3', string: 'E' }, sub: 2, from: 76, goal: 96, do: 'One shape, moved up a fret at a time: the same distance from every root. (It starts on fret 2, where the shape needs no open string.)' },
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
            { ex: 'iv-ear-quiz', p: { set: 'basic' }, sub: 1, do: '3rds, 4ths, 5ths and the octave. Sing, name, then play.' },
            { ex: 'iv-ear-quiz', p: { set: 'all' }, sub: 1, do: 'Every interval within the octave.' },
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
          { ex: 'iv-all-from-root', p: { root: 'A' }, sub: 2, from: 80, goal: 100 },
          { ex: 'iv-ear-quiz', p: { set: 'basic' }, sub: 1 },
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
            { ex: 'tri-qualities', p: { quality: 'dim', shape: 'updown' }, sub: 2, from: 66, goal: 88, do: 'Diminished: R-♭3-♭5.' },
            { ex: 'tri-qualities', p: { quality: 'aug', shape: 'updown' }, sub: 2, from: 66, goal: 88, do: 'Augmented: R-3-♯5.' },
            { ex: 'tri-qualities', p: { quality: 'sus4', shape: 'updown' }, sub: 2, from: 66, goal: 88, do: 'Sus4: the 4th takes the place of the 3rd.' },
          ],
          mistakes: [
            'Mixing up diminished and minor. Diminished also lowers the 5th.',
          ],
        },
        {
          id: 'four-types', title: 'Four types from one root',
          idea: 'Change one note at a time and hear each colour.',
          concept: [
            'Major, minor, diminished, augmented on the same root. Major to minor lowers the 3rd by a fret, minor to diminished lowers the 5th, and augmented then raises the 5th of the major triad (so from diminished both the 3rd and the 5th move). Hearing which note moved is the best ear training for chords.',
          ],
          steps: [
            { ex: 'tri-four-types', p: { root: 'A' }, sub: 2, from: 70, goal: 92, do: 'Major → minor → diminished → augmented. Say each name before it plays.' },
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
            { ex: 'tri-zone-cycle', p: { quality: 'maj', zone: '1', order: 'cycle4', pattern: 'turn' }, sub: 1, from: 72, goal: 96, do: 'Major triads around the cycle of 4ths in zone 1.' },
            { ex: 'tri-zone-cycle', p: { quality: 'min', zone: '1', order: 'cycle4', pattern: 'turn' }, sub: 1, from: 72, goal: 96, do: 'Minor triads, same zone.' },
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
          { ex: 'tri-four-types', p: {}, sub: 2, from: 80, goal: 100 },
          { ex: 'tri-zone-cycle', p: { quality: 'maj', zone: '2', order: 'cycle4' }, sub: 1, from: 80, goal: 100 },
          { ex: 'ear-triads', p: { set: 'all' } },
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
            { ex: 'arp-7th-qualities', p: { root: 'A' }, sub: 2, from: 70, goal: 90, do: 'Lower one note at a time. Say each chord\'s name.' },
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
            { ex: 'arp-7th', p: { quality: 'dom7', shape: 'updown', oct: '1', root: 'A' }, sub: 2, from: 72, goal: 96, do: 'Dominant 7: R-3-5-♭7.' },
            { ex: 'arp-7th', p: { quality: 'min7', shape: 'updown', oct: '1', root: 'A' }, sub: 2, from: 72, goal: 96, do: 'Minor 7: R-♭3-5-♭7.' },
            { ex: 'arp-7th', p: { quality: 'maj7', shape: 'updown', oct: '1', root: 'A' }, sub: 2, from: 72, goal: 96, do: 'Major 7: R-3-5-7.' },
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
            'Root and 3rd tell major from minor. The vii chord has a minor 3rd too, but its 5th is a fret lower as well: that makes it diminished, the tense one.',
          ],
          steps: [
            { ex: 'hm-chord-qualities', p: { scale: 'ionian' }, sub: 2, from: 72, goal: 92, do: 'Root and 3rd on every degree. Say "major" or "minor" each time, and "diminished" on vii.' },
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
          { ex: 'arp-7th-qualities', p: {}, sub: 2, from: 80, goal: 100 },
          { ex: 'arp-7th', p: { quality: 'dom7', oct: '1' }, sub: 2, from: 84, goal: 104 },
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
            { ex: 'sc-blues', p: { type: 'blues', root: 'E', oct: '1' }, sub: 1, from: 60, goal: 88, do: 'The blues scale from the E string.' },
            { ex: 'sc-blues', p: { type: 'majorBlues', root: 'E', oct: '1' }, sub: 1, from: 60, goal: 88, do: 'The major blues scale: hear the brighter colour.' },
          ],
          mistakes: [
            'Holding the ♭5 as if it were home. It is a passing note.',
          ],
        },
        {
          id: 'blues-lines', title: 'Blues bass lines',
          idea: 'Boogie and shuffle: the lines that built rock\'n\'roll.',
          concept: [
            'The boogie-woogie line (R-3-5-6-♭7-6-5-3) and the shuffle (R-R-5-5-6-6-5-5) move the same shape through the 12 bars. Play them straight, then swung; keep them steady and you can play with any blues band.',
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
          'I know the sound of I–IV–V and I–V–vi–IV and can play their roots in any key.',
        ],
        steps: [
          { ex: 'hm-12-bar-blues', p: { prog: 'blues', pattern: 'r357' }, from: 100, goal: 120, backing: 'chords' },
          { ex: 'gr-blues', p: { style: 'boogie', prog: 'blues' }, from: 96, goal: 120, backing: 'chords' },
          { ex: 'hm-progression-roots', p: { prog: 'I-V-vi-IV', rhythm: '1' }, from: 96, goal: 116, backing: 'chords' },
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
            { ex: 'tech-octaves', p: { pair: 'E' }, sub: 2, from: 96, goal: 112, do: 'Root–octave 8ths moving up the neck. Keep the string in between silent.' },
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
            { ex: 'tech-dynamics', p: { pos: '5' }, sub: 2, from: 66, goal: 84, do: 'pp → ff → pp. Keep the tempo steady as the volume changes.' },
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
          { ex: 'tech-dynamics', p: { pos: '5' }, sub: 2, from: 72, goal: 90 },
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
            'At the start of each line, the key signature lists the notes that are sharp or flat throughout: one ♯ (F♯) is G major, two (F♯, C♯) D major; one ♭ (B♭) is F major, two (B♭, E♭) B♭ major. Read it before the first note, then keep it in mind.',
            'Read in shapes: steps, small leaps and repeated notes, not one note at a time.',
          ],
          steps: [
            { ex: 'rd-melodies', p: { key: '0' }, from: 60, goal: 76, do: 'C major: no sharps or flats.' },
            { ex: 'rd-melodies', p: { key: '7' }, from: 60, goal: 76, do: 'G major: every F is F♯.' },
            { ex: 'rd-melodies', p: { key: '5' }, from: 60, goal: 76, do: 'F major: every B is B♭.' },
            { ex: 'rd-melodies', p: { key: '2' }, from: 60, goal: 76, do: 'D major: every F and C is sharp.' },
            { ex: 'rd-melodies', p: { key: '10' }, from: 60, goal: 76, do: 'B♭ major: every B and E is flat.' },
          ],
          mistakes: [
            'Forgetting the key signature halfway through. Check it again at the start of every line.',
          ],
        },
      ],
      check: {
        can: [
          'I read sharps, flats and naturals in first position.',
          'I can read a simple melody in C, G, F, D or B♭ major.',
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
      'I can play the 12-bar blues with a boogie line at 116 BPM.',
      'I can find any note up to fret 12 and play every triad type from it.',
      'I can play maj7, 7 and m7 arpeggios in any key.',
      'I can swing, play off-beats and read a melody with a key signature.',
    ],
    steps: [
      { ex: 'gr-blues', p: { style: 'boogieSwing', prog: 'blues' }, from: 96, goal: 116, backing: 'chords' },
      { ex: 'tri-zone-cycle', p: { quality: 'min', zone: '2', order: 'cycle4' }, sub: 1, from: 84, goal: 104 },
      { ex: 'arp-7th', p: { quality: 'min7', oct: '1' }, sub: 2, from: 84, goal: 104 },
      { ex: 'rh-shuffle', p: {}, from: 96, goal: 120 },
      { ex: 'rd-melodies', p: { key: '10' }, from: 66, goal: 80 },
    ],
  },
};
