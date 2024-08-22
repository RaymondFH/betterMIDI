import { useState } from 'react'
import { Midi } from '@tonejs/midi'

export default function MIDIUploader({ onUpload }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setLoading(true)
      setError(null)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const midi = new Midi(e.target.result)
          onUpload(midi)
        } catch (err) {
          setError('Failed to parse MIDI file. Please try another file.')
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      reader.onerror = () => {
        setError('Failed to read file. Please try again.')
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <div>
      <input type="file" accept=".mid,.midi" onChange={handleFileUpload} />
      {loading && <p>Loading MIDI file...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}