import React, { useEffect, useRef, useState, useCallback } from 'react'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const OCTAVES = 7
const NOTE_HEIGHT = 20
const PIANO_WIDTH = 100
const PIXEL_PER_SECOND = 100
const TIMELINE_HEIGHT = 30

const PianoRoll = ({ midiData, currentTime, duration, onNotesChange }) => {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [scrollX, setScrollX] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(800)
  const [viewportHeight, setViewportHeight] = useState(600)

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = duration * PIXEL_PER_SECOND * zoom + PIANO_WIDTH
    const height = NOTES.length * OCTAVES * NOTE_HEIGHT + TIMELINE_HEIGHT

    canvas.width = viewportWidth
    canvas.height = viewportHeight

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, viewportWidth, viewportHeight)

    // Draw timeline
    drawTimeline(ctx)

    // Draw piano keys
    drawPianoKeys(ctx)

    // Draw grid
    drawGrid(ctx)

    // Draw visible notes
    drawVisibleNotes(ctx)

    // Draw playhead
    drawPlayhead(ctx)
  }, [midiData, currentTime, duration, zoom, scrollX, scrollY, viewportWidth, viewportHeight])

  const drawTimeline = useCallback((ctx) => {
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, viewportWidth, TIMELINE_HEIGHT)
    
    const measureDuration = 4 // Assuming 4/4 time signature
    const pixelsPerMeasure = measureDuration * PIXEL_PER_SECOND * zoom
    const visibleMeasures = Math.ceil(viewportWidth / pixelsPerMeasure)

    ctx.fillStyle = 'black'
    ctx.font = '12px Arial'
    for (let i = 0; i < visibleMeasures; i++) {
      const x = i * pixelsPerMeasure + PIANO_WIDTH - scrollX
      if (x >= PIANO_WIDTH && x < viewportWidth) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, TIMELINE_HEIGHT)
        ctx.stroke()
        ctx.fillText(`${Math.floor(scrollX / pixelsPerMeasure) + i + 1}`, x + 5, TIMELINE_HEIGHT - 5)
      }
    }
  }, [zoom, scrollX, viewportWidth])

  const drawPianoKeys = useCallback((ctx) => {
    const startOctave = Math.floor(scrollY / (NOTES.length * NOTE_HEIGHT))
    const endOctave = Math.min(OCTAVES - 1, Math.ceil((scrollY + viewportHeight) / (NOTES.length * NOTE_HEIGHT)))

    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let note = 0; note < NOTES.length; note++) {
        const y = (OCTAVES - 1 - octave) * NOTES.length * NOTE_HEIGHT + note * NOTE_HEIGHT + TIMELINE_HEIGHT - scrollY
        if (y >= TIMELINE_HEIGHT && y < viewportHeight) {
          ctx.fillStyle = NOTES[note].includes('#') ? 'black' : 'white'
          ctx.fillRect(0, y, PIANO_WIDTH, NOTE_HEIGHT)
          ctx.strokeRect(0, y, PIANO_WIDTH, NOTE_HEIGHT)
          
          if (!NOTES[note].includes('#')) {
            ctx.fillStyle = 'black'
            ctx.font = '12px Arial'
            ctx.fillText(`${NOTES[note]}${octave}`, 5, y + 15)
          }
        }
      }
    }
  }, [scrollY, viewportHeight])

  const drawGrid = useCallback((ctx) => {
    ctx.strokeStyle = '#ddd'
    const startNote = Math.floor(scrollY / NOTE_HEIGHT)
    const endNote = Math.min(NOTES.length * OCTAVES - 1, Math.ceil((scrollY + viewportHeight) / NOTE_HEIGHT))

    for (let i = startNote; i <= endNote; i++) {
      const y = i * NOTE_HEIGHT + TIMELINE_HEIGHT - scrollY
      ctx.beginPath()
      ctx.moveTo(PIANO_WIDTH, y)
      ctx.lineTo(viewportWidth, y)
      ctx.stroke()
    }
  }, [scrollY, viewportHeight, viewportWidth])

  const drawVisibleNotes = useCallback((ctx) => {
    const startTime = scrollX / (PIXEL_PER_SECOND * zoom)
    const endTime = (scrollX + viewportWidth) / (PIXEL_PER_SECOND * zoom)
    const startNote = Math.floor(scrollY / NOTE_HEIGHT)
    const endNote = Math.ceil((scrollY + viewportHeight) / NOTE_HEIGHT)

    midiData.tracks.forEach((track, trackIndex) => {
      track.notes.forEach(note => {
        if (note.time < endTime && note.time + note.duration > startTime &&
            note.midi >= startNote && note.midi <= endNote) {
          const x = (note.time * PIXEL_PER_SECOND * zoom) + PIANO_WIDTH - scrollX
          const y = (NOTES.length * OCTAVES - 1 - note.midi) * NOTE_HEIGHT + TIMELINE_HEIGHT - scrollY
          const noteWidth = note.duration * PIXEL_PER_SECOND * zoom

          ctx.fillStyle = `hsl(${trackIndex * 30}, 70%, 50%)`
          ctx.fillRect(x, y, noteWidth, NOTE_HEIGHT)
          ctx.strokeRect(x, y, noteWidth, NOTE_HEIGHT)
        }
      })
    })
  }, [midiData, zoom, scrollX, scrollY, viewportWidth, viewportHeight])

  const drawPlayhead = useCallback((ctx) => {
    const playheadX = (currentTime * PIXEL_PER_SECOND * zoom) + PIANO_WIDTH - scrollX
    if (playheadX >= PIANO_WIDTH && playheadX <= viewportWidth) {
      ctx.strokeStyle = 'red'
      ctx.beginPath()
      ctx.moveTo(playheadX, TIMELINE_HEIGHT)
      ctx.lineTo(playheadX, viewportHeight)
      ctx.stroke()
    }
  }, [currentTime, zoom, scrollX, viewportWidth, viewportHeight])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const zoomCenter = (e.clientX - PIANO_WIDTH + scrollX) / (PIXEL_PER_SECOND * zoom)
      const newZoom = Math.max(0.1, Math.min(5, zoom - e.deltaY * 0.001))
      const newScrollX = zoomCenter * PIXEL_PER_SECOND * newZoom - (e.clientX - PIANO_WIDTH)
      setZoom(newZoom)
      setScrollX(Math.max(0, newScrollX))
    } else {
      setScrollX(prev => Math.max(0, prev + e.deltaX))
      setScrollY(prev => Math.max(0, prev + e.deltaY))
    }
  }, [zoom, scrollX])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportWidth(entry.contentRect.width)
        setViewportHeight(entry.contentRect.height)
      }
    })

    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      style={{ border: '1px solid black' }}
      onWheel={handleWheel}
    />
  )
}

export default PianoRoll