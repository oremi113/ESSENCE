import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { voiceTrainingScript } from "@shared/voiceTrainingScript";
import { getTotalPrompts } from "@shared/personalizationHelper";

// Components
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import Navigation from "@/components/Navigation";
import VoiceRecorder from "@/components/VoiceRecorder";
import MessageCreator from "@/components/MessageCreator";
import PlaybackLibrary from "@/components/PlaybackLibrary";
import UserProfiles from "@/components/UserProfiles";
import Settings from "@/components/Settings";

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
  
  // Check authentication status
  const { data: authData, isLoading: authLoading, refetch: refetchAuth } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to check auth');
      return response.json();
    },
    retry: false
  });

  const user = authData?.user;
  const isAuthenticated = !!user;

  const handleAuthSuccess = () => {
    refetchAuth();
  };
  
  // Application state
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [currentView, setCurrentView] = useState<'training' | 'create' | 'library' | 'profiles' | 'settings'>('training');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Voice training state
  const totalPrompts = useMemo(() => getTotalPrompts(voiceTrainingScript), []);
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0);
  const [recordings, setRecordings] = useState<(Blob | null)[]>(new Array(totalPrompts).fill(null));
  
  // Load profiles from backend
  const { data: profiles = [], isLoading: loadingProfiles, isFetching: fetchingProfiles } = useQuery({
    queryKey: ['/api/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/profiles', { credentials: 'include' });
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
      
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load recordings');
      return response.json();
    },
    enabled: !!currentProfile?.id
  });

  // Save recording mutation
  const saveRecordingMutation = useMutation({
    mutationFn: async ({ audioBlob, phraseIndex, phraseText }: { audioBlob: Blob, phraseIndex: number, phraseText: string }) => {
      if (!currentProfile?.id) throw new Error('No profile selected');
      
      const audioData = await blobToBase64(audioBlob);
      const response = await fetch(`/api/profiles/${currentProfile.id}/recordings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phraseIndex,
          phraseText,
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
  const isVoiceTrainingComplete = completedRecordings === totalPrompts;
  
  // Voice model status from current profile or derived from recordings
  const voiceModelStatus = currentProfile?.voiceModelStatus || 
    (completedRecordings === 0 ? 'not_submitted' :
     completedRecordings < totalPrompts ? 'training' : 'ready');

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
      const newRecordings = new Array(totalPrompts).fill(null);
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
          
          // Direct mapping using recordingIndex (0-51)
          const index = recording.recordingIndex;
          newRecordings[index] = blob;
        } catch (error) {
          console.error('Failed to decode recording:', error, recording);
        }
      });
      setRecordings(newRecordings);
    }
  }, [existingRecordings, totalPrompts]);

  // No longer needed since profiles come from backend

  // Load messages from backend for current profile
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/profiles', currentProfile?.id, 'messages'],
    queryFn: async () => {
      if (!currentProfile?.id) return [];
      
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

  const handleRecordingComplete = (audioBlob: Blob, promptIndex: number, passageText: string) => {
    // Safety check: only process if we have a valid Blob
    if (!audioBlob || !(audioBlob instanceof Blob)) {
      console.error('Invalid audio blob received:', audioBlob);
      return;
    }
    
    // Update local state immediately for responsive UI
    const newRecordings = [...recordings];
    newRecordings[promptIndex] = audioBlob;
    setRecordings(newRecordings);
    
    // Save to backend
    saveRecordingMutation.mutate({ audioBlob, phraseIndex: promptIndex, phraseText: passageText });
  };

  const handleClearRecording = (promptIndex: number) => {
    // Clear from local recordings array only (doesn't affect database)
    const newRecordings = [...recordings];
    newRecordings[promptIndex] = null;
    setRecordings(newRecordings);
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
        credentials: 'include',
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
      
      // Auto-navigate to library to see the message
      setCurrentView('library');
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
      return;
    }

    const message = messages?.find((m: any) => m.id === id);
    
    if (!message) {
      console.error('Message not found:', id);
      toast({
        title: "Playback error",
        description: "Message not found",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.audioData) {
      console.error('No audio data for message:', id, 'Message:', message);
      toast({
        title: "No audio available",
        description: "This message doesn't have audio generated yet",
        variant: "destructive",
      });
      return;
    }

    setPlayingMessageId(id);
    
    try {
      // Create and play audio element
      const audio = new Audio(message.audioData);
      audio.onended = () => {
        setPlayingMessageId(undefined);
      };
      audio.onerror = (e) => {
        console.error('Error playing audio for message:', id, e);
        setPlayingMessageId(undefined);
        toast({
          title: "Playback error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingMessageId(undefined);
      toast({
        title: "Playback error",
        description: "Failed to play audio",
        variant: "destructive",
      });
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
        body: JSON.stringify(profileData),
        credentials: 'include'
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
        body: JSON.stringify(updates),
        credentials: 'include'
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
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete profile');
      return response.json();
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
      
      // Switch to first remaining profile if current was deleted
      if (currentProfile?.id === deletedId) {
        const remainingProfiles = profiles.filter((p: Profile) => p.id !== deletedId);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
  if (loadingProfiles || (fetchingProfiles && profiles.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ESSENCE...</p>
        </div>
      </div>
    );
  }

  // Show message if no profiles exist (and we're not in the middle of creating one)
  if (!currentProfile && !createProfileMutation.isPending) {
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
        totalRecordings={totalPrompts}
        messagesCount={messages.length}
        profilesCount={profiles.length}
        voiceModelStatus={voiceModelStatus}
      />

      <main className="pb-8">
        {currentView === 'training' && user && currentProfile && (
          <VoiceRecorder
            currentUser={user}
            currentProfile={currentProfile}
            currentPromptIndex={currentRecordingIndex}
            onRecordingComplete={handleRecordingComplete}
            onClearRecording={handleClearRecording}
            onNext={() => setCurrentRecordingIndex(prev => Math.min(prev + 1, totalPrompts - 1))}
            onPrevious={() => setCurrentRecordingIndex(prev => Math.max(prev - 1, 0))}
            recordings={recordings}
          />
        )}
        
        {currentView === 'training' && user && !currentProfile && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <p className="text-xl text-muted-foreground mb-6">
              Please select a profile first to begin voice training
            </p>
            <Button onClick={() => setCurrentView('profiles')} data-testid="button-select-profile">
              Go to Profiles
            </Button>
          </div>
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

        {currentView === 'settings' && (
          <Settings
            user={user}
            onLogout={handleLogout}
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