import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Play, Save, Volume2, Heart, MessageSquare } from "lucide-react";

interface MessageCreatorProps {
  voiceModelStatus: 'not_submitted' | 'training' | 'ready';
  currentProfileId: string;
  onCreateMessage: (title: string, content: string, category: string, audioData?: string, duration?: number) => void;
}

export default function MessageCreator({ voiceModelStatus, currentProfileId, onCreateMessage }: MessageCreatorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [isPlaying, setIsPlaying] = useState(false);

  const statusConfig = {
    not_submitted: { color: "secondary", text: "Voice Not Submitted" },
    training: { color: "secondary", text: "Training in Progress..." },
    ready: { color: "default", text: "Voice Ready" }
  };

  const handleGenerate = async () => {
    if (!content.trim() || voiceModelStatus !== 'ready') return;
    
    setIsGenerating(true);
    setGeneratedAudio(null);
    setAudioDuration(0);
    
    try {
      // Create a temporary message to generate speech
      const response = await fetch(`/api/profiles/${currentProfileId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title || 'Preview Message',
          content: content.trim(),
          category: selectedCategory
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate voice');
      }
      
      const message = await response.json();
      
      if (message.audioData) {
        setGeneratedAudio(message.audioData);
        setAudioDuration(message.duration || 30);
        console.log('ElevenLabs voice generation completed');
      } else {
        throw new Error('No audio data received');
      }
      
    } catch (error) {
      console.error('Voice generation failed:', error);
      // Show user-friendly error
      alert('Voice generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    if (!generatedAudio) return;
    
    setIsPlaying(true);
    console.log('Playing generated audio');
    
    try {
      // Create and play the actual generated audio
      const audio = new Audio(generatedAudio);
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        console.error('Error playing generated audio');
        setIsPlaying(false);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Error playing preview audio:', error);
      setIsPlaying(false);
    }
  };

  const handleSave = () => {
    if (title.trim() && content.trim() && generatedAudio) {
      onCreateMessage(title.trim(), content.trim(), selectedCategory, generatedAudio, audioDuration);
      
      // Reset form
      setTitle("");
      setContent("");
      setGeneratedAudio(null);
      setAudioDuration(0);
      setSelectedCategory("other");
    }
  };

  const isDisabled = voiceModelStatus !== 'ready';
  const canGenerate = content.trim() && !isDisabled;
  const canSave = title.trim() && generatedAudio;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif">Create Voice Message</CardTitle>
            <Badge 
              variant={statusConfig[voiceModelStatus].color as any}
              data-testid="status-badge"
            >
              {statusConfig[voiceModelStatus].text}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isDisabled 
              ? "Complete voice training to create custom messages"
              : "Type what you want your voice to say"
            }
          </p>
        </CardHeader>
      </Card>

      <Card className={isDisabled ? "opacity-60" : ""}>
        <CardContent className="p-6 space-y-6">
          {/* Message Title */}
          <div className="space-y-2">
            <Label htmlFor="message-title">Message Title</Label>
            <Input
              id="message-title"
              placeholder="e.g., 'Happy Birthday Sarah', 'Bedtime Story', 'Life Advice'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isDisabled}
              data-testid="input-message-title"
            />
          </div>

          {/* Message Category */}
          <div className="space-y-2">
            <Label htmlFor="message-category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isDisabled}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">🎂 Birthday</SelectItem>
                <SelectItem value="advice">💡 Advice</SelectItem>
                <SelectItem value="story">📖 Story</SelectItem>
                <SelectItem value="love">❤️ Love</SelectItem>
                <SelectItem value="other">✨ Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message-content">What do you want to say?</Label>
            <Textarea
              id="message-content"
              placeholder="Write your message here... Your voice will speak these exact words."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isDisabled}
              rows={6}
              className="resize-none"
              data-testid="textarea-message-content"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} characters • Write naturally as you would speak
            </p>
          </div>

          {/* AI Generation Status */}
          {isGenerating && (
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-accent-foreground" />
                  <div>
                    <p className="font-medium text-accent-foreground">Generating your voice...</p>
                    <p className="text-sm text-muted-foreground">This may take a moment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Audio Preview */}
          {generatedAudio && !isGenerating && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Voice Generated Successfully</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Ready to save or regenerate</p>
                    </div>
                  </div>
                  <Button
                    onClick={handlePlay}
                    variant="outline"
                    size="sm"
                    disabled={isPlaying}
                    className="border-green-200 dark:border-green-800"
                    data-testid="button-preview-audio"
                  >
                    {isPlaying ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'Playing' : 'Preview'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="flex-1"
              data-testid="button-generate-voice"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Voice
                </>
              )}
            </Button>
            
            {generatedAudio && (
              <Button
                onClick={handleSave}
                disabled={!canSave}
                variant="outline"
                data-testid="button-save-message"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Message
              </Button>
            )}
          </div>

          {isDisabled && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
              💡 Complete your voice training first to unlock message creation
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}