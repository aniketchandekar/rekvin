

import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Project, UserRole } from '../data/types.ts';
import { XIcon, AlertTriangleIcon, UnfoldMoreIcon, Icon } from './Icons.tsx';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdate: (projectData: Omit<Project, 'createdAt' | 'resources' | 'workflows'>) => void;
  project: Project;
}

type ProjectType = 'B2B' | 'B2C';
type ProjectPlatform = 'Mobile' | 'Desktop';

const userRolesWithIcons: { role: UserRole; icon: string }[] = [
  { role: 'Product Manager', icon: 'manage_accounts' },
  { role: 'Project Manager', icon: 'task_alt' },
  { role: 'UX Designer', icon: 'design_services' },
  { role: 'UI Designer', icon: 'palette' },
  { role: 'Business Analyst', icon: 'analytics' },
  { role: 'Researcher', icon: 'science' },
  { role: 'Developer', icon: 'code' },
  { role: 'Other', icon: 'person_outline' },
];

const EditProjectModal: React.FC<EditProjectModalProps> = ({ isOpen, onClose, onProjectUpdate, project }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [type, setType] = useState<ProjectType>('B2B');
  const [platform, setPlatform] = useState<ProjectPlatform>('Mobile');
  const [userRole, setUserRole] = useState<UserRole>('UX Designer');
  const [error, setError] = useState('');
  const [isRoleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setGoal(project.goal);
      setType(project.type);
      setPlatform(project.platform);
      setUserRole(project.userRole || 'UX Designer');
      setError('');
      setRoleDropdownOpen(false);
    }
  }, [project]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goal.trim()) {
      setError('Project Name and Goal cannot be empty.');
      return;
    }
    setError('');
    onProjectUpdate({ ...project, name, goal, type, platform, userRole });
  };

  if (!isOpen) return null;

  const selectedRoleInfo = userRolesWithIcons.find(r => r.role === userRole) || userRolesWithIcons.find(r => r.role === 'Other')!;

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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Project</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <XIcon className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="editProjectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
            <input
              type="text"
              id="editProjectName"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              placeholder="e.g., Redesign of a checkout flow"
            />
          </div>

          <div>
            <label htmlFor="editProjectGoal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal of the Project</label>
            <textarea
              id="editProjectGoal"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              placeholder="e.g., To improve conversion rate by 20%"
            ></textarea>
          </div>

          <div className="relative" ref={roleDropdownRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Role</label>
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between text-left px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              aria-haspopup="listbox"
              aria-expanded={isRoleDropdownOpen}
            >
              <span className="flex items-center gap-3">
                <Icon iconName={selectedRoleInfo.icon} className="text-xl text-slate-500 dark:text-slate-400" />
                <span className="text-slate-900 dark:text-slate-100">{selectedRoleInfo.role}</span>
              </span>
              <UnfoldMoreIcon className="text-xl text-slate-500 dark:text-slate-400" />
            </button>
            {isRoleDropdownOpen && (
              <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto p-1 animate-fadeIn">
                {userRolesWithIcons.map(({ role, icon }) => (
                  <li key={role}>
                    <button
                      type="button"
                      onClick={() => { setUserRole(role); setRoleDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 text-left p-2 text-sm rounded-md transition-colors ${userRole === role ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      role="option"
                      aria-selected={userRole === role}
                    >
                       <Icon iconName={icon} className="text-xl text-slate-500 dark:text-slate-400" />
                       <span className="text-slate-800 dark:text-slate-200">{role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project Type</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['B2B', 'B2C'] as ProjectType[]).map(t => (
                  <div key={t}>
                    <input
                      type="radio"
                      id={`edit-type-${t}`}
                      name="editProjectType"
                      value={t}
                      checked={type === t}
                      onChange={() => setType(t)}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor={`edit-type-${t}`}
                      className="w-full cursor-pointer flex items-center justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-colors border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 peer-checked:bg-slate-800 peer-checked:text-white dark:peer-checked:bg-slate-200 dark:peer-checked:text-slate-900 peer-checked:border-slate-800 dark:peer-checked:border-slate-200"
                    >
                      {t}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Platform</legend>
              <div className="grid grid-cols-2 gap-2">
                {(['Mobile', 'Desktop'] as ProjectPlatform[]).map(p => (
                  <div key={p}>
                    <input
                      type="radio"
                      id={`edit-platform-${p}`}
                      name="editProjectPlatform"
                      value={p}
                      checked={platform === p}
                      onChange={() => setPlatform(p)}
                      className="sr-only peer"
                    />
                    <label
                      htmlFor={`edit-platform-${p}`}
                      className="w-full cursor-pointer flex items-center justify-center py-2 px-4 rounded-lg text-sm font-semibold transition-colors border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 peer-checked:bg-slate-800 peer-checked:text-white dark:peer-checked:bg-slate-200 dark:peer-checked:text-slate-900 peer-checked:border-slate-800 dark:peer-checked:border-slate-200"
                    >
                      {p}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          
          {error && (
            <div className="flex items-center w-full p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-300 text-sm font-medium">
              <AlertTriangleIcon className="text-xl mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 text-sm font-semibold text-slate-100 bg-slate-800 rounded-lg shadow-md hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-slate-500">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
