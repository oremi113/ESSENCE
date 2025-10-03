import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { TRAINING_SCRIPT, TOTAL_TRAINING_PHRASES } from "@shared/constants";

// Components
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import Navigation from "@/components/Navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import MessageCreator from "@/components/MessageCreator";
import PlaybackLibrary from "@/components/PlaybackLibrary";
import UserProfiles from "@/components/UserProfiles";

// Auth Pages
import Login from "@/pages/login";
import Signup from "@/pages/signup";

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
  category: 'children' | 'partner' | 'parents' | 'future_me' | 'family' | 'other';
  audioUrl?: string;
  duration: number;
}

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
  const [location, setLocation] = useLocation();
  
  // DEV MODE: Skip authentication for testing - SET TO FALSE TO RE-ENABLE AUTH
  const DEV_SKIP_AUTH = true;
  
  // Check authentication status
  const { data: authData, isLoading: authLoading, refetch: refetchAuth } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      if (DEV_SKIP_AUTH) {
        // Return mock user in dev mode
        return {
          user: {
            id: 'dev-user-123',
            email: 'dev@test.com',
            name: 'Dev User',
            age: 30,
            voiceModelId: null,
            voiceTrainingComplete: 0,
            createdAt: new Date().toISOString()
          }
        };
      }
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to check auth');
      return response.json();
    },
    retry: false,
    enabled: !DEV_SKIP_AUTH
  });

  const user = authData?.user;
  const isAuthenticated = DEV_SKIP_AUTH || !!user;

  const handleAuthSuccess = () => {
    refetchAuth();
  };
  
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
  
  // Load profiles from backend (or use mock data in dev mode)
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      if (DEV_SKIP_AUTH) {
        // Return mock profiles in dev mode
        return [
          {
            id: 'profile-1',
            userId: 'dev-user-123',
            name: 'My Children',
            relation: 'Children',
            notes: 'Messages for my kids to listen to in the future',
            voiceModelStatus: 'ready',
            recordingsCount: 3,
            messagesCount: 2,
            createdAt: new Date('2024-01-15')
          },
          {
            id: 'profile-2',
            userId: 'dev-user-123',
            name: 'My Partner',
            relation: 'Spouse',
            notes: 'Love notes and special messages',
            voiceModelStatus: 'training',
            recordingsCount: 2,
            messagesCount: 1,
            createdAt: new Date('2024-02-01')
          }
        ];
      }
      const response = await fetch('/api/profiles', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load profiles');
      return response.json();
    },
    enabled: !DEV_SKIP_AUTH || true
  });

  // Set current profile to first profile if available
  const [currentProfileId, setCurrentProfileId] = useState<string>(DEV_SKIP_AUTH ? 'profile-1' : '1');
  const currentProfile = profiles.find((p: Profile) => p.id === currentProfileId) || profiles[0] || null;

  // Load existing recordings for current profile (or use mock in dev mode)
  const { data: existingRecordings, isLoading: loadingRecordings } = useQuery({
    queryKey: ['/api/profiles', currentProfile?.id, 'recordings'],
    queryFn: async () => {
      if (!currentProfile?.id) return [];
      
      if (DEV_SKIP_AUTH) {
        // Return empty recordings in dev mode so user can test the recording flow
        return [];
      }
      
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`, { credentials: 'include' });
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
  const voiceModelStatus = DEV_SKIP_AUTH && currentProfile?.id === 'profile-1' 
    ? 'ready'
    : (currentProfile?.voiceModelStatus || 
        (completedRecordings === 0 ? 'not_submitted' :
         completedRecordings < TRAINING_SCRIPT.length ? 'training' : 'ready'));

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
        // Strip data URL prefix if present (e.g., "data:audio/webm;base64,")
        let base64Data = recording.audioData;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }
        
        try {
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/wav' });
          
          // Direct 1:1 mapping: Act 1→index 0, Act 2→index 1, Act 3→index 2
          const index = parseInt(recording.actNumber) - 1;
          newRecordings[index] = blob;
        } catch (error) {
          console.error('Failed to decode recording:', error, recording);
        }
      });
      setRecordings(newRecordings);
    }
  }, [existingRecordings]);

  // No longer needed since profiles come from backend

  // Load messages from backend for current profile (or use mock data in dev mode)
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/profiles', currentProfile?.id, 'messages'],
    queryFn: async () => {
      if (!currentProfile?.id) return [];
      
      if (DEV_SKIP_AUTH) {
        // Return mock messages in dev mode
        return [
          {
            id: 'msg-1',
            profileId: 'profile-1',
            userId: 'dev-user-123',
            title: 'My First Message',
            content: 'Hello my dear children. I hope this message finds you well...',
            category: 'children',
            audioUrl: null,
            duration: 45,
            createdAt: new Date('2024-01-20')
          },
          {
            id: 'msg-2',
            profileId: 'profile-1',
            userId: 'dev-user-123',
            title: 'Life Advice',
            content: 'As you grow older, remember these important lessons...',
            category: 'children',
            audioUrl: null,
            duration: 62,
            createdAt: new Date('2024-02-10')
          }
        ];
      }
      
      const response = await fetch(`/api/profiles/${currentProfile.id}/messages`, { credentials: 'include' });
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
    mutationFn: async ({ title, content, category = 'other', audioData, duration }: { 
      title: string, 
      content: string, 
      category?: string,
      audioData?: string | null,
      duration?: number
    }) => {
      if (!currentProfile?.id) throw new Error('No profile selected');
      const response = await fetch(`/api/profiles/${currentProfile.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, audioData, duration })
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

  const handleCreateMessage = (title: string, content: string, category: string, audioData?: string, duration?: number) => {
    createMessageMutation.mutate({ 
      title, 
      content, 
      category: category as 'children' | 'partner' | 'parents' | 'future_me' | 'family' | 'other',
      audioData: audioData || null,
      duration: duration || 30
    });
  };

  const handlePlayMessage = async (id: string) => {
    if (playingMessageId === id) {
      setPlayingMessageId(undefined);
      console.log('Pausing message:', id);
      return;
    }

    // Find the message to get its audio data
    const message = messages?.find((m: any) => m.id === id);
    if (!message || !message.audioData) {
      console.log('No audio data available for message:', id);
      return;
    }

    setPlayingMessageId(id);
    console.log('Playing message:', id);
    
    try {
      // Create and play audio element
      const audio = new Audio(message.audioData);
      audio.onended = () => {
        setPlayingMessageId(undefined);
      };
      audio.onerror = () => {
        console.error('Error playing audio for message:', id);
        setPlayingMessageId(undefined);
      };
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingMessageId(undefined);
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/signup">
          <Signup onSignup={handleAuthSuccess} />
        </Route>
        <Route path="/">
          <Login onLogin={handleAuthSuccess} />
        </Route>
      </Switch>
    );
  }

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
            currentProfileId={currentProfile?.id || ''}
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