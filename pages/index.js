import { useState, useCallback } from 'react'
import MIDIUploader from '../components/MIDIUploader'
import MIDIPlayer from '../components/MIDIPlayer'
import PianoRoll from '../components/PianoRoll'
import MIDIModifier from '../components/MIDIModifier'

export default function Home() {
  const [midiData, setMidiData] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const updateMidiData = useCallback((newData) => {
    setMidiData(newData)
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newData])
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const handleNotesChange = useCallback((newNotes, trackIndex = 0) => {
    updateMidiData({
      ...midiData,
      tracks: midiData.tracks.map((track, index) => 
        index === trackIndex ? { ...track, notes: newNotes } : track
      )
    })
  }, [midiData, updateMidiData])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
      setMidiData(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
      setMidiData(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  return (
    <div>
      <h1>MIDI Enhancer</h1>
      <MIDIUploader onUpload={updateMidiData} />
      {midiData && (
        <>
          <div>
            <button onClick={undo} disabled={historyIndex <= 0}>Undo</button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</button>
          </div>
          <MIDIPlayer midiData={midiData} onTimeUpdate={setCurrentTime} />
          <PianoRoll 
            midiData={midiData} 
            currentTime={currentTime} 
            duration={Math.max(...midiData.tracks.flatMap(track => 
              track.notes.map(note => note.time + note.duration)
            ))}
            onNotesChange={handleNotesChange}
          />
          <MIDIModifier midiData={midiData} onModify={updateMidiData} />
        </>
      )}
    </div>
  )
}