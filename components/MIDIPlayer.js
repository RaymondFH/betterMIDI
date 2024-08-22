import { useEffect, useState, useRef } from 'react'
import * as Tone from 'tone'

export default function MIDIPlayer({ midiData, onTimeUpdate }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const partsRef = useRef([])
  const synthRef = useRef(null)

  useEffect(() => {
    synthRef.current = new Tone.PolySynth().toDestination()
    
    // Clear previous parts
    partsRef.current.forEach(part => part.dispose())
    partsRef.current = []

    let maxEndTime = 0

    midiData.tracks.forEach((track, trackIndex) => {
      const part = new Tone.Part((time, note) => {
        synthRef.current.triggerAttackRelease(
          note.name,
          note.duration,
          time,
          note.velocity
        )
      }, track.notes.map(note => [note.time, note])).start(0)

      partsRef.current.push(part)

      const trackEndTime = Math.max(...track.notes.map(n => n.time + n.duration))
      maxEndTime = Math.max(maxEndTime, trackEndTime)
    })

    setDuration(maxEndTime)

    return () => {
      partsRef.current.forEach(part => part.dispose())
      if (synthRef.current) synthRef.current.dispose()
    }
  }, [midiData])

  const handlePlayPause = async () => {
    if (playing) {
      Tone.Transport.pause()
    } else {
      await Tone.start()
      Tone.Transport.start()
    }
    setPlaying(!playing)
  }

  useEffect(() => {
    const id = Tone.Transport.scheduleRepeat((time) => {
      const newTime = Tone.Transport.seconds
      setCurrentTime(newTime)
      onTimeUpdate(newTime)
    }, 0.1)

    return () => Tone.Transport.clear(id)
  }, [onTimeUpdate])

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    Tone.Transport.seconds = newTime
    setCurrentTime(newTime)
  }

  return (
    <div>
      <button onClick={handlePlayPause}>{playing ? 'Pause' : 'Play'}</button>
      <input
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={handleSeek}
        step="0.1"
      />
      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
    </div>
  )
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}