import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SEO } from '../components/SEO';
import { Brain, TrendingUp, Shield, Zap, ArrowRight, CheckCircle, PlayCircle, AlertCircle, Target, BarChart3, Lock, Eye, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

// ============================================
// SECTION 1: HERO SECTION
// ============================================
function HeroSection() {
  const navigate = useNavigate();
  const [alphaDemo, setAlphaDemo] = useState(3.2);

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10" />
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Financial Intelligence
            </Badge>

            <h1 className="text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Stop Losing <span className="text-red-400">{alphaDemo.toFixed(1)}%</span>
              <br />
              Annual Returns to
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Cognitive Biases
              </span>
            </h1>

            <p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-gray-300">
              Neufin's Neural Twin AI identifies exactly how much you're leaving on the table through emotional trading, 
              and shows you a rational path forward.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="px-10 py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Calculate My Alpha Score
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>

              <Button
                variant="outline"
                size="lg"
                className="px-10 py-6 text-lg border-purple-500/30 hover:bg-purple-500/10"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch 60s Demo
              </Button>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 border-t border-purple-500/20 pt-8">
              <span>✅ Trusted by 500+ investors</span>
              <span className="hidden sm:inline">•</span>
              <span>✅ SOC 2 Certified</span>
              <span className="hidden sm:inline">•</span>
              <span>✅ Real-time Bloomberg data</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 2: THE PROBLEM (Emotional Hook)
// ============================================
function ProblemSection() {
  const problems = [
    {
      title: 'Loss Aversion',
      description: 'You held TSLA down 40% for 8 months',
      cost: '$4,200',
      icon: '😰',
    },
    {
      title: 'Disposition Effect',
      description: 'You sold NVDA at +15%, it\'s now +180%',
      cost: '$12,400',
      icon: '😞',
    },
    {
      title: 'Herding',
      description: 'You bought META at peak with everyone',
      cost: '$2,800',
      icon: '🐑',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-transparent to-purple-600/5">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6">
            You're a <span className="text-purple-400">Disciplined</span> Investor
            <br />
            But Your <span className="text-blue-400">Brain Isn't</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            These aren't mistakes. They're predictable cognitive biases that cost you money every trading day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 h-full">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{problem.icon}</div>
                  <h3 className="text-2xl font-bold text-red-400 mb-2">{problem.title}</h3>
                  <p className="text-gray-300 mb-4">{problem.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-red-500">Cost:</span>
                    <span className="text-2xl text-red-400">{problem.cost}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 3: THE SOLUTION
// ============================================
function SolutionSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold mb-6">
            Meet Your <span className="text-purple-400">Neural Twin</span>
            <br />
            The <span className="text-blue-400">Rational Version</span> of You
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your AI-powered twin makes rational decisions you can't. See what you should do before emotions take over.
          </p>
        </motion.div>

        {/* Interactive Demo Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-400 mb-2">-8.4%</div>
                    <div className="text-sm text-gray-400">Your Returns</div>
                  </div>
                  <ArrowRight className="h-8 w-8 text-purple-400" />
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">+4.2%</div>
                    <div className="text-sm text-gray-400">Neural Twin Returns</div>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                  Analyze Sample Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Three Core Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: TrendingUp,
              title: 'Sentiment Analysis Engine',
              description: 'We analyze 50,000 news sources daily. Get actionable signals 2.4 hours before price moves.',
              stat: '73% accuracy over 6 months',
            },
            {
              icon: Brain,
              title: 'Bias Detection & Mitigation',
              description: 'Quantify every dollar lost to bias and see exactly how to fix it with AI-powered suggestions.',
              stat: '+0.34 Sharpe ratio improvement',
            },
            {
              icon: Target,
              title: 'Digital Twin Simulator',
              description: 'See what your rational self would do. Stress-tested over 10,000 market scenarios.',
              stat: '+18% in market crashes',
            },
          ].map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 h-full hover:border-blue-500/40 transition-colors">
                <CardContent className="pt-6">
                  <module.icon className="h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">{module.title}</h3>
                  <p className="text-gray-400 mb-6">{module.description}</p>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {module.stat}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 4: SOCIAL PROOF
// ============================================
function SocialProofSection() {
  const testimonials = [
    {
      quote: 'Neufin saved me $8K by alerting me to sell COIN before the crash',
      author: 'Sarah K',
      portfolio: '$240K',
    },
    {
      quote: "I didn't realize I was holding losers 3x longer than winners. Game changer.",
      author: 'David M',
      portfolio: '$180K',
    },
    {
      quote: "The digital twin predicted I'd panic sell. I didn't. Saved 12% returns.",
      author: 'Michael R',
      portfolio: '$420K',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-transparent to-purple-600/5">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16"
        >
          Trusted by <span className="text-purple-400">Disciplined Investors</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-bold text-green-400">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">Portfolio: {testimonial.portfolio}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 5: PRICING
// ============================================
function PricingSection() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Get started with AI-powered bias detection',
      features: [
        '1 portfolio (max 10 holdings)',
        'Weekly sentiment updates',
        'Basic bias analysis',
        'Community support',
      ],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'Serious traders maximizing alpha',
      features: [
        'Unlimited portfolios',
        'Real-time signals',
        'Advanced bias interventions',
        'Digital twin simulator',
        'Email support',
        'API access',
      ],
      cta: 'Start 7-Day Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For institutions and hedge funds',
      features: [
        'White-label API',
        'Dedicated success manager',
        'Custom integrations',
        'SLA guarantees',
        'Advanced analytics',
      ],
      cta: 'Book Demo',
      highlighted: false,
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Simple, <span className="text-purple-400">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-gray-400">No hidden fees. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`h-full ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50 ring-2 ring-purple-500/30'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50'
                }`}
              >
                <CardContent className="pt-8 pb-8 flex flex-col h-full">
                  {plan.highlighted && (
                    <Badge className="w-fit mb-4 bg-purple-500 text-white border-purple-500/50">
                      Most Popular
                    </Badge>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                  <div className="mb-8">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate('/login')}
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 6: TRUST & SECURITY
// ============================================
function TrustSection() {
  const trustPillars = [
    {
      icon: Lock,
      title: 'Bank-Level Security',
      description: 'SOC 2 Type II certified',
    },
    {
      icon: Eye,
      title: 'No Trading Access',
      description: 'We analyze only. You control your money.',
    },
    {
      icon: Shield,
      title: '100% Data Privacy',
      description: 'Your holdings never shared or sold',
    },
    {
      icon: Award,
      title: 'Always Transparent',
      description: 'Every signal shows its reasoning',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-transparent to-purple-600/5">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16"
        >
          Trust Built on <span className="text-purple-400">Transparency</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <pillar.icon className="h-12 w-12 mx-auto mb-4 text-purple-400" />
              <h3 className="font-bold mb-2 text-lg">{pillar.title}</h3>
              <p className="text-gray-400">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTION 7: FINAL CTA
// ============================================
function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
      <motion.div
        className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-5xl font-bold mb-8">
            See Your <span className="text-purple-400">Alpha Score</span>
            <br />
            in <span className="text-blue-400">60 Seconds</span>
          </h2>

          <div className="flex gap-4 mb-8">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-6 py-3 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <Button
              onClick={() => navigate('/login')}
              className="px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Calculate Now
            </Button>
          </div>

          <p className="text-gray-400">No credit card required • Cancel anytime</p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN LANDING PAGE COMPONENT
// ============================================
export function LandingRedesign() {
  const supabase = createClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/user-dashboard');
      }
    };
    checkAuth();
  }, []);

  return (
    <>
      <SEO
        title="Neufin AI - Stop Losing 3.2% to Cognitive Bias | Neural Twin Trading"
        description="Your Neural Twin AI identifies how much cognitive bias costs you annually. Real-time sentiment analysis, bias detection, and digital twin simulator for disciplined investors."
        keywords="cognitive bias, trading psychology, neural twin AI, alpha score, portfolio optimization, behavioral finance"
        url="/"
        schemaType="WebSite"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <SocialProofSection />
        <PricingSection />
        <TrustSection />
        <FinalCTASection />

        {/* Footer */}
        <footer className="border-t border-gray-800/50 py-12">
          <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
            <p>
              Not investment advice. For educational purposes. Neufin AI is a financial analysis tool, not a financial advisor.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
