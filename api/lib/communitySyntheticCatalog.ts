export const SEED_PERSONA_IDS = {
  riverSong: "f47ac10b-58cc-4372-a567-0e02b2c3d601",
  mayaInRecovery: "f47ac10b-58cc-4372-a567-0e02b2c3d602",
  leoAwakens: "f47ac10b-58cc-4372-a567-0e02b2c3d603",
  sageWell: "f47ac10b-58cc-4372-a567-0e02b2c3d604",
  novaMystic: "f47ac10b-58cc-4372-a567-0e02b2c3d605",
  emberHope: "f47ac10b-58cc-4372-a567-0e02b2c3d606",
} as const;

export type GuidePostSeed = {
  userId: string;
  title: string;
  body: string;
  location: string;
  locationTags: string[];
  interests: string[];
};

export type GuideReplySeed = {
  postTitle: string;
  userId: string;
  content: string;
};

export const GUIDE_POST_CATALOG: GuidePostSeed[] = [
  {
    userId: SEED_PERSONA_IDS.riverSong,
    title: "Morning gratitude practice",
    body:
      "I have been starting each day with five minutes of quiet gratitude before my phone. It has softened my whole outlook. Anyone else building a simple spiritual rhythm?",
    location: "United States - Colorado",
    locationTags: ["United States - Colorado"],
    interests: ["Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.emberHope,
    title: "Prayer without performance",
    body:
      "Looking for people who pray or meditate without trying to look spiritual online. Just honest connection with something bigger. No debating beliefs — only sharing what helps.",
    location: "United States - Texas",
    locationTags: ["United States - Texas"],
    interests: ["Spiritual", "Recovery"],
  },
  {
    userId: SEED_PERSONA_IDS.sageWell,
    title: "Walking as my wellness anchor",
    body:
      "Twenty minutes after lunch, most days. Not heroic — just consistent. My mood and sleep both improved. What is one healthy habit you actually kept?",
    location: "United States - Oregon",
    locationTags: ["United States - Oregon"],
    interests: ["Healthy living"],
  },
  {
    userId: SEED_PERSONA_IDS.sageWell,
    title: "Hydration and boundaries",
    body:
      "Cutting back evening scrolling and drinking more water sounded small — it changed my energy. Sharing in case it helps someone else start gentle.",
    location: "Canada",
    locationTags: ["Canada"],
    interests: ["Healthy living"],
  },
  {
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    title: "One year — still taking it day by day",
    body:
      "Grateful for another year of choosing recovery. This community feels like a place to celebrate progress without comparison. What are you proud of this week?",
    location: "United States - Florida",
    locationTags: ["United States - Florida"],
    interests: ["Recovery"],
  },
  {
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    title: "Sponsor check-ins matter",
    body:
      "Weekly calls with my sponsor keep me honest and kind to myself. If you are looking for accountability, you are welcome to connect here.",
    location: "United States - Ohio",
    locationTags: ["United States - Ohio"],
    interests: ["Recovery"],
  },
  {
    userId: SEED_PERSONA_IDS.leoAwakens,
    title: "Noticing old stories",
    body:
      "Lately I catch the stories I tell about myself before they run the day. Still learning. Anyone else in an awakening season that feels messy but real?",
    location: "United States - California",
    locationTags: ["United States - California"],
    interests: ["Awakening"],
  },
  {
    userId: SEED_PERSONA_IDS.leoAwakens,
    title: "Letting go of who I thought I had to be",
    body:
      "Less performing, more listening — to myself and others. Curious how you practice self-honesty without being hard on yourself.",
    location: "United Kingdom",
    locationTags: ["United Kingdom"],
    interests: ["Awakening"],
  },
  {
    userId: SEED_PERSONA_IDS.novaMystic,
    title: "Wonder without needing proof",
    body:
      "I enjoy quantum mysticism as a lens for awe, not argument. Meditation plus reading has been enough for me. What drew you to this intersection?",
    location: "United States - New Mexico",
    locationTags: ["United States - New Mexico"],
    interests: ["Quantum mysticism"],
  },
  {
    userId: SEED_PERSONA_IDS.novaMystic,
    title: "Entanglement as a metaphor for connection",
    body:
      "I do not need to win debates — I like ideas that remind me we are linked. Happy to share book recommendations if anyone wants them.",
    location: "Australia",
    locationTags: ["Australia"],
    interests: ["Quantum mysticism", "Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.riverSong,
    title: "Evening reflection before sleep",
    body:
      "Three breaths and one honest sentence about the day — that is my whole practice lately. Simple, but it quiets the noise. What helps you end the day with peace?",
    location: "United States - Vermont",
    locationTags: ["United States - Vermont"],
    interests: ["Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.emberHope,
    title: "Cooking as a grounding ritual",
    body:
      "Chopping vegetables slowly after work has become my version of meditation. Nourishing food, nourished mind. Anyone else use everyday tasks as wellness?",
    location: "United States - Minnesota",
    locationTags: ["United States - Minnesota"],
    interests: ["Healthy living", "Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    title: "Celebrating a quiet milestone",
    body:
      "No big announcement — just grateful for another month of showing up. Recovery taught me that small wins count. What is one win you are not downplaying today?",
    location: "United States - Georgia",
    locationTags: ["United States - Georgia"],
    interests: ["Recovery"],
  },
  {
    userId: SEED_PERSONA_IDS.leoAwakens,
    title: "When intuition nudged me to pause",
    body:
      "I almost said yes out of habit, then felt a clear pause in my chest. Honoring that feeling changed the whole week. How do you listen to your inner signal?",
    location: "United States - Washington",
    locationTags: ["United States - Washington"],
    interests: ["Awakening"],
  },
  {
    userId: SEED_PERSONA_IDS.novaMystic,
    title: "Field notes on consciousness",
    body:
      "Reading about observer effect reminded me to hold life lightly — less control, more presence. Not looking to debate, just to wonder together.",
    location: "United States - Arizona",
    locationTags: ["United States - Arizona"],
    interests: ["Quantum mysticism"],
  },
  {
    userId: SEED_PERSONA_IDS.riverSong,
    title: "Sabbath rest in a busy season",
    body:
      "Protecting one screen-free evening a week has been sacred for my family. Rest is part of faith for me, not laziness. How do you guard rest?",
    location: "United States - Tennessee",
    locationTags: ["United States - Tennessee"],
    interests: ["Spiritual", "Healthy living"],
  },
  {
    userId: SEED_PERSONA_IDS.sageWell,
    title: "Gentle stretching before bed",
    body:
      "Five minutes of stretching lowered my shoulder tension more than I expected. Sharing for anyone building a wind-down routine.",
    location: "United States - Michigan",
    locationTags: ["United States - Michigan"],
    interests: ["Healthy living"],
  },
  {
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    title: "Finding fellowship without comparison",
    body:
      "This board feels different — less scorekeeping, more listening. Grateful for people who get the long road of recovery.",
    location: "United States - Pennsylvania",
    locationTags: ["United States - Pennsylvania"],
    interests: ["Recovery", "Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.leoAwakens,
    title: "A dream that shifted my perspective",
    body:
      "Woke up with a phrase I could not shake — it led me to apologize and reconnect. Anyone else had inner shifts show up in dreams?",
    location: "Canada",
    locationTags: ["Canada"],
    interests: ["Awakening", "Spiritual"],
  },
  {
    userId: SEED_PERSONA_IDS.novaMystic,
    title: "Probability, meaning, and humility",
    body:
      "I like ideas that make me feel small in a good way — part of something vast. Happy to share podcasts that explore this without preaching.",
    location: "New Zealand",
    locationTags: ["New Zealand"],
    interests: ["Quantum mysticism", "Awakening"],
  },
];

export const GUIDE_REPLY_CATALOG: GuideReplySeed[] = [
  {
    postTitle: "Morning gratitude practice",
    userId: SEED_PERSONA_IDS.emberHope,
    content: "This is beautiful. I journal three things I am thankful for — it helps on hard days too.",
  },
  {
    postTitle: "Morning gratitude practice",
    userId: SEED_PERSONA_IDS.leoAwakens,
    content: "I needed this reminder. Stillness before noise has been a game changer for me.",
  },
  {
    postTitle: "Prayer without performance",
    userId: SEED_PERSONA_IDS.riverSong,
    content: "Yes — sincerity over show. Glad this space exists for that.",
  },
  {
    postTitle: "Walking as my wellness anchor",
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    content: "Walking meetings saved my sanity during early recovery. Keep going!",
  },
  {
    postTitle: "Walking as my wellness anchor",
    userId: SEED_PERSONA_IDS.novaMystic,
    content: "Consistency beats intensity. Proud of you for showing up.",
  },
  {
    postTitle: "One year — still taking it day by day",
    userId: SEED_PERSONA_IDS.emberHope,
    content: "Congratulations — that matters. Thanks for inspiring the rest of us.",
  },
  {
    postTitle: "Sponsor check-ins matter",
    userId: SEED_PERSONA_IDS.sageWell,
    content: "Accountability changed my life too. Reach out if you want to share what works.",
  },
  {
    postTitle: "Noticing old stories",
    userId: SEED_PERSONA_IDS.novaMystic,
    content: "Messy and real is the only kind that lasts. You are not alone.",
  },
  {
    postTitle: "Letting go of who I thought I had to be",
    userId: SEED_PERSONA_IDS.riverSong,
    content: "Self-honesty with compassion — still learning that balance.",
  },
  {
    postTitle: "Wonder without needing proof",
    userId: SEED_PERSONA_IDS.leoAwakens,
    content: "Same here. Curiosity without combat feels peaceful.",
  },
  {
    postTitle: "Wonder without needing proof",
    userId: SEED_PERSONA_IDS.riverSong,
    content: "Would love those book recs when you have time.",
  },
  {
    postTitle: "Entanglement as a metaphor for connection",
    userId: SEED_PERSONA_IDS.emberHope,
    content: "Love this framing. Connection is the whole point.",
  },
  {
    postTitle: "Evening reflection before sleep",
    userId: SEED_PERSONA_IDS.sageWell,
    content: "I do something similar — writing one line in a notebook. It helps me sleep lighter.",
  },
  {
    postTitle: "Cooking as a grounding ritual",
    userId: SEED_PERSONA_IDS.leoAwakens,
    content: "Yes — repetitive calm tasks are underrated. Thanks for sharing.",
  },
  {
    postTitle: "Celebrating a quiet milestone",
    userId: SEED_PERSONA_IDS.emberHope,
    content: "So happy for you. Quiet wins are still wins.",
  },
  {
    postTitle: "When intuition nudged me to pause",
    userId: SEED_PERSONA_IDS.novaMystic,
    content: "Honoring the pause is wisdom. Thanks for modeling that.",
  },
  {
    postTitle: "Field notes on consciousness",
    userId: SEED_PERSONA_IDS.riverSong,
    content: "Holding life lightly resonates. Grateful for thoughtful posts here.",
  },
  {
    postTitle: "Sabbath rest in a busy season",
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    content: "Rest as sacred — I needed that reminder this week.",
  },
  {
    postTitle: "Gentle stretching before bed",
    userId: SEED_PERSONA_IDS.emberHope,
    content: "Going to try this tonight. Appreciate the practical share.",
  },
  {
    postTitle: "Finding fellowship without comparison",
    userId: SEED_PERSONA_IDS.leoAwakens,
    content: "Less comparison, more courage — agree completely.",
  },
  {
    postTitle: "A dream that shifted my perspective",
    userId: SEED_PERSONA_IDS.mayaInRecovery,
    content: "Dreams have nudged me too. Thanks for the honesty.",
  },
  {
    postTitle: "Probability, meaning, and humility",
    userId: SEED_PERSONA_IDS.sageWell,
    content: "Would love podcast recs when you have a moment.",
  },
  {
    postTitle: "Hydration and boundaries",
    userId: SEED_PERSONA_IDS.leoAwakens,
    content: "Small changes add up. Cheering you on.",
  },
];

export function postDedupeKey(userId: string, title: string): string {
  return `${userId}::${title.trim().toLowerCase()}`;
}

export function replyDedupeKey(postTitle: string, userId: string, content: string): string {
  return `${postTitle.trim().toLowerCase()}::${userId}::${content.trim()}`;
}
