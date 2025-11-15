import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DevTask, DevTaskStatus, DesignArtifact, Project } from '../../data/types.ts';
import { Icon, CodeIcon, MoreHorizontalIcon, ViewDesignIcon } from '../Icons.tsx';

const STATUS_CONFIG: Record<DevTaskStatus, { color: string, bg: string, border: string }> = {
    'To Do': { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-200 dark:bg-slate-700', border: 'border-slate-400' },
    'In Progress': { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500' },
    'Done': { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500' },
};

const STATUS_OPTIONS: DevTaskStatus[] = ['To Do', 'In Progress', 'Done'];

const TaskCard: React.FC<{
  task: DevTask;
  artifact?: DesignArtifact;
  onUpdateStatus: (id: string, status: DevTaskStatus) => void;
}> = ({ task, artifact, onUpdateStatus }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (status: DevTaskStatus) => {
    onUpdateStatus(task.id, status);
    setMenuOpen(false);
  };

  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/80">
        <div className="flex justify-between items-start gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-grow pr-2">{task.title}</p>
             <div className="relative flex-shrink-0" ref={menuRef}>
                <button onClick={() => setMenuOpen(p => !p)} className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                    <span>{task.status}</span>
                    <MoreHorizontalIcon className="text-sm" />
                </button>
                {isMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-36 bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl z-20 border border-slate-200 dark:border-slate-700/50 py-1.5 animate-fadeIn">
                       {STATUS_OPTIONS.map(status => (
                           <button key={status} onClick={() => handleStatusChange(status)} className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800">
                               {status}
                           </button>
                       ))}
                    </div>
                )}
            </div>
        </div>
        {artifact && (
            <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    <ViewDesignIcon className="text-sm"/>
                    <span>View Linked Design: {artifact.nodeTitle} v{artifact.version}</span>
                </a>
            </div>
        )}
    </div>
  );
};

const KanbanColumn: React.FC<{
  title: DevTaskStatus;
  tasks: DevTask[];
  artifacts: DesignArtifact[];
  onUpdateStatus: (id: string, status: DevTaskStatus) => void;
}> = ({ title, tasks, artifacts, onUpdateStatus }) => {
  const statusConfig = STATUS_CONFIG[title];
  return (
    <div className="flex-1 min-w-[280px] bg-slate-100/50 dark:bg-slate-950/40 rounded-xl p-3 flex flex-col">
        <div className={`flex items-center gap-2 px-2 pb-2 border-b-2 ${statusConfig.border}`}>
            <span className={`text-sm font-semibold ${statusConfig.color}`}>{title}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>{tasks.length}</span>
        </div>
        <div className="flex-grow pt-3 space-y-3 overflow-y-auto">
            {tasks.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task}
                    artifact={artifacts.find(a => a.id === task.designArtifactId)}
                    onUpdateStatus={onUpdateStatus}
                />
            ))}
        </div>
    </div>
  );
};


const DevelopmentHub: React.FC<{
  project: Project;
  tasks: DevTask[];
  artifacts: DesignArtifact[];
  onUpdateTaskStatus: (id: string, status: DevTaskStatus) => void;
}> = ({ tasks, artifacts, onUpdateTaskStatus }) => {

  const columns: { title: DevTaskStatus; tasks: DevTask[] }[] = useMemo(() => [
    { title: 'To Do', tasks: tasks.filter(t => t.status === 'To Do') },
    { title: 'In Progress', tasks: tasks.filter(t => t.status === 'In Progress') },
    { title: 'Done', tasks: tasks.filter(t => t.status === 'Done') },
  ], [tasks]);


  if (tasks.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center p-8 bg-white/30 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
            <CodeIcon className="text-5xl text-slate-400 dark:text-slate-500 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No Development Tasks</h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm">Approve designs in the Design Hub to create new development tasks here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => (
            <KanbanColumn
                key={col.title}
                title={col.title}
                tasks={col.tasks}
                artifacts={artifacts}
                onUpdateStatus={onUpdateTaskStatus}
            />
        ))}
    </div>
  );
};

export default DevelopmentHub;