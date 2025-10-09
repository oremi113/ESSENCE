import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StageSelector from "@/components/StageSelector";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Square, Play, RotateCcw, Check, Save } from "lucide-react";
import type { User } from "@shared/schema";

interface CurrentPromptData {
  stage: number;
  stageTitle: string;
  stageDescription: string;
  estimatedTime: string;
  promptNumber: number;
  totalPrompts: number;
  progressPercentage: number;
  currentPrompt: {
    id: number;
    instruction: string;
    displayLine: string;
  };
  stageComplete?: boolean;
  nextStage?: number;
  complete?: boolean;
}

interface VoiceTrainingFlowProps {
  currentUser: User;
  currentProfile: any;
  onSaveRecording: (audioBlob: Blob, phraseIndex: number, phraseText: string) => Promise<void>;
}

export default function VoiceTrainingFlow({ currentUser, currentProfile, onSaveRecording }: VoiceTrainingFlowProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentView, setCurrentView] = useState<'stages' | 'recording' | 'celebration'>('stages');
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedStage, setCompletedStage] = useState<number | null>(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch current prompt
  const { data: currentPromptData, isLoading: loadingPrompt, refetch: refetchCurrentPrompt } = useQuery<CurrentPromptData>({
    queryKey: ['/api/voice/training/current'],
    enabled: currentView === 'recording'
  });

  // Set stage mutation
  const setStageMutation = useMutation({
    mutationFn: async (stage: number) => {
      const response = await fetch('/api/voice/training/set-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stage })
      });
      if (!response.ok) throw new Error('Failed to set stage');
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async ({ promptId, duration }: { promptId: number, duration?: number }) => {
      const response = await fetch('/api/voice/training/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promptId, duration })
      });
      if (!response.ok) throw new Error('Failed to save progress');
      return response.json();
    },
    onSuccess: (data) => {
      // Clear recording state for next prompt
      clearRecordingState();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/voice/training/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/voice/training/stages'] });
      
      // Check if stage complete
      if (data.stageComplete) {
        setCompletedStage(data.completedStage);
        setShowCelebration(true);
        setCurrentView('stages');
      } else if (data.complete) {
        // All stages complete - redirect to message creation
        setLocation('/create');
      } else {
        // Move to next prompt
        refetchCurrentPrompt();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error saving progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle stageComplete from GET endpoint
  useEffect(() => {
    if (currentView === 'recording' && currentPromptData && !loadingPrompt) {
      if (currentPromptData.stageComplete) {
        setCompletedStage(currentPromptData.stage);
        setShowCelebration(true);
        setCurrentView('stages');
      } else if (currentPromptData.complete) {
        setLocation('/create');
      }
    }
  }, [currentView, currentPromptData, loadingPrompt, setLocation]);

  const handleSelectStage = async (stageNumber: number) => {
    try {
      clearRecordingState();
      // Update backend stage
      await setStageMutation.mutateAsync(stageNumber);
      // Switch to recording view
      setCurrentView('recording');
      refetchCurrentPrompt();
    } catch (error) {
      // Error already shown by mutation
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const retryRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const clearRecordingState = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setIsRecording(false);
  };

  const handleRecordingComplete = async (audioBlob: Blob, promptIndex: number, passageText: string) => {
    if (!currentPromptData) return;
    
    try {
      // First, save the actual audio recording
      await onSaveRecording(audioBlob, promptIndex, passageText);
      
      // Calculate duration from audio blob (approximate)
      const duration = Math.round(audioBlob.size / 16000); // Rough estimate
      
      // Then, update user progress
      await saveProgressMutation.mutateAsync({
        promptId: currentPromptData.currentPrompt.id,
        duration
      });
    } catch (error) {
      console.error('Error in recording flow:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    
    if (completedStage === 3) {
      // All done - redirect to message creation
      setLocation('/create');
    } else {
      // Back to stage selector
      setCurrentView('stages');
    }
  };

  const handleSaveAndFinishLater = () => {
    setCurrentView('stages');
  };

  if (currentView === 'stages') {
    return (
      <>
        <StageSelector onSelectStage={handleSelectStage} />
        {showCelebration && completedStage && (
          <MilestoneCelebration
            stage={completedStage}
            open={showCelebration}
            onClose={handleCelebrationClose}
          />
        )}
      </>
    );
  }

  if (currentView === 'recording') {
    if (loadingPrompt) {
      return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    // Handle edge cases without setState during render
    if (!currentPromptData.currentPrompt) {
      // No current prompt available - either stageComplete or complete
      // The mutation callback will handle transitions, show loading for now
      return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Progress header */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">
            Stage {currentPromptData.stage} of 3: {currentPromptData.stageTitle}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Prompt {currentPromptData.promptNumber} of {currentPromptData.totalPrompts}</span>
              <span>{currentPromptData.progressPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${currentPromptData.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Prompt card */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground font-medium">
            {currentPromptData.currentPrompt.instruction}
          </p>
          <p className="text-lg leading-relaxed">
            {currentPromptData.currentPrompt.displayLine}
          </p>
        </div>

        {/* Recording Controls */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {!audioBlob && !isRecording && (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-full"
                data-testid="button-start-recording"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="w-full"
                data-testid="button-stop-recording"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioBlob && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={playRecording}
                    disabled={isPlaying}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-play-recording"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play'}
                  </Button>
                  <Button
                    onClick={retryRecording}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-retry-recording"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Re-record
                  </Button>
                </div>
                <Button
                  onClick={() => handleRecordingComplete(
                    audioBlob,
                    currentPromptData.currentPrompt.id - 1,
                    currentPromptData.currentPrompt.displayLine
                  )}
                  size="lg"
                  className="w-full"
                  disabled={saveProgressMutation.isPending}
                  data-testid="button-save-recording"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {saveProgressMutation.isPending ? 'Saving...' : 'Save & Continue'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save & Finish Later button */}
        <Button
          onClick={handleSaveAndFinishLater}
          variant="outline"
          size="lg"
          className="w-full"
          data-testid="button-save-finish-later"
        >
          <Save className="w-4 h-4 mr-2" />
          Save & Finish Later
        </Button>

        {/* Celebration modal */}
        {showCelebration && completedStage && (
          <MilestoneCelebration
            stage={completedStage}
            open={showCelebration}
            onClose={handleCelebrationClose}
          />
        )}
      </div>
    );
  }

  return null;
}
