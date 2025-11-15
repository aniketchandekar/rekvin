import React, { useState, useEffect, useCallback, useMemo, useRef, DragEvent } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    Background,
    type Connection,
    type Edge,
    type Node,
    type Viewport,
    ReactFlowProvider,
} from 'reactflow';
import { Project, Resource, Workflow } from '../../data/types.ts';
import * as store from '../../data/store.ts';
import * as ai from '../../lib/ai.ts';
import { Icon, PanelLeftOpenIcon, PanelLeftCloseIcon } from '../Icons.tsx';
import WorkflowNode from '../WorkflowNode.tsx';
import NodeDetailSidebar, { NodeData } from './NodeDetailSidebar.tsx';
import WorkflowEditorHeader from './workflow/WorkflowEditorHeader.tsx';
import WorkflowComponentSidebar from './workflow/WorkflowComponentSidebar.tsx';
import WorkflowControls from './workflow/WorkflowControls.tsx';
import { WorkflowEditorProvider, SidebarTab } from '../../contexts/WorkflowEditorContext.tsx';
import { DesignModal } from '../modals/DesignModal.tsx';
import OutputModal from '../modals/OutputModal.tsx';
import { getNodeDefByTitle } from '../../data/workflow-constants.ts';
import { type WorkflowTemplate } from '../../data/workflow-templates.ts';

const nodeTypes = { workflowNode: WorkflowNode };

