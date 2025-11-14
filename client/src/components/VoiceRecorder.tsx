import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Pause, RotateCcw, Check, Volume2 } from "lucide-react";
import { voiceTrainingScript } from "@shared/voiceTrainingScript";
import { getPersonalizedLine, getTimeOfDay, getGeneration, getTotalPrompts, type UserContext } from "@shared/personalizationHelper";
import type { User, Profile } from "@shared/schema";

interface VoiceRecorderProps {
  currentUser: User;
  currentProfile: Profile;
  currentPromptIndex: number;
  onRecordingComplete: (audioBlob: Blob, promptIndex: number, passageText: string) => void;
  onClearRecording: (promptIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  recordings: (Blob | null)[];
}

export default function VoiceRecorder({ 
  currentUser,
  currentProfile,
  currentPromptIndex,
  onRecordingComplete,
  onClearRecording,
  onNext, 
  onPrevious,
  recordings 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const userContext = useMemo<UserContext>(() => {
    const birthYear = currentUser.age ? new Date().getFullYear() - currentUser.age : 0;
    
    // Normalize relationship to lowercase and map to personalization keys
    const normalizeRelationship = (relation: string): UserContext['relationship'] => {
      const normalized = relation.toLowerCase().trim();
      
      // Map relationships to personalization keys (for voice training script)
      const mapping: Record<string, UserContext['relationship']> = {
        // Direct matches
        'daughter': 'daughter',
        'son': 'son',
        'spouse': 'spouse',
        'grandchild': 'grandchild',
        'friend': 'friend',
        'parent': 'parent',
        
        // Legacy/plural/alternative forms
        'children': 'daughter',
        'kids': 'daughter',
        'child': 'daughter',
        'partner': 'spouse',
        'husband': 'spouse',
        'wife': 'spouse',
        'grandchildren': 'grandchild',
        'grandkids': 'grandchild',
        'mom': 'parent',
        'dad': 'parent',
        'mother': 'parent',
        'father': 'parent',
        
        // Extended relationships (map to closest personalization key)
        'sibling': 'friend', // Use friend for siblings
        'brother': 'friend',
        'sister': 'friend',
        'grandparent': 'parent', // Grandparent uses parent prompts
        'grandmother': 'parent',
        'grandfather': 'parent',
        'grandma': 'parent',
        'grandpa': 'parent',
        'uncle': 'friend',
        'aunt': 'friend',
        'cousin': 'friend',
        'nephew': 'friend',
        'niece': 'friend',
        'other': 'default',
      };
      
      return mapping[normalized] || 'default';
    };
    
    return {
      name: currentUser.name || 'there',
      city: currentUser.city || undefined,
      hometown: currentUser.city || undefined,
      timeOfDay: getTimeOfDay(),
      generation: getGeneration(birthYear),
      relationship: normalizeRelationship(currentProfile.relation),
    };
  }, [currentUser, currentProfile]);

  const allPrompts = useMemo(() => {
    return voiceTrainingScript.flatMap(stage => 
      stage.prompts.map((prompt, idx) => ({
        ...prompt,
        stageTitle: stage.title,
        stageNumber: stage.stage,
        promptIndexInStage: idx
      }))
    );
  }, []);

  const totalPrompts = allPrompts.length;
  const currentPrompt = allPrompts[currentPromptIndex];
  const personalizedLine = currentPrompt ? getPersonalizedLine(currentPrompt, userContext) : '';

  const completedRecordings = recordings.filter(r => r !== null).length;
  const progress = (completedRecordings / totalPrompts) * 100;

  useEffect(() => {
    setCurrentRecording(recordings[currentPromptIndex] || null);
  }, [currentPromptIndex, recordings]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          setAudioLevel(average);
          
          if (isRecording) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setCurrentRecording(audioBlob);
        onRecordingComplete(audioBlob, currentPromptIndex, personalizedLine);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
      
      setIsRecording(true);
      setRecordingTime(0);
      mediaRecorderRef.current.start();
      updateAudioLevel();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const togglePlayPause = () => {
    if (isPlaying && audioRef.current) {
      // Pause the audio
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioRef.current && audioRef.current.paused) {
      // Resume paused audio
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Play the audio for the first time
      const recordingToPlay = currentRecording || recordings[currentPromptIndex];
      if (recordingToPlay) {
        const url = URL.createObjectURL(recordingToPlay);
        audioRef.current = new Audio(url);
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    }
  };

  const reRecord = () => {
    setCurrentRecording(null);
    // Clear from parent's recordings array (local state only, doesn't delete from database)
    onClearRecording(currentPromptIndex);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasRecording = currentRecording || recordings[currentPromptIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif">Voice Training</CardTitle>
            <Badge variant="secondary" data-testid="progress-badge">
              {completedRecordings} / {totalPrompts}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" data-testid="progress-bar" />
          <p className="text-sm text-muted-foreground">
            {completedRecordings === totalPrompts 
              ? "Training complete! You can review or re-record any phrase." 
              : "Read each phrase clearly and naturally"
            }
          </p>
        </CardHeader>
      </Card>

      {/* Current Script */}
      <Card className="border-accent/20">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {currentPrompt?.stageTitle || 'Stage'}
              </Badge>
              <Badge variant="secondary">
                Prompt {currentPromptIndex + 1} of {totalPrompts}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground italic">
                {currentPrompt?.instruction}
              </p>
              <p className="text-2xl font-serif leading-relaxed text-foreground text-center">
                "{personalizedLine}"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            {/* Audio Level Visualizer */}
            {isRecording && (
              <div className="flex justify-center items-end space-x-1 h-12">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-accent transition-all duration-100"
                    style={{
                      height: `${Math.max(8, (audioLevel / 255) * 48 * Math.random())}px`,
                      opacity: audioLevel > 10 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}

            {/* Recording Status */}
            <div className="space-y-2">
              {isRecording && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-600 font-medium">Recording {formatTime(recordingTime)}</span>
                </div>
              )}
              
              {hasRecording && !isRecording && (
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Recording saved</span>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-3">
              {!isRecording ? (
                <>
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="w-16 h-16 rounded-full"
                    data-testid="button-start-recording"
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                  
                  {hasRecording && (
                    <>
                      <Button
                        onClick={togglePlayPause}
                        variant="outline"
                        size="lg"
                        data-testid="button-play-recording"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      
                      <Button
                        onClick={reRecord}
                        variant="outline"
                        size="lg"
                        data-testid="button-rerecord"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Re-record
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="w-16 h-16 rounded-full"
                  data-testid="button-stop-recording"
                >
                  <Square className="w-6 h-6" />
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {!isRecording ? 'Click the microphone to start recording' : 'Click the square to stop recording'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onPrevious}
          variant="outline"
          disabled={currentPromptIndex === 0}
          data-testid="button-previous"
        >
          Previous
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {currentPromptIndex + 1} of {totalPrompts} prompts
          </p>
        </div>
        
        <Button
          onClick={onNext}
          variant="outline"
          disabled={currentPromptIndex === totalPrompts - 1}
          data-testid="button-next"
        >
          Next
        </Button>
      </div>
    </div>
  );
}