

import React, { useState, useRef, useEffect } from 'react';
import { Resource } from '../data/types.ts';
import * as store from '../data/store.ts';
import { Icon } from './Icons.tsx';

interface TagEditorProps {
    projectId: string;
    resource: Resource;
    allCategories: string[];
    onUpdate: () => void;
}

const TagEditor: React.FC<TagEditorProps> = ({ projectId, resource, allCategories, onUpdate }) => {
    const [isPopoverOpen, setPopoverOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateCategory = (category: string | undefined) => {
        store.updateResourceCategory(projectId, resource.id, category);
        onUpdate();
        setPopoverOpen(false);
        setNewTag('');
    };
    
    const handleRemoveCategory = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleUpdateCategory(undefined);
    };

    const handleAddTag = () => {
        if (newTag.trim()) {
            handleUpdateCategory(newTag.trim());
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    }

    return (
        <div className="relative">
            {resource.category ? (
                <div className="group flex items-center gap-1 whitespace-nowrap bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium">
                    <span className="cursor-pointer" onClick={() => setPopoverOpen(true)}>{resource.category}</span>
                    <button onClick={handleRemoveCategory} className="opacity-50 group-hover:opacity-100 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5 transition-opacity">
                        <Icon iconName="close" className="text-sm" />
                    </button>
                </div>
            ) : (
                <button onClick={() => setPopoverOpen(true)} className="flex items-center gap-1 whitespace-nowrap bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-dashed border-slate-400 dark:border-slate-600 px-2.5 py-1 rounded-full text-xs font-medium transition-colors">
                    <Icon iconName="add" className="text-sm" />
                    <span>Add Tag</span>
                </button>
            )}

            {isPopoverOpen && (
                <div ref={popoverRef} className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg z-10 p-3 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Create new tag..."
                            className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-slate-500 focus:border-slate-500 text-sm"
                            autoFocus
                        />
                        <button onClick={handleAddTag} disabled={!newTag.trim()} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <Icon iconName="add" className="text-lg" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Or select an existing one:</p>
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                        {allCategories.filter(cat => cat !== resource.category).map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleUpdateCategory(cat)}
                                className="whitespace-nowrap bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                            >
                                {cat}
                            </button>
                        ))}
                         {allCategories.filter(cat => cat !== resource.category).length === 0 && (
                             <p className="text-xs text-slate-400 dark:text-slate-500 italic px-1">No other tags in use.</p>
                         )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagEditor;
