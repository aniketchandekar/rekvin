

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useReactFlow, type Node, type Edge } from 'reactflow';
import { Project, Resource } from '../../data/types.ts';
import * as store from '../../data/store.ts';
import * as ai from '../../lib/ai.ts';
import { GoogleGenAI } from "@google/genai";
import { Icon, UploadCloudIcon, LoaderIcon, XIcon, TrashIcon, LinkIcon } from '../Icons.tsx';
import { useWorkflowEditor, SidebarTab } from '../../contexts/WorkflowEditorContext.tsx';
import { DESIGN_ENABLED_NODES, TEXT_ONLY_NODES } from '../../data/workflow-constants.ts';

// --- TYPE DEFINITIONS ---
type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
  suggestions?: string[];
};

export type NodeData = {
  title: string;
  icon: string;
  resourceId?: string;
  linkedResourceName?: string;
  isResourceProcessed?: boolean;
  customDescription?: string;
  tags?: string[];
  chatHistory?: ChatMessage[];
  outputContent?: string;
  outputStatus?: 'idle' | 'generating' | 'generated' | 'error';
  designContent?: string;
};

// --- HELPER & CHILD COMPONENTS ---

const ThreeDotsLoader = () => (
    <div className="three-dots-loader flex items-center space-x-1.5 p-2">
        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
        <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full"></span>
    </div>
);

const NodeConnections = ({ nodeId }: { nodeId: string }) => {
    const { getEdges, getNode } = useReactFlow();
    const incomingEdges = useMemo(() => getEdges().filter(edge => edge.target === nodeId), [getEdges, nodeId]);
    const outgoingEdges = useMemo(() => getEdges().filter(edge => edge.source === nodeId), [getEdges, nodeId]);

    const renderConnections = (edges: Edge[], type: 'input' | 'output') => {
        if (edges.length === 0) {
            return <p className="text-sm text-slate-500 dark:text-slate-400 italic">No nodes connected to {type}.</p>
        }
        return edges.map(edge => {
            const connectedNode = getNode(type === 'input' ? edge.source : edge.target);
            return (
                <div key={edge.id} className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Icon iconName={connectedNode?.data.icon || 'circle'} className="text-lg"/>
                    <span className="font-medium truncate" title={connectedNode?.data.title}>{connectedNode?.data.title || 'Unknown Node'}</span>
                </div>
            );
        });
    };

    return (
        <>
            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Connected Inputs</label>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg space-y-2">
                    {renderConnections(incomingEdges, 'input')}
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Connected Outputs</label>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg space-y-2">
                    {renderConnections(outgoingEdges, 'output')}
                </div>
            </div>
        </>
    );
};

