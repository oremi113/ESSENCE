import VoiceRecorder from '../VoiceRecorder';
import { useState } from 'react';

export default function VoiceRecorderExample() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(new Array(5).fill(null));

  const script = [
    "The quick brown fox jumps over the lazy dog.",
    "She sells seashells by the seashore while the sun shines brightly.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
    "Peter Piper picked a peck of pickled peppers from the patch.",
    "A gentle breeze whispered through the tall oak trees in the meadow."
  ];

  const handleRecordingComplete = (audioBlob: Blob, index: number) => {
    const newRecordings = [...recordings];
    newRecordings[index] = audioBlob;
    setRecordings(newRecordings);
    console.log('Recording completed for phrase', index + 1);
  };

  return (
    <VoiceRecorder
      script={script}
      currentIndex={currentIndex}
      onRecordingComplete={handleRecordingComplete}
      onNext={() => setCurrentIndex(prev => Math.min(prev + 1, script.length - 1))}
      onPrevious={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
      recordings={recordings}
    />
  );
}