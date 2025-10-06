// Complete Voice Training Script with Personalization

export interface VoicePrompt {
  instruction: string;
  lineType: 'simple' | 'timeOfDay' | 'timeOfDayCity' | 'city' | 'generation' | 'relationship' | 'relationshipGoodbye';
  line: string | Record<string, string>;
}

export interface VoiceStage {
  stage: number;
  title: string;
  prompts: VoicePrompt[];
}

export const voiceTrainingScript: VoiceStage[] = [
  
  {
    stage: 1,
    title: "Meet Your Voice",
    prompts: [
      {
        instruction: "Let's start simple. Say hello like yourself.",
        lineType: "timeOfDay",
        line: {
          morning: "Good morning! My name is {userName}, calling in from {city}. Hope you've had your coffee!",
          afternoon: "Good afternoon! My name is {userName}, calling in from {city}. Hope you're having a great day so far.",
          evening: "Good evening! My name is {userName}, calling in from {city}. End of the day, time to do something fun.",
          lateNight: "Hey there, night owl! My name is {userName}, calling in from {city}. Couldn't sleep either, huh?"
        }
      },
      {
        instruction: "Now say it like you're hosting a cooking show.",
        lineType: "simple",
        line: "Welcome back to the kitchen! Today we're making something special, so grab your apron and let's get started!"
      },
      {
        instruction: "Now you're a golf announcer whispering at the Masters.",
        lineType: "simple",
        line: "And here we are on the eighteenth hole. The crowd is silent. This putt could change everything."
      }
    ]
  },
  
  {
    stage: 2,
    title: "Movie Trailer Madness",
    prompts: [
      {
        instruction: "Time for your movie trailer voice. Deep and dramatic.",
        lineType: "simple",
        line: "In a world where nothing is as it seems, one person will discover the truth that changes everything."
      },
      {
        instruction: "Now the comedy trailer version - upbeat and fun!",
        lineType: "simple",
        line: "This summer, get ready for the most hilarious adventure of the year! You won't believe what happens next!"
      },
      {
        instruction: "And now the horror movie whisper.",
        lineType: "simple",
        line: "They thought they were alone. They were wrong. Coming soon to a theater near you."
      }
    ]
  },
  
  {
    stage: 3,
    title: "Tongue Twister Theater",
    prompts: [
      {
        instruction: "Let's warm up that voice! Say this three times fast.",
        lineType: "simple",
        line: "She sells seashells by the seashore. She sells seashells by the seashore. She sells seashells by the seashore."
      },
      {
        instruction: "Now this one - and don't trip!",
        lineType: "simple",
        line: "Peter Piper picked a peck of pickled peppers. How many pickled peppers did Peter Piper pick?"
      },
      {
        instruction: "One more. You've got this!",
        lineType: "simple",
        line: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?"
      }
    ]
  },
  
  {
    stage: 4,
    title: "The Absurd Storyteller",
    prompts: [
      {
        instruction: "You're telling a fairy tale, but it's weird. Make it dramatic.",
        lineType: "generation",
        line: {
          "1950s": "Once upon a time, back when TV was black and white, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "1960s": "Once upon a time, during the summer of love, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "1970s": "Once upon a time, in the disco era, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "1980s": "Once upon a time, when MTV actually played music videos, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "1990s": "Once upon a time, when we all had AOL screen names, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "2000s": "Once upon a time, when TikTok didn't exist yet, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck.",
          "default": "Once upon a time, not too long ago, there lived a penguin named Gerald who was terrified of ice. He dreamed of moving to the desert and opening a taco truck."
        }
      },
      {
        instruction: "Now the plot thickens! Add some drama.",
        lineType: "simple",
        line: "But one day, a mysterious wizard arrived with shocking news. Gerald wasn't actually a penguin at all. He was an enchanted accountant from New Jersey!"
      },
      {
        instruction: "The action sequence! Things are getting wild!",
        lineType: "simple",
        line: "Suddenly, an army of angry pelicans descended from the sky, demanding their tax returns! Gerald grabbed his calculator and fought back with spreadsheets and pivot tables!"
      },
      {
        instruction: "And the ridiculous ending.",
        lineType: "simple",
        line: "In the end, Gerald defeated the pelicans with his quarterly earnings report, moved to Arizona, and his taco truck became the most successful business in the Southwest. The end."
      }
    ]
  },
  
  {
    stage: 5,
    title: "Infomercial Insanity",
    prompts: [
      {
        instruction: "You're selling the most amazing product ever invented. Be enthusiastic!",
        lineType: "simple",
        line: "But wait, there's more! Order now and we'll double your offer! That's right, you get two for the price of one!"
      },
      {
        instruction: "Now do the disclaimer voice at the end - fast and monotone.",
        lineType: "simple",
        line: "Terms and conditions apply. Results may vary. Not responsible for any damages. Please consult a doctor before use. Shipping and handling not included."
      },
      {
        instruction: "Back to the enthusiastic pitch!",
        lineType: "simple",
        line: "Don't wait! Operators are standing by! Call now and change your life forever! This offer won't last long!"
      }
    ]
  },
  
  {
    stage: 6,
    title: "Nature Documentary Narrator",
    prompts: [
      {
        instruction: "You're David Attenborough observing animals in the wild.",
        lineType: "simple",
        line: "And here we see the majestic creature in its natural habitat, carefully stalking its prey through the tall grass. Every movement is calculated. Every step, deliberate."
      },
      {
        instruction: "Now narrate something dramatic happening.",
        lineType: "simple",
        line: "But suddenly, danger approaches from behind! The hunter has become the hunted! Will it escape in time? Nature can be cruel, but also magnificent."
      },
      {
        instruction: "Finish with wonder and awe.",
        lineType: "simple",
        line: "And so the circle of life continues, just as it has for millions of years. Truly, the natural world never ceases to amaze us."
      }
    ]
  },
  
  {
    stage: 7,
    title: "Classic Radio Voices",
    prompts: [
      {
        instruction: "You're a 1940s radio announcer with that old-timey voice.",
        lineType: "simple",
        line: "Good evening, ladies and gentlemen, and welcome to tonight's broadcast. We have a wonderful show lined up for you this evening."
      },
      {
        instruction: "Now you're a smooth jazz radio DJ late at night.",
        lineType: "timeOfDayCity",
        line: {
          morning: "Good morning {city}! You're listening to your wake-up show on ninety-five-point-seven. Let's start this day right!",
          afternoon: "You're listening to the afternoon drive in {city} on ninety-five-point-seven. Sit back, relax, enjoy the ride.",
          evening: "You're listening to evening grooves in {city} on ninety-five-point-seven. Sit back, relax, and let the music take you away.",
          lateNight: "You're listening to midnight grooves in {city} on ninety-five-point-seven. For all you night owls out there."
        }
      },
      {
        instruction: "Sports radio announcer calling the big play!",
        lineType: "simple",
        line: "He winds up, the pitch! It's a long drive to center field! Going, going, gone! Home run! The crowd goes absolutely wild!"
      }
    ]
  },
  
  {
    stage: 8,
    title: "Character Emotions",
    prompts: [
      {
        instruction: "Say this line like you just won the lottery.",
        lineType: "simple",
        line: "I can't believe it! This is incredible! This is the best day of my entire life!"
      },
      {
        instruction: "Now like you're a detective who just solved the case.",
        lineType: "simple",
        line: "So that's how it happened. I should have seen it from the beginning. It was right in front of me the whole time."
      },
      {
        instruction: "Like a proud parent at graduation.",
        lineType: "simple",
        line: "I'm so proud of you. All that hard work paid off. This is your moment. You did it."
      },
      {
        instruction: "Like you're giving a pep talk before the big game.",
        lineType: "simple",
        line: "Listen up, team. We've trained for this. We're ready. Now get out there and show them what you're made of!"
      },
      {
        instruction: "Now practice speaking to someone you love.",
        lineType: "relationship",
        line: {
          daughter: "I'm so proud of the woman you've become. Keep being you.",
          son: "You've got this. I believe in you. Always have, always will.",
          spouse: "I love you. Even when you drive me crazy. Especially then, actually.",
          grandchild: "You are so loved. Don't ever forget that. Your grandma is always here for you.",
          friend: "Remember that time we laughed so hard we couldn't breathe? I'm still laughing about it.",
          parent: "Thank you. For everything. I don't say it enough, but I mean it.",
          default: "I'm grateful for you. You mean more to me than you know."
        }
      }
    ]
  },
  
  {
    stage: 9,
    title: "Wisdom & Advice",
    prompts: [
      {
        instruction: "Give advice to your younger self. Be real.",
        lineType: "simple",
        line: "Stop worrying so much about what other people think. Life's too short for that. Do what makes you happy. Trust your gut. You'll be fine."
      },
      {
        instruction: "Encourage someone having a rough day.",
        lineType: "simple",
        line: "Today was tough, I know. But you got through it. That counts for something. Tomorrow's a fresh start. You're tougher than you realize."
      },
      {
        instruction: "Share what you've learned about life.",
        lineType: "simple",
        line: "Here's what I've figured out. Things rarely go according to plan, and that's okay. The best moments are usually the ones you didn't see coming. Stay flexible. Stay curious."
      }
    ]
  },
  
  {
    stage: 10,
    title: "Dad Jokes & Humor",
    prompts: [
      {
        instruction: "Tell a classic dad joke with confidence.",
        lineType: "generation",
        line: {
          "1950s": "Why did the scarecrow win an award? Because he was outstanding in his field! Thank you, thank you.",
          "1960s": "Why don't oysters donate to charity? Because they're shellfish!",
          "1970s": "What do you call a bear with no teeth? A gummy bear!",
          "1980s": "I used to hate facial hair, but then it grew on me.",
          "1990s": "Why did the PowerPoint presentation cross the road? To get to the other slide!",
          "2000s": "Why don't scientists trust atoms? Because they make up everything! Classic dad joke energy.",
          "default": "Why don't scientists trust atoms? Because they make up everything! Thank you, I'll be here all week."
        }
      },
      {
        instruction: "Knock knock joke time!",
        lineType: "simple",
        line: "Knock knock. Who's there? Interrupting cow. Interrupting cow wh— MOOOOO!"
      },
      {
        instruction: "One more groaner.",
        lineType: "simple",
        line: "I used to hate facial hair, but then it grew on me."
      },
      {
        instruction: "React to your own terrible joke.",
        lineType: "simple",
        line: "Okay, that was bad. I admit it. But you smiled. I saw that little smirk. You can't hide it."
      }
    ]
  },
  
  {
    stage: 11,
    title: "Memory & Heart",
    prompts: [
      {
        instruction: "Talk about a moment you'll never forget.",
        lineType: "generation",
        line: {
          "1950s": "I remember summer days in the fifties when the neighborhood kids would all play outside until the streetlights came on. Simpler times, but good times.",
          "1960s": "I remember the sixties, when everything felt like it was changing. The music, the culture, the way people thought about the world. Electric.",
          "1970s": "I remember the seventies, riding bikes around the neighborhood with no helmets, coming home when it got dark. Nobody worried the way they do now.",
          "1980s": "I remember the eighties, when we had to rewind VHS tapes and waited all week for our favorite TV show. No binge-watching back then.",
          "1990s": "I remember the nineties, when we'd meet up with friends without texting first. We just... showed up. And somehow it worked.",
          "2000s": "I remember being a kid in the 2000s, growing up with YouTube and social media. Different from how my parents grew up, but it's the only childhood I know.",
          "default": "I remember this one summer day when I was a kid. The sun was setting, and everything just felt perfect. I didn't know it then, but those are the moments you carry with you forever."
        }
      },
      {
        instruction: "Describe someone important to you.",
        lineType: "simple",
        line: "There's someone in my life who always knows what to say. They make me laugh when I need it most. They've seen me at my worst and stuck around anyway. That's friendship."
      },
      {
        instruction: "Talk about a place that feels like home.",
        lineType: "city",
        line: "There's this spot in {city} I go to when I need to think. Quiet. Peaceful. Just me and my thoughts. Everyone needs a place like that. Somewhere you can just breathe."
      }
    ]
  },
  
  {
    stage: 12,
    title: "Practical Stuff",
    prompts: [
      {
        instruction: "Count from one to ten like you're teaching a kid.",
        lineType: "simple",
        line: "One, two, three, four, five, six, seven, eight, nine, ten. Good job!"
      },
      {
        instruction: "Now count backward.",
        lineType: "simple",
        line: "Ten, nine, eight, seven, six, five, four, three, two, one. Blast off!"
      },
      {
        instruction: "Say a date and time clearly.",
        lineType: "simple",
        line: "Today is March fifteenth, two thousand twenty-five, at three-thirty in the afternoon."
      },
      {
        instruction: "Say a phone number and address.",
        lineType: "simple",
        line: "You can reach me at five-five-five, two-one-two, three-four-five-six. I live at four-twenty-seven Oak Street, apartment two-B."
      },
      {
        instruction: "Prices and numbers, like you're shopping.",
        lineType: "simple",
        line: "That'll be thirty-nine ninety-five, plus tax. Your total comes to forty-three dollars and twenty cents. Cash or card?"
      }
    ]
  },
  
  {
    stage: 13,
    title: "Actually Interesting Questions",
    prompts: [
      {
        instruction: "Someone asks: What's your most unpopular opinion? Go.",
        lineType: "simple",
        line: "Hot dogs are sandwiches. I don't care what anyone says. It's meat between bread. That's a sandwich. Fight me."
      },
      {
        instruction: "What would you do if you won the lottery tomorrow?",
        lineType: "simple",
        line: "First thing? Quit my job. Second thing? Buy a ridiculous house with a secret bookcase door. Third thing? Travel everywhere and eat all the food. Live the dream."
      },
      {
        instruction: "What's the weirdest thing you've ever eaten?",
        lineType: "simple",
        line: "Once I tried fried crickets at a food festival. Crunchy. Salty. Not terrible, actually. Would I order them again? Probably not. But I can say I did it."
      },
      {
        instruction: "If you could have dinner with anyone, living or dead, who would it be?",
        lineType: "simple",
        line: "I'd want to have dinner with my grandparents one more time. Ask them all the questions I never got to ask. Hear their stories. That would mean everything."
      },
      {
        instruction: "What's something you believed as a kid that turned out to be completely wrong?",
        lineType: "simple",
        line: "I genuinely believed that if you swallowed a watermelon seed, a watermelon would grow in your stomach. I was terrified of watermelon for years. Completely ridiculous."
      },
      {
        instruction: "If you could master any skill instantly, what would it be?",
        lineType: "simple",
        line: "I'd want to play piano like a concert pianist. Just sit down and blow people's minds. That would be incredible. Or maybe speak every language. That would be pretty useful too."
      }
    ]
  },
  
  {
    stage: 14,
    title: "The Big Finish",
    prompts: [
      {
        instruction: "Give yourself credit for doing this.",
        lineType: "simple",
        line: "You know what? Good for me. I actually did this. Recorded my whole voice. That's pretty cool."
      },
      {
        instruction: "Say goodbye like you mean it.",
        lineType: "relationshipGoodbye",
        line: {
          daughter: "Alright, that's a wrap. I'm so proud of you. Always. I hope this brings you joy. I love you.",
          son: "Alright, that's a wrap. You're my son, and I couldn't be prouder. I hope this makes you smile. I love you.",
          spouse: "Alright, that's a wrap. You're my person. Always have been. I hope this reminds you how much you mean to me. I love you.",
          grandchild: "Alright, that's a wrap. I hope this makes you smile, kiddo. Grandma loves you so much.",
          friend: "Alright, that's a wrap. Thanks for being you. You're one of the good ones. Love you, friend.",
          parent: "Alright, that's a wrap. Thank you for everything you've given me. I hope this makes you smile. I love you.",
          default: "Alright, that's a wrap. Thanks for sticking with me through all that. I hope this brings you joy whenever you hear it. Take care. I love you."
        }
      },
      {
        instruction: "One last thing - send them off with a smile.",
        lineType: "simple",
        line: "And remember, life's too short to take everything so seriously. Laugh a little. Be silly. You've earned it. Bye for now!"
      }
    ]
  }
  
];
