import MessageCreator from '../MessageCreator';
import { useState } from 'react';

export default function MessageCreatorExample() {
  const [voiceModelStatus, setVoiceModelStatus] = useState<'not_submitted' | 'training' | 'ready'>('ready');

  const handleCreateMessage = (title: string, content: string) => {
    console.log('Creating message:', { title, content });
    // Simulate status changes for demo
    setTimeout(() => {
      if (voiceModelStatus === 'ready') {
        setVoiceModelStatus('training');
        setTimeout(() => setVoiceModelStatus('ready'), 2000);
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        <button 
          className="px-3 py-1 text-sm border rounded"
          onClick={() => setVoiceModelStatus('not_submitted')}
        >
          Not Submitted
        </button>
        <button 
          className="px-3 py-1 text-sm border rounded"
          onClick={() => setVoiceModelStatus('training')}
        >
          Training
        </button>
        <button 
          className="px-3 py-1 text-sm border rounded"
          onClick={() => setVoiceModelStatus('ready')}
        >
          Ready
        </button>
      </div>
      
      <MessageCreator
        voiceModelStatus={voiceModelStatus}
        onCreateMessage={handleCreateMessage}
      />
    </div>
  );
}