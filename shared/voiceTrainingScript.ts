// Voice training script with A/B testing capability
// Change ACTIVE_SCRIPT to switch between versions

export interface VoicePrompt {
  id?: number;
  instruction: string;
  lineType: 'simple' | 'timeOfDay' | 'timeOfDayName' | 'timeOfDayCity' | 'city' | 'generation' | 'relationship' | 'relationshipGoodbye';
  line: string | Record<string, string>;
}

export interface VoiceStage {
  stage: number;
  title: string;
  prompts: VoicePrompt[];
}

// ============================================
// VERSION A: ABSURD & ENGAGING (Current)
// ============================================
const ABSURD_SCRIPT: VoiceStage[] = [
  
  // ACT 1: ABSURD INTRODUCTIONS (5 prompts)
  {
    stage: 1,
    title: "Welcome to the Weirdness",
    prompts: [
      {
        id: 1,
        instruction: "Introduce yourself like you're hosting the strangest talk show ever.",
        lineType: "timeOfDayName",
        line: {
          morning: "Good morning! I'm {userName}, broadcasting live from {city}, and welcome to the most bizarre morning show you've ever heard. We've got absolutely nothing planned, no guests, no agenda, just vibes and chaos. Let's see where this goes!",
          afternoon: "Hey there! I'm {userName} coming to you from {city}, and you've tuned into the weirdest afternoon radio show that doesn't actually exist. No script, no plan, just me talking into a microphone like I know what I'm doing. Spoiler alert: I don't!",
          evening: "Good evening! I'm {userName}, your host from {city}, and welcome to the evening show where literally anything could happen. Will it be interesting? Will it make sense? Absolutely not! But we're doing it anyway!",
          lateNight: "It's late, I'm {userName} from {city}, and apparently I'm recording this at an ungodly hour like some kind of nocturnal creature. Am I a vampire? A werewolf? No, just someone who makes questionable life choices. Let's go!"
        }
      },
      {
        id: 2,
        instruction: "Explain your totally fictional superhero origin story.",
        lineType: "city",
        line: "So here's how I got my superpowers. I was walking through {city} one day, minding my own business, when I got bitten by a radioactive accountant. Now I have the incredible ability to file taxes with perfect accuracy and organize spreadsheets at superhuman speed. Not the hero anyone wanted, but apparently the hero we deserve!"
      },
      {
        id: 3,
        instruction: "Describe your imaginary side hustle that makes no sense.",
        lineType: "simple",
        line: "My side business? Oh, I run an underground operation where I teach pigeons to deliver tiny packages across the city. It's like Amazon Prime, but with more cooing and significantly less reliability. The pigeons unionized last month, so now I have to provide them with little health insurance plans. It's chaos, but someone's gotta do it!"
      },
      {
        id: 4,
        instruction: "Share your conspiracy theory about everyday objects.",
        lineType: "simple",
        line: "Can we talk about how socks disappear in the dryer? Because I'm convinced there's a portal in there. A sock dimension where all the missing socks live together in peace. They're probably having parties right now, laughing at us walking around with mismatched feet. The evidence is overwhelming!"
      },
      {
        id: 5,
        instruction: "Reveal your secret talent that's completely useless.",
        lineType: "simple",
        line: "Want to know my hidden talent? I can perfectly predict when the microwave has exactly three seconds left before it beeps. Not two seconds, not four seconds, exactly three. Is this a useful skill? Absolutely not. Does it make me feel like I have psychic powers? One hundred percent yes!"
      }
    ]
  },
  
  // ACT 2: ABSURD ADVENTURES (10 prompts)
  {
    stage: 2,
    title: "Tales from the Weird Side",
    prompts: [
      {
        id: 6,
        instruction: "Tell the Gerald the Penguin saga - make it dramatic and ridiculous.",
        lineType: "generation",
        line: {
          "1950s": "Once upon a time, back when TV was black and white and milk was delivered to your door, there lived a penguin named Gerald. Gerald had a problem: he was terrified of ice. Absolutely petrified. So naturally, he dreamed of moving to the Arizona desert to open a taco truck. His family thought he was insane, but Gerald didn't care!",
          "1960s": "Once upon a time, during the summer of love when everyone was finding themselves, there lived a penguin named Gerald who was having an identity crisis. He was terrified of ice, which is unfortunate when you're a penguin. His dream? Move to the desert and open a taco truck serving fish tacos. Ironic? Absolutely. Did he care? Not one bit!",
          "1970s": "Once upon a time, in the disco era when everything was groovy, there lived a penguin named Gerald who had a serious ice phobia. While all the other penguins were sliding around on their bellies, Gerald was having panic attacks. His solution? Open a taco truck in the desert. Was this reasonable? No. Was he going to do it anyway? You bet your bell bottoms he was!",
          "1980s": "Once upon a time, when MTV actually played music videos, there lived a penguin named Gerald with a totally radical problem. He was scared of ice! Super embarrassing for a penguin, right? So Gerald decided to chase the American dream: move to the desert and open a taco truck. His friends said he was crazy. Gerald said they were just jealous of his entrepreneurial spirit!",
          "1990s": "Once upon a time, when we all had dial-up internet and way too much hair gel, there lived a penguin named Gerald who had major ice anxiety. Like, couldn't even look at an ice cube without hyperventilating. His master plan? Ditch Antarctica, move to Arizona, open a taco truck. His friends emailed him like 'dude, that's insane' but Gerald was already packing his bags!",
          "2000s": "Once upon a time, before TikTok ruined everything, there lived a penguin named Gerald who was absolutely terrified of ice. The other penguins made fun of him on social media, which was super toxic. So Gerald said 'you know what? I'm out.' He was gonna move to the desert and open a taco truck because spite is a powerful motivator!",
          "default": "Once upon a time, not too long ago, there lived a penguin named Gerald who had an unusual problem. He was terrified of ice. Deeply, irrationally afraid of it. Which is problematic when you're a penguin. So Gerald came up with a plan: move to the desert and open a taco truck. A penguin. Selling tacos. In the desert. What could go wrong?"
        }
      },
      {
        id: 7,
        instruction: "Continue Gerald's story - the plot twist!",
        lineType: "simple",
        line: "But then one day, a mysterious wizard appeared at Gerald's igloo. The wizard had shocking news: Gerald wasn't actually a penguin at all! He was an enchanted accountant from New Jersey who'd been transformed into a penguin as punishment for filing his taxes late. The wizard could lift the curse, but only if Gerald could defeat the bureaucracy of getting a business license for his taco truck!"
      },
      {
        id: 8,
        instruction: "The epic battle scene - go all out!",
        lineType: "simple",
        line: "Suddenly, an army of angry pelicans descended from the sky! They were furious because Gerald owed them money from a timeshare deal gone wrong. Gerald grabbed the only weapon he had: his calculator! He fought them off with the power of mathematics, hurling tax returns and quarterly earnings reports at them like ninja stars. The pelicans never stood a chance against his pivot tables!"
      },
      {
        id: 9,
        instruction: "Gerald's triumphant ending!",
        lineType: "simple",
        line: "In the end, Gerald defeated the pelicans with a perfectly balanced spreadsheet, broke the wizard's curse, moved to Arizona, and his taco truck became the most successful business in the entire Southwest. He specialized in fish tacos, obviously. The moral of the story? Follow your dreams, even if everyone thinks you're completely insane. Especially then, actually!"
      },
      {
        id: 10,
        instruction: "Pitch your fake invention on a shopping channel - be hilariously enthusiastic!",
        lineType: "simple",
        line: "But wait, there's more! Are you tired of your furniture just sitting there being boring? Introducing the Motivational Coffee Table! It shouts positive affirmations at you every morning! Things like 'You can do this!' and 'Your outfit looks great!' Order now and we'll throw in a judgmental lamp that tells you when you're watching too much TV absolutely free!"
      },
      {
        id: 11,
        instruction: "Narrate a nature documentary about the most mundane thing possible.",
        lineType: "city",
        line: "And here we are in the wilds of {city}, observing the majestic office worker in their natural habitat: the coffee shop. Watch as they approach the counter, carefully selecting their beverage. The ritual is ancient and sacred. One wrong move and they'll be grumpy for the entire day. Nature truly is magnificent and terrifying in equal measure!"
      },
      {
        id: 12,
        instruction: "Give terrible life advice with complete confidence.",
        lineType: "generation",
        line: {
          "1950s": "Here's what I've learned: When life gives you lemons, throw them back and demand better fruit. We're not in the fifties anymore where you just accept what you're given. Negotiate with life! Ask to speak to life's manager! It probably won't work, but at least you tried, right?",
          "1960s": "My advice? Question everything, trust no one, and if someone tells you to find yourself, tell them you weren't lost in the first place. The sixties taught us to challenge authority, so I'm challenging the authority of good advice by giving you this terrible advice. You're welcome!",
          "1970s": "Life wisdom from the disco era: If you can't solve your problems, just dance until you forget what they were. Did this work in the seventies? Absolutely not. Will it work now? Probably not. Should you do it anyway? Why not? What's the worst that could happen?",
          "1980s": "Advice from the eighties: Every problem can be solved with enough hairspray and confidence. Neither of these things will actually help, but you'll look fantastic while failing. And isn't that what really matters? Spoiler alert: it's not, but we're committed to this bit now!",
          "1990s": "My nineties wisdom: If you're having a problem, ask yourself: What would a boy band do? The answer is probably harmonize and dance, which won't solve anything, but at least you'll be entertained. This is genuinely terrible advice, please don't listen to me!",
          "2000s": "Modern advice: If something's going wrong, have you tried turning yourself off and back on again? Like taking a nap? No? Well maybe you should! This is basically the tech support solution applied to life. Does it work? Sometimes! Is it real advice? Questionable!",
          "default": "Here's my advice: When you don't know what to do, just do something weird and commit to it fully. Will it help? Unclear. Will it be memorable? Absolutely! Life's too short to make sensible decisions all the time. Sometimes you gotta just wing it and hope for the best!"
        }
      },
      {
        id: 13,
        instruction: "Reveal a ridiculous fear you have.",
        lineType: "simple",
        line: "Can I confess something? I'm terrified that one day I'll be in a serious conversation and suddenly forget how to human. Like I'll just blank on basic things. How do handshakes work again? What's the appropriate volume for indoor voices? Why do we say 'bless you' when people sneeze? It could happen at any moment and I live in constant fear of this!"
      },
      {
        id: 14,
        instruction: "Share the worst date idea you can imagine, but describe it like it's romantic.",
        lineType: "city",
        line: "Picture this: A romantic evening in {city} where we go to the DMV together and wait in line for three hours. Then we'll visit a laundromat and watch our clothes tumble in matching machines. For dinner, we'll eat convenience store sandwiches under fluorescent lighting. Some people say I'm not good at planning dates, but I think they just don't appreciate minimalist romance!"
      },
      {
        id: 15,
        instruction: "Rant passionately about something completely trivial.",
        lineType: "simple",
        line: "Why are there so many types of milk now? Cow milk, almond milk, oat milk, coconut milk, cashew milk! Where does it end? Are we going to have like, grass milk? Rock milk? Air milk? And don't even get me started on milk alternatives that come in cartons. That's just juice pretending to be milk! I have very strong opinions about this and I'm willing to die on this hill!"
      }
    ]
  },
  
  // ACT 3: HEARTFELT (BUT STILL WEIRD) (10 prompts)
  {
    stage: 3,
    title: "Getting Real (But Make It Weird)",
    prompts: [
      {
        id: 16,
        instruction: "Share genuine advice but frame it weirdly.",
        lineType: "simple",
        line: "Okay, real talk for a second. Life is weird and unpredictable and sometimes it feels like you're just making it all up as you go along. But here's the secret: everyone else is doing that too! We're all just winging it and pretending we know what we're doing. So cut yourself some slack, okay? You're doing better than you think!"
      },
      {
        id: 17,
        instruction: "Tell a childhood memory but make it slightly absurd.",
        lineType: "generation",
        line: {
          "1950s": "I remember being a kid in the fifties. We'd play outside until the streetlights came on, and if you weren't home by then, your mom would just assume you'd been adopted by a pack of neighborhood dogs. Different times! But honestly, those summer days felt endless, and I wouldn't trade those memories for anything. Even the dog adoption scares!",
          "1960s": "Growing up in the sixties, everything felt electric. The music, the culture, the way people thought the world was gonna change overnight. Did it? Kinda? Not really? But the optimism was real! We thought we could do anything. Turns out we were half right, which isn't bad for a bunch of kids who thought tie-dye was peak fashion!",
          "1970s": "The seventies were wild. We rode bikes with no helmets, drank from garden hoses, and somehow survived. Our parents would just kick us out of the house in the morning and be like 'be back by dinner or don't, we're not keeping track.' And we turned out fine! Mostly! Some of us! Anyway, good times!",
          "1980s": "Being a kid in the eighties meant everything was neon and nothing made sense. We had to rewind VHS tapes, we thought Walkmen were the peak of technology, and we genuinely believed quick sand was going to be a much bigger problem in adult life. Spoiler: it wasn't! But hey, at least we had good cartoons!",
          "1990s": "The nineties were this weird time where we had the internet but it was so slow you could make a sandwich while a webpage loaded. We still went outside and hung out without texting first, we just... showed up at people's houses! Wild, right? Simpler times, weird fashion choices, but man, those were good days!",
          "2000s": "Growing up in the two thousands meant YouTube was just getting started, everyone had a MySpace with an embarrassing song auto-playing, and we thought flip phones were the coolest thing ever. Looking back, it was chaos! But it was our chaos, you know? Every generation gets their weird thing, and ours was pretty fun!",
          "default": "When I was a kid, we didn't have all the fancy technology you do now. We had imagination and stick fighting, and we were grateful! Okay, that sounds like old person talk, but seriously, those simple summer days playing outside with friends? Those memories stick with you. The good stuff always does!"
        }
      },
      {
        id: 18,
        instruction: "Share something you're genuinely grateful for, but keep it light.",
        lineType: "simple",
        line: "You know what I'm really grateful for? The people in my life who laugh at my terrible jokes. And I mean genuinely terrible jokes. Dad joke level terrible. They don't have to laugh, they choose to, and that's real friendship right there. If someone sticks around through your worst puns, they're a keeper!"
      },
      {
        id: 19,
        instruction: "Give actual good advice disguised as a joke.",
        lineType: "generation",
        line: {
          "1950s": "Real talk though: Stop trying to be perfect. Perfect is boring and exhausting. The world already had one perfect generation and spoiler alert, it wasn't any of them! Be yourself, mess up sometimes, learn as you go. That's way more interesting anyway!",
          "1960s": "Here's the thing they don't tell you: You don't have to have your whole life figured out. The people who acted like they did in the sixties? They were lying! Just take it one day at a time, trust yourself, and remember that everyone else is just as confused as you are!",
          "1970s": "Life lesson from the disco era: Dance like nobody's watching, but also, maybe someone IS watching so at least try not to hurt yourself. But seriously, don't take everything so seriously. Life's too short and too weird for that. Have fun with it!",
          "1980s": "Eighties wisdom: Take risks! Try new things! Will you look back and cringe at some of your choices? Absolutely! But at least you'll have stories! And isn't that better than playing it safe all the time? Your future self will thank you. Or laugh at you. Maybe both!",
          "1990s": "Nineties advice still holds up: Stop worrying so much about what other people think. Half of them aren't thinking about you at all, they're worried about what YOU think of THEM! It's a whole cycle of unnecessary anxiety! Just do your thing and be cool about it!",
          "2000s": "Modern wisdom: Put the phone down sometimes. I know, I know, you need it for everything. But real life is happening right in front of you and you're gonna miss it if you're always looking at a screen. FOMO is real, but missing actual life is worse!",
          "default": "Here's what I've learned: Stop worrying so much. Most of the things you're stressed about right now? In five years, you won't even remember them. So take a breath, trust yourself, and remember that it's all gonna work out. Or it won't, and you'll handle that too. You're tougher than you think!"
        }
      },
      {
        id: 20,
        instruction: "Express genuine love to the person you're recording for - heartfelt but not corny.",
        lineType: "relationship",
        line: {
          daughter: "Okay real talk sweetheart. I'm so proud of you it's actually ridiculous. You're smart, you're kind, you're strong, and you're not afraid to be yourself. That last part? That's the hardest thing to do and you make it look easy. Keep being exactly who you are. The world needs more people like you. I love you so much.",
          son: "Alright buddy, getting serious for a second. You've grown into this incredible person and I'm honestly in awe sometimes. You're thoughtful, you're brave, you stand up for what you believe in. That takes guts. I'm so proud of who you're becoming. Keep being you. You're doing amazing. I love you, kid.",
          spouse: "Hey love, I don't say this enough but you're my favorite person. Like, ever. You've seen me at my absolute worst and you're still here, which means you're either very patient or slightly crazy. Probably both! But seriously, I love you. You make everything better. Thank you for being you.",
          grandchild: "Okay kiddo, Grandma's gonna get sappy for a second. You are so loved. Like, more loved than you could ever possibly imagine. Whatever happens, wherever you go, whatever you do, remember that. You've got people cheering for you always. I'm one of them. Love you so much, sweetheart.",
          friend: "Alright my friend, I'm gonna be vulnerable for a second which is terrifying. Thank you. For being there, for getting my weird sense of humor, for not judging me when I make questionable life choices. You're one of the good ones and I don't take that for granted. Love you, friend.",
          parent: "Mom, Dad... I'm not great at this but I need to say it. Thank you. For everything. All the stuff I never noticed, all the sacrifices you made, all the times you believed in me even when I didn't believe in myself. I love you. I hope I make you proud because you made me who I am.",
          default: "Okay, getting real for a moment. You matter to me. More than you probably know. You've made my life better just by being in it. Whatever you're going through, whatever happens, remember you're not alone. I'm here. I care. And I love you. For real."
        }
      },
      {
        id: 21,
        instruction: "Share a hope for the future, make it genuine but optimistic.",
        lineType: "city",
        line: "Here's what I hope for: I hope we all slow down a little. Take more time to appreciate the small stuff. Like good coffee. Or a perfect sunset in {city}. Or just laughing with people we love. Life moves so fast and we forget to actually live it sometimes. So that's my wish. More living, less rushing. More present, less stress. That's the dream!"
      },
      {
        id: 22,
        instruction: "Describe what home means to you.",
        lineType: "city",
        line: "When I think about home, it's not really about {city} or any specific place. Home is the people. It's that feeling when you walk in and you can just... be yourself. No pretending, no performing, just existing comfortably. It's where people know your worst qualities and stick around anyway. That's home. And I'm really lucky to have that!"
      },
      {
        id: 23,
        instruction: "For voice quality: Count naturally and warmly.",
        lineType: "simple",
        line: "Okay, let's count together. Ready? One, two, three, four, five, six, seven, eight, nine, ten! Perfect! Now backwards! Ten, nine, eight, seven, six, five, four, three, two, one! You're amazing at this! Seriously, you crushed it!"
      },
      {
        id: 24,
        instruction: "For voice quality: Say contact info clearly.",
        lineType: "city",
        line: "Just so you have my information: You can reach me at five-five-five, two-one-two, three-four-five-six. I live at four-twenty-seven Oak Street, apartment two-B, {city}. And for the record, today is March fifteenth, two thousand twenty-five, around three-thirty in the afternoon. There, now you've got all my details!"
      },
      {
        id: 25,
        instruction: "End with a warm, genuine goodbye - make it count.",
        lineType: "relationship",
        line: {
          daughter: "Alright sweetheart, that's everything from me. Remember: You're amazing, you're loved, and you can handle whatever comes your way. I'm always here cheering for you. Always. I love you more than words can say. Take care of yourself. Bye for now, kiddo.",
          son: "Okay buddy, I think we're done. I'm proud of you. So incredibly proud. Keep being the awesome person you are. Keep trusting yourself. You've got this, and you've got me. Always. Love you so much. Take care. Talk to you soon.",
          spouse: "Alright love, that's a wrap. I love you. You know that, right? Even when life gets crazy and I forget to say it, I love you. You're my favorite person and my best friend. Take care of yourself. I'll see you soon. Love you always.",
          grandchild: "Okay kiddo, that's all from Grandma for now. Remember: You're so loved. So, so loved. Be good, have fun, and know you can always talk to me about anything. Anything at all. Love you to the moon and back, sweetheart. Bye for now!",
          friend: "Alright my friend, that's it from me. Thanks for being you. Thanks for being in my life. You make everything better. Take care of yourself, okay? I'll talk to you soon. Love you, friend. Stay awesome. Bye!",
          parent: "Okay, I think that's everything. I love you. Thank you for everything you've done for me, everything you've taught me. I hope I make you proud. Take care of yourself. I'll call you soon. Love you so much. Bye for now.",
          default: "Alright, that's a wrap. Thank you for listening to all this weirdness. I hope this brings you joy whenever you hear it. Remember you're loved, you're awesome, and you're doing better than you think. Take care. Love you. Bye for now!"
        }
      }
    ]
  }
];

