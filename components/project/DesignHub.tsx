import React, { useState, useMemo, useRef, useEffect } from 'react';
import mermaid from 'mermaid';
import { DesignArtifact, Project, DesignArtifactStatus } from '../../data/types.ts';
import { Icon, ViewDesignIcon, MoreHorizontalIcon } from '../Icons.tsx';

const STATUS_CONFIG: Record<DesignArtifactStatus, { color: string, bg: string }> = {
    'Draft': { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-200 dark:bg-slate-700' },
    'In Review': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
    'Approved': { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' },
    'Archived': { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-200 dark:bg-gray-700' },
};

const STATUS_OPTIONS: DesignArtifactStatus[] = ['Draft', 'In Review', 'Approved', 'Archived'];

const ArtifactCard: React.FC<{
  artifact: DesignArtifact;
  onUpdateStatus: (id: string, status: DesignArtifactStatus) => void;
  onSendToDev: (id: string) => void;
}> = ({ artifact, onUpdateStatus, onSendToDev }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (artifact.contentType === 'mermaid') {
        mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
    }
  }, [artifact.contentType]);

  useEffect(() => {
    if (artifact.contentType === 'mermaid' && mermaidContainerRef.current) {
        const render = async () => {
            try {
                const uniqueId = `mermaid-card-${artifact.id.replace(/-/g, '')}`;
                const { svg } = await mermaid.render(uniqueId, artifact.content);
                if (mermaidContainerRef.current) {
                    mermaidContainerRef.current.innerHTML = svg;
                }
            } catch (e) {
                console.error("Mermaid card render error:", e);
                if (mermaidContainerRef.current) {
                    mermaidContainerRef.current.innerHTML = `<p class="text-xs text-red-500">Error rendering diagram</p>`;
                }
            }
        };
        render();
    }
  }, [artifact.id, artifact.content, artifact.contentType]);


  const handleStatusChange = (status: DesignArtifactStatus) => {
    onUpdateStatus(artifact.id, status);
    setMenuOpen(false);
  };
  
  const statusConfig = STATUS_CONFIG[artifact.status];

  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-lg flex flex-col border border-slate-200 dark:border-slate-700/80 animate-fadeIn h-full overflow-hidden">
        <div className="relative p-4 flex-grow bg-slate-200/30 dark:bg-slate-950/30">
            {artifact.contentType === 'html' ? (
                <iframe srcDoc={artifact.content} title={`Version ${artifact.version}`} className="w-full h-full border-0 rounded-md bg-white" sandbox="allow-scripts"></iframe>
            ) : artifact.contentType === 'mermaid' ? (
                <div ref={mermaidContainerRef} className="w-full h-full bg-white rounded-md p-2 flex items-center justify-center overflow-auto design-render-container" />
            ) : (
                <div className="w-full h-full bg-white rounded-md p-2 flex items-center justify-center overflow-auto design-render-container" dangerouslySetInnerHTML={{ __html: artifact.content }} />
            )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Version {artifact.version}</p>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(p => !p)} className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                        <span>{artifact.status}</span>
                        <MoreHorizontalIcon className="text-base" />
                    </button>
                    {isMenuOpen && (
                         <div className="absolute right-0 bottom-full mb-2 w-36 bg-slate-100 dark:bg-slate-900 rounded-lg shadow-2xl z-20 border border-slate-200 dark:border-slate-700/50 py-1.5 animate-fadeIn">
                           {STATUS_OPTIONS.map(status => (
                               <button key={status} onClick={() => handleStatusChange(status)} className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800">
                                   {status}
                               </button>
                           ))}
                        </div>
                    )}
                </div>
            </div>
             {artifact.status === 'Approved' && (
                <button 
                    onClick={() => onSendToDev(artifact.id)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-slate-800 rounded-lg shadow-md hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                   <Icon iconName="send" className="text-base" /> Send to Dev
                </button>
            )}
        </div>
    </div>
  );
};

const DesignHub: React.FC<{
  project: Project;
  artifacts: DesignArtifact[];
  onUpdateArtifactStatus: (id: string, status: DesignArtifactStatus) => void;
  onSendToDev: (id: string) => void;
}> = ({ artifacts, onUpdateArtifactStatus, onSendToDev }) => {

  const groupedArtifacts = useMemo(() => {
    const groups: { [key: string]: DesignArtifact[] } = {};
    artifacts.forEach(artifact => {
        if (!groups[artifact.nodeId]) {
            groups[artifact.nodeId] = [];
        }
        groups[artifact.nodeId].push(artifact);
    });
    // Sort versions within each group, descending
    Object.values(groups).forEach(group => group.sort((a, b) => b.version - a.version));
    return Object.values(groups);
  }, [artifacts]);

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center p-8 bg-white/30 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
            <ViewDesignIcon className="text-5xl text-slate-400 dark:text-slate-500 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Your Design Hub is Empty</h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 max-w-sm">Generate designs in your workflows and use the "Promote to Design" button to add them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-4 space-y-8">
        {groupedArtifacts.map(group => (
            <div key={group[0].nodeId}>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{group[0].nodeTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.map(artifact => (
                        <ArtifactCard 
                            key={artifact.id}
                            artifact={artifact}
                            onUpdateStatus={onUpdateArtifactStatus}
                            onSendToDev={onSendToDev}
                        />
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
};

export default DesignHub;