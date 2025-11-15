
import React, { useState, useMemo, useCallback } from 'react';
import { Project, Resource } from '../../data/types.ts';
import { PlusIcon, SearchIcon, UploadCloudIcon, TrashIcon, FileTextIcon, LinkIcon, LoaderIcon, AlertTriangleIcon, DownloadIcon } from '../Icons.tsx';
import AddResourceView from '../AddResourceView.tsx';
import TagEditor from '../TagEditor.tsx';

interface ResearchHubProps {
    project: Project;
    resources: Resource[];
    onAddResources: (files: File[], links:string[]) => Promise<void>;
    onDeleteResource: (resourceId: string) => void;
    isAnalyzing: boolean;
    onRefresh: () => void;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ project, resources, onAddResources, onDeleteResource, isAnalyzing, onRefresh }) => {
    const [isAddingResource, setIsAddingResource] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        resources.forEach(resource => {
            if (resource.status === 'processed' && resource.category) {
                tags.add(resource.category);
            }
        });
        // Add 'Uploaded' and 'Generated' for filtering but not for editing suggestions
        // FIX: Replaced problematic filter/map with a simple, type-safe loop.
        resources.forEach(r => {
            if (r.source === 'user') {
                tags.add('Uploaded');
            } else if (r.source === 'generated') {
                tags.add('Generated');
            }
        });
        
        return Array.from(tags).sort();
    }, [resources]);

    const editableTags = useMemo(() => {
        const tags = new Set<string>();
        resources.forEach(resource => {
            if (resource.status === 'processed' && resource.category) {
                tags.add(resource.category);
            }
        });
        return Array.from(tags).sort();
    }, [resources]);

    const filteredResources = useMemo(() => {
        return resources
            .filter(resource => { // Filter by tags (AND logic)
                if (activeFilters.length === 0) return true;

                const resourceTags = new Set<string>();
                if (resource.status === 'processed' && resource.category) {
                    resourceTags.add(resource.category);
                }
                if (resource.source === 'user') {
                    resourceTags.add('Uploaded');
                }
                 if (resource.source === 'generated') {
                    resourceTags.add('Generated');
                }

                return activeFilters.every(filter => resourceTags.has(filter));
            })
            .filter(resource => { // Filter by search term
                if (!searchTerm) return true;
                const name = resource.type === 'file' ? resource.name : resource.url;
                const description = resource.description || '';
                const category = resource.category || '';
                const searchTermLower = searchTerm.toLowerCase();

                return name.toLowerCase().includes(searchTermLower) ||
                    description.toLowerCase().includes(searchTermLower) ||
                    category.toLowerCase().includes(searchTermLower);
            });
    }, [resources, activeFilters, searchTerm]);

    const handleAddResourcesAndClose = async (files: File[], links: string[]) => {
        setIsAddingResource(false);
        await onAddResources(files, links);
    };

    const handleFilterToggle = (tag: string) => {
        setActiveFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(tag)) {
                newFilters.delete(tag);
            } else {
                newFilters.add(tag);
            }
            return Array.from(newFilters);
        });
    };

    const clearFilters = () => {
        setActiveFilters([]);
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <>
            <div className="flex-shrink-0">
                <div className="relative mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="text-slate-400 dark:text-slate-500 text-xl" />
                            </div>
                            <input
                                type="search"
                                name="search"
                                id="search"
                                className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-500"
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddingResource(prev => !prev)}
                            disabled={isAnalyzing}
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusIcon className="mr-2 -ml-1 text-xl" />
                            Add Resource
                        </button>
                    </div>

                    <div className={`absolute top-full right-0 w-full sm:max-w-md z-20 mt-2 transition-all duration-300 ease-out ${isAddingResource ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'}`}>
                        <AddResourceView
                            onClose={() => setIsAddingResource(false)}
                            onAddResources={handleAddResourcesAndClose}
                        />
                    </div>
                </div>

                {resources.length > 0 && availableTags.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">Filter by:</span>
                        <button
                            onClick={clearFilters}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${activeFilters.length === 0 ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            All
                        </button>
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => handleFilterToggle(tag)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors border ${activeFilters.includes(tag) ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-transparent ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 dark:ring-offset-slate-900' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
                {filteredResources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredResources.map(resource => (
                            <div key={resource.id} className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-lg p-5 flex flex-col transition-all hover:shadow-md border border-slate-200 dark:border-slate-700/80 animate-fadeIn h-full">
                                <div className="flex-grow flex flex-col">
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3 flex-grow min-w-0">
                                            <div className="flex-shrink-0 text-slate-500 dark:text-slate-400">
                                                {resource.type === 'file' ? <FileTextIcon className="text-xl" /> : <LinkIcon className="text-xl" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {resource.type === 'file' ? resource.name : <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{resource.url}</a>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 -mt-1 -mr-1 flex items-center">
                                            {resource.type === 'file' && resource.content && (
                                                <a
                                                    href={resource.content}
                                                    download={resource.name}
                                                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700/50"
                                                    aria-label={`Download file ${resource.name}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <DownloadIcon className="text-lg" />
                                                </a>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteResource(resource.id); }}
                                                aria-label={`Delete resource ${resource.type === 'file' ? resource.name : resource.url}`}
                                                className="p-2 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                                            >
                                                <TrashIcon className="text-lg" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-grow min-h-[4rem]">
                                        {resource.status === 'processing' ? (
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <LoaderIcon className="text-base animate-spin" />
                                                <span className="text-sm">Analyzing...</span>
                                            </div>
                                        ) : resource.status === 'processed' ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {resource.description || <span className="italic">No description available.</span>}
                                            </p>
                                        ) : resource.status === 'failed' ? (
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-500">
                                                    <AlertTriangleIcon className="text-base flex-shrink-0" />
                                                    <span className="text-sm font-semibold">Analysis Failed</span>
                                                </div>
                                                {resource.description && (
                                                    <p className="mt-1.5 text-xs text-red-700 dark:text-red-500/90 bg-red-50 dark:bg-red-900/20 p-2 rounded-md" title={resource.description}>
                                                        {resource.description}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-slate-500 dark:text-slate-400 flex items-center flex-wrap text-xs">
                                                <span>{resource.type === 'file' ? `File • ${formatBytes(resource.size)}` : 'Link'}</span>
                                                <span className="mx-1.5">&bull;</span>
                                                <span>Added {new Date(resource.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                                    {resource.status === 'processed' && (
                                        <TagEditor
                                            projectId={project.id}
                                            resource={resource}
                                            allCategories={editableTags}
                                            onUpdate={onRefresh}
                                        />
                                    )}
                                    {resource.source === 'user' && (
                                        <span className="whitespace-nowrap inline-block bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full text-xs font-medium">Uploaded</span>
                                    )}
                                    {resource.source === 'generated' && (
                                        <span className="whitespace-nowrap inline-block bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-full text-xs font-medium">Generated</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/30 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center flex flex-col items-center justify-center min-h-[300px] h-full transition-all">
                        {resources.length > 0 ? (
                            <SearchIcon className="text-5xl text-slate-400 dark:text-slate-500" />
                        ) : (
                            <UploadCloudIcon className="text-5xl text-slate-400 dark:text-slate-500" />
                        )}
                        <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
                            {resources.length > 0 ? 'No Matching Resources' : 'No Resources Uploaded'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {resources.length > 0 ? 'Try adjusting your search or filters.' : 'Get started by adding your first research document.'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ResearchHub;
