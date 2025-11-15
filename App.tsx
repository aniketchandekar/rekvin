

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import HomePage from './components/HomePage.tsx';
import ProjectPage from './components/project/ProjectPage.tsx';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from './components/Icons.tsx';
import EditProjectModal from './components/EditProjectModal.tsx';
import DeleteConfirmationModal from './components/DeleteConfirmationModal.tsx';
import AboutModal from './components/AboutModal.tsx';
import * as store from './data/store.ts';
import type { Project } from './data/types.ts';


const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);

  const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

  useEffect(() => {
    setProjects(store.getProjects());
  }, [dataVersion]);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'resources' | 'workflows'>) => {
    const newProject = store.addProject(projectData);
    refreshData();
    setActiveProject(newProject);
  }, [refreshData]);
  
  const handleUpdateProject = useCallback((updatedProjectData: Omit<Project, 'createdAt' | 'resources' | 'workflows'>) => {
    const updated = store.updateProject(updatedProjectData);
    refreshData();
    if (activeProject?.id === updatedProjectData.id && updated) {
        // Need to create a new object to trigger re-render in children
        setActiveProject({ ...updated });
    }
    setEditingProject(null);
  }, [activeProject, refreshData]);

  const deleteProject = useCallback((projectId: string) => {
    store.deleteProject(projectId);
    refreshData();
    if (activeProject?.id === projectId) {
      setActiveProject(null);
    }
  }, [activeProject, refreshData]);

  const handleConfirmDelete = useCallback(() => {
    if (deletingProject) {
        deleteProject(deletingProject.id);
        setDeletingProject(null);
    }
  }, [deletingProject, deleteProject]);

  const selectProject = useCallback((projectId: string) => {
    const project = store.getProject(projectId);
    setActiveProject(project || null);
  }, []);

  const goToHome = useCallback(() => {
    setActiveProject(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) { 
      setSidebarOpen(false);
    }
  }, []);

  const mainClasses = `flex-1 p-4 sm:p-6 md:p-12 ${
    activeProject
      ? 'overflow-hidden'
      : 'overflow-y-auto grid place-items-center'
  }`;

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        projects={projects} 
        selectProject={selectProject}
        goToHome={goToHome}
        activeProjectId={activeProject?.id || null}
        onEditRequest={setEditingProject}
        onDeleteRequest={setDeletingProject}
        onOpenAbout={() => setAboutModalOpen(true)}
      />
      <div className="relative flex-1 flex flex-col">
        <button
          onClick={toggleSidebar}
          className="absolute top-6 left-0 z-20 p-1.5 bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 -translate-x-1/2"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <PanelLeftCloseIcon className="text-xl" /> : <PanelLeftOpenIcon className="text-xl" />}
        </button>
        
        <main className={mainClasses}>
           {activeProject ? (
            <ProjectPage project={activeProject} onBack={goToHome} />
           ) : (
            <HomePage 
              projects={projects} 
              addProject={addProject} 
              deleteProject={setDeletingProject} // Pass the setter to open confirmation modal
              selectProject={selectProject}
              onEditRequest={setEditingProject}
            />
           )}
        </main>
      </div>

      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onProjectUpdate={handleUpdateProject}
          project={editingProject}
        />
      )}

      {deletingProject && (
        <DeleteConfirmationModal
          isOpen={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          onConfirm={handleConfirmDelete}
          itemName={deletingProject.name}
          itemType="Project"
        />
      )}

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />
    </div>
  );
};

export default App;
