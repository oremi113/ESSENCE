import { VoicePrompt } from './voiceTrainingScript';

export interface UserContext {
  name: string;
  city?: string;
  hometown?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'lateNight';
  generation?: string;
  relationship?: 'daughter' | 'son' | 'spouse' | 'grandchild' | 'friend' | 'parent' | 'default';
}

export function getPersonalizedLine(prompt: VoicePrompt, userContext: UserContext): string {
  const { lineType, line } = prompt;
  
  if (lineType === 'simple') {
    return replacePlaceholders(line as string, userContext);
  }
  
  if (lineType === 'timeOfDay') {
    const timeKey = userContext.timeOfDay || 'morning';
    const lineObj = line as Record<string, string>;
    return replacePlaceholders(lineObj[timeKey], userContext);
  }
  
  if (lineType === 'timeOfDayCity') {
    const timeKey = userContext.timeOfDay || 'morning';
    const lineObj = line as Record<string, string>;
    return replacePlaceholders(lineObj[timeKey], userContext);
  }
  
  if (lineType === 'city') {
    return replacePlaceholders(line as string, userContext);
  }
  
  if (lineType === 'generation') {
    const generation = userContext.generation || 'default';
    const lineObj = line as Record<string, string>;
    const selectedLine = lineObj[generation] || lineObj.default;
    return replacePlaceholders(selectedLine, userContext);
  }
  
  if (lineType === 'relationship') {
    const relationship = userContext.relationship || 'default';
    const lineObj = line as Record<string, string>;
    const selectedLine = lineObj[relationship] || lineObj.default;
    return replacePlaceholders(selectedLine, userContext);
  }
  
  if (lineType === 'relationshipGoodbye') {
    const relationship = userContext.relationship || 'default';
    const lineObj = line as Record<string, string>;
    const selectedLine = lineObj[relationship] || lineObj.default;
    return replacePlaceholders(selectedLine, userContext);
  }
  
  return replacePlaceholders(line as string, userContext);
}

function replacePlaceholders(text: string, userContext: UserContext): string {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/{userName}/g, userContext.name || 'there')
    .replace(/{city}/g, userContext.city || 'your city')
    .replace(/{hometown}/g, userContext.hometown || userContext.city || 'home');
}

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'lateNight' {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'lateNight';
}

export function getGeneration(birthYear: number): string {
  if (!birthYear) return 'default';
  
  if (birthYear >= 1950 && birthYear <= 1959) return '1950s';
  if (birthYear >= 1960 && birthYear <= 1969) return '1960s';
  if (birthYear >= 1970 && birthYear <= 1979) return '1970s';
  if (birthYear >= 1980 && birthYear <= 1989) return '1980s';
  if (birthYear >= 1990 && birthYear <= 1999) return '1990s';
  if (birthYear >= 2000 && birthYear <= 2009) return '2000s';
  
  return 'default';
}

export function getTotalPrompts(script: { prompts: VoicePrompt[] }[]): number {
  return script.reduce((total, stage) => total + stage.prompts.length, 0);
}
