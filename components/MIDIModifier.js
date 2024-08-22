// MIDIModifier.js

import React, { useState } from 'react';
import { addHarmony, extendMelody, improveMelody } from '../lib/midiProcessor';

const MIDIModifier = ({ midiData, onModify }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleModification = async (modificationFunction, actionName) => {
    if (!midiData) {
      setError('No MIDI data available to modify');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const modifiedData = await modificationFunction(midiData);
      onModify(modifiedData);
    } catch (err) {
      console.error(`Error ${actionName}:`, err);
      setError(`Failed to ${actionName}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleModification(addHarmony, 'add harmony')}
        disabled={isProcessing}
      >
        Add Harmony
      </button>
      <button 
        onClick={() => handleModification(extendMelody, 'extend melody')}
        disabled={isProcessing}
      >
        Extend Melody
      </button>
      <button 
        onClick={() => handleModification(improveMelody, 'improve melody')}
        disabled={isProcessing}
      >
        Improve Melody
      </button>
      {isProcessing && <p>Processing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default MIDIModifier;