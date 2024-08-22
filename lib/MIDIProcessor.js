// midiProcessor.js

// Helper function to get a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function addHarmony(midiData) {
  return {
    ...midiData,
    tracks: midiData.tracks.map(track => ({
      ...track,
      notes: track.notes.flatMap(note => {
        // Simple harmony: add a note a third and a fifth above each existing note
        const thirdNote = { ...note, midi: note.midi + 4 }; // Major third
        const fifthNote = { ...note, midi: note.midi + 7 }; // Perfect fifth
        return [note, thirdNote, fifthNote];
      })
    }))
  };
}

export function extendMelody(midiData) {
  return {
    ...midiData,
    tracks: midiData.tracks.map(track => {
      const lastNote = track.notes[track.notes.length - 1];
      const extensionDuration = 4; // Extend by 4 beats
      const newNotes = [...track.notes];

      for (let i = 0; i < extensionDuration; i++) {
        newNotes.push({
          midi: getRandomInt(lastNote.midi - 5, lastNote.midi + 5),
          time: lastNote.time + lastNote.duration + i,
          duration: 1,
          velocity: lastNote.velocity
        });
      }

      return { ...track, notes: newNotes };
    })
  };
}

export function improveMelody(midiData) {
  return {
    ...midiData,
    tracks: midiData.tracks.map(track => ({
      ...track,
      notes: track.notes.map(note => ({
        ...note,
        midi: note.midi + getRandomInt(-2, 2), // Slightly alter pitch
        duration: Math.max(0.1, note.duration + getRandomInt(-1, 1) * 0.1) // Slightly alter duration
      }))
    }))
  };
}