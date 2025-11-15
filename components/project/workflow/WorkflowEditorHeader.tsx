

import React from 'react';
import { Project, Workflow } from '../../../data/types.ts';
import { ChevronRightIcon } from '../../Icons.tsx';

interface WorkflowEditorHeaderProps {
    project: Project;
    workflow: Workflow;
    onBack: () => void;
    onGoToProjects: () => void;
}

const WorkflowEditorHeader: React.FC<WorkflowEditorHeaderProps> = ({ project, workflow, onBack, onGoToProjects }) => {
    return (
        <header className="flex-shrink-0">
            <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <button onClick={onGoToProjects} className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-sm">
                    Projects
                </button>
                <ChevronRightIcon className="mx-1 text-base shrink-0" />
                 <span className="text-slate-600 dark:text-slate-300 truncate cursor-default" title={project.name}>
                    {project.name}
                </span>
                <ChevronRightIcon className="mx-1 text-base shrink-0" />
                <button onClick={onBack} className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-500 rounded-sm">
                    Workflows
                </button>
                <ChevronRightIcon className="mx-1 text-base shrink-0" />
                <span className="text-slate-700 dark:text-slate-200 truncate" aria-current="page">
                    {workflow.name}
                </span>
            </nav>
            <div className="mt-4 mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {workflow.name}
                </h1>
                <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400">
                    {workflow.description}
                </p>
            </div>
        </header>
    );
};

export default WorkflowEditorHeader;
