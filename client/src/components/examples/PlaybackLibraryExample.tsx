import PlaybackLibrary from '../PlaybackLibrary';
import { useState } from 'react';

export default function PlaybackLibraryExample() {
  const [playingMessageId, setPlayingMessageId] = useState<string>();

  // Mock data for demonstration
  const mockMessages = [
    {
      id: '1',
      title: 'Happy Birthday Sarah',
      content: 'Happy birthday my dear daughter. I hope your special day is filled with joy, laughter, and all the wonderful things life has to offer.',
      createdAt: new Date('2024-01-15'),
      category: 'birthday' as const,
      duration: 32
    },
    {
      id: '2', 
      title: 'Life Advice for College',
      content: 'As you start college, remember that challenges are opportunities to grow. Stay curious, be kind to others, and always believe in yourself.',
      createdAt: new Date('2024-01-10'),
      category: 'advice' as const,
      duration: 45
    },
    {
      id: '3',
      title: 'Bedtime Story - The Brave Little Fox',
      content: 'Once upon a time, in a magical forest, there lived a brave little fox who discovered that true courage comes from helping others.',
      createdAt: new Date('2024-01-08'),
      category: 'story' as const,
      duration: 180
    },
    {
      id: '4',
      title: 'I Love You Message',
      content: 'I want you to know how much you mean to me. Your smile brightens my day and your laughter fills my heart with joy.',
      createdAt: new Date('2024-01-05'),
      category: 'love' as const,
      duration: 25
    }
  ];

  const handlePlayMessage = (id: string) => {
    if (playingMessageId === id) {
      setPlayingMessageId(undefined);
      console.log('Pausing message:', id);
    } else {
      setPlayingMessageId(id);
      console.log('Playing message:', id);
      
      // Simulate audio ending
      setTimeout(() => {
        setPlayingMessageId(undefined);
      }, 3000);
    }
  };

  const handleDeleteMessage = (id: string) => {
    console.log('Deleting message:', id);
  };

  return (
    <PlaybackLibrary
      messages={mockMessages}
      onDeleteMessage={handleDeleteMessage}
      onPlayMessage={handlePlayMessage}
      playingMessageId={playingMessageId}
    />
  );
}