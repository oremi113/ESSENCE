import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MessageSquare, 
  Library, 
  Users, 
  Moon, 
  Sun,
  Settings
} from "lucide-react";

interface NavigationProps {
  currentView: 'training' | 'create' | 'library' | 'profiles';
  onViewChange: (view: 'training' | 'create' | 'library' | 'profiles') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  completedRecordings: number;
  totalRecordings: number;
  messagesCount: number;
  profilesCount: number;
}

export default function Navigation({ 
  currentView, 
  onViewChange, 
  isDarkMode,
  onToggleDarkMode,
  completedRecordings,
  totalRecordings,
  messagesCount,
  profilesCount
}: NavigationProps) {
  const isTrainingComplete = completedRecordings === totalRecordings && totalRecordings > 0;

  const navItems = [
    {
      id: 'training' as const,
      label: 'Voice Training',
      icon: Mic,
      badge: `${completedRecordings}/${totalRecordings}`,
      description: 'Record training phrases',
      available: true
    },
    {
      id: 'create' as const,
      label: 'Create Message',
      icon: MessageSquare,
      badge: null,
      description: 'Generate new voice messages',
      available: isTrainingComplete
    },
    {
      id: 'library' as const,
      label: 'Message Library',
      icon: Library,
      badge: messagesCount > 0 ? messagesCount.toString() : null,
      description: 'View saved messages',
      available: true
    },
    {
      id: 'profiles' as const,
      label: 'Voice Profiles',
      icon: Users,
      badge: profilesCount > 0 ? profilesCount.toString() : null,
      description: 'Manage family profiles',
      available: true
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Essynce
              </h1>
              <p className="text-xs text-muted-foreground">
                Voice Preservation
              </p>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                const IconComponent = item.icon;
                
                return (
                  <Button
                    key={item.id}
                    onClick={() => item.available && onViewChange(item.id)}
                    variant={isActive ? "default" : "ghost"}
                    className={`relative h-auto py-2 px-3 flex-col items-center space-y-1 min-w-20 ${
                      !item.available ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!item.available}
                    data-testid={`nav-${item.id}`}
                  >
                    <div className="flex items-center space-x-1">
                      <IconComponent className="w-4 h-4" />
                      {item.badge && (
                        <Badge 
                          variant={isActive ? "secondary" : "outline"} 
                          className="h-4 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-normal leading-none">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              onClick={onToggleDarkMode}
              variant="ghost"
              size="sm"
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Settings (placeholder for future) */}
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="opacity-50"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 pt-4 border-t">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const IconComponent = item.icon;
              
              return (
                <Button
                  key={item.id}
                  onClick={() => item.available && onViewChange(item.id)}
                  variant={isActive ? "default" : "ghost"}
                  className={`h-auto py-2 px-2 flex-col items-center space-y-1 ${
                    !item.available ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!item.available}
                  data-testid={`nav-mobile-${item.id}`}
                >
                  <div className="flex items-center space-x-1">
                    <IconComponent className="w-4 h-4" />
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className="h-3 px-1 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-normal leading-none">
                    {item.label.split(' ')[0]}
                  </span>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Status Bar */}
        {totalRecordings > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span>Training Progress: {completedRecordings}/{totalRecordings}</span>
                {isTrainingComplete && (
                  <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                    Voice Ready
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-muted-foreground">
                {messagesCount > 0 && <span>{messagesCount} messages</span>}
                {profilesCount > 0 && <span>{profilesCount} profiles</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}