// ============================================
// VERSION B: EMOTIONAL & HEARTFELT
// ============================================
const EMOTIONAL_SCRIPT: VoiceStage[] = [
  
  // STAGE 1: QUICK START (5 prompts)
  {
    stage: 1,
    title: "Quick Start",
    prompts: [
      {
        id: 1,
        instruction: "Start with a warm, natural greeting. Talk like you're meeting a friend.",
        lineType: "simple",
        line: "Good morning! My name is Michael, and I'm here in Chicago. It's a beautiful morning, and I'm excited to be doing this. This is actually kind of fun! Let's see how my voice sounds."
      },
      {
        id: 2,
        instruction: "Talk about something simple that makes you happy. Keep it light and genuine.",
        lineType: "simple",
        line: "You know what always makes me smile? A really good cup of coffee in the morning. There's something about that first sip, when it's hot and fresh, that just makes everything feel right. It's the little things, you know? Those simple moments that make your day better. That's what I'm grateful for."
      },
      {
        id: 3,
        instruction: "Share a quick story about your day or week. Be casual and natural.",
        lineType: "simple",
        line: "So this week has been pretty good, actually. I got out for a walk around Chicago, which was nice. The weather's been decent, and it felt good to get some fresh air and clear my head. Nothing too exciting, just life. But sometimes those quiet, normal days are exactly what you need, you know?"
      },
      {
        id: 4,
        instruction: "Talk about a place you love. Let yourself get a little nostalgic.",
        lineType: "simple",
        line: "There's this spot in Chicago that I really love. It's nothing fancy, just a quiet place where I can sit and think. Maybe it's a park bench, maybe it's a coffee shop corner, doesn't really matter. But when I'm there, everything just feels peaceful. Everyone needs a place like that, you know? Somewhere you can just breathe and be yourself."
      },
      {
        id: 5,
        instruction: "End this first stage with encouragement. Sound warm and supportive.",
        lineType: "simple",
        line: "You know what? If you're listening to this, I just want you to know something. Whatever you're going through right now, you're doing better than you think. I mean that. Life's hard sometimes, but you're here. You're showing up. And that counts for something. So give yourself some credit, okay? You've earned it."
      }
    ]
  },
  
  // STAGE 2: BUILD EMOTION (12 prompts)
  {
    stage: 2,
    title: "Build Emotion",
    prompts: [
      {
        id: 6,
        instruction: "Share a childhood memory. Let yourself get nostalgic.",
        lineType: "simple",
        line: "I remember when I was a kid. Summer days that felt endless, playing outside, laughing until our stomachs hurt. We didn't have much, but we had each other, and honestly? That was enough. Those simple moments, those are the memories I hold onto. Those are the ones that matter."
      },
      {
        id: 7,
        instruction: "Talk about someone who's always been there for you. Get a little emotional.",
        lineType: "simple",
        line: "There's this person in my life who's always been there for me. Through the good times and the bad times, they never wavered. Never gave up on me, even when I probably gave them plenty of reasons to. They taught me what real loyalty looks like, what friendship actually means. I don't know where I'd be without them. Honestly, I don't even want to think about it."
      },
      {
        id: 8,
        instruction: "Give advice to your younger self. Be honest and real.",
        lineType: "simple",
        line: "What would I tell my younger self? Simple. Stop worrying so much about what other people think. Life's too short for that. Do what makes you happy. Trust your gut. Follow your heart. And guess what? It's all going to work out fine. Better than you ever imagined."
      },
      {
        id: 9,
        instruction: "Share a moment when you felt really proud of yourself.",
        lineType: "simple",
        line: "I remember this one time when I finally did something I'd been scared to do for years. And when it was done, when I'd actually pulled it off, I just stood there thinking, 'I did it. I really did it.' That feeling of realizing you're stronger than you thought? Braver than you gave yourself credit for? That's something you don't forget. That stays with you."
      },
      {
        id: 10,
        instruction: "Talk about what a perfect day looks like for you. Sound content and happy.",
        lineType: "simple",
        line: "My perfect day? It's actually pretty simple. I'd wake up without an alarm, make a really good cup of coffee, and just take my time with breakfast. No rush, no stress. Then maybe take a walk around Chicago, enjoy the weather, clear my head. Later, I'd spend time with people I love. Maybe cook a nice dinner together, nothing fancy. Just good food, good company, good conversation. That's it. That's my perfect day."
      },
      {
        id: 11,
        instruction: "Share something you're genuinely grateful for. Mean it.",
        lineType: "simple",
        line: "You know what I'm really grateful for? The people in my life who've stuck around. The ones who've seen me at my worst and didn't run away. The ones who celebrate with me when things are good and sit with me when things are hard. That's real. That's what matters. And I don't say it enough, but I'm grateful for every single one of them."
      },
      {
        id: 12,
        instruction: "Share a lesson life taught you the hard way.",
        lineType: "simple",
        line: "Life taught me something the hard way: You can't control everything. And believe me, I tried. But the more you try to force things to go your way, the more they fall apart. Sometimes you just have to let go, trust the process, and see what happens. It's scary as hell, but it's also kind of freeing. Turns out, not everything needs to be controlled."
      },
      {
        id: 13,
        instruction: "Talk about a time you were scared but did it anyway.",
        lineType: "simple",
        line: "I remember being absolutely terrified before doing something I'd never done before. My hands were shaking, my heart was pounding, and I kept thinking, 'What if I fail? What if this goes horribly wrong?' But I did it anyway. And you know what? It turned out okay. Not perfect, but okay. And I learned something important that day: Being scared doesn't mean you can't do it. It just means it matters."
      },
      {
        id: 14,
        instruction: "Say something encouraging to someone having a tough day. Really mean it.",
        lineType: "simple",
        line: "Hey, if you're having a rough day, I just want you to know something. It's okay. You don't have to be strong all the time. You don't have to have it all figured out. Just getting through today is enough. Tomorrow's a fresh start, and things will get better. I promise. You're tougher than you think you are, and you're going to be okay."
      },
      {
        id: 15,
        instruction: "Share what you've learned about what really matters in life.",
        lineType: "simple",
        line: "Here's what I've figured out after all these years. What really matters isn't the big stuff. It's not the job title or the house or the car. It's the people. It's the moments. It's the late-night conversations, the shared meals, the inside jokes. That's what you remember. That's what makes life worth living. The rest is just noise."
      },
      {
        id: 16,
        instruction: "Tell someone you believe in them. Sound confident and warm.",
        lineType: "simple",
        line: "Hey, I want you to know something. I believe in you. I know you're doubting yourself right now, wondering if you can do this, but I've seen what you're capable of. You're stronger than you think. You've got this. Even when it feels impossible, even when you want to give up, keep going. You're going to make it. I know you are."
      },
      {
        id: 17,
        instruction: "Share what you've learned about love over the years.",
        lineType: "simple",
        line: "Here's what I've learned about love over the years. It's not always fireworks and grand gestures. Most of the time, it's quiet. It's showing up. It's being there when it's hard. It's choosing each other, over and over again, even on the days when it's not easy. The movies got it all wrong. Real love is in the everyday moments, the little things. That's where the magic actually is."
      }
    ]
  },
  
  // STAGE 3: FINAL TOUCH (8 prompts)
  {
    stage: 3,
    title: "Final Touch",
    prompts: [
      {
        id: 18,
        instruction: "Speak directly to the person you're recording for. Be genuine and loving.",
        lineType: "simple",
        line: "I just want you to know that you matter to me. More than you probably realize. You've made my life better just by being in it, and I'm grateful for you. Whatever you're going through, whatever happens, remember that you're not alone. I'm here. I care. And I love you."
      },
      {
        id: 19,
        instruction: "Share a hope you have for the future. Sound optimistic.",
        lineType: "simple",
        line: "You know what I hope for? I hope we all slow down a little. Take more time to appreciate the small stuff. Spend more time with the people we love. Worry less about things that don't really matter in the end. Life's short, and we forget that sometimes. I hope we all remember to just... live. Really, truly live."
      },
      {
        id: 20,
        instruction: "Talk about what home means to you.",
        lineType: "simple",
        line: "When I think about home, it's not really about a place. I mean, sure, I love Chicago, but home is more than that. Home is where the people are. It's that feeling when you walk in and everything just feels right. It's where you can be yourself, completely, without any masks or pretending. That's home. And I'm really lucky to have that."
      },
      {
        id: 21,
        instruction: "Share a piece of simple wisdom. Keep it real.",
        lineType: "simple",
        line: "Here's something I wish someone had told me when I was younger. Be kind. To others, yes, but also to yourself. We're all doing the best we can with what we have. Nobody's perfect. We all mess up. And that's okay. So be patient with yourself. Give yourself the same grace you'd give to someone you love. You deserve that too."
      },
      {
        id: 22,
        instruction: "For voice quality: Count clearly and warmly, like teaching someone.",
        lineType: "simple",
        line: "Okay, let's count together. Ready? One, two, three, four, five, six, seven, eight, nine, ten. Good! Now let's go backwards. Ten, nine, eight, seven, six, five, four, three, two, one. Perfect! See? You're really good at this."
      },
      {
        id: 23,
        instruction: "For voice quality: Say numbers, dates, and contact info clearly.",
        lineType: "simple",
        line: "Just so you have my information: You can reach me at five-five-five, two-one-two, three-four-five-six. My address is four-twenty-seven Oak Street, apartment two-B, Chicago. And today's date is March fifteenth, two thousand twenty-five, around three-thirty in the afternoon."
      },
      {
        id: 24,
        instruction: "Add a light moment of humor. Keep it natural.",
        lineType: "simple",
        line: "You know what always makes me laugh? When you're walking and you trip over literally nothing. Just your own feet. And then you do that quick look around to see if anyone saw. We all do it. Every single one of us. It's ridiculous, but it's human. Sometimes you just gotta laugh at yourself, you know?"
      },
      {
        id: 25,
        instruction: "End with a heartfelt, personalized goodbye. Make it count.",
        lineType: "simple",
        line: "Alright, that's a wrap. Thank you for listening to all of this. I hope this brings you joy whenever you hear it. Remember you're loved, you're valued, and you're doing better than you think. Take care of yourself. Love you. Bye for now!"
      }
    ]
  }
];

// ============================================
// ACTIVE SCRIPT SELECTOR
// ============================================
// Change this line to switch between versions for A/B testing:
// - 'absurd' = Absurd & Engaging (with personalization)
// - 'emotional' = Emotional & Heartfelt (simpler, more direct)

export const ACTIVE_SCRIPT: 'absurd' | 'emotional' = 'emotional';  // ← CHANGE THIS LINE TO TEST

const SCRIPT_VERSIONS = {
  absurd: ABSURD_SCRIPT,
  emotional: EMOTIONAL_SCRIPT
};

// Export the active script
export const voiceTrainingScript = SCRIPT_VERSIONS[ACTIVE_SCRIPT];
