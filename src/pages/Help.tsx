import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  HelpCircle, 
  Target, 
  CreditCard, 
  Users, 
  Bell, 
  Shield, 
  Smartphone,
  Mail,
  MessageCircle,
  BookOpen,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeroFloatingCircles } from '@/components/HeroFloatingCircles';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  questions: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Zap className="w-6 h-6" />,
    description: 'Learn the basics of using the app',
    questions: [
      {
        question: 'How do I create my first goal?',
        answer: 'After signing up, click the "Add Goal" button on your dashboard. Give your goal a name, set your target (0-10 scale), and optionally add milestones. Your goal will appear on your dashboard where you can track progress daily.'
      },
      {
        question: 'What is the 0-10 progress system?',
        answer: 'Our unique 0-10 system lets you rate your progress on any goal from 0 (not started) to 10 (fully achieved). This simple scale makes it easy to track incremental progress and see how far you\'ve come. Just slide the progress bar to update your current level.'
      },
      {
        question: 'Can I use the app without creating an account?',
        answer: 'You can explore the demo to see how the app works, but to save your goals and track progress over time, you\'ll need to create a free account. Your data is securely stored and synced across all your devices.'
      },
      {
        question: 'How do I set up milestones for my goals?',
        answer: 'When creating or editing a goal, click "Add Milestone" to break your goal into smaller, achievable steps. Each milestone can have its own target date and description. Completing milestones helps you stay motivated and see tangible progress.'
      }
    ]
  },
  {
    id: 'goals-tracking',
    title: 'Goals–Vision Board & Tracking',
    icon: <Target className="w-6 h-6" />,
    description: 'Managing and tracking your goals',
    questions: [
      {
        question: 'How often should I update my progress?',
        answer: 'We recommend updating your progress daily or at least a few times per week. Regular check-ins help you stay accountable and give you accurate data for your progress charts. Set up reminders to help build this habit.'
      },
      {
        question: 'Can I have multiple goals at once?',
        answer: 'Absolutely! You can track as many goals as you want. However, we recommend focusing on 3-5 key goals at a time for the best results. You can always archive completed goals and add new ones.'
      },
      {
        question: 'What happens when I complete a goal?',
        answer: 'When you reach 10/10 on a goal, you\'ll see a celebration animation! The goal is marked as complete and moved to your achievements. You can view your completed goals anytime to see how far you\'ve come.'
      },
      {
        question: 'Can I edit or delete a goal?',
        answer: 'Yes! Click on any goal to open its details, then use the edit or delete options. Editing lets you change the name, description, or milestones. Deleting a goal is permanent, so we\'ll ask you to confirm first.'
      },
      {
        question: 'How do goal categories work?',
        answer: 'Categories help you organize goals by area of life: Health, Career, Finance, Education, Personal Growth, etc. You can filter your dashboard by category and see progress charts for each area.'
      }
    ]
  },
  {
    id: 'subscription',
    title: 'Subscription & Billing',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Plans, pricing, and payments',
    questions: [
      {
        question: 'What\'s included in the free trial?',
        answer: 'Your 7-day free trial includes full access to all premium features: unlimited goals, AI coaching, advanced analytics, calendar sync, and more. No credit card required to start. You can upgrade anytime during or after the trial.'
      },
      {
        question: 'What are the subscription plans?',
        answer: 'We offer three plans: Free (3 goals, basic features), Pro ($9.99/month - unlimited goals, AI coaching, analytics), and Team ($19.99/month - everything in Pro plus collaboration features for families or teams).'
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel anytime from your account settings. You\'ll continue to have access until the end of your billing period. We don\'t do refunds for partial months, but you keep all your data.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor, Stripe. We also support Apple Pay and Google Pay where available.'
      },
      {
        question: 'Is there a discount for annual billing?',
        answer: 'Yes! When you choose annual billing, you get 2 months free compared to monthly billing. That\'s $99.99/year for Pro (instead of $119.88) and $199.99/year for Team (instead of $239.88).'
      }
    ]
  },
  {
    id: 'collaboration',
    title: 'Collaboration & Sharing',
    icon: <Users className="w-6 h-6" />,
    description: 'Working with others on goals',
    questions: [
      {
        question: 'Can I share goals with family members?',
        answer: 'Yes! With a Team subscription, you can create shared goals that multiple family members can contribute to. Everyone can update progress, add comments, and celebrate achievements together.'
      },
      {
        question: 'How do I invite someone to collaborate?',
        answer: 'Go to a goal\'s settings and click "Invite Collaborator." Enter their email address and they\'ll receive an invitation. Once they accept, they can view and update the shared goal.'
      },
      {
        question: 'Can I make my goals public?',
        answer: 'You can share individual goals publicly to inspire others or get accountability. Public goals appear in the community feed where others can cheer you on. Your private goals always stay private.'
      },
      {
        question: 'What\'s the difference between sharing and collaborating?',
        answer: 'Sharing lets others view your goal and leave encouragement. Collaborating lets others actually update progress on a shared goal. Use sharing for accountability, collaboration for team goals.'
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications & Reminders',
    icon: <Bell className="w-6 h-6" />,
    description: 'Stay on track with alerts',
    questions: [
      {
        question: 'How do I set up reminders?',
        answer: 'Go to Settings > Notifications to set up daily or weekly reminders. You can choose the time and days that work best for you. Reminders can be sent via push notification, email, or both.'
      },
      {
        question: 'Can I get reminders for specific goals?',
        answer: 'Yes! Each goal can have its own reminder schedule. Edit a goal and scroll to "Reminders" to set custom notification times for that specific goal.'
      },
      {
        question: 'How do I turn off notifications?',
        answer: 'Go to Settings > Notifications and toggle off the types of notifications you don\'t want. You can disable all notifications or just specific types like weekly summaries or achievement alerts.'
      },
      {
        question: 'Why am I not receiving notifications?',
        answer: 'Check that notifications are enabled both in the app settings and in your device/browser settings. For mobile, make sure the app has permission to send notifications. For desktop, allow notifications when prompted.'
      }
    ]
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    icon: <Shield className="w-6 h-6" />,
    description: 'Keeping your data safe',
    questions: [
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. We use industry-standard encryption (AES-256) for all data at rest and in transit (TLS 1.3). Your data is stored on secure servers with regular backups. We never sell your personal information.'
      },
      {
        question: 'Who can see my goals?',
        answer: 'By default, all your goals are private and only visible to you. You control what to share. Shared goals are only visible to people you explicitly invite. Public goals are visible in the community feed.'
      },
      {
        question: 'Can I export my data?',
        answer: 'Yes! Go to Settings > Data & Privacy > Export Data to download all your goals, progress history, and journal entries in JSON or CSV format. Your data belongs to you.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. This permanently removes all your data from our servers within 30 days. This action cannot be undone, so please export your data first if you want to keep it.'
      },
      {
        question: 'Do you use my data for AI training?',
        answer: 'No. Your personal goals and data are never used to train AI models. Our AI coaching features use pre-trained models that don\'t learn from or store your individual data.'
      }
    ]
  },
  {
    id: 'mobile-sync',
    title: 'Mobile & Sync',
    icon: <Smartphone className="w-6 h-6" />,
    description: 'Using across devices',
    questions: [
      {
        question: 'Is there a mobile app?',
        answer: 'Our web app is fully responsive and works great on mobile browsers. You can also install it as a Progressive Web App (PWA) on your phone for an app-like experience with offline access.'
      },
      {
        question: 'How do I install the PWA?',
        answer: 'On iPhone: Open in Safari, tap the Share button, then "Add to Home Screen." On Android: Open in Chrome, tap the menu (three dots), then "Install app" or "Add to Home Screen."'
      },
      {
        question: 'Does my data sync across devices?',
        answer: 'Yes! When you\'re signed in, your goals and progress sync automatically across all your devices. Make an update on your phone and see it instantly on your computer.'
      },
      {
        question: 'Can I use the app offline?',
        answer: 'Yes! The PWA works offline. Any changes you make while offline will sync automatically when you reconnect to the internet. Perfect for updating progress on the go.'
      }
    ]
  }
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  // Filter FAQs based on search
  const filteredFAQs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/demo" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </Link>
          <Link to="/contact">
            <Button variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 text-white py-16 px-4">
        <HeroFloatingCircles variant="dark" />
        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How can we help?</h1>
          <p className="text-xl text-green-100 mb-8">
            Find answers to common questions or reach out to our support team
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full border-0 shadow-lg text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 px-4 sm:px-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BookOpen className="w-6 h-6" />, title: 'Quick Start Guide', desc: 'Get up and running', link: '#getting-started' },
              { icon: <Target className="w-6 h-6" />, title: 'Goal Tracking', desc: 'Master your goals', link: '#goals-tracking' },
              { icon: <CreditCard className="w-6 h-6" />, title: 'Billing Help', desc: 'Plans & payments', link: '#subscription' },
              { icon: <MessageCircle className="w-6 h-6" />, title: 'Contact Us', desc: 'Get personal help', link: '/contact' },
            ].map((item, i) => (
              <a
                key={i}
                href={item.link}
                className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          {searchQuery && filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
              <p className="text-gray-400 mt-2">Try different keywords or browse categories below</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {(searchQuery ? filteredFAQs : faqData).map((category) => (
              <div 
                key={category.id} 
                id={category.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 text-lg">{category.title}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {category.questions.length} questions
                    </span>
                    {expandedCategory === category.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Questions */}
                {expandedCategory === category.id && (
                  <div className="border-t border-gray-100">
                    {category.questions.map((faq, index) => {
                      const questionId = `${category.id}-${index}`;
                      const isExpanded = expandedQuestions.has(questionId);
                      
                      return (
                        <div key={index} className="border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => toggleQuestion(questionId)}
                            className="w-full flex items-center justify-between p-5 pl-8 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span className="font-medium text-gray-800 pr-4">{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-8 pb-5 text-gray-600 leading-relaxed bg-green-50/50">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Still have questions?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Our support team is here to help you succeed with your goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white gap-2 px-8">
                <Mail className="w-5 h-5" />
                Email Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2026 Goal Tracker. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/demo" className="hover:text-white transition-colors">Demo</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Help;
