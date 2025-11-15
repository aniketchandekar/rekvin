

import React, { useState } from 'react';
import { PlusIcon } from './Icons.tsx';
import CreateProjectModal from './CreateProjectModal.tsx';
import ProjectCard from './ProjectCard.tsx';
import { Project } from '../data/types.ts';

interface HomePageProps {
  projects: Project[];
  addProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'resources' | 'workflows'>) => void;
  deleteProject: (project: Project) => void;
  selectProject: (id: string) => void;
  onEditRequest: (project: Project) => void;
}

const HomePage: React.FC<HomePageProps> = ({ projects, addProject, deleteProject, selectProject, onEditRequest }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleProjectCreate = (projectData: Omit<Project, 'id' | 'createdAt' | 'resources' | 'workflows'>) => {
    addProject(projectData);
    setModalOpen(false);
  };

  return (
    <>
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onProjectCreate={handleProjectCreate}
      />
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-slate-900 dark:text-slate-100 leading-tight">
            Bring Research into Design.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-orange-400 text-transparent bg-clip-text">
              Seamlessly.
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-slate-600 dark:text-slate-400 leading-relaxed">
            Rekvin helps you turn raw research into actionable insights and polished designs, effortlessly.
          </p>
          <div className="mt-10">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center px-6 py-3 font-semibold text-slate-100 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
            >
              <PlusIcon className="text-xl mr-2 -ml-1" />
              Create Project
            </button>
          </div>
        </div>
        
        <div className="w-full max-w-6xl mt-16 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-left mb-6">
            My Projects
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} onDelete={deleteProject} onSelect={selectProject} onEdit={onEditRequest} />
              ))}
            </div>
          ) : (
             <div className="text-center py-10 px-6 bg-white/30 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400">You haven't created any projects yet.</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Click "Create Project" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
