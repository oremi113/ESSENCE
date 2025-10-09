import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Lock, PlayCircle, Clock } from "lucide-react";

interface Stage {
  stage: number;
  title: string;
  description: string;
  estimatedTime: string;
  promptCount: number;
  complete: boolean;
  locked: boolean;
  current: boolean;
}

interface StageData {
  stages: Stage[];
  overallProgress: number;
  completedPrompts: number;
  totalPrompts: number;
}

interface StageSelectorProps {
  onSelectStage: (stageNumber: number) => void;
}

export default function StageSelector({ onSelectStage }: StageSelectorProps) {
  const { data, isLoading, error } = useQuery<StageData>({
    queryKey: ['/api/voice/training/stages'],
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load training stages. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stages, overallProgress, completedPrompts, totalPrompts } = data;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6" data-testid="stage-selector">
      <div>
        <h1 className="text-3xl font-bold mb-2">Voice Training Progress</h1>
        <p className="text-muted-foreground">Complete all three stages to train your voice</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Overall Progress</h3>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" data-testid="overall-progress" />
          <p className="text-sm text-muted-foreground">
            {completedPrompts} of {totalPrompts} prompts complete
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {stages.map((stage) => (
          <Card 
            key={stage.stage}
            className={`
              transition-all duration-200
              ${stage.complete ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''}
              ${stage.current ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20' : ''}
              ${stage.locked ? 'opacity-60' : 'hover-elevate'}
            `}
            data-testid={`stage-card-${stage.stage}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {stage.complete ? (
                    <CheckCircle2 className="w-10 h-10 text-green-600" data-testid={`stage-${stage.stage}-complete-icon`} />
                  ) : stage.locked ? (
                    <Lock className="w-10 h-10 text-muted-foreground" data-testid={`stage-${stage.stage}-locked-icon`} />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-primary" data-testid={`stage-${stage.stage}-play-icon`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg mb-1" data-testid={`stage-${stage.stage}-title`}>
                        {stage.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`stage-${stage.stage}-description`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{stage.estimatedTime}</span>
                    </Badge>
                    <Badge variant="secondary">
                      {stage.promptCount} prompts
                    </Badge>
                    {stage.complete && (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        Complete
                      </Badge>
                    )}
                    {stage.current && !stage.complete && (
                      <Badge variant="default">
                        In Progress
                      </Badge>
                    )}
                  </div>

                  {!stage.locked && (
                    <Button
                      onClick={() => onSelectStage(stage.stage)}
                      className="mt-4"
                      variant={stage.complete ? "outline" : "default"}
                      data-testid={`button-start-stage-${stage.stage}`}
                    >
                      {stage.complete ? 'Review' : stage.current ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
