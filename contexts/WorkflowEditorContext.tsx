

import { createContext, useContext } from 'react';
import type { Node } from 'reactflow';

export type SidebarTab = 'About' | 'Output' | 'Chat';

interface WorkflowEditorContextType {
  handleSuggest: (sourceNodeId: string) => Promise<void>;
  isSuggestingForNode: string | null;
  viewDesign: (nodeId: string) => void;
  viewTextOutput: (nodeId: string) => void;
  openNodeDetails: (nodeId: string, tab: SidebarTab) => void;
}

const WorkflowEditorContext = createContext<WorkflowEditorContextType | null>(null);

export const useWorkflowEditor = () => {
  const context = useContext(WorkflowEditorContext);
  if (!context) {
    throw new Error('useWorkflowEditor must be used within a WorkflowEditorProvider');
  }
  return context;
};

export const WorkflowEditorProvider = WorkflowEditorContext.Provider;