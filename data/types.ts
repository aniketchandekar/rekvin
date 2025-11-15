// --- TYPE DEFINITIONS ---

// Simplified types for React Flow data structures
// This avoids a direct dependency on 'reactflow' in the data layer.
export interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: any;
  type?: string;
  width?: number | null;
  height?: number | null;
  [key: string]: any;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface FlowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport?: FlowViewport;
}

export interface ResourceFile {
  type: 'file';
  id: string;
  name: string;
  fileType: string;
  size: number;
  content?: string; // Stored as a data URL
  createdAt: string;
  source: 'user' | 'generated';
  status: 'pending' | 'processing' | 'processed' | 'failed';
  description?: string;
  category?: string;
}

export interface ResourceLink {
  type: 'link';
  id: string;
  url: string;
  createdAt: string;
  source: 'user' | 'generated';
  status: 'pending' | 'processing' | 'processed' | 'failed';
  description?: string;
  category?: string;
}

export type Resource = ResourceFile | ResourceLink;

export type UserRole =
  | 'Product Manager'
  | 'Project Manager'
  | 'UX Designer'
  | 'UI Designer'
  | 'Business Analyst'
  | 'Researcher'
  | 'Developer'
  | 'Other';

export type DesignArtifactStatus = 'Draft' | 'In Review' | 'Approved' | 'Archived';
export type DevTaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface DesignArtifact {
  id: string;
  projectId: string;
  workflowId: string;
  nodeId: string;
  nodeTitle: string; // e.g., "Wireframe"
  version: number;
  status: DesignArtifactStatus;
  createdAt: string;
  content: string; // The SVG, HTML, or Mermaid code
  contentType: 'svg' | 'html' | 'mermaid';
}

export interface DevTask {
  id: string;
  projectId: string;
  title: string;
  status: DevTaskStatus;
  createdAt: string;
  designArtifactId?: string; // Link back to the design artifact
  description?: string; // For tasks generated from PRDs, etc.
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  type: 'B2B' | 'B2C';
  platform: 'Mobile' | 'Desktop';
  userRole: UserRole;
  createdAt: string;
  resources: Resource[];
  workflows: Workflow[];
  designArtifacts: DesignArtifact[];
  devTasks: DevTask[];
}