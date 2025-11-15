

import React, { useState, useEffect, FormEvent } from 'react';
import { Workflow } from '../../data/types.ts';
import { XIcon, AlertTriangleIcon } from '../Icons.tsx';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; description: string }) => void;
  workflow: Workflow | null;
}

const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, onSave, workflow }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!workflow;

  useEffect(() => {
    if (isOpen) {
      setName(workflow?.name || '');
      setDescription(workflow?.description || '');
      setError('');
    }
  }, [isOpen, workflow]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workflow name cannot be empty.');
      return;
    }
    setError('');
    onSave({ id: workflow?.id, name, description });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 transition-opacity animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 transform transition-all animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit' : 'Create'} Workflow</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <XIcon className="text-2xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="workflowName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workflow Name</label>
            <input
              type="text"
              id="workflowName"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              placeholder="e.g., New Feature Research"
            />
          </div>
          <div>
            <label htmlFor="workflowDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              id="workflowDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              placeholder="e.g., A workflow to handle research and design for the new feature X."
            ></textarea>
          </div>
          {error && (
            <div className="flex items-center w-full p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm font-medium">
              <AlertTriangleIcon className="text-xl mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end items-center pt-4 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-slate-100 bg-slate-800 rounded-lg shadow-md hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-slate-500">
              {isEditing ? 'Save Changes' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkflowModal;
