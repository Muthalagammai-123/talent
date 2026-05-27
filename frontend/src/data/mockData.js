export const stats = [
  { label: 'Active freelancers', value: 120000, suffix: '+' },
  { label: 'Projects completed', value: 2.4, suffix: 'M', decimals: 1 },
  { label: 'Client satisfaction', value: 98, suffix: '%' },
  { label: 'Avg. match time', value: 4, suffix: ' hrs' },
]

export const features = [
  { title: 'AI Talent Matching', desc: 'Get matched to projects that fit your skills and rate.', icon: 'Sparkles' },
  { title: 'Smart Proposals', desc: 'AI scores your proposals before you submit.', icon: 'FileText' },
  { title: 'Verified Skills', desc: 'Skill badges backed by assessments and portfolio review.', icon: 'BadgeCheck' },
  { title: 'Secure Payments', desc: 'Milestone escrow with fast withdrawals.', icon: 'Wallet' },
]

export const testimonials = [
  { name: 'Priya Sharma', role: 'Full-stack freelancer', text: 'TalentStage helped me 3x my income in 6 months with better project matches.', avatar: 'PS' },
  { name: 'Marcus Cole', role: 'Startup founder', text: 'We hired our entire dev team here. AI matching saved weeks of screening.', avatar: 'MC' },
  { name: 'Elena Voss', role: 'UI/UX designer', text: 'The portfolio reviewer gave actionable tips that landed me premium clients.', avatar: 'EV' },
]

export const pricingPlans = [
  { name: 'Free', price: 0, features: ['5 proposals/mo', 'Basic AI match', 'Community access'] },
  { name: 'Pro', price: 29, popular: true, features: ['Unlimited proposals', 'AI proposal scorer', 'Priority matching', '0% fee first $5K'] },
  { name: 'Business', price: 99, features: ['Team seats', 'Advanced analytics', 'Dedicated support', 'Custom contracts'] },
]

export const projects = [
  { id: 'p1', title: 'React Dashboard for SaaS', budget: '$3,000 - $5,000', category: 'Web Dev', skills: ['React', 'TypeScript', 'Tailwind'], posted: '2h ago', proposals: 12, description: 'Build analytics dashboard with charts and auth.' },
  { id: 'p2', title: 'Mobile App UI Redesign', budget: '$1,500 - $2,500', category: 'Design', skills: ['Figma', 'UI/UX', 'Mobile'], posted: '5h ago', proposals: 8, description: 'Redesign fintech app screens for iOS and Android.' },
  { id: 'p3', title: 'Node.js API Integration', budget: '$2,000 - $4,000', category: 'Backend', skills: ['Node.js', 'PostgreSQL', 'REST'], posted: '1d ago', proposals: 15, description: 'Integrate Stripe, webhooks, and admin panel.' },
  { id: 'p4', title: 'AI Chatbot for Support', budget: '$4,000 - $8,000', category: 'AI/ML', skills: ['Python', 'OpenAI', 'LangChain'], posted: '1d ago', proposals: 6, description: 'RAG-based support bot with knowledge base.' },
  { id: 'p5', title: 'WordPress E-commerce', budget: '$800 - $1,200', category: 'Web Dev', skills: ['WordPress', 'WooCommerce'], posted: '2d ago', proposals: 22, description: 'Setup store with 50 products and payment gateway.' },
  { id: 'p6', title: 'Brand Identity Package', budget: '$1,000 - $2,000', category: 'Design', skills: ['Branding', 'Illustrator'], posted: '3d ago', proposals: 9, description: 'Logo, guidelines, and social templates.' },
]

export const proposals = [
  { id: 'pr1', project: 'React Dashboard for SaaS', status: 'pending', bid: '$4,200', submitted: '1d ago' },
  { id: 'pr2', project: 'Node.js API Integration', status: 'interview', bid: '$3,500', submitted: '3d ago' },
  { id: 'pr3', project: 'AI Chatbot for Support', status: 'declined', bid: '$6,000', submitted: '5d ago' },
]

export const portfolio = {
  name: 'Alex Rivera',
  title: 'Senior Full-Stack Developer',
  location: 'Remote · UTC-5',
  bio: 'Building scalable web apps for startups and enterprises. 8+ years experience.',
  completion: 78,
  aiScore: 92,
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'GraphQL'],
  education: [{ school: 'MIT', degree: 'B.S. Computer Science', year: '2016' }],
  experience: [
    { company: 'TechFlow Inc', role: 'Lead Developer', period: '2021 - Present' },
    { company: 'StartupXYZ', role: 'Full-Stack Dev', period: '2018 - 2021' },
  ],
  projects: [
    { title: 'FinTrack Dashboard', image: 'gradient-1', link: 'github.com', live: 'fintrack.app' },
    { title: 'HealthConnect API', image: 'gradient-2', link: 'github.com', live: null },
    { title: 'E-commerce Platform', image: 'gradient-3', link: 'github.com', live: 'shop.demo' },
  ],
  aiSuggestions: [
    'Add 2 more React projects to boost match rate by ~15%',
    'Complete skill verification for TypeScript',
    'Update hourly rate — market avg is $85/hr for your level',
  ],
}

