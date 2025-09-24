import Navigation from '../Navigation';
import { useState } from 'react';

export default function NavigationExample() {
  const [currentView, setCurrentView] = useState<'training' | 'create' | 'library' | 'profiles'>('training');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
    console.log('Dark mode toggled:', !isDarkMode);
  };

  const handleViewChange = (view: 'training' | 'create' | 'library' | 'profiles') => {
    setCurrentView(view);
    console.log('Navigation changed to:', view);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onViewChange={handleViewChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        completedRecordings={15}
        totalRecordings={20}
        messagesCount={8}
        profilesCount={3}
      />
      
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif">Current View: {currentView}</h2>
          <p className="text-muted-foreground">
            This navigation shows the current state with 15/20 recordings complete, 
            8 messages created, and 3 profiles available.
          </p>
        </div>
      </div>
    </div>
  );
}