interface WorkflowEditorProps {
    project: Project;
    workflow: Workflow;
    resources: Resource[];
    refreshResources: () => void;
    onBack: () => void;
    onGoToProjects: () => void;
}

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ project, workflow, resources, refreshResources, onBack, onGoToProjects }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { getNodes, getEdges, setViewport, fitView, getNode, deleteElements, screenToFlowPosition, getViewport, zoomIn, zoomOut } = useReactFlow();
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    
    // State for on-canvas suggestions
    const [suggestionNodes, setSuggestionNodes] = useState<Node[]>([]);
    const [suggestionEdges, setSuggestionEdges] = useState<Edge[]>([]);
    const [isSuggestingForNode, setIsSuggestingForNode] = useState<string | null>(null);
    const suggestionSourceNodeId = useRef<string | null>(null);

    const [viewingDesignForNodeId, setViewingDesignForNodeId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [promotedDesigns, setPromotedDesigns] = useState<Set<string>>(new Set());

    useEffect(() => {
        if(toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);


    const [designModalState, setDesignModalState] = useState<{
        isOpen: boolean;
        title: string;
        content: string | null;
        isLoading: boolean;
        error: string | null;
    }>({ isOpen: false, title: '', content: null, isLoading: false, error: null });

    const [outputModalState, setOutputModalState] = useState<{
        isOpen: boolean;
        title: string;
        content: string;
    }>({ isOpen: false, title: '', content: '' });

    const idCounter = useRef(0);

    useEffect(() => {
        const newNodes = workflow.nodes || [];
        const newEdges = workflow.edges || [];

        setNodes(newNodes);
        setEdges(newEdges);

        if (workflow.viewport) {
            setViewport(workflow.viewport);
        } else {
            setTimeout(() => fitView({ duration: 200 }), 10);
        }

        idCounter.current = newNodes.reduce((maxId, node) => {
            const match = node.id.match(/^dndnode_(\d+)$/);
            return match ? Math.max(maxId, parseInt(match[1], 10)) : maxId;
        }, -1) + 1;
        
    }, [workflow, setNodes, setEdges, setViewport, fitView]);


    const [isWorkflowSidebarOpen, setWorkflowSidebarOpen] = useState(true);
    const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
    const [initialSidebarTab, setInitialSidebarTab] = useState<SidebarTab>('About');

    const nodeForSidebar = useMemo(() => {
        if (!selectedNode) return null;
        return nodes.find(n => n.id === selectedNode.id) as Node<NodeData> || null;
    }, [selectedNode, nodes]);
    
    const saveTimeoutRef = useRef<number | null>(null);
    const isSavingRef = useRef(false);

    const saveWorkflow = useCallback((viewport?: Viewport) => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;

        const workflowToSave: store.Workflow = {
            ...workflow,
            nodes: getNodes(),
            edges: getEdges(),
            viewport: viewport || getViewport(),
        };
        store.updateWorkflow(project.id, workflowToSave);

        setTimeout(() => { isSavingRef.current = false; }, 100);

    }, [project.id, workflow, getNodes, getEdges, getViewport]);

    const debouncedSave = useCallback((viewport?: Viewport) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => saveWorkflow(viewport), 500);
    }, [saveWorkflow]);
    
    const isMountedRef = useRef(false);
    useEffect(() => {
        if (isMountedRef.current) debouncedSave();
        else isMountedRef.current = true;
    }, [nodes, edges, debouncedSave]);

    const onMoveEnd = useCallback((_: any, viewport: Viewport) => {
        debouncedSave(viewport);
    }, [debouncedSave]);
    
    const handleNodeDataChange = useCallback((nodeId: string, data: Partial<NodeData>) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    }, [setNodes]);
    
    const openNodeDetails = useCallback((nodeId: string, tab: SidebarTab) => {
        const nodeToSelect = getNode(nodeId) as Node<NodeData> | undefined;
        if (nodeToSelect) {
            setSelectedNode(nodeToSelect);
            setInitialSidebarTab(tab);
        }
    }, [getNode]);

    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node<any>) => {
        if (node.data?.isSuggestion) {
            if (!suggestionSourceNodeId.current) return;
            const newPermanentNode: Node = {
                ...node,
                id: `dndnode_${idCounter.current++}`,
                data: { ...node.data, isSuggestion: false },
            };
            const newPermanentEdge: Edge = {
                id: `e${suggestionSourceNodeId.current}-${newPermanentNode.id}`,
                source: suggestionSourceNodeId.current,
                target: newPermanentNode.id,
            };
            setNodes(nds => nds.concat(newPermanentNode));
            setEdges(eds => addEdge(newPermanentEdge, eds));
            setSuggestionNodes([]);
            setSuggestionEdges([]);
            suggestionSourceNodeId.current = null;
        } else {
            setSelectedNode(node);
            setInitialSidebarTab('About');
            setSuggestionNodes([]);
            setSuggestionEdges([]);
            suggestionSourceNodeId.current = null;
        }
    }, [setNodes, setEdges, setSelectedNode]);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setSuggestionNodes([]);
        setSuggestionEdges([]);
        suggestionSourceNodeId.current = null;
    }, [setSelectedNode]);

    const closeDetailSidebar = useCallback(() => {
        if (selectedNode) {
            setNodes(nds => nds.map(n => ({...n, selected: n.id === selectedNode.id ? false : n.selected })));
        }
        setSelectedNode(null);
    }, [selectedNode, setNodes]);

    const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
    
    const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    
    const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!reactFlowWrapper.current) return;
        
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type) return;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        if (type === 'workflowNode') {
            const nodeData = JSON.parse(event.dataTransfer.getData('application/nodeData'));
            const newNode: Node = {
                id: `dndnode_${idCounter.current++}`,
                type: 'workflowNode',
                position,
                data: { title: nodeData.title, icon: nodeData.icon },
            };
            setNodes((nds) => nds.concat(newNode));
        } else if (type === 'workflowTemplate') {
            const templateData: WorkflowTemplate = JSON.parse(event.dataTransfer.getData('application/templateData'));
            
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];
            let lastNodeId: string | null = null;
            const nodeVerticalSpacing = 120; // vertical space between nodes
            
            templateData.nodeTitles.forEach((title, index) => {
                const nodeDef = getNodeDefByTitle(title);
                if (!nodeDef) return; // Skip if node definition not found
                
                const newNode: Node = {
                    id: `dndnode_${idCounter.current++}`,
                    type: 'workflowNode',
                    position: {
                        x: position.x,
                        y: position.y + (index * nodeVerticalSpacing),
                    },
                    data: { title: nodeDef.title, icon: nodeDef.icon },
                };
                newNodes.push(newNode);

                if (lastNodeId) {
                    const newEdge: Edge = {
                        id: `e${lastNodeId}-${newNode.id}`,
                        source: lastNodeId,
                        target: newNode.id,
                        type: 'smoothstep',
                    };
                    newEdges.push(newEdge);
                }
                lastNodeId = newNode.id;
            });

            if (newNodes.length > 0) {
                setNodes((nds) => nds.concat(newNodes));
                setEdges((eds) => eds.concat(newEdges));
            }
        }
    }, [screenToFlowPosition, setNodes, setEdges]);
    
    const toggleWorkflowSidebar = useCallback(() => setWorkflowSidebarOpen(p => !p), []);
    
    const handleNodeDelete = useCallback((nodeId: string) => {
        deleteElements({ nodes: [{ id: nodeId }] });
        setSelectedNode(null);
    }, [deleteElements]);
    
    const handleSuggest = useCallback(async (sourceNodeId: string) => {
        setIsSuggestingForNode(sourceNodeId);
        suggestionSourceNodeId.current = sourceNodeId;

        try {
            const sourceNode = getNode(sourceNodeId);
            if (!sourceNode) throw new Error("Source node not found");
            
            // This is an async call, so the component can re-render in the meantime
            const results = await ai.suggestNextNodes(sourceNode, project);
            
            // After await, check if the context is still valid. 
            // The user might have clicked something else.
            if (suggestionSourceNodeId.current !== sourceNodeId) {
                return; // Abort if a different suggestion process has started
            }

            if (!results || results.length === 0) {
                setSuggestionNodes([]);
                setSuggestionEdges([]);
                return;
            }

            // IMPORTANT: Re-fetch the source node from the instance *after* the async call
            // to get its most up-to-date position and dimensions.
            const freshSourceNode = getNode(sourceNodeId);
            if (!freshSourceNode) {
                // Node might have been deleted while we were fetching suggestions.
                setSuggestionNodes([]);
                setSuggestionEdges([]);
                return;
            }

            const sourceNodeWidth = freshSourceNode.width || 288; // Default width
            const sourceNodeHeight = freshSourceNode.height || 88; // Default height
            const newNodeWidth = 288;
            const newNodeHeight = 88;

            // Center of the source node
            const sourceCenter = {
                x: freshSourceNode.position.x + sourceNodeWidth / 2,
                y: freshSourceNode.position.y + sourceNodeHeight / 2,
            };

            const radius = 350;
            const angleSpread = Math.PI / 5; // 36 degrees
            const totalAngle = (results.length - 1) * angleSpread;
            const startAngle = -totalAngle / 2; // Center the arc in front of the node

            const newSuggestionNodes: Node[] = results.map((nodeDef, index) => {
                const angle = startAngle + index * angleSpread;
                const position = {
                    x: sourceCenter.x + radius * Math.cos(angle) - newNodeWidth / 2,
                    y: sourceCenter.y + radius * Math.sin(angle) - newNodeHeight / 2,
                };

                return {
                    id: `suggestion_${sourceNodeId}_${nodeDef.title.replace(/\s/g, '')}`,
                    type: 'workflowNode',
                    position,
                    data: { ...nodeDef, isSuggestion: true },
                    width: newNodeWidth,
                    height: newNodeHeight,
                };
            });

            const newSuggestionEdges: Edge[] = newSuggestionNodes.map(targetNode => ({
                id: `s-edge_${sourceNodeId}-${targetNode.id}`,
                source: sourceNodeId,
                target: targetNode.id,
                animated: true,
                type: 'smoothstep',
                style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5 5' },
            }));
            
            // Batch state updates
            setSuggestionNodes(newSuggestionNodes);
            setSuggestionEdges(newSuggestionEdges);

        } catch (e) {
            console.error("Failed to suggest nodes:", e);
            setSuggestionNodes([]);
            setSuggestionEdges([]);
        } finally {
            // Only turn off the loader if this is the currently active suggestion process
            if (suggestionSourceNodeId.current === sourceNodeId) {
                setIsSuggestingForNode(null);
            }
        }
    }, [getNode, project]);

    const handleRunWorkflow = useCallback(async () => {
        setIsRunning(true);
        // Start edge animation
        setEdges(eds => eds.map(e => ({ ...e, animated: true })));

        const currentNodes = getNodes();
        const currentEdges = getEdges();
        
        const sortedNodes = store.topologicalSort(currentNodes, currentEdges);
        const inputNodeTypes = ['Resource', 'Note', 'Project Brief'];

        for (const node of sortedNodes) {
             if (inputNodeTypes.includes(node.data.title)) {
                 // It's an input node. Just ensure it's visually clean and skip processing.
                 setNodes(nds => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, outputStatus: 'idle', outputContent: undefined, designContent: undefined }} : n));
                 continue;
             }

             // Set generating status for processable nodes
             setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, outputStatus: 'generating', designContent: undefined } } : n));
             
             try {
                 const result = await ai.processNodeData(node, project, resources, currentNodes, currentEdges);
                 // On success, set new content and generated status
                 setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, outputContent: result, outputStatus: 'generated', designContent: undefined } } : n));
             } catch(e: any) {
                 // On error, set error status/message and stop
                 setNodes((nds) => nds.map(n => n.id === node.id ? { ...n, data: { ...n.data, outputContent: e.message, outputStatus: 'error', designContent: undefined } } : n));
                 break; // Stop execution on error
             }
        }
        
        setIsRunning(false);
        // Stop edge animation
        setEdges(eds => eds.map(e => ({ ...e, animated: false })));

    }, [getNodes, getEdges, setNodes, setEdges, project, resources]);

    const viewDesign = useCallback(async (nodeId: string) => {
        const node = getNode(nodeId) as Node<NodeData> | undefined;
        if (!node || !node.data.outputContent) return;

        setViewingDesignForNodeId(nodeId);

        if (node.data.designContent) {
            // Use cached design
            setDesignModalState({
                isOpen: true,
                title: node.data.title,
                content: node.data.designContent,
                isLoading: false,
                error: null
            });
        } else {
            // Generate new design
            setDesignModalState({
                isOpen: true,
                title: node.data.title,
                content: null,
                isLoading: true,
                error: null
            });
            try {
                const designCode = await ai.generateVisualDesign(node.data.title, node.data.outputContent, project.platform);
                handleNodeDataChange(nodeId, { designContent: designCode }); // Cache it
                setDesignModalState(prev => ({ ...prev, isLoading: false, content: designCode }));
            } catch (e: any) {
                setDesignModalState(prev => ({ ...prev, isLoading: false, error: e.message }));
            }
        }
    }, [getNode, handleNodeDataChange, project.platform]);

    const regenerateDesign = useCallback(async () => {
        if (!viewingDesignForNodeId) return;

        const node = getNode(viewingDesignForNodeId) as Node<NodeData> | undefined;
        if (!node || !node.data.outputContent) return;
        
        setDesignModalState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const designCode = await ai.generateVisualDesign(node.data.title, node.data.outputContent, project.platform);
            handleNodeDataChange(viewingDesignForNodeId, { designContent: designCode }); // Update cache
            setDesignModalState(prev => ({ ...prev, isLoading: false, content: designCode }));
        } catch (e: any) {
            setDesignModalState(prev => ({ ...prev, isLoading: false, error: e.message }));
        }
    }, [viewingDesignForNodeId, getNode, handleNodeDataChange, project.platform]);

    const closeDesignModal = useCallback(() => {
        setDesignModalState({ isOpen: false, title: '', isLoading: false, content: null, error: null });
        setViewingDesignForNodeId(null);
    }, []);

    const handlePromoteToDesign = useCallback(() => {
        if (!viewingDesignForNodeId || !designModalState.content) return;
        const node = getNode(viewingDesignForNodeId);
        if (!node) return;

        const isHtml = ['Wireframe', 'Prototype', 'Design System'].includes(node.data.title);

        store.addDesignArtifact(project.id, {
            workflowId: workflow.id,
            nodeId: node.id,
            nodeTitle: node.data.title,
            content: designModalState.content,
            contentType: isHtml ? 'html' : 'svg',
        });

        const key = `${workflow.id}-${node.id}-${designModalState.content}`;
        setPromotedDesigns(prev => new Set(prev).add(key));
        setToastMessage(`"${node.data.title}" was promoted to the Design Hub!`);
    }, [viewingDesignForNodeId, designModalState.content, getNode, project.id, workflow.id]);

    const viewTextOutput = useCallback((nodeId: string) => {
        const node = getNode(nodeId) as Node<NodeData> | undefined;
        if (!node || !node.data.outputContent) return;
    
        setOutputModalState({
            isOpen: true,
            title: node.data.title,
            content: node.data.outputContent,
        });
    }, [getNode]);
    
    const closeOutputModal = useCallback(() => {
        setOutputModalState({ isOpen: false, title: '', content: '' });
    }, []);

    const handleClearCanvas = useCallback(() => {
        if(window.confirm('Are you sure you want to clear the canvas? This action will remove all nodes and edges.')) {
            const nodesToRemove = getNodes();
            const edgesToRemove = getEdges();
            deleteElements({ nodes: nodesToRemove, edges: edgesToRemove });
        }
    }, [getNodes, getEdges, deleteElements]);
    
    const providerValue = useMemo(() => ({
        handleSuggest,
        isSuggestingForNode,
        viewDesign,
        viewTextOutput,
        openNodeDetails
    }), [handleSuggest, isSuggestingForNode, viewDesign, viewTextOutput, openNodeDetails]);

    const currentPromotionKey = viewingDesignForNodeId && designModalState.content ? `${workflow.id}-${viewingDesignForNodeId}-${designModalState.content}` : '';
    
    return (
        <WorkflowEditorProvider value={providerValue}>
            <div className="w-full h-full flex flex-col">
                <WorkflowEditorHeader project={project} workflow={workflow} onBack={onBack} onGoToProjects={onGoToProjects} />
                <div className="flex-1 flex min-h-0 relative">
                    <button
                      onClick={toggleWorkflowSidebar}
                      className={`absolute top-1/2 -translate-y-1/2 z-20 p-1.5 bg-slate-100/60 dark:bg-slate-800/60 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 -translate-x-1/2 ${isWorkflowSidebarOpen ? 'left-[18rem]' : 'left-0'}`}
                      aria-label="Toggle component sidebar"
                    >
                      {isWorkflowSidebarOpen ? <PanelLeftCloseIcon className="text-xl" /> : <PanelLeftOpenIcon className="text-xl" />}
                    </button>
                    
                    <WorkflowComponentSidebar isOpen={isWorkflowSidebarOpen} />
                    
                    <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={[...nodes, ...suggestionNodes]}
                            edges={[...edges, ...suggestionEdges]}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={handleNodeClick}
                            onPaneClick={handlePaneClick}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onMoveEnd={onMoveEnd}
                            nodeTypes={nodeTypes}
                            nodeDragThreshold={5}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            proOptions={{ hideAttribution: true }}
                            deleteKeyCode={['Backspace', 'Delete']}
                            panOnDrag={!isLocked}
                            zoomOnScroll={!isLocked}
                            zoomOnDoubleClick={!isLocked}
                            zoomOnPinch={!isLocked}
                            nodesDraggable={!isLocked}
                            nodesConnectable={!isLocked}
                            elementsSelectable={!isLocked}
                        >
                            <Background gap={24} />
                            <WorkflowControls 
                                onRun={handleRunWorkflow}
                                isRunning={isRunning}
                                onZoomIn={() => zoomIn({ duration: 200 })}
                                onZoomOut={() => zoomOut({ duration: 200 })}
                                onFitView={() => fitView({ duration: 200, padding: 0.2 })}
                                onLockToggle={() => setIsLocked(l => !l)}
                                isLocked={isLocked}
                                runDisabled={nodes.length === 0}
                                onClearCanvas={handleClearCanvas}
                            />
                        </ReactFlow>
                    </div>

                    <NodeDetailSidebar
                        node={nodeForSidebar}
                        onClose={closeDetailSidebar}
                        project={project}
                        resources={resources}
                        onNodeDataChange={handleNodeDataChange}
                        refreshResources={refreshResources}
                        onNodeDelete={handleNodeDelete}
                        initialTab={initialSidebarTab}
                    />
                </div>
            </div>
            <DesignModal 
                {...designModalState} 
                onClose={closeDesignModal} 
                onRegenerate={regenerateDesign}
                onPromote={handlePromoteToDesign}
                isPromoted={promotedDesigns.has(currentPromotionKey)}
            />
            <OutputModal {...outputModalState} onClose={closeOutputModal} />
            {toastMessage && <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-2rem)] bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-semibold py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-30">{toastMessage}</div>}
        </WorkflowEditorProvider>
    );
};