

import React from 'react';
import { Workflow } from '../../data/types.ts';
import { PlusIcon, EditIcon, TrashIcon, WorkflowIcon } from '../Icons.tsx';

interface WorkflowListViewProps {
    workflows: Workflow[];
    onSelectWorkflow: (workflow: Workflow) => void;
    onAddWorkflow: () => void;
    onEditWorkflow: (workflow: Workflow) => void;
    onDeleteWorkflow: (workflow: Workflow) => void;
}

const WorkflowListView: React.FC<WorkflowListViewProps> = ({
    workflows,
    onSelectWorkflow,
    onAddWorkflow,
    onEditWorkflow,
    onDeleteWorkflow,
}) => {
    return (
        <>
            <div className="flex justify-end items-center mb-6">
                <button
                    onClick={onAddWorkflow}
                    className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm text-slate-100 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-transform transform hover:scale-105"
                >
                    <PlusIcon className="text-lg mr-2 -ml-1" />
                    Add Workflow
                </button>
            </div>

            {workflows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
                    {workflows.map(wf => (
                        <div
                            key={wf.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectWorkflow(wf)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectWorkflow(wf); }}
                            className="relative group bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 flex flex-col h-full border border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
                        >
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEditWorkflow(wf); }}
                                    aria-label={`Edit workflow ${wf.name}`}
                                    className="p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    <EditIcon className="text-base" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteWorkflow(wf); }}
                                    aria-label={`Delete workflow ${wf.name}`}
                                    className="p-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-700/70 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <TrashIcon className="text-base" />
                                </button>
                            </div>
                            <div className="flex-grow">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 pr-12">{wf.name}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{wf.description}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <WorkflowIcon className="text-base" />
                                <span>{wf.nodes.length} nodes, {wf.edges.length} edges</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-6 bg-white/30 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex-grow flex flex-col justify-center items-center">
                    <WorkflowIcon className="text-5xl text-slate-400 dark:text-slate-500" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No Workflows Yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Click "Add Workflow" to create your first one.</p>
                </div>
            )}
        </>
    );
};

export default WorkflowListView;
