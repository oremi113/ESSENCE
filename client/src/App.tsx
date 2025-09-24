import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Components
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import Navigation from "@/components/Navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import MessageCreator from "@/components/MessageCreator";
import PlaybackLibrary from "@/components/PlaybackLibrary";
import UserProfiles from "@/components/UserProfiles";

// Types
interface Profile {
  id: string;
  name: string;
  relation: string;
  notes: string;
  createdAt: Date;
  voiceModelStatus: 'not_submitted' | 'training' | 'ready';
  recordingsCount: number;
  messagesCount: number;
}

interface Message {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  category: 'birthday' | 'advice' | 'story' | 'love' | 'other';
  audioUrl?: string;
  duration: number;
}

// Training script data
const TRAINING_SCRIPT = [
  "The quick brown fox jumps over the lazy dog.",
  "She sells seashells by the seashore while the sun shines brightly.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Peter Piper picked a peck of pickled peppers from the patch.",
  "A gentle breeze whispered through the tall oak trees in the meadow.",
  "The five boxing wizards jump quickly over the narrow bridge.",
  "Jack and Jill went up the hill to fetch a pail of crystal clear water.",
  "Mary had a little lamb whose fleece was white as fresh snow.",
  "Humpty Dumpty sat on a wall and watched the world go by peacefully.",
  "Twinkle, twinkle, little star, how I wonder what you are up above.",
  "Rain, rain, go away, come again another sunny day in May.",
  "Hickory dickory dock, the mouse ran up the grandfather clock.",
  "Old MacDonald had a farm with many animals running around happily.",
  "Row, row, row your boat gently down the sparkling stream.",
  "London Bridge is falling down, my fair lady of great beauty.",
  "Ring around the rosie, a pocket full of posies in springtime.",
  "Hot cross buns, hot cross buns, one a penny, two a penny treats.",
  "Baa, baa, black sheep, have you any wool for the winter?",
  "Three blind mice, see how they run through the farmer's field.",
  "Itsy bitsy spider climbed up the water spout in the garden."
];