const CustomDescription = ({ value, onChange, placeholder }: { value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Node Description</label>
        <textarea
            value={value}
            onChange={onChange}
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500 text-sm"
            placeholder={placeholder}
        />
    </div>
);

// --- UNIFIED "ABOUT" TAB ---

const NodeAboutTab = ({ node, resources, onNodeDataChange, project, refreshResources, setToastMessage }: { node: Node<NodeData>, resources: Resource[], onNodeDataChange: (nodeId: string, data: Partial<NodeData>) => void, project: Project, refreshResources: () => void, setToastMessage: (message: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false);
    const linkedResource = useMemo(() => resources.find(r => r.id === node.data.resourceId), [resources, node.data.resourceId]);

    const handleResourceLink = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const resourceId = e.target.value;
        const resource = resources.find(r => r.id === resourceId);
        onNodeDataChange(node.id, {
            resourceId: resourceId || undefined,
            linkedResourceName: resource ? (resource.type === 'file' ? resource.name : resource.url) : undefined,
            isResourceProcessed: resource ? resource.status === 'processed' : undefined,
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setToastMessage('Analyzing new file...');
        try {
            const newResources = await store.addResourcesToProject(project.id, [file], [], refreshResources);
            if (newResources.length > 0) {
                const newResource = newResources[0];
                onNodeDataChange(node.id, {
                    resourceId: newResource.id,
                    linkedResourceName: newResource.type === 'file' ? newResource.name : newResource.url,
                    isResourceProcessed: newResource.status === 'processed',
                });
                setToastMessage('File analyzed & linked!');
            }
        } catch (error) {
            setToastMessage(`Analysis failed for new file.`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-4 space-y-6">
            <NodeConnections nodeId={node.id} />
            
            {node.data.title === 'Project Brief' && (
                <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Project Name</label>
                        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200">{project.name}</div>
                    </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Project Goal</label>
                        <div className="p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300">{project.goal}</div>
                    </div>
                </div>
            )}
            
            <CustomDescription value={node.data.customDescription || ''} onChange={(e) => onNodeDataChange(node.id, { customDescription: e.target.value })} placeholder="Add a custom description or context for this node..."/>

            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                 <div>
                    <label htmlFor="resource-select" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Link from Resource Hub</label>
                    <select id="resource-select" value={node.data.resourceId || ''} onChange={handleResourceLink} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500 text-sm">
                        <option value="">-- Select a resource --</option>
                        {resources.filter(r => r.status === 'processed').map(r => ( <option key={r.id} value={r.id}> {r.type === 'file' ? r.name : r.url} </option>))}
                    </select>
                </div>
                 <div>
                     <label htmlFor="file-upload-node" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Or Upload New</label>
                     <div className="relative">
                        <button disabled={isUploading} onClick={() => document.getElementById(`file-upload-node-${node.id}`)?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-wait">
                            {isUploading ? <LoaderIcon className="animate-spin text-lg"/> : <UploadCloudIcon className="text-lg"/>}
                            {isUploading ? 'Analyzing...' : 'Upload & Analyze File'}
                        </button>
                        <input id={`file-upload-node-${node.id}`} type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                     </div>
                </div>
                {linkedResource && (
                     <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="text-lg text-slate-600 dark:text-slate-300 flex-shrink-0" />
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate" title={linkedResource.type === 'file' ? linkedResource.name : linkedResource.url}>
                              {linkedResource.type === 'file' ? linkedResource.name : linkedResource.url}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            {linkedResource.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- UNIFIED "OUTPUT" TAB ---

const NodeOutputTab = ({ node, project, resources, onNodeDataChange }: { node: Node<NodeData>, project: Project, resources: Resource[], onNodeDataChange: (id: string, data: Partial<NodeData>) => void }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const { getNodes, getEdges } = useReactFlow();
    const { viewDesign, viewTextOutput } = useWorkflowEditor();
    
    const isTextOnly = useMemo(() => TEXT_ONLY_NODES.includes(node.data.title), [node.data.title]);
    const canViewDesign = useMemo(() => DESIGN_ENABLED_NODES.includes(node.data.title) && !isTextOnly, [node.data.title, isTextOnly]);


    const handleGenerate = async () => {
        setIsGenerating(true);
        onNodeDataChange(node.id, { outputStatus: 'generating', designContent: undefined });
        try {
            const allNodes = getNodes();
            const allEdges = getEdges();
            const report = await ai.processNodeData(node, project, resources, allNodes, allEdges);
            onNodeDataChange(node.id, { outputStatus: 'generated', outputContent: report, designContent: undefined });
        } catch (e: any) {
            onNodeDataChange(node.id, { outputStatus: 'error', outputContent: e.message, designContent: undefined });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopy = useCallback(() => {
        if (!node.data.outputContent) return;
        navigator.clipboard.writeText(node.data.outputContent).then(() => {
            setIsCopied(true);
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        });
    }, [node.data.outputContent]);

    const handleDownload = () => {
        if (!node.data.outputContent) return;
        const blob = new Blob([node.data.outputContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${node.data.title.replace(/\s+/g, '_')}_Output.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderContent = () => {
        const currentStatus = isGenerating ? 'generating' : node.data.outputStatus;

        switch (currentStatus) {
            case 'generating':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-4">
                        <LoaderIcon className="text-4xl animate-spin" />
                        <p className="mt-4 font-semibold">Generating Output...</p>
                        <p className="text-sm">This may take a moment.</p>
                    </div>
                );
            case 'generated':
                return (
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/50">
                        {(canViewDesign || isTextOnly) && (
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                {isTextOnly ? (
                                    <button
                                        onClick={() => viewTextOutput(node.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <Icon iconName="article" className="text-lg" />
                                        View Output
                                    </button>
                                ) : canViewDesign ? (
                                    <button
                                        onClick={() => viewDesign(node.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                    >
                                        <Icon iconName="style" className="text-lg" />
                                        View Design
                                    </button>
                                ) : null}
                            </div>
                        )}
                        <div className="flex-grow overflow-y-auto p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-inner p-4">
                                <pre className="font-sans text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                                    {node.data.outputContent}
                                </pre>
                            </div>
                        </div>
                        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 space-y-3 bg-slate-100 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleCopy} 
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border ${isCopied ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                >
                                    <Icon iconName={isCopied ? 'check' : 'content_copy'} className="text-base" />
                                    {isCopied ? 'Copied!' : 'Copy'}
                                </button>
                                <button 
                                    onClick={handleDownload} 
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
                                >
                                    <Icon iconName="download" className="text-base" />
                                    Download
                                </button>
                            </div>
                            <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50 disabled:cursor-wait">
                                Regenerate Output
                            </button>
                        </div>
                    </div>
                );
            case 'error':
                 return (
                    <div className="p-4 space-y-3 text-center">
                         <Icon iconName="error" className="text-5xl mx-auto text-red-500" />
                         <h4 className="text-lg font-semibold text-red-700 dark:text-red-400">Generation Failed</h4>
                         <p className="text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded-md text-red-800 dark:text-red-300">{node.data.outputContent || 'An unknown error occurred.'}</p>
                         <button onClick={handleGenerate} disabled={isGenerating} className="w-full mt-4 px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-300">
                            Try Again
                        </button>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-4 text-center">
                        <Icon iconName={node.data.icon} className="text-5xl opacity-50" />
                        <p className="mt-4 font-semibold">Generate an Output</p>
                        <p className="text-sm px-4">Click the button below to generate an output for the "{node.data.title}" node.</p>
                        <button onClick={handleGenerate} disabled={isGenerating} className="mt-6 w-full max-w-xs px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-300">
                            Generate Output
                        </button>
                    </div>
                );
        }
    }
    return <div className="h-full flex flex-col">{renderContent()}</div>;
};

// --- CHAT TAB COMPONENT ---

const ChatTab = ({ node, resources, onNodeDataChange, project }: { node: Node<NodeData>, resources: Resource[], onNodeDataChange: (nodeId: string, data: Partial<NodeData>) => void, project: Project }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chat = useMemo(() => {
        if (!process.env.API_KEY) return null;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const projectContext = `You are a helpful design research assistant for a project named "${project.name}" with the goal: "${project.goal}". The user is currently focused on a workflow task: "${node.data.title}".`;
        
        const resourceContext = resources
            .filter(r => r.status === 'processed')
            .map(r => `- ${r.type === 'file' ? r.name : r.url}: ${r.description || 'No description.'}`)
            .join('\n');

        const linkedResourceContext = node.data.resourceId ? resources.find(r => r.id === node.data.resourceId) : null;
        const linkedContext = linkedResourceContext ? `The user has specifically linked this resource to the current node:\n- ${linkedResourceContext.type === 'file' ? linkedResourceContext.name : linkedResourceContext.url}: ${linkedResourceContext.description}` : "No specific resource is linked to this node.";

        const systemInstruction = `${projectContext}
${linkedContext}
Refer to the following available research resources if relevant:
${resourceContext || "No other resources available."}

Based on this context, please answer the user's questions. Keep your responses concise and focused. 
ALWAYS respond with a valid JSON object in the following format, with no markdown formatting or other text: {"answer": "Your response...", "follow_up_questions": ["Relevant question 1", "Relevant question 2", "Relevant question 3"]}`;

        return ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction, responseMimeType: "application/json" },
            history: node.data.chatHistory?.map(m => ({ role: m.role, parts: m.parts }))
        });
    }, [resources, node.data.title, node.data.chatHistory, node.data.resourceId, project.name, project.goal]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [node.data.chatHistory]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !chat || isLoading) return;
        setInput('');
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', parts: [{ text }] };
        const updatedHistory = [...(node.data.chatHistory || []), userMessage];
        onNodeDataChange(node.id, { chatHistory: updatedHistory });

        try {
            const result = await chat.sendMessage({ message: text });
            let jsonStr = result.text.trim();
            const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[2]) { jsonStr = match[2].trim(); }
            const parsedResponse = JSON.parse(jsonStr);

            const modelMessage: ChatMessage = {
                role: 'model',
                parts: [{ text: parsedResponse.answer || "Sorry, I couldn't generate a proper response." }],
                suggestions: (parsedResponse.follow_up_questions || []).slice(0, 3)
            };
            onNodeDataChange(node.id, { chatHistory: [...updatedHistory, modelMessage] });
        } catch (error) {
            console.error("Chat API error:", error);
            const errorHistory = [...updatedHistory, { role: 'model' as const, parts: [{ text: "Sorry, I encountered an error. Please try again." }] }];
            onNodeDataChange(node.id, { chatHistory: errorHistory });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!chat) {
        return <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 h-full flex items-center justify-center">Please add and analyze resources in the Research Hub to begin a chat.</div>
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {(node.data.chatHistory || []).map((msg, index) => {
                    const isLastMessage = index === (node.data.chatHistory?.length || 0) - 1;
                    return (
                        <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-start gap-2.5 w-full ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                <div className={`flex flex-col max-w-[280px] sm:max-w-[320px] leading-1.5 p-3 ${msg.role === 'user' ? 'rounded-s-xl rounded-ee-xl bg-blue-500 dark:bg-blue-600' : 'rounded-e-xl rounded-es-xl bg-white dark:bg-slate-700'}`}>
                                    <p className={`text-sm font-normal break-words ${msg.role === 'user' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{msg.parts[0].text}</p>
                                </div>
                            </div>
                            {msg.role === 'model' && msg.suggestions?.length && isLastMessage && !isLoading && (
                                <div className="mt-2 w-full max-w-[280px] sm:max-w-[320px] flex flex-col gap-2">
                                    {msg.suggestions.map((q, i) => <button key={i} onClick={() => sendMessage(q)} className="w-full text-left px-3 py-1.5 text-xs bg-slate-200/60 dark:bg-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-800 dark:text-slate-200">{q}</button>)}
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && <div className="flex items-start gap-2.5"><div className="flex items-center justify-start w-full max-w-[280px] leading-1.5 p-1 rounded-e-xl rounded-es-xl bg-white dark:bg-slate-700"><ThreeDotsLoader /></div></div>}
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this node..." disabled={isLoading} className="w-full px-3 py-2 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500 text-sm" />
                    <button type="submit" disabled={isLoading || !input.trim()} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed"><Icon iconName="send" className="text-xl"/></button>
                </div>
            </form>
        </div>
    );
};


// --- NODE DETAILS CONTAINER ---

const NodeDetailsView = ({ node, onClose, onNodeDelete, initialTab, ...props }: {
    node: Node<NodeData>,
    onClose: () => void,
    onNodeDelete: (nodeId: string) => void,
    resources: Resource[],
    onNodeDataChange: (nodeId: string, data: Partial<NodeData>) => void,
    project: Project,
    refreshResources: () => void,
    initialTab: SidebarTab;
}) => {
    const isInputNode = useMemo(() => {
        // Define titles of nodes that are purely for input and don't generate their own output.
        const inputNodeTitles = ['Resource', 'Note', 'Project Brief'];
        return inputNodeTitles.includes(node.data.title);
    }, [node.data.title]);
    
    // FIX: Simplified TABS definition to remove useMemo and ensure correct type inference.
    const TABS: SidebarTab[] = isInputNode ? ['About', 'Chat'] : ['About', 'Output', 'Chat'];

    const [activeTab, setActiveTab] = useState<SidebarTab>(initialTab);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        // When a new node is selected or initialTab prop changes, update the active tab.
        setActiveTab(initialTab);
    }, [node.id, initialTab]);

    useEffect(() => {
        if(toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleDelete = () => {
        onNodeDelete(node.id);
    };

    return (
        <div className="flex flex-col h-full w-full animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2" title={node.data.title}>{node.data.title}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleDelete} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors" aria-label="Delete node">
                        <TrashIcon className="text-xl" />
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close details">
                        <XIcon className="text-xl" />
                    </button>
                </div>
            </div>
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 p-1">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg">
                     {TABS.map(tabName => (
                        <button
                            key={tabName}
                            onClick={() => setActiveTab(tabName)}
                            className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 first:rounded-l-lg last:rounded-r-lg ${activeTab === tabName ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
                        >
                            {tabName}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto relative bg-slate-50 dark:bg-slate-800/50">
                {activeTab === 'About' && <NodeAboutTab node={node} {...props} setToastMessage={setToastMessage} />}
                {activeTab === 'Output' && <NodeOutputTab node={node} project={props.project} resources={props.resources} onNodeDataChange={props.onNodeDataChange} />}
                {activeTab === 'Chat' && <ChatTab node={node} {...props} />}
                {toastMessage && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[calc(100%-2rem)] bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-semibold py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-10">{toastMessage}</div>}
            </div>
        </div>
    )
}

// --- MAIN EXPORT ---

interface NodeDetailSidebarProps {
    node: Node<NodeData> | null;
    onClose: () => void;
    project: Project;
    resources: Resource[];
    onNodeDataChange: (nodeId: string, data: Partial<NodeData>) => void;
    refreshResources: () => void;
    onNodeDelete: (nodeId: string) => void;
    initialTab: SidebarTab;
}

const NodeDetailSidebar: React.FC<NodeDetailSidebarProps> = ({ node, onClose, onNodeDelete, initialTab = 'About', ...props }) => {
    return (
        <aside className={`flex-shrink-0 bg-slate-100/50 dark:bg-slate-900/40 backdrop-blur-lg border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${node ? 'w-80 md:w-96' : 'w-0'}`}>
            {node && <NodeDetailsView node={node} onClose={onClose} onNodeDelete={onNodeDelete} initialTab={initialTab} {...props} />}
        </aside>
    );
};

export default NodeDetailSidebar;