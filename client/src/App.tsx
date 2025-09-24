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
  
  // Load profiles from backend
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles');
      if (!response.ok) throw new Error('Failed to load profiles');
      return response.json();
    }
  });

  // Set current profile to first profile if available
  const [currentProfileId, setCurrentProfileId] = useState<string>('1');
  const currentProfile = profiles.find((p: Profile) => p.id === currentProfileId) || profiles[0] || null;

  // Load existing recordings for current profile
  const { data: existingRecordings, isLoading: loadingRecordings } = useQuery({
    queryKey: ['/api/profiles', currentProfile?.id, 'recordings'],
    queryFn: async () => {
      if (!currentProfile?.id) return [];
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`);
      if (!response.ok) throw new Error('Failed to load recordings');
      return response.json();
    },
    enabled: !!currentProfile?.id
  });

  // Save recording mutation
  const saveRecordingMutation = useMutation({
    mutationFn: async ({ audioBlob, phraseIndex }: { audioBlob: Blob, phraseIndex: number }) => {
      if (!currentProfile?.id) throw new Error('No profile selected');
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
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', currentProfile?.id, 'recordings'] });
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

  const [playingMessageId, setPlayingMessageId] = useState<string>();

  // Derived state
  const completedRecordings = recordings.filter(r => r !== null).length;
  const isVoiceTrainingComplete = completedRecordings === TRAINING_SCRIPT.length;
  
  // Voice model status from current profile or derived from recordings
  const voiceModelStatus = currentProfile?.voiceModelStatus || 
    (completedRecordings === 0 ? 'not_submitted' :
     completedRecordings < TRAINING_SCRIPT.length ? 'training' : 'ready');

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

  // No longer needed since profiles come from backend

  // Load messages from backend for current profile
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/profiles', currentProfile?.id, 'messages'],
    queryFn: async () => {
      if (!currentProfile?.id) return [];
      const response = await fetch(`/api/profiles/${currentProfile.id}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      return response.json();
    },
    enabled: !!currentProfile?.id
  });

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

  // Create message mutation
  const createMessageMutation = useMutation({
    mutationFn: async ({ title, content, category = 'other' }: { title: string, content: string, category?: string }) => {
      if (!currentProfile?.id) throw new Error('No profile selected');
      const response = await fetch(`/api/profiles/${currentProfile.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category })
      });
      if (!response.ok) throw new Error('Failed to create message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', currentProfile?.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Message created",
        description: "Your message has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateMessage = (title: string, content: string) => {
    createMessageMutation.mutate({ title, content });
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

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles', currentProfile?.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteMessage = (id: string) => {
    deleteMessageMutation.mutate(id);
  };

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: { name: string, relation: string, notes: string }) => {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) throw new Error('Failed to create profile');
      return response.json();
    },
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      setCurrentProfileId(newProfile.id);
      toast({
        title: "Profile created",
        description: "Your new profile has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateProfile = (profileData: { name: string, relation: string, notes: string }) => {
    createProfileMutation.mutate(profileData);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Profile> }) => {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      // Switch to first remaining profile if current was deleted
      if (currentProfile?.id === currentProfileId) {
        const remainingProfiles = profiles.filter((p: Profile) => p.id !== currentProfileId);
        if (remainingProfiles.length > 0) {
          setCurrentProfileId(remainingProfiles[0].id);
        }
      }
      toast({
        title: "Profile deleted",
        description: "Your profile has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdateProfile = (id: string, updates: Partial<Profile>) => {
    updateProfileMutation.mutate({ id, updates });
  };

  const handleDeleteProfile = (id: string) => {
    deleteProfileMutation.mutate(id);
  };

  const handleSelectProfile = (profile: Profile) => {
    setCurrentProfileId(profile.id);
    setCurrentRecordingIndex(0); // Reset to first phrase
  };

  // Show onboarding if user hasn't completed it
  if (!hasOnboarded) {
    return <WelcomeOnboarding onStart={handleStartOnboarding} />;
  }

  // Show loading while profiles are being fetched
  if (loadingProfiles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ESSENCE...</p>
        </div>
      </div>
    );
  }

  // Show message if no profiles exist
  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-serif mb-4">Welcome to ESSENCE</h2>
          <p className="text-muted-foreground mb-6">
            No profiles found. Let's create your first voice profile to get started.
          </p>
          <button
            onClick={() => handleCreateProfile({ name: 'My Voice', relation: 'Self', notes: 'Primary voice profile' })}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
          >
            Create First Profile
          </button>
        </div>
      </div>
    );
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