export const clientData = {
  postedProjects: [
    { id: 'cp1', title: 'Marketing Website Revamp', proposals: 18, status: 'open', budget: '$2,500' },
    { id: 'cp2', title: 'CRM Integration', proposals: 7, status: 'hiring', budget: '$5,000' },
  ],
  activeHires: [
    { name: 'Sam Kim', project: 'CRM Integration', milestone: 'Phase 2', progress: 65 },
    { name: 'Jordan Lee', project: 'Mobile MVP', milestone: 'Phase 1', progress: 30 },
  ],
  milestones: [
    { project: 'CRM Integration', amount: '$1,500', status: 'pending', due: 'May 28' },
    { project: 'Mobile MVP', amount: '$2,000', status: 'released', due: 'May 20' },
  ],
  analytics: { spend: 12400, hires: 8, avgTime: '3.2 days', success: 94 },
}

export const aiMatches = [
  { name: 'React Dashboard for SaaS', match: 96, reason: 'Strong React + TypeScript portfolio' },
  { name: 'Node.js API Integration', match: 89, reason: 'Backend experience aligns' },
  { name: 'AI Chatbot for Support', match: 82, reason: 'Python skills verified' },
]

export const messages = [
  { id: 'm1', user: 'Sarah Chen', status: 'online', last: 'Sounds good, let\'s start Monday', time: '10:32 AM', unread: 2 },
  { id: 'm2', user: 'DevStudio LLC', status: 'online', last: 'Can you share the timeline?', time: 'Yesterday', unread: 0 },
  { id: 'm3', user: 'Mike Torres', status: 'away', last: 'Thanks for the proposal!', time: 'Mon', unread: 0 },
]

export const clientMessages = [
  { id: 'cm1', user: 'Alex Rivera', status: 'online', last: 'I can deliver the revamp in 3 weeks at $2,800', time: '10:32 AM', unread: 1, project: 'Marketing Website Revamp' },
  { id: 'cm2', user: 'Sam Kim', status: 'online', last: 'Phase 2 mockups are ready for your review', time: 'Yesterday', unread: 0, project: 'CRM Integration' },
  { id: 'cm3', user: 'Priya Sharma', status: 'away', last: 'Thanks for shortlisting my proposal!', time: 'Mon', unread: 0, project: 'Marketing Website Revamp' },
]

export const clientChatThread = [
  { id: 1, sender: 'Alex Rivera', text: 'Hi! I submitted a proposal for your Marketing Website Revamp. Happy to walk you through my approach.', self: false, time: '10:10' },
  { id: 2, sender: 'You', text: 'Thanks Alex — what timeline and budget are you thinking?', self: true, time: '10:15' },
  { id: 3, sender: 'Alex Rivera', text: 'I can deliver the revamp in 3 weeks at $2,800', self: false, time: '10:32' },
]

export const chatThread = [
  { id: 1, sender: 'Sarah Chen', text: 'Hi! Loved your portfolio. Are you available for the dashboard project?', self: false, time: '10:15' },
  { id: 2, sender: 'You', text: 'Yes, I can start next week. Happy to jump on a quick call.', self: true, time: '10:20' },
  { id: 3, sender: 'Sarah Chen', text: 'Sounds good, let\'s start Monday', self: false, time: '10:32' },
]

export const payments = {
  totalEarnings: 48250,
  pending: 3200,
  available: 8500,
  transactions: [
    { id: 't1', desc: 'Milestone — CRM Integration', amount: 1500, status: 'completed', date: 'May 20' },
    { id: 't2', desc: 'Withdrawal to bank', amount: -2000, status: 'completed', date: 'May 18' },
    { id: 't3', desc: 'Milestone — Dashboard', amount: 2100, status: 'pending', date: 'May 24' },
  ],
  withdrawals: [
    { amount: 2000, date: 'May 18', status: 'completed' },
    { amount: 3500, date: 'May 5', status: 'completed' },
  ],
}

export const communityPosts = [
  { author: 'Dev Community', title: 'How to price your first enterprise project', likes: 124, comments: 32, time: '2h ago' },
  { author: 'TalentStage Team', title: 'New: AI skill verification badges', likes: 89, comments: 15, time: '5h ago' },
]

export const mentorships = [
  { mentor: 'Lisa Park', skill: 'React Architecture', slots: 3, rating: 4.9 },
  { mentor: 'David Wu', skill: 'Freelance Business', slots: 5, rating: 4.8 },
]

export const leaderboard = [
  { rank: 1, name: 'CodeMaster99', points: 2450, badge: 'gold' },
  { rank: 2, name: 'DesignPro', points: 2180, badge: 'silver' },
  { rank: 3, name: 'You', points: 1920, badge: 'bronze' },
  { rank: 4, name: 'APIWizard', points: 1750, badge: null },
]

export const notifications = [
  { id: 'n1', title: 'New project match', body: 'React Dashboard — 96% match', read: false, time: '10m ago' },
  { id: 'n2', title: 'Proposal viewed', body: 'Sarah Chen viewed your proposal', read: false, time: '1h ago' },
  { id: 'n3', title: 'Payment received', body: '$1,500 milestone released', read: true, time: '2d ago' },
]

export const categories = ['All', 'Web Dev', 'Design', 'Backend', 'AI/ML', 'Mobile', 'Marketing']
