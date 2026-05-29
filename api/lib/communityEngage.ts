export const COMMUNITY_SYSTEM_INTERESTS = [
  "Spiritual",
  "Healthy living",
  "Recovery",
  "Awakening",
  "Quantum mysticism",
] as const;

export type CommunitySystemInterest = (typeof COMMUNITY_SYSTEM_INTERESTS)[number];

export const REACTIVE_REPLY_TEMPLATES: Record<CommunitySystemInterest, string[]> = {
  Spiritual: [
    "Thank you for sharing that — it resonates. What practice has helped you stay grounded lately?",
    "Beautifully said. I have found quiet morning reflection makes a real difference. Would love to hear what works for you.",
    "Grateful for this thread. Sending encouragement as you keep showing up for yourself.",
  ],
  "Healthy living": [
    "Love this perspective. Small daily habits have been my anchor too — sleep and walks especially.",
    "Thanks for opening this up. Curious what one change has felt most sustainable for you?",
    "Appreciate the honesty here. Cheering you on as you build routines that fit your life.",
  ],
  Recovery: [
    "Thank you for your courage in sharing. One day at a time is a real thing in this space.",
    "Hearing you. Connection and accountability have helped me — glad this board exists for that.",
    "Sending support. You are not alone in this journey.",
  ],
  Awakening: [
    "This lands deeply. I am learning to notice patterns without judging myself — still a work in progress.",
    "Thank you for putting words to that. What helped you first recognize the shift?",
    "Grateful for thoughtful conversation here. Wishing you clarity and patience with the process.",
  ],
  "Quantum mysticism": [
    "Fascinating thread — I like holding wonder and humility together. What book or teacher sparked this for you?",
    "Thanks for sharing. I have been sitting with similar ideas in meditation without needing all the answers.",
    "Appreciate the open-minded tone here. Happy to explore these questions respectfully alongside you.",
  ],
};

export function pickInterestForPost(interests: string[]): CommunitySystemInterest {
  const normalized = interests.map((i) => i.toLowerCase());
  for (const tag of COMMUNITY_SYSTEM_INTERESTS) {
    if (normalized.includes(tag.toLowerCase())) return tag;
  }
  return "Spiritual";
}

export function pickReactiveReply(interest: CommunitySystemInterest, seed: number): string {
  const pool = REACTIVE_REPLY_TEMPLATES[interest];
  return pool[Math.abs(seed) % pool.length] ?? pool[0];
}

/** Welcome reply when a real member's post is approved. */
export const WELCOME_POST_TEMPLATES: Record<CommunitySystemInterest, string[]> = {
  Spiritual: [
    "Thank you for opening this thread — glad you are here. What would feel most supportive for you in this season?",
    "Welcome. This is a gentle space to share without pressure. Looking forward to hearing more when you are ready.",
  ],
  "Healthy living": [
    "Thanks for posting — small steps count. What is one habit you are hoping to build or protect right now?",
    "Glad you brought this here. Cheering you on as you figure out what sustainable wellness looks like for you.",
  ],
  Recovery: [
    "Thank you for sharing. You are welcome here — one day at a time is enough. What kind of support would help most?",
    "Appreciate your courage in posting. This community is rooting for you.",
  ],
  Awakening: [
    "Thank you for starting this conversation. Growth can feel messy — you are not alone in that.",
    "Welcome. Curious what prompted you to post today, whenever you want to share more.",
  ],
  "Quantum mysticism": [
    "Thanks for opening this thread — love thoughtful wonder here. What question are you sitting with lately?",
    "Welcome. Happy to explore ideas respectfully alongside you.",
  ],
};

export function pickWelcomeReply(interest: CommunitySystemInterest, seed: number): string {
  const pool = WELCOME_POST_TEMPLATES[interest];
  return pool[Math.abs(seed) % pool.length] ?? pool[0];
}
