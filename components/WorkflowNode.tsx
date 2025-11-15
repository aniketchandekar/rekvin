

import React, { memo, useMemo } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow';
import { Icon, GripVerticalIcon, TrashIcon, ChevronRightIcon, LoaderIcon, SuggestIcon, ViewDesignIcon, ViewOutputIcon } from './Icons.tsx';
import { workflowNodeCategories, DESIGN_ENABLED_NODES, TEXT_ONLY_NODES } from '../data/workflow-constants.ts';
import { useWorkflowEditor } from '../contexts/WorkflowEditorContext.tsx';

type WorkflowNodeData = {
  title: string;
  icon: string;
  resourceId?: string;
  linkedResourceName?: string;
  isResourceProcessed?: boolean;
  outputStatus?: 'idle' | 'generating' | 'generated' | 'error';
  isSuggestion?: boolean;
};

const categoryMap = new Map<string, string>();
workflowNodeCategories.forEach(category => {
    category.nodes.forEach(node => {
        categoryMap.set(node.title, category.category);
    });
});

const getCategoryColors = (category: string | undefined): { bg: string, text: string } => {
  switch (category) {
    case 'Inputs': return { bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-600 dark:text-sky-400' };
    case 'Product & Project Management': return { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' };
    case 'Research & Synthesis': return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-600 dark:text-green-400' };
    case 'Strategy & Ideation': return { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' };
    case 'Design & Prototyping': return { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-600 dark:text-pink-400' };
    case 'Testing & Validation': return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-600 dark:text-red-400' };
    case 'Figma Integration': return { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-400' };
    default: return { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' };
  }
};

const NodeStatusFooter: React.FC<{ data: WorkflowNodeData; nodeId: string }> = ({ data, nodeId }) => {
    const { openNodeDetails, viewDesign, viewTextOutput } = useWorkflowEditor();

    const isTextOnly = TEXT_ONLY_NODES.includes(data.title);
    const canViewDesign = DESIGN_ENABLED_NODES.includes(data.title) && !isTextOnly;

    let statusElement = null;

    if (data.outputStatus === 'generating') {
        statusElement = <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium"><LoaderIcon className="text-sm animate-spin" /><span>Generating...</span></div>;
    } else if (data.outputStatus === 'error') {
        statusElement = <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium"><Icon iconName="error" className="text-sm" /><span>Error</span></div>;
    } else if (data.outputStatus === 'generated') {
        statusElement = (
            <button 
                onClick={(e) => { e.stopPropagation(); openNodeDetails(nodeId, 'Output'); }}
                className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium hover:text-green-700 dark:hover:text-green-300 hover:underline"
            >
                <Icon iconName="check_circle" className="text-sm" />
                <span>Output generated</span>
            </button>
        );
    } else if (data.isResourceProcessed) {
        statusElement = <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium"><Icon iconName="check_circle" className="text-sm" /><span>Ready to use</span></div>;
    }

    const showFooterActions = data.outputStatus === 'generated';

    if (!statusElement && !showFooterActions) {
        return null;
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex-grow min-w-0">{statusElement}</div>
            {showFooterActions && (
                isTextOnly ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); viewTextOutput(nodeId); }}
                        className="flex items-center gap-1.5 text-xs font-semibold rounded-md px-2 py-1 -my-1 -mr-1 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/40 transition-colors flex-shrink-0"
                    >
                        <ViewOutputIcon className="text-base" />
                        <span>View Output</span>
                    </button>
                ) : canViewDesign ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); viewDesign(nodeId); }}
                        className="flex items-center gap-1.5 text-xs font-semibold rounded-md px-2 py-1 -my-1 -mr-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex-shrink-0"
                    >
                        <ViewDesignIcon className="text-base" />
                        <span>View Design</span>
                    </button>
                ) : null
            )}
        </div>
    );
};

const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, isConnectable, id }) => {
  const { deleteElements } = useReactFlow();
  const { handleSuggest, isSuggestingForNode } = useWorkflowEditor();
  const isLinkedAndProcessed = !!(data.resourceId && data.linkedResourceName && data.isResourceProcessed);
  const isThisNodeSuggesting = isSuggestingForNode === id;

  const { colors } = useMemo(() => {
    const nodeCategory = categoryMap.get(data.title);
    return { colors: getCategoryColors(nodeCategory) };
  }, [data.title]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };
  
  const handleSuggestClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSuggest(id);
  }
  
  const borderClass = useMemo(() => {
    if (data.isSuggestion) return 'border-slate-400/70 dark:border-slate-600/70 border-dashed';
    switch (data.outputStatus) {
      case 'generated': return 'border-green-500 shadow-lg shadow-green-500/20';
      case 'generating': return 'border-blue-500 animate-pulse';
      case 'error': return 'border-red-500';
      default: return isLinkedAndProcessed ? 'border-green-400 dark:border-green-600' : 'border-slate-300 dark:border-slate-700';
    }
  }, [data.outputStatus, isLinkedAndProcessed, data.isSuggestion]);

  const suggestionClass = data.isSuggestion ? 'opacity-60 hover:opacity-100 cursor-pointer' : 'cursor-default';
  const hasFooter = !data.isSuggestion && (data.resourceId || (data.outputStatus && data.outputStatus !== 'idle'));

  return (
    <div className={`group p-0 bg-white dark:bg-slate-800 rounded-lg border-2 shadow-lg w-72 transition-all duration-300 ${borderClass} ${suggestionClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-500" isConnectable={isConnectable && !data.isSuggestion} />
      
      <div className="flex items-center gap-3 p-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 ${colors.bg}`}>
            <Icon iconName={data.icon} className={`text-2xl ${colors.text}`} />
        </div>
        <div className="flex-grow min-w-0 flex items-center justify-between">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 pr-2">{data.title}</p>
            {!data.isSuggestion && <ChevronRightIcon className="text-lg text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />}
        </div>
        {!data.isSuggestion && (
            <div className="flex items-center gap-1 shrink-0">
                <div className="relative group/tooltip">
                    <button onClick={handleSuggestClick} disabled={isThisNodeSuggesting} aria-label="Suggest next process" className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                        {isThisNodeSuggesting ? <LoaderIcon className="text-base animate-spin" /> : <SuggestIcon className="text-base" />}
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">Suggest Next Process</div>
                </div>
                <button onClick={handleDelete} aria-label={`Delete node ${data.title}`} className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrashIcon className="text-base" />
                </button>
                <div className="text-slate-400 dark:text-slate-500 cursor-grab handle">
                    <GripVerticalIcon className="text-lg" />
                </div>
            </div>
        )}
      </div>
      
      {hasFooter && (
        <div className="border-t-2 border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
          {data.resourceId && data.linkedResourceName && (
            <div className="flex items-center gap-2">
              <Icon iconName="file_present" className="text-lg text-slate-600 dark:text-slate-300 flex-shrink-0" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate" title={data.linkedResourceName}>{data.linkedResourceName}</p>
            </div>
          )}
          <NodeStatusFooter data={data} nodeId={id} />
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-slate-500" isConnectable={isConnectable && !data.isSuggestion} />
    </div>
  );
};

export default memo(WorkflowNode);