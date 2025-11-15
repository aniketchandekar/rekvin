

import React from 'react';
import { Project } from '../data/types.ts';
import { TrashIcon, EditIcon, UserRoleIcon } from './Icons.tsx';

interface ProjectCardProps {
  project: Project;
  onDelete: (project: Project) => void;
  onSelect: (id: string) => void;
  onEdit: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onSelect, onEdit }) => {
  const getTagClass = () => {
    return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(project);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(project.id);
    }
  };

  return (
    <div 
      onClick={() => onSelect(project.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View project ${project.name}`}
      className="relative group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col h-full border border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
         <button 
            onClick={handleEdit}
            aria-label={`Edit project ${project.name}`}
            className="p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
         >
            <EditIcon className="text-base" />
         </button>
         <button 
            onClick={handleDelete}
            aria-label={`Delete project ${project.name}`}
            className="p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 hover:text-red-500 dark:hover:text-red-400 transition-colors"
         >
            <TrashIcon className="text-base" />
         </button>
      </div>

      <div className="flex-grow">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 pr-12">{project.name}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{project.goal}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTagClass()}`}>
          {project.type}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTagClass()}`}>
          {project.platform}
        </span>
        {project.userRole && (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${getTagClass()}`}>
            <UserRoleIcon className="text-sm" />
            {project.userRole}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
