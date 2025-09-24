import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, RotateCcw, Check, Volume2 } from "lucide-react";

interface VoiceRecorderProps {
  script: string[];
  currentIndex: number;
  onRecordingComplete: (audioBlob: Blob, index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  recordings: (Blob | null)[];
}

export default function VoiceRecorder({ 
  script, 
  currentIndex, 
  onRecordingComplete, 
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

  const completedRecordings = recordings.filter(r => r !== null).length;
  const progress = (completedRecordings / script.length) * 100;

  useEffect(() => {
    // Load existing recording for current index
    setCurrentRecording(recordings[currentIndex] || null);
  }, [currentIndex, recordings]);

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
        onRecordingComplete(audioBlob, currentIndex);
        
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

  const playRecording = () => {
    if (currentRecording) {
      const url = URL.createObjectURL(currentRecording);
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
    }
  };

  const reRecord = () => {
    setCurrentRecording(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentScript = script[currentIndex];
  const hasRecording = currentRecording || recordings[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-serif">Voice Training</CardTitle>
            <Badge variant="secondary" data-testid="progress-badge">
              {completedRecordings} / {script.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" data-testid="progress-bar" />
          <p className="text-sm text-muted-foreground">
            {completedRecordings === script.length 
              ? "Training complete! You can review or re-record any phrase." 
              : "Read each phrase clearly and naturally"
            }
          </p>
        </CardHeader>
      </Card>

      {/* Current Script */}
      <Card className="border-accent/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Badge variant="outline" className="mb-2">
              Phrase {currentIndex + 1}
            </Badge>
            <p className="text-2xl font-serif leading-relaxed text-foreground">
              "{currentScript}"
            </p>
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
                        onClick={playRecording}
                        variant="outline"
                        size="lg"
                        disabled={isPlaying}
                        data-testid="button-play-recording"
                      >
                        {isPlaying ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Playing' : 'Play'}
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
          disabled={currentIndex === 0}
          data-testid="button-previous"
        >
          Previous
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {script.length} phrases
          </p>
        </div>
        
        <Button
          onClick={onNext}
          variant="outline"
          disabled={currentIndex === script.length - 1}
          data-testid="button-next"
        >
          Next
        </Button>
      </div>
    </div>
  );
}