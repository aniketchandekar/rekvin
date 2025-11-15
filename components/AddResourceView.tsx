
import React, { useState, useCallback, DragEvent } from 'react';
import { XIcon, UploadCloudIcon, TrashIcon, LinkIcon, FileTextIcon, PlusIcon } from './Icons.tsx';

interface AddResourceViewProps {
  onClose: () => void;
  onAddResources: (files: File[], links: string[]) => void;
}

const AddResourceView: React.FC<AddResourceViewProps> = ({ onClose, onAddResources }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLink();
    }
  };

  const handleAddLink = () => {
    if (currentLink.trim() && !links.includes(currentLink.trim())) {
      try {
        new URL(currentLink.trim()); // Validate URL
        setLinks(prev => [...prev, currentLink.trim()]);
        setCurrentLink('');
      } catch (error) {
        alert('Please enter a valid URL.');
      }
    }
  };

  const handleRemoveLink = (indexToRemove: number) => {
    setLinks(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: DragEvent) => {
    handleDrag(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  
  const handleDragOut = (e: DragEvent) => {
    handleDrag(e);
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent) => {
    handleDrag(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleSubmit = () => {
      onAddResources(files, links);
      setFiles([]);
      setLinks([]);
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Add Resources</h3>
        <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <XIcon className="text-2xl" />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* File Upload Section */}
        <div className="space-y-3">
          <label
            htmlFor="file-upload"
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-slate-800/50 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 ${isDragging ? 'border-slate-500' : ''}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloudIcon className="w-8 h-8 mb-2 text-slate-500 dark:text-slate-400" />
              <p className="mb-1 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">PDF, DOCX, TXT, MD, PNG, JPG</p>
            </div>
            <input id="file-upload" type="file" className="hidden" multiple onChange={handleFileChange} accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,text/markdown,.md,image/png,image/jpeg" />
          </label>
          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg text-sm">
                   <div className="flex items-center gap-3 truncate">
                      <FileTextIcon className="text-slate-500 text-lg shrink-0"/>
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{file.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{formatBytes(file.size)}</span>
                   </div>
                  <button onClick={() => handleRemoveFile(index)} className="p-1 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 shrink-0">
                    <TrashIcon className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Link Add Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
               <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="url"
                 value={currentLink}
                 onChange={(e) => setCurrentLink(e.target.value)}
                 onKeyDown={handleLinkKeyDown}
                 placeholder="Paste a URL..."
                 className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-slate-500 focus:border-slate-500"
               />
            </div>
            <button onClick={handleAddLink} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <PlusIcon className="text-lg"/>
            </button>
          </div>
          {links.length > 0 && (
             <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center justify-between bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg text-sm">
                  <div className="flex items-center gap-3 truncate">
                    <LinkIcon className="text-slate-500 text-lg shrink-0"/>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="truncate text-slate-700 dark:text-slate-300 font-medium hover:underline">{link}</a>
                  </div>
                  <button onClick={() => handleRemoveLink(index)} className="p-1 text-slate-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 shrink-0">
                    <TrashIcon className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        
      {(files.length > 0 || links.length > 0) && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button 
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-semibold text-slate-100 bg-slate-800 rounded-lg shadow-md hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-slate-500"
            >
                Add {files.length + links.length} Resource{files.length + links.length > 1 ? 's' : ''}
            </button>
        </div>
      )}
    </div>
  );
};

export default AddResourceView;