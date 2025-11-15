
import { WorkflowNodeDef } from './workflow-constants.ts';

export interface WorkflowTemplate {
  name: string;
  description: string;
  icon: string;
  nodeTitles: string[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    name: 'New Feature Sprint',
    description: 'A complete workflow from project brief to sprint planning and user stories.',
    icon: 'rocket_launch',
    nodeTitles: [
      'Project Brief',
      'Product Requirement Doc',
      'User Story Map',
      'Sprint Planning',
    ],
  },
  {
    name: 'User Research & Persona',
    description: 'Synthesize user interviews and surveys to create a detailed user persona.',
    icon: 'groups',
    nodeTitles: [
      'User Interview',
      'Survey',
      'Synthesize Findings',
      'Create Persona',
      'Problem Statement',
    ],
  },
  {
    name: 'Full Design Process',
    description: 'A comprehensive workflow from initial research synthesis to a final prototype.',
    icon: 'design_services',
    nodeTitles: [
      'Synthesize Findings',
      'Create Persona',
      'Journey Map',
      'User Flow',
      'Wireframe',
      'Prototype',
    ],
  },
  {
    name: 'Competitive Analysis',
    description: 'Analyze competitors and present the key insights and strategic takeaways.',
    icon: 'equalizer',
    nodeTitles: [
      'Competitive Analysis',
      'Synthesize Findings',
      'Present Insights',
    ],
  },
  {
    name: 'A/B Testing Cycle',
    description: 'Plan, execute, and analyze an A/B test to validate a design hypothesis.',
    icon: 'compare_arrows',
    nodeTitles: [
      'Problem Statement',
      'A/B Test',
      'Synthesize Findings',
      'Present Insights',
    ],
  },
  {
    name: 'Ideation to Wireframe',
    description: 'A focused workflow for brainstorming sessions that result in a structural wireframe.',
    icon: 'emoji_objects',
    nodeTitles: [
      'Brainstorming',
      'Affinity Diagram',
      'User Flow',
      'Wireframe',
    ],
  },
];
