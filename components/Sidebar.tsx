

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { MoonIcon, SunIcon, TrashIcon, MoreVerticalIcon, EditIcon, HelpIcon } from './Icons.tsx';
import { Project } from '../data/types.ts';
import Logo from './Logo.tsx';

interface SidebarProps {
  isOpen: boolean;
  projects: Project[];
  selectProject: (id: string) => void;
  goToHome: () => void;
  activeProjectId: string | null;
  onEditRequest: (project: Project) => void;
  onDeleteRequest: (project: Project) => void;
  onOpenAbout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, projects, selectProject, goToHome, activeProjectId, onEditRequest, onDeleteRequest, onOpenAbout }) => {
  const { theme, toggleTheme } = useTheme();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <aside
      className={`bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-lg flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r-2 border-slate-200 dark:border-slate-800 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full text-slate-900 dark:text-white">
        <button onClick={goToHome} className="border-b border-slate-200 dark:border-slate-800 p-4 text-left w-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500">
          <div className={`flex items-center ${!isOpen && 'justify-center'}`}>
            <Logo className="w-9 h-9 flex-shrink-0" />
            <div
              className={`overflow-hidden transition-all duration-200 ease-in-out ${
                isOpen ? 'ml-3 opacity-100 max-w-xs' : 'ml-0 opacity-0'
              }`}
            >
              <h1 className="text-xl font-bold whitespace-nowrap">Rekvin</h1>
            </div>
          </div>
           <div
            className={`overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap ${
              isOpen ? 'max-h-10 mt-2 opacity-100' : 'max-h-0 mt-0 opacity-0'
            }`}
          >
            <h2 className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Design Research Copilot
            </h2>
          </div>
        </button>
        
        <div className="flex-grow p-2 overflow-y-auto">
           <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            <h3 className="px-2 mb-2 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">My Projects</h3>
            {projects.length > 0 ? (
              <ul className="space-y-1">
                {projects.map(project => (
                  <li key={project.id} ref={openMenuId === project.id ? menuRef : null} className="relative">
                    <a href="#" onClick={(e) => { e.preventDefault(); selectProject(project.id); }} className={`flex items-center justify-between p-2 text-sm font-medium rounded-lg ${activeProjectId === project.id ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                      <span className="truncate flex-1">{project.name}</span>
                      {isOpen && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(prev => prev === project.id ? null : project.id);
                          }}
                          className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-300/70 dark:hover:bg-slate-700/70"
                          aria-label={`Options for ${project.name}`}
                          aria-haspopup="true"
                          aria-expanded={openMenuId === project.id}
                        >
                          <MoreVerticalIcon className="text-base" />
                        </button>
                      )}
                    </a>
                    {isOpen && openMenuId === project.id && (
                       <div className="absolute right-2 mt-1 w-36 bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl z-20 border border-slate-200 dark:border-slate-700/50 py-1.5 animate-fadeIn">
                          <button onClick={() => handleMenuAction(() => onEditRequest(project))} className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800">
                              <EditIcon className="text-base"/>
                              Edit
                          </button>
                          <button onClick={() => handleMenuAction(() => onDeleteRequest(project))} className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                              <TrashIcon className="text-base"/>
                              Delete
                          </button>
                       </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 text-sm text-slate-500 dark:text-slate-400 italic">No projects yet.</p>
            )}
          </div>
        </div>

        <div className="p-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
           <button
             onClick={toggleTheme}
             className={`flex items-center w-full p-2 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 ${!isOpen && 'justify-center'}`}
             aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
           >
            {theme === 'light' ? (
                <MoonIcon className="text-xl shrink-0" />
            ) : (
                <SunIcon className="text-xl shrink-0" />
            )}
             <span
               className={`overflow-hidden transition-all duration-200 ease-in-out whitespace-nowrap ${
                 isOpen ? 'ml-3 opacity-100' : 'ml-0 opacity-0'
               }`}
             >
               Switch Theme
             </span>
           </button>
           <button
             onClick={onOpenAbout}
             className={`flex items-center w-full p-2 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 ${!isOpen && 'justify-center'}`}
             aria-label="About Rekvin"
           >
             <HelpIcon className="text-xl shrink-0" />
             <span
               className={`overflow-hidden transition-all duration-200 ease-in-out whitespace-nowrap ${
                 isOpen ? 'ml-3 opacity-100' : 'ml-0 opacity-0'
               }`}
             >
               About Rekvin
             </span>
           </button>
        </div>
        
      </div>
    </aside>
  );
};

export default Sidebar;
