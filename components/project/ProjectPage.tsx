import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Project, Resource, Workflow, DesignArtifact, DevTask, DesignArtifactStatus, DevTaskStatus } from '../../data/types.ts';
import { ChevronRightIcon, ScienceIcon, WorkflowIcon, ViewDesignIcon, CodeIcon } from '../Icons.tsx';
import * as store from '../../data/store.ts';

import ResearchHub from './ResearchHub.tsx';
import WorkflowListView from './WorkflowListView.tsx';
import { WorkflowEditor } from './WorkflowEditor.tsx';
import WorkflowModal from '../modals/WorkflowModal.tsx';
import DeleteConfirmationModal from '../DeleteConfirmationModal.tsx';
import DesignHub from './DesignHub.tsx';
import DevelopmentHub from './DevelopmentHub.tsx';

interface ProjectPageProps {
  project: Project;
  onBack: () => void;
}

type Tab = 'research' | 'workflow' | 'design' | 'development';

const ProjectPage: React.FC<ProjectPageProps> = ({ project, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('workflow');
  
  // State for all project data
  const [resources, setResources] = useState<Resource[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [designArtifacts, setDesignArtifacts] = useState<DesignArtifact[]>([]);
  const [devTasks, setDevTasks] = useState<DevTask[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [isWorkflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  const refreshAllData = useCallback(() => {
    setResources(store.getResourcesForProject(project.id));
    setWorkflows(store.getWorkflowsForProject(project.id));
    setDesignArtifacts(store.getDesignArtifactsForProject(project.id));
    setDevTasks(store.getDevTasksForProject(project.id));
  }, [project.id]);

  useEffect(() => {
    refreshAllData();
    setActiveWorkflow(null); // Reset active workflow when project changes
  }, [project.id, refreshAllData]);

  // --- RESOURCE HANDLERS ---
  const handleAddResources = async (files: File[], links: string[]) => {
    setIsAnalyzing(true);
    await store.addResourcesToProject(project.id, files, links, refreshAllData);
    setIsAnalyzing(false);
  };

  const handleDeleteResource = (resourceId: string) => {
    store.deleteResource(project.id, resourceId);
    refreshAllData();
  };

  // --- WORKFLOW HANDLERS ---
  const handleOpenWorkflowModal = (workflow: Workflow | null) => {
    setEditingWorkflow(workflow);
    setWorkflowModalOpen(true);
  };

  const handleCloseWorkflowModal = () => {
    setEditingWorkflow(null);
    setWorkflowModalOpen(false);
  };
  
  const handleSaveWorkflow = (data: { id?: string; name: string; description: string }) => {
    if (data.id) { // Editing
      const workflowToUpdate = workflows.find(w => w.id === data.id);
      if (workflowToUpdate) {
        store.updateWorkflow(project.id, { ...workflowToUpdate, name: data.name, description: data.description });
      }
    } else { // Creating
      store.addWorkflow(project.id, { name: data.name, description: data.description });
    }
    refreshAllData();
    handleCloseWorkflowModal();
  };

  const handleDeleteWorkflowConfirm = () => {
    if (deletingWorkflow) {
      store.deleteWorkflow(project.id, deletingWorkflow.id);
      refreshAllData();
      setDeletingWorkflow(null);
    }
  };

  // --- DESIGN ARTIFACT HANDLERS ---
  const handleUpdateArtifactStatus = (artifactId: string, status: DesignArtifactStatus) => {
      store.updateDesignArtifactStatus(project.id, artifactId, status);
      refreshAllData();
  };

  // --- DEV TASK HANDLERS ---
  const handleSendToDev = (artifactId: string) => {
      store.addDevTaskFromArtifact(project.id, artifactId);
      refreshAllData();
      setActiveTab('development');
  };
  
  const handleUpdateTaskStatus = (taskId: string, status: DevTaskStatus) => {
      store.updateDevTaskStatus(project.id, taskId, status);
      refreshAllData();
  };


  const tabBaseStyles = "flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-t-sm";
  const activeTabStyles = "border-slate-800 dark:border-slate-200 text-slate-900 dark:text-slate-100";
  const inactiveTabStyles = "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200";

  return (
    <div className="w-full h-full animate-fadeIn flex flex-col">
      <header className={`mb-6 flex-shrink-0 ${activeWorkflow ? 'hidden' : ''}`}>
        <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
          <button onClick={onBack} className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-sm">
            Projects
          </button>
          <ChevronRightIcon className="mx-1 text-base shrink-0" />
          <span className="text-slate-700 dark:text-slate-200 truncate" aria-current="page">
            {project.name}
          </span>
        </nav>
        <div className="mt-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {project.name}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            {project.goal}
          </p>
        </div>
      </header>
      
      <div className={`border-b border-slate-200 dark:border-slate-700 flex-shrink-0 ${activeWorkflow ? 'hidden' : ''}`}>
        <nav className="-mb-px flex space-x-2 sm:space-x-6" aria-label="Tabs">
          <button
            role="tab"
            aria-selected={activeTab === 'research'}
            aria-controls="research-panel"
            id="research-tab"
            onClick={() => setActiveTab('research')}
            className={`${tabBaseStyles} ${activeTab === 'research' ? activeTabStyles : inactiveTabStyles}`}
          >
            <ScienceIcon className="text-lg" />
            Research
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'workflow'}
            aria-controls="workflow-panel"
            id="workflow-tab"
            onClick={() => setActiveTab('workflow')}
            className={`${tabBaseStyles} ${activeTab === 'workflow' ? activeTabStyles : inactiveTabStyles}`}
          >
            <WorkflowIcon className="text-lg" />
            Workflows
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'design'}
            aria-controls="design-panel"
            id="design-tab"
            onClick={() => setActiveTab('design')}
            className={`${tabBaseStyles} ${activeTab === 'design' ? activeTabStyles : inactiveTabStyles}`}
          >
            <ViewDesignIcon className="text-lg" />
            Design
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'development'}
            aria-controls="development-panel"
            id="development-tab"
            onClick={() => setActiveTab('development')}
            className={`${tabBaseStyles} ${activeTab === 'development' ? activeTabStyles : inactiveTabStyles}`}
          >
            <CodeIcon className="text-lg" />
            Development
          </button>
        </nav>
      </div>

      <main className={`${activeWorkflow ? '' : 'mt-8'} flex-1 flex flex-col min-h-0`}>
        {activeTab === 'research' && (
          <div
            id="research-panel"
            role="tabpanel"
            aria-labelledby="research-tab"
            className={`animate-fadeIn flex flex-col h-full ${activeWorkflow ? 'hidden' : ''}`}
          >
            <ResearchHub
              project={project}
              resources={resources}
              onAddResources={handleAddResources}
              onDeleteResource={handleDeleteResource}
              isAnalyzing={isAnalyzing}
              onRefresh={refreshAllData}
            />
          </div>
        )}

        {activeTab === 'workflow' && (
          <div
            id="workflow-panel"
            role="tabpanel"
            aria-labelledby="workflow-tab"
            className="animate-fadeIn flex flex-col h-full"
          >
            {activeWorkflow ? (
              <ReactFlowProvider>
                <WorkflowEditor 
                  project={project} 
                  workflow={activeWorkflow}
                  resources={resources}
                  refreshResources={refreshAllData}
                  onBack={() => {
                    refreshAllData();
                    setActiveWorkflow(null);
                  }}
                  onGoToProjects={onBack}
                />
              </ReactFlowProvider>
            ) : (
              <WorkflowListView
                workflows={workflows}
                onSelectWorkflow={setActiveWorkflow}
                onAddWorkflow={() => handleOpenWorkflowModal(null)}
                onEditWorkflow={handleOpenWorkflowModal}
                onDeleteWorkflow={setDeletingWorkflow}
              />
            )}
          </div>
        )}

        {activeTab === 'design' && (
            <div
                id="design-panel"
                role="tabpanel"
                aria-labelledby="design-tab"
                className={`animate-fadeIn flex flex-col h-full ${activeWorkflow ? 'hidden' : ''}`}
            >
                <DesignHub
                    project={project}
                    artifacts={designArtifacts}
                    onUpdateArtifactStatus={handleUpdateArtifactStatus}
                    onSendToDev={handleSendToDev}
                />
            </div>
        )}
        {activeTab === 'development' && (
            <div
                id="development-panel"
                role="tabpanel"
                aria-labelledby="development-tab"
                className={`animate-fadeIn flex flex-col h-full ${activeWorkflow ? 'hidden' : ''}`}
            >
                <DevelopmentHub
                    project={project}
                    tasks={devTasks}
                    artifacts={designArtifacts}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                />
            </div>
        )}
      </main>

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={handleCloseWorkflowModal}
        onSave={handleSaveWorkflow}
        workflow={editingWorkflow}
      />
      
      {deletingWorkflow && (
        <DeleteConfirmationModal
          isOpen={!!deletingWorkflow}
          onClose={() => setDeletingWorkflow(null)}
          onConfirm={handleDeleteWorkflowConfirm}
          itemName={deletingWorkflow.name}
          itemType="Workflow"
        />
      )}
    </div>
  );
};

export default ProjectPage;