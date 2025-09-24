import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Heart, Clock } from "lucide-react";

interface WelcomeOnboardingProps {
  onStart: () => void;
}

export default function WelcomeOnboarding({ onStart }: WelcomeOnboardingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
              Essynce
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light">
              Capture your voice. Preserve your essence.
            </p>
          </div>
          
          <p className="text-lg text-foreground/80 max-w-xl mx-auto leading-relaxed">
            Create a lasting voice legacy for future generations. Record your voice today, 
            and let AI help you share messages, stories, and love for years to come.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <Card className="hover-elevate transition-all duration-300">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Voice Training</h3>
              <p className="text-sm text-muted-foreground">
                Record 20+ phrases to train your unique voice model
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all duration-300">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">AI Messages</h3>
              <p className="text-sm text-muted-foreground">
                Generate heartfelt messages in your preserved voice
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all duration-300">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">Legacy Audio</h3>
              <p className="text-sm text-muted-foreground">
                Share birthday wishes, advice, and love across time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="space-y-4 pt-8">
          <Button 
            onClick={onStart}
            size="lg" 
            className="px-8 py-4 text-lg font-medium"
            data-testid="button-start-journey"
          >
            Begin Your Journey
          </Button>
          <p className="text-sm text-muted-foreground">
            Takes about 10 minutes to complete voice training
          </p>
        </div>
      </div>
    </div>
  );
}