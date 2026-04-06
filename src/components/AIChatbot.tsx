import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Compass, X, RotateCcw, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import aiChatbotMan from '@/assets/images/AI-chatbot-man.png';
import aiChatbotWoman from '@/assets/images/AI-chatbot-woman.jpg';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { useAuth } from '@/contexts/AuthContext';

/** Message shape for API and local state */
type ChatMessage = { role: 'user' | 'assistant'; content: string };

const CHAT_STORAGE_KEY = 'goals-ai-chat-messages';
const AVATAR_STORAGE_KEY = 'goals-ai-chat-avatar';
const MAX_STORED_MESSAGES = 50;

type AvatarGender = 'man' | 'woman';

const AVATAR_IMAGES: Record<AvatarGender, string> = {
  man: aiChatbotMan,
  woman: aiChatbotWoman,
};

function loadAvatarPreference(): AvatarGender {
  try {
    const stored = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (stored === 'man' || stored === 'woman') return stored;
  } catch {
    // ignore
  }
  return 'woman';
}

/** Marketing / logged-out visitors — product discovery prompts */
const SUGGESTED_QUESTIONS = [
  "What's included in the free trial?",
  'How do I set and track goals?',
  'Tell me about AI feedback on my progress',
  'Where can I see pricing?',
  'How does family connection work?',
];

/** First name for the assistant avatar (matches selectable man/woman persona). */
const ASSISTANT_FIRST_NAME: Record<AvatarGender, string> = {
  woman: 'Maya',
  man: 'Jordan',
};

const SYSTEM_PROMPT = `You are the friendly AI assistant for "Authenticity & Purpose" — a website that helps people plan, track, and grow through goals, timelines, and personal development without social comparison.

Product context:
- Free trial: 7-day free trial, no credit card required. After that, paid plans (see Pricing page).
- Core features: set goals, write a development plan, attach goals to calendar and reminders, get AI insights on progress, and optional family/accountability connection (private, no social feed).
- Use cases: personal growth, habits, career, wellness, relationships. No comparison or social media; everything is private.

You answer questions about: the product (goals, plan, calendar, AI feedback, journals, reminders, family plans, pricing), how to get started, use cases, and motivation. Keep replies concise (2–4 sentences unless the user asks for detail). Be warm and encouraging. If you don't know something, say so and suggest the FAQ or Contact Us. Do not output raw HTML or code blocks unless the user explicitly asks for code.`;

function buildMessages(history: ChatMessage[], userInput: string): ChatMessage[] {
  const withSystem = [
    { role: 'assistant' as const, content: SYSTEM_PROMPT },
    ...history,
    { role: 'user' as const, content: userInput },
  ];
  return withSystem;
}

/** Sanitize HTML from markdown for safe display (strip script, iframe, event handlers). */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === 'SCRIPT' || el.tagName === 'IFRAME' || el.tagName === 'OBJECT') {
        el.remove();
        return;
      }
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('on') || (attr.name === 'href' && attr.value.startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      });
    }
    Array.from(node.childNodes).forEach(walk);
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

function renderAssistantContent(text: string): string {
  marked.setOptions({ gfm: true, breaks: true });
  const raw = marked.parse(text, { async: false }) as string;
  return sanitizeHtml(raw ?? '');
}

/** Call server-side chat API (uses OPENAI_API_KEY on server — no CORS, same as AI insights). */
async function chatViaApi(messages: ChatMessage[]): Promise<string | null> {
  const res = await fetch('/api/chat-completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const data = (await res.json()) as { reply?: string; error?: string; detail?: string };
  if (!res.ok) {
    const msg = data.detail || data.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data.reply ?? null;
}

function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (m): m is ChatMessage =>
        m && typeof m === 'object' && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    );
    return valid.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [avatarGender, setAvatarGender] = useState<AvatarGender>(loadAvatarPreference);

  const avatarSrc = AVATAR_IMAGES[avatarGender];
  const assistantFirstName = ASSISTANT_FIRST_NAME[avatarGender];

  const setAvatar = useCallback((gender: AvatarGender) => {
    setAvatarGender(gender);
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, gender);
    } catch {
      // ignore
    }
  }, []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // ignore quota or disabled storage
    }
  }, [messages]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input.trim()).trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const apiMessages = buildMessages(messages, text);
      const reply = await chatViaApi(apiMessages);

      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } else {
        setError('Could not get a reply. Please try again.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showSuggestedQuestions =
    messages.length === 0 || (messages.length > 0 && messages[messages.length - 1].role === 'assistant');
  /** Logged-in users get a simple welcome only — no demo/marketing quick picks */
  const showMarketingPills = !isLoggedIn && showSuggestedQuestions;

  return (
    <div className="ai-chatbot-widget">
      {/* Floating trigger — uses --chatbot-trigger-* */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full h-14 w-14',
          'shadow-lg transition-shadow hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        )}
        style={{
          background: 'var(--chatbot-trigger-bg)',
          color: 'var(--chatbot-trigger-text)',
          boxShadow: 'var(--chatbot-trigger-shadow)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open AI assistant"
      >
        <Compass className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="AI assistant"
            className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none"
            initial={false}
          >
            <div
              className="pointer-events-auto absolute inset-0"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              className="relative flex flex-col w-full max-w-md pointer-events-auto"
              style={{
                height: 'min(85vh, 560px)',
                borderRadius: '1.75rem 1.75rem 0.5rem 1.75rem',
                background: 'var(--chatbot-panel-bg)',
                border: '1px solid var(--chatbot-panel-border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 0 0 1px var(--chatbot-panel-border)',
              }}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — uses --chatbot-header-* and --chatbot-title-* */}
              <div
                className="flex items-center justify-between shrink-0 px-5 py-4 rounded-t-[1.75rem]"
                style={{
                  background: 'var(--chatbot-header-bg)',
                  borderBottom: '1px solid var(--chatbot-panel-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--chatbot-icon-bg)]"
                        style={{ backgroundColor: 'var(--chatbot-icon-bg)' }}
                        aria-label="Change AI avatar"
                      >
                        <img
                          src={avatarSrc}
                          alt="AI assistant"
                          className="h-full w-full object-cover"
                        />
                        <ChevronDown className="absolute bottom-0 right-0 h-3 w-3 text-white/90 bg-black/40 rounded-tl" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="dropdown-landing min-w-[160px]">
                      <DropdownMenuItem onClick={() => setAvatar('man')} className="cursor-pointer">
                        Male avatar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAvatar('woman')} className="cursor-pointer">
                        Female avatar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--chatbot-title-text)' }}>
                      Authenticity & Purpose AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-9 w-9"
                      style={{ color: 'var(--chatbot-title-text)' }}
                      onClick={clearConversation}
                      aria-label="Clear conversation"
                      title="Clear conversation"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9"
                    style={{ color: 'var(--chatbot-title-text)' }}
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="flex flex-col gap-4 pb-2">
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-8 px-4 text-center"
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4 overflow-hidden shrink-0"
                        style={{ border: '1px solid var(--chatbot-bot-border)' }}
                      >
                        <img
                          src={avatarSrc}
                          alt="AI assistant"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--chatbot-title-text)' }}>
                        {isLoggedIn
                          ? `Hi! I’m ${assistantFirstName}, your Goals–Vision Board assistant.`
                          : 'Hi! I’m your Goals–Vision Board assistant.'}
                      </p>
                      <p className="text-xs opacity-70" style={{ color: 'var(--chatbot-bot-text)' }}>
                        {isLoggedIn
                          ? 'How can I help you today?'
                          : 'Ask about features, pricing, or how to get started.'}
                      </p>
                      {showMarketingPills && (
                        <div className="flex flex-wrap justify-center gap-2 mt-5">
                          {SUGGESTED_QUESTIONS.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => send(q)}
                              disabled={loading}
                              className={cn(
                                'text-xs font-medium px-3 py-2 rounded-full border transition-colors',
                                'hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                              )}
                              style={{
                                borderColor: 'var(--chatbot-bot-border)',
                                backgroundColor: 'var(--chatbot-bot-bubble)',
                                color: 'var(--chatbot-bot-text)',
                              }}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className={cn(
                        'flex',
                        m.role === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                          m.role === 'user'
                            ? 'rounded-br-md'
                            : 'rounded-bl-md border',
                        )}
                        style={
                          m.role === 'user'
                            ? {
                                background: 'var(--chatbot-user-bubble)',
                                color: 'var(--chatbot-user-text)',
                                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                              }
                            : {
                                backgroundColor: 'var(--chatbot-bot-bubble)',
                                borderColor: 'var(--chatbot-bot-border)',
                                color: 'var(--chatbot-bot-text)',
                              }
                        }
                      >
                        {m.role === 'user' ? (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        ) : (
                          <div
                            className="chatbot-markdown prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5"
                            style={{ color: 'var(--chatbot-bot-text)' }}
                            dangerouslySetInnerHTML={{ __html: renderAssistantContent(m.content) }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {showMarketingPills && messages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          disabled={loading}
                          className={cn(
                            'text-xs font-medium px-3 py-2 rounded-full border transition-colors',
                            'hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                          )}
                          style={{
                            borderColor: 'var(--chatbot-bot-border)',
                            backgroundColor: 'var(--chatbot-bot-bubble)',
                            color: 'var(--chatbot-bot-text)',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div
                        className="rounded-2xl rounded-bl-md border px-4 py-3 text-sm"
                        style={{
                          backgroundColor: 'var(--chatbot-bot-bubble)',
                          borderColor: 'var(--chatbot-bot-border)',
                          color: 'var(--chatbot-bot-text)',
                        }}
                      >
                        <span className="inline-flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    </motion.div>
                  )}
                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400 px-2">{error}</p>
                  )}
                </div>
              </div>

              {/* Input area — uses --chatbot-input-* and --chatbot-send-* */}
              <div
                className="shrink-0 p-4 rounded-b-[1.75rem]"
                style={{
                  borderTop: '1px solid var(--chatbot-panel-border)',
                  backgroundColor: 'var(--chatbot-input-bg)',
                }}
              >
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className={cn(
                      'flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl px-4 py-3 text-sm',
                      'border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                    )}
                    style={{
                      borderColor: 'var(--chatbot-input-border)',
                      backgroundColor: 'var(--chatbot-panel-bg)',
                      color: 'var(--chatbot-input-text)',
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--chatbot-send-bg)', color: 'var(--chatbot-send-text)' }}
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    aria-label="Send"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
