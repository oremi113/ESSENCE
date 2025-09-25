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
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("other");
  const [isPlaying, setIsPlaying] = useState(false);

  const relationships = ["Spouse", "Daughter", "Son", "Parent", "Friend"];

  const templates = {
    Spouse: [
      "Love Letter",
      "Thank You for Everything", 
      "Our Favorite Memory"
    ],
    Daughter: [
      "Letter for Her 18th Birthday",
      "When You Miss Me",
      "What I Hope for You"
    ],
    Son: [
      "Story Time Adventure", 
      "You Are So Brave",
      "Dad's Secret Mission"
    ],
    Parent: [
      "Thank You for Your Wisdom",
      "What You Taught Me", 
      "I'm Okay Now"
    ],
    Friend: [
      "You Were Always There",
      "My Message to You",
      "Laughter I'll Never Forget"
    ]
  };

  const templateContent = {
    "Love Letter": "My dearest love, I want you to know that every day with you is a gift. When I'm no longer here, I want you to remember...",
    "Thank You for Everything": "I never said it enough, but thank you. Thank you for being my partner, my best friend, my everything...",
    "Our Favorite Memory": "Do you remember that day when we... I think about that moment often, and it always brings a smile to my face...",
    "Letter for Her 18th Birthday": "My beautiful daughter, today you turn 18, and I couldn't be prouder. As you start this new chapter...",
    "When You Miss Me": "Sweet girl, whenever you miss me, I want you to know that I'm always with you in your heart...",
    "What I Hope for You": "My darling daughter, I hope you grow up knowing how loved you are. I hope you chase your dreams...",
    "Story Time Adventure": "Once upon a time, there was a brave little boy who could do anything he set his mind to...",
    "You Are So Brave": "My son, I see how brave you are every day. Even when things are scary, you face them with courage...",
    "Dad's Secret Mission": "I have a secret mission for you, buddy. It's the most important mission ever - to always be kind...",
    "Thank You for Your Wisdom": "All the lessons you taught me, all the love you gave - I carry them with me every day...",
    "What You Taught Me": "You taught me what strength looks like, what love means, and how to never give up...",
    "I'm Okay Now": "I want you to know that I'm okay. I'm at peace, and I want you to find peace too...",
    "You Were Always There": "Through every up and down, every triumph and struggle, you were there. That meant everything...",
    "My Message to You": "If I could tell you one thing, it would be how grateful I am for your friendship...",
    "Laughter I'll Never Forget": "Remember all the times we laughed until our sides hurt? Those are the moments I treasure most..."
  };

  const statusConfig = {
    not_submitted: { color: "secondary", text: "Voice Not Submitted" },
    training: { color: "secondary", text: "Training in Progress..." },
    ready: { color: "default", text: "Voice Ready" }
  };

  const handleRelationshipSelect = (relationship: string) => {
    setSelectedRelationship(relationship);
    setSelectedTemplate(null);
    setTitle("");
    setContent("");
    setGeneratedAudio(null);
    
    // Auto-set category based on relationship
    const categoryMap: { [key: string]: string } = {
      "Spouse": "love",
      "Daughter": "love", 
      "Son": "story",
      "Parent": "other",
      "Friend": "other"
    };
    setSelectedCategory(categoryMap[relationship] || "other");
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setTitle(template);
    setContent(templateContent[template as keyof typeof templateContent] || "");
    setGeneratedAudio(null);
  };

  const handleGenerate = async () => {
    if (!content.trim() || voiceModelStatus !== 'ready') return;
    
    setIsGenerating(true);
    setGeneratedAudio(null);
    setAudioDuration(0);
    
    try {
      // Use preview endpoint to generate speech without saving message
      const response = await fetch(`/api/profiles/${currentProfileId}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'Failed to generate voice';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch {
          // Use default message if response isn't JSON
        }
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      
      if (result.audioData) {
        setGeneratedAudio(result.audioData);
        setAudioDuration(result.duration || 30);
        console.log('ElevenLabs preview generation completed');
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
      setSelectedRelationship(null);
      setSelectedTemplate(null);
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
              : "Choose a relationship and template to get started"
            }
          </p>
        </CardHeader>
      </Card>

      <Card className={isDisabled ? "opacity-60" : ""}>
        <CardContent className="p-6 space-y-6">
          {/* Step 1: Relationship Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Step 1: Who is this message for?</Label>
            <div className="flex gap-2 flex-wrap">
              {relationships.map((rel) => (
                <Button
                  key={rel}
                  variant={selectedRelationship === rel ? "default" : "outline"}
                  onClick={() => handleRelationshipSelect(rel)}
                  disabled={isDisabled}
                  data-testid={`button-relationship-${rel.toLowerCase()}`}
                >
                  {rel}
                </Button>
              ))}
            </div>
          </div>

          {/* Step 2: Template Selection */}
          {selectedRelationship && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Step 2: Choose a message template</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates[selectedRelationship as keyof typeof templates].map((temp) => (
                  <Card
                    key={temp}
                    onClick={() => handleTemplateSelect(temp)}
                    className={`cursor-pointer transition-all hover:shadow-md hover-elevate ${
                      selectedTemplate === temp 
                        ? "border-primary bg-primary/5" 
                        : "border-border"
                    }`}
                    data-testid={`card-template-${temp.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardContent className="p-4">
                      <p className="font-medium text-sm text-center">{temp}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Message Editing */}
          {selectedTemplate && (
            <>
              <div className="space-y-2">
                <Label htmlFor="message-title">Step 3: Customize your message</Label>
                <Input
                  id="message-title"
                  placeholder="Message title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isDisabled}
                  data-testid="input-message-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message-content">Your message content</Label>
                <Textarea
                  id="message-content"
                  placeholder="Edit this message or write your own..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isDisabled}
                  rows={8}
                  className="resize-none"
                  data-testid="textarea-message-content"
                />
                <p className="text-xs text-muted-foreground">
                  {content.length}/2000 characters • Edit freely to make it your own
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
            </>
          )}

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