

export type WorkflowNodeDef = {
  title: string;
  description: string;
  icon: string;
  disabled?: boolean;
  tag?: string;
};

export type WorkflowNodeCategory = {
  category: string;
  nodes: WorkflowNodeDef[];
};

export const workflowNodeCategories: WorkflowNodeCategory[] = [
  {
    category: 'Inputs',
    nodes: [
      { title: 'Resource', description: 'Reference a single research resource', icon: 'topic' },
      { title: 'Note', description: 'Add a freeform text-based note', icon: 'edit_note' },
    ],
  },
  {
    category: 'Product & Project Management',
    nodes: [
      { title: 'Project Brief', description: 'Define scope and goals', icon: 'description' },
      { title: 'Product Requirement Doc', description: 'Draft detailed product specifications', icon: 'assignment' },
      { title: 'User Story Map', description: 'Outline user stories and epics', icon: 'signpost' },
      { title: 'Competitive Analysis', description: 'Evaluate competitor products', icon: 'equalizer' },
      { title: 'Define KPIs', description: 'Set key performance indicators', icon: 'query_stats' },
      { title: 'Sprint Planning', description: 'Organize agile ceremonies', icon: 'event' },
      { title: 'Roadmap', description: 'Visualize project timeline', icon: 'timeline' },
    ],
  },
  {
    category: 'Research & Synthesis',
    nodes: [
      { title: 'User Interview', description: 'Conduct 1:1 sessions', icon: 'record_voice_over' },
      { title: 'Survey', description: 'Distribute questionnaires', icon: 'poll' },
      { title: 'Usability Test', description: 'Observe user interactions', icon: 'rule' },
      { title: 'Synthesize Findings', description: 'Analyze collected data', icon: 'psychology_alt' },
      { title: 'Affinity Diagram', description: 'Group and theme ideas', icon: 'hub' },
    ],
  },
  {
    category: 'Strategy & Ideation',
    nodes: [
      { title: 'Create Persona', description: 'Define user archetypes', icon: 'person' },
      { title: 'Journey Map', description: 'Visualize user experience', icon: 'map' },
      { title: 'Problem Statement', description: 'Articulate user needs', icon: 'task_alt' },
      { title: 'Brainstorming', description: 'Generate creative ideas', icon: 'emoji_objects' },
    ],
  },
  {
    category: 'Design & Prototyping',
    nodes: [
      { title: 'User Flow', description: 'Map out screen sequences', icon: 'account_tree' },
      { title: 'Wireframe', description: 'Create low-fidelity layouts', icon: 'web_asset' },
      { title: 'Prototype', description: 'Build interactive mockups', icon: 'smart_screen' },
      { title: 'Design System', description: 'Define visual language', icon: 'palette' },
    ],
  },
  {
    category: 'Testing & Validation',
    nodes: [
      { title: 'A/B Test', description: 'Compare design variants', icon: 'compare_arrows' },
      { title: 'Preference Test', description: 'Gauge user preferences', icon: 'fact_check' },
      { title: 'Present Insights', description: 'Share key findings', icon: 'insights' },
    ],
  },
];

export const allWorkflowNodes: WorkflowNodeDef[] = workflowNodeCategories.flatMap(category => category.nodes);

const allWorkflowNodesMap = new Map<string, WorkflowNodeDef>(
    allWorkflowNodes.map(node => [node.title, node])
);

export const getNodeDefByTitle = (title: string): WorkflowNodeDef | undefined => {
    return allWorkflowNodesMap.get(title);
};

export const DESIGN_ENABLED_NODES = [ 'Affinity Diagram', 'Create Persona', 'Journey Map', 'Brainstorming', 'User Flow', 'Wireframe', 'User Story Map', 'Roadmap', 'Prototype', 'Design System' ];

export const MERMAID_ENABLED_NODES = [ 'User Story Map', 'User Flow', 'Journey Map', 'Roadmap', 'Affinity Diagram' ];

export const HTML_DESIGN_NODES = ['Wireframe', 'Prototype', 'Design System', 'Create Persona', 'Brainstorming'];

export const TEXT_ONLY_NODES = [
    'Project Brief',
    'Product Requirement Doc',
    'Competitive Analysis',
    'Define KPIs',
    'Sprint Planning',
    'User Interview',
    'Survey',
    'Usability Test',
    'Synthesize Findings',
    'Problem Statement',
    'A/B Test',
    'Preference Test',
    'Present Insights',
    'Note',
    'Resource'
];