// Utility function to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function Router() {
  const { toast } = useToast();
  
  // Application state
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentView, setCurrentView] = useState<'training' | 'create' | 'library' | 'profiles'>('training');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Voice training state
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(new Array(TRAINING_SCRIPT.length).fill(null));
  
  // Profiles state
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'My Voice',
      relation: 'Self',
      notes: 'Primary voice profile for creating legacy messages',
      createdAt: new Date(),
      voiceModelStatus: 'not_submitted',
      recordingsCount: 0,
      messagesCount: 0
    }
  ]);
  const [currentProfile, setCurrentProfile] = useState<Profile>(profiles[0]);

  // Load existing recordings for current profile
  const { data: existingRecordings, isLoading: loadingRecordings } = useQuery({
    queryKey: ['/api/profiles', currentProfile.id, 'recordings'],
    queryFn: async () => {
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`);
      if (!response.ok) throw new Error('Failed to load recordings');
      return response.json();
    }
  });

  // Save recording mutation
  const saveRecordingMutation = useMutation({
    mutationFn: async ({ audioBlob, phraseIndex }: { audioBlob: Blob, phraseIndex: number }) => {
      const audioData = await blobToBase64(audioBlob);
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseIndex,
          phraseText: TRAINING_SCRIPT[phraseIndex],
          audioData
        })
      });
      if (!response.ok) throw new Error('Failed to save recording');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', currentProfile.id, 'recordings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Recording saved",
        description: "Your voice recording has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving recording",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string>();

  // Derived state
  const completedRecordings = recordings.filter(r => r !== null).length;
  const isVoiceTrainingComplete = completedRecordings === TRAINING_SCRIPT.length;
  
  // Voice model status based on training progress
  const voiceModelStatus: 'not_submitted' | 'training' | 'ready' = 
    completedRecordings === 0 ? 'not_submitted' :
    completedRecordings < TRAINING_SCRIPT.length ? 'training' : 'ready';

  // Theme handling
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load recordings from backend when they're fetched
  useEffect(() => {
    if (existingRecordings) {
      const newRecordings = new Array(TRAINING_SCRIPT.length).fill(null);
      existingRecordings.forEach((recording: any) => {
        // Convert base64 back to Blob for local playback
        const byteCharacters = atob(recording.audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        newRecordings[recording.phraseIndex] = blob;
      });
      setRecordings(newRecordings);
    }
  }, [existingRecordings]);

  // Update current profile's recording count when recordings change
  useEffect(() => {
    setProfiles(prev => prev.map(p => 
      p.id === currentProfile.id 
        ? { ...p, recordingsCount: completedRecordings, voiceModelStatus }
        : p
    ));
  }, [completedRecordings, currentProfile.id, voiceModelStatus]);

  // Update current profile's message count when messages change
  useEffect(() => {
    const currentProfileMessages = messages.filter(m => m.id.startsWith(currentProfile.id));
    setProfiles(prev => prev.map(p => 
      p.id === currentProfile.id 
        ? { ...p, messagesCount: currentProfileMessages.length }
        : p
    ));
  }, [messages.length, currentProfile.id]);

  // Handlers
  const handleStartOnboarding = () => {
    setHasOnboarded(true);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleRecordingComplete = (audioBlob: Blob, index: number) => {
    // Update local state immediately for responsive UI
    const newRecordings = [...recordings];
    newRecordings[index] = audioBlob;
    setRecordings(newRecordings);
    
    // Save to backend
    saveRecordingMutation.mutate({ audioBlob, phraseIndex: index });
  };

  const handleCreateMessage = (title: string, content: string) => {
    const newMessage: Message = {
      id: `${currentProfile.id}-${Date.now()}`,
      title,
      content,
      createdAt: new Date(),
      category: 'other', // TODO: Add category selection in UI
      duration: Math.floor(Math.random() * 120) + 30, // Mock duration
      // audioUrl: placeholder - will be generated by AI service
    };
    
    setMessages(prev => [...prev, newMessage]);
    console.log('Message created:', newMessage);
    
    // TODO: In real implementation, send to voice synthesis API
  };

  const handlePlayMessage = (id: string) => {
    if (playingMessageId === id) {
      setPlayingMessageId(undefined);
      console.log('Pausing message:', id);
    } else {
      setPlayingMessageId(id);
      console.log('Playing message:', id);
      
      // Simulate audio playback ending
      setTimeout(() => {
        setPlayingMessageId(undefined);
      }, 3000);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    console.log('Message deleted:', id);
  };

  const handleCreateProfile = (profileData: Omit<Profile, 'id' | 'createdAt' | 'voiceModelStatus' | 'recordingsCount' | 'messagesCount'>) => {
    const newProfile: Profile = {
      ...profileData,
      id: Date.now().toString(),
      createdAt: new Date(),
      voiceModelStatus: 'not_submitted',
      recordingsCount: 0,
      messagesCount: 0
    };
    setProfiles(prev => [...prev, newProfile]);
    console.log('Profile created:', newProfile);
  };

  const handleUpdateProfile = (id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    console.log('Profile updated:', id, updates);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    // Switch to first remaining profile
    if (currentProfile.id === id) {
      const remainingProfiles = profiles.filter(p => p.id !== id);
      if (remainingProfiles.length > 0) {
        setCurrentProfile(remainingProfiles[0]);
      }
    }
    console.log('Profile deleted:', id);
  };

  const handleSelectProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    // TODO: Load profile-specific data (recordings, messages)
    console.log('Profile selected:', profile.name);
  };

  // Show onboarding if user hasn't completed it
  if (!hasOnboarded) {
    return <WelcomeOnboarding onStart={handleStartOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        completedRecordings={completedRecordings}
        totalRecordings={TRAINING_SCRIPT.length}
        messagesCount={messages.length}
        profilesCount={profiles.length}
      />

      <main className="pb-8">
        {currentView === 'training' && (
          <VoiceRecorder
            script={TRAINING_SCRIPT}
            currentIndex={currentRecordingIndex}
            onRecordingComplete={handleRecordingComplete}
            onNext={() => setCurrentRecordingIndex(prev => Math.min(prev + 1, TRAINING_SCRIPT.length - 1))}
            onPrevious={() => setCurrentRecordingIndex(prev => Math.max(prev - 1, 0))}
            recordings={recordings}
          />
        )}

        {currentView === 'create' && (
          <MessageCreator
            voiceModelStatus={voiceModelStatus}
            onCreateMessage={handleCreateMessage}
          />
        )}

        {currentView === 'library' && (
          <PlaybackLibrary
            messages={messages}
            onDeleteMessage={handleDeleteMessage}
            onPlayMessage={handlePlayMessage}
            playingMessageId={playingMessageId}
          />
        )}

        {currentView === 'profiles' && (
          <UserProfiles
            profiles={profiles}
            currentProfile={currentProfile}
            onSelectProfile={handleSelectProfile}
            onCreateProfile={handleCreateProfile}
            onUpdateProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}