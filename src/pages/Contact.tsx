import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Phone,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LandingPageLayout } from '@/components/LandingPageLayout';

export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: 'Message sent!',
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const contactCards = [
    {
      icon: Mail,
      title: 'Email',
      value: 'info@authenticitynpurpose.com',
      href: 'mailto:info@authenticitynpurpose.com',
      description: 'Best for detailed questions',
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (701) 711-7160',
      href: 'tel:+17017117160',
      description: 'Mon–Fri, 9am–6pm EST',
    },
  ];

  return (
    <LandingPageLayout>
      {/* Main content */}
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden" style={{ backgroundColor: 'var(--landing-bg)' }}>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--landing-primary) 1px, transparent 0)', backgroundSize: '28px 28px' }} aria-hidden />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Form */}
            <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Card
                className="border-2 shadow-xl overflow-hidden feature-card-shadow"
                style={{ backgroundColor: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold" style={{ color: 'var(--landing-text)' }}>
                    Send us a message
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--landing-text)', opacity: 0.8 }}>
                    Fill out the form below and we'll get back to you soon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-medium" style={{ color: 'var(--landing-text)' }}>Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          className={`border-2 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--landing-primary)] ${errors.name ? 'border-red-500' : 'border-[var(--landing-border)]'}`}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-medium" style={{ color: 'var(--landing-text)' }}>Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className={`border-2 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--landing-primary)] ${errors.email ? 'border-red-500' : 'border-[var(--landing-border)]'}`}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="font-medium" style={{ color: 'var(--landing-text)' }}>Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What's this about?"
                        value={formData.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        className={`border-2 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--landing-primary)] ${errors.subject ? 'border-red-500' : 'border-[var(--landing-border)]'}`}
                      />
                      {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="font-medium" style={{ color: 'var(--landing-text)' }}>Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us what's on your mind..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        rows={5}
                        className={`border-2 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[var(--landing-primary)] resize-none ${errors.message ? 'border-red-500' : 'border-[var(--landing-border)]'}`}
                      />
                      {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
                    </div>
                    <Button
                      type="submit"
                      className="w-full font-bold text-white hero-cta-primary py-6 text-base gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact info + social */}
            <div className="lg:col-span-2 space-y-6">
              {contactCards.map((item, i) => (
                <Card
                  key={item.title}
                  className="group border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 feature-card-shadow animate-slide-up"
                  style={{
                    backgroundColor: 'var(--landing-bg)',
                    borderColor: 'var(--landing-border)',
                    animationDelay: `${0.15 + i * 0.05}s`,
                  }}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div
                      className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'var(--landing-accent)' }}
                    >
                      <item.icon className="h-6 w-6" style={{ color: 'var(--landing-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--landing-primary)' }}>
                        {item.title}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="font-semibold text-base break-all hover:underline"
                          style={{ color: 'var(--landing-text)' }}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-semibold text-base" style={{ color: 'var(--landing-text)' }}>{item.value}</p>
                      )}
                      <p className="text-sm mt-1 opacity-80" style={{ color: 'var(--landing-text)' }}>{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="mt-16 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-base font-medium mb-4" style={{ color: 'var(--landing-text)', opacity: 0.9 }}>
              Looking for quick answers?
            </p>
            <Button
              variant="outline"
              size="lg"
              className="hero-cta-outline gap-2 font-bold"
              onClick={() => navigate('/faq')}
            >
              <HelpCircle className="h-5 w-5" />
              Visit FAQ
            </Button>
          </div>
        </div>
      </section>

    </LandingPageLayout>
  );
}
