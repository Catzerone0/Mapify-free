export interface TemplateData {
  name: string;
  description: string;
  category: string;
  prompt: string;
  language: string;
  complexity: string;
  icon?: string;
}

export const defaultTemplates: TemplateData[] = [
  {
    name: 'Project Plan',
    description: 'Create a comprehensive project plan with phases, milestones, and deliverables',
    category: 'project',
    prompt: `Create a detailed project plan mind map for: {{TOPIC}}

Structure:
1. Project Overview (goals, scope, stakeholders)
2. Phases (initiation, planning, execution, monitoring, closure)
3. Key Milestones with timelines
4. Deliverables for each phase
5. Resources and Team Structure
6. Risk Management
7. Success Criteria

Make it actionable and comprehensive.`,
    language: 'en',
    complexity: 'moderate',
    icon: '📋',
  },
  {
    name: 'Study Notes',
    description: 'Organize study material into a structured learning framework',
    category: 'study',
    prompt: `Create a comprehensive study notes mind map for: {{TOPIC}}

Structure:
1. Core Concepts (main ideas and definitions)
2. Key Terminology (important terms and their meanings)
3. Detailed Explanations (break down complex ideas)
4. Examples and Applications
5. Common Misconceptions
6. Practice Questions
7. Related Topics for Further Study

Make it clear and educational.`,
    language: 'en',
    complexity: 'simple',
    icon: '📚',
  },
  {
    name: 'Timeline',
    description: 'Create a chronological timeline of events',
    category: 'timeline',
    prompt: `Create a chronological timeline mind map for: {{TOPIC}}

Structure:
1. Early Period (origins and foundations)
2. Key Events (major milestones in chronological order)
3. Turning Points (significant changes)
4. Modern Era (recent developments)
5. Impact and Legacy
6. Future Outlook

Include dates and context for each event.`,
    language: 'en',
    complexity: 'simple',
    icon: '📅',
  },
  {
    name: 'Brainstorming',
    description: 'Generate creative ideas and solutions',
    category: 'brainstorm',
    prompt: `Create a creative brainstorming mind map for: {{TOPIC}}

Structure:
1. Problem Definition (what we're solving)
2. Constraints and Requirements
3. Ideas Category A (approach 1)
4. Ideas Category B (approach 2)
5. Ideas Category C (approach 3)
6. Wild Ideas (unconventional approaches)
7. Evaluation Criteria
8. Top Recommendations

Be creative and explore multiple angles.`,
    language: 'en',
    complexity: 'moderate',
    icon: '💡',
  },
  {
    name: 'Decision Analysis',
    description: 'Analyze options and make informed decisions',
    category: 'analysis',
    prompt: `Create a decision analysis mind map for: {{TOPIC}}

Structure:
1. Decision Context (background and importance)
2. Options Available (list all alternatives)
3. Evaluation Criteria (what matters most)
4. Pros and Cons for each option
5. Risk Assessment
6. Cost-Benefit Analysis
7. Recommendation with Reasoning

Be objective and thorough.`,
    language: 'en',
    complexity: 'complex',
    icon: '⚖️',
  },
  {
    name: 'Meeting Agenda',
    description: 'Structure a productive meeting with clear objectives',
    category: 'project',
    prompt: `Create a meeting agenda mind map for: {{TOPIC}}

Structure:
1. Meeting Overview (purpose, date, attendees)
2. Pre-Meeting Preparation
3. Agenda Items (with time allocations)
4. Discussion Points for each item
5. Decisions to be Made
6. Action Items and Owners
7. Follow-up Tasks

Keep it focused and time-conscious.`,
    language: 'en',
    complexity: 'simple',
    icon: '👥',
  },
  {
    name: 'Content Strategy',
    description: 'Plan content creation and distribution strategy',
    category: 'marketing',
    prompt: `Create a content strategy mind map for: {{TOPIC}}

Structure:
1. Audience Analysis (target demographics, needs)
2. Content Pillars (main themes)
3. Content Types (blog, video, social, etc.)
4. Distribution Channels
5. Content Calendar
6. Engagement Tactics
7. Metrics and KPIs

Make it actionable for content creators.`,
    language: 'en',
    complexity: 'moderate',
    icon: '📱',
  },
  {
    name: 'Product Roadmap',
    description: 'Plan product development and feature releases',
    category: 'product',
    prompt: `Create a product roadmap mind map for: {{TOPIC}}

Structure:
1. Product Vision and Goals
2. Current State Assessment
3. Q1 Features and Priorities
4. Q2 Features and Priorities
5. Q3-Q4 Long-term Goals
6. Technical Dependencies
7. Resource Requirements
8. Success Metrics

Focus on strategic priorities.`,
    language: 'en',
    complexity: 'complex',
    icon: '🚀',
  },
  {
    name: 'Research Summary',
    description: 'Synthesize research findings and insights',
    category: 'research',
    prompt: `Create a research summary mind map for: {{TOPIC}}

Structure:
1. Research Question/Hypothesis
2. Methodology (how research was conducted)
3. Key Findings (main discoveries)
4. Supporting Data and Evidence
5. Analysis and Interpretation
6. Limitations and Challenges
7. Conclusions and Implications
8. Future Research Directions

Be rigorous and well-structured.`,
    language: 'en',
    complexity: 'complex',
    icon: '🔬',
  },
  {
    name: 'Book Summary',
    description: 'Summarize and analyze a book\'s key themes',
    category: 'study',
    prompt: `Create a book summary mind map for: {{TOPIC}}

Structure:
1. Book Overview (author, genre, context)
2. Main Themes
3. Key Characters or Concepts
4. Chapter-by-Chapter Breakdown
5. Important Quotes
6. Personal Insights and Reflections
7. Practical Applications
8. Related Reading

Make it comprehensive yet digestible.`,
    language: 'en',
    complexity: 'moderate',
    icon: '📖',
  },
];

export function getTemplatesByCategory(category: string): TemplateData[] {
  return defaultTemplates.filter((t) => t.category === category);
}

export function getTemplateByName(name: string): TemplateData | undefined {
  return defaultTemplates.find((t) => t.name === name);
}

export function getAllCategories(): string[] {
  const categories = new Set(defaultTemplates.map((t) => t.category));
  return Array.from(categories);
}
