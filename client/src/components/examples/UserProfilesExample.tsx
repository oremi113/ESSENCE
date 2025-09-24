import UserProfiles from '../UserProfiles';
import { useState } from 'react';

export default function UserProfilesExample() {
  const [profiles, setProfiles] = useState([
    {
      id: '1',
      name: 'Dad',
      relation: 'Father',
      notes: 'Deep voice, speaks slowly and thoughtfully. Loves telling stories about his childhood.',
      createdAt: new Date('2024-01-01'),
      voiceModelStatus: 'ready' as const,
      recordingsCount: 20,
      messagesCount: 8
    },
    {
      id: '2',
      name: 'Grandma Rose',
      relation: 'Grandmother',
      notes: 'Gentle voice with a slight accent. Always full of wisdom and love.',
      createdAt: new Date('2024-01-05'),
      voiceModelStatus: 'training' as const,
      recordingsCount: 15,
      messagesCount: 3
    },
    {
      id: '3',
      name: 'Uncle Mike',
      relation: 'Uncle',
      notes: 'Cheerful and energetic speaker. Great at making people laugh.',
      createdAt: new Date('2024-01-10'),
      voiceModelStatus: 'not_submitted' as const,
      recordingsCount: 0,
      messagesCount: 0
    }
  ]);

  const [currentProfile, setCurrentProfile] = useState(profiles[0]);

  const handleCreateProfile = (newProfileData: any) => {
    const newProfile = {
      ...newProfileData,
      id: Date.now().toString(),
      createdAt: new Date(),
      voiceModelStatus: 'not_submitted' as const,
      recordingsCount: 0,
      messagesCount: 0
    };
    setProfiles(prev => [...prev, newProfile]);
    console.log('Created profile:', newProfile);
  };

  const handleUpdateProfile = (id: string, updates: any) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    console.log('Updated profile:', id, updates);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (currentProfile?.id === id) {
      setCurrentProfile(profiles.find(p => p.id !== id) || profiles[0]);
    }
    console.log('Deleted profile:', id);
  };

  const handleSelectProfile = (profile: any) => {
    setCurrentProfile(profile);
    console.log('Selected profile:', profile.name);
  };

  return (
    <UserProfiles
      profiles={profiles}
      currentProfile={currentProfile}
      onSelectProfile={handleSelectProfile}
      onCreateProfile={handleCreateProfile}
      onUpdateProfile={handleUpdateProfile}
      onDeleteProfile={handleDeleteProfile}
    />
  );
}