
import React, { useState, DragEvent } from 'react';
import { workflowNodeCategories, WorkflowNodeDef } from '../../../data/workflow-constants.ts';
import { workflowTemplates, type WorkflowTemplate } from '../../../data/workflow-templates.ts';
import { Icon, ChevronRightIcon } from '../../Icons.tsx';

interface WorkflowComponentSidebarProps {
    isOpen: boolean;
}

// FIX: Changed component signature to React.FC to correctly handle the `key` prop.
const DraggableNode: React.FC<{ nodeDef: WorkflowNodeDef }> = ({ nodeDef }) => {
    const onDragStart = (event: DragEvent<HTMLDivElement>, nodeData: WorkflowNodeDef) => {
        if (nodeData.disabled) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.setData('application/reactflow', 'workflowNode');
        event.dataTransfer.setData('application/nodeData', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const isDisabled = !!nodeDef.disabled;
    const containerClasses = `relative flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all ${
        isDisabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-grab shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
    }`;

    return (
        <div
            onDragStart={(event) => onDragStart(event, nodeDef)}
            draggable={!isDisabled}
            className={containerClasses}
            title={isDisabled ? `${nodeDef.title} (Coming Soon)` : nodeDef.title}
        >
            <Icon iconName={nodeDef.icon} className="text-xl text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate pr-4">{nodeDef.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{nodeDef.description}</p>
            </div>
            {nodeDef.tag && (
                <span className="absolute top-1.5 right-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400/80 text-amber-900 px-1.5 py-0.5 rounded-full">
                    {nodeDef.tag}
                </span>
            )}
        </div>
    );
};

// FIX: Changed component signature to React.FC to correctly handle the `key` prop.
const DraggableTemplate: React.FC<{ template: WorkflowTemplate }> = ({ template }) => {
    const onDragStart = (event: DragEvent<HTMLDivElement>, templateData: WorkflowTemplate) => {
        event.dataTransfer.setData('application/reactflow', 'workflowTemplate');
        event.dataTransfer.setData('application/templateData', JSON.stringify(templateData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const containerClasses = `relative flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-grab shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600`;

    return (
        <div
            onDragStart={(event) => onDragStart(event, template)}
            draggable
            className={containerClasses}
            title={template.name}
        >
            <Icon iconName={template.icon} className="text-xl text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate pr-4">{template.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{template.description}</p>
            </div>
        </div>
    );
};

const WorkflowComponentSidebar: React.FC<WorkflowComponentSidebarProps> = ({ isOpen }) => {
    const [openCategories, setOpenCategories] = useState<Set<string>>(
        new Set(['AI Workflow Templates', workflowNodeCategories[0].category])
    );

    const handleCategoryToggle = (category: string) => {
        setOpenCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    return (
        <aside
            className={`flex-shrink-0 bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-72' : 'w-0'}`}
        >
            <div className="p-4 h-full overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white whitespace-nowrap">Components</h3>
                
                <div className="space-y-1">
                    <div>
                        <button
                            onClick={() => handleCategoryToggle('AI Workflow Templates')}
                            className="w-full flex justify-between items-center p-2 rounded-lg text-left text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                            aria-expanded={openCategories.has('AI Workflow Templates')}
                        >
                            <span className="font-semibold text-sm">AI Workflow Templates</span>
                            <ChevronRightIcon
                                className={`text-lg transition-transform duration-200 ${openCategories.has('AI Workflow Templates') ? 'rotate-90' : ''}`}
                            />
                        </button>
                        <div
                            className={`grid transition-all duration-300 ease-in-out overflow-hidden ${openCategories.has('AI Workflow Templates') ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                            <div className="overflow-hidden">
                                <div className="pt-2 pb-1 pl-2 space-y-2">
                                    {workflowTemplates.map(template => (
                                        <DraggableTemplate key={template.name} template={template} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {workflowNodeCategories.map(({ category, nodes }) => (
                        <div key={category}>
                            <button
                                onClick={() => handleCategoryToggle(category)}
                                className="w-full flex justify-between items-center p-2 rounded-lg text-left text-slate-800 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
                                aria-expanded={openCategories.has(category)}
                            >
                                <span className="font-semibold text-sm">{category}</span>
                                <ChevronRightIcon
                                    className={`text-lg transition-transform duration-200 ${openCategories.has(category) ? 'rotate-90' : ''}`}
                                />
                            </button>
                            <div
                                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${openCategories.has(category) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-2 pb-1 pl-2 space-y-2">
                                        {nodes.map(node => (
                                            <DraggableNode key={node.title} nodeDef={node} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default WorkflowComponentSidebar;
