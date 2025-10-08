import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  Calendar, 
  Clock, 
  Heart,
  MessageSquare,
  Download
} from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  category: 'children' | 'partner' | 'parents' | 'future_me' | 'family' | 'other';
  audioUrl?: string;
  duration: number;
}

interface PlaybackLibraryProps {
  messages: Message[];
  onDeleteMessage: (id: string) => void;
  onPlayMessage: (id: string) => void;
  playingMessageId?: string;
}

export default function PlaybackLibrary({ 
  messages, 
  onDeleteMessage, 
  onPlayMessage, 
  playingMessageId 
}: PlaybackLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryIcons = {
    children: Heart,
    partner: Heart,
    parents: Heart,
    future_me: MessageSquare,
    family: Heart,
    other: MessageSquare
  };

  const categoryColors = {
    children: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    partner: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    parents: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", 
    future_me: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    family: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    other: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300"
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || message.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalDuration = filteredMessages.reduce((total, msg) => total + msg.duration, 0);
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExport = () => {
    messages.forEach((message, index) => {
      if (message.audioUrl) {
        const link = document.createElement('a');
        link.href = message.audioUrl;
        link.download = `${message.title.replace(/[^a-z0-9]/gi, '_')}_${index + 1}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif">Voice Message Library</CardTitle>
              <p className="text-muted-foreground mt-1">
                {messages.length} messages • {formatDuration(totalDuration)} total duration
              </p>
            </div>
            {messages.length > 0 && (
              <Button 
                onClick={handleExport}
                variant="outline"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {messages.length > 0 && (
        <>
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setSelectedCategory("all")}
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    data-testid="filter-all"
                  >
                    All ({messages.length})
                  </Button>
                  {Object.entries(
                    messages.reduce((acc, msg) => {
                      acc[msg.category] = (acc[msg.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <Button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      data-testid={`filter-${category}`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No messages match your search criteria</p>
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => {
                const IconComponent = categoryIcons[message.category];
                const isPlaying = playingMessageId === message.id;
                
                return (
                  <Card key={message.id} className="hover-elevate transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-lg" data-testid={`message-title-${message.id}`}>
                              {message.title}
                            </h3>
                            <Badge 
                              className={categoryColors[message.category]}
                              variant="secondary"
                            >
                              <IconComponent className="w-3 h-3 mr-1" />
                              {message.category}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {message.content}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{format(message.createdAt, 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(message.duration)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => onPlayMessage(message.id)}
                            variant="outline"
                            size="sm"
                            className="w-20"
                            data-testid={`button-play-${message.id}`}
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => onDeleteMessage(message.id)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-${message.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
              <p className="text-muted-foreground">
                Create your first voice message to start building your audio legacy
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}