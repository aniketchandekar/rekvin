import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { XIcon, DownloadIcon, LoaderIcon, Icon, RefreshIcon, PromoteIcon } from '../Icons.tsx';
import { HTML_DESIGN_NODES, MERMAID_ENABLED_NODES } from '../../data/workflow-constants.ts';

interface DesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  isLoading: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  onPromote?: () => void;
  isPromoted?: boolean;
}

export const DesignModal: React.FC<DesignModalProps> = ({ isOpen, onClose, title, content, isLoading, error, onRegenerate, onPromote, isPromoted }) => {
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  const isMermaidOutput = MERMAID_ENABLED_NODES.includes(title);

  useEffect(() => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setRenderedSvg(null);
      return;
    }
    
    if (content && isMermaidOutput) {
        const renderMermaid = async () => {
          if (mermaidContainerRef.current) {
            try {
              const uniqueId = `mermaid-graph-${Date.now()}`;
              const { svg } = await mermaid.render(uniqueId, content);
              setRenderedSvg(svg);
              if (mermaidContainerRef.current) {
                // Ensure the container is visible before injecting content
                mermaidContainerRef.current.style.opacity = '1';
                mermaidContainerRef.current.innerHTML = svg;
              }
            } catch (e: any) {
              console.error('Mermaid rendering error:', e);
              setRenderedSvg(null);
              if (mermaidContainerRef.current) {
                mermaidContainerRef.current.innerHTML = `<pre class="text-xs p-4 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-md">Error rendering diagram:\n\n${e.message}</pre>`;
              }
            }
          }
        };
        // Hide container while rendering to prevent flash of old content
        if (mermaidContainerRef.current) mermaidContainerRef.current.style.opacity = '0';
        renderMermaid();
    } else if (!isOpen) {
      setRenderedSvg(null);
    }
  }, [isOpen, content, isMermaidOutput]);

  if (!isOpen) return null;

  const handleDownload = () => {
    let blob: Blob;
    let filename: string;

    if (isMermaidOutput) {
        if (!renderedSvg) return;
        blob = new Blob([renderedSvg], { type: 'image/svg+xml' });
        filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'design'}.svg`;
    } else {
        if (!content) return;
        blob = new Blob([content], { type: 'text/html' });
        filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'design'}.html`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const showLoader = isLoading;
  const showContent = !isLoading && !error && content;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-modal-title"
    >
      <div
        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col transform transition-all animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 sm:px-8 py-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
          <h2 id="design-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={title}>{title} - Design</h2>
          <div className="flex items-center gap-2">
            {onPromote && (
                 <button
                    onClick={onPromote}
                    disabled={!content || showLoader || isPromoted}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50"
                 >
                    <PromoteIcon className="text-base"/>
                    {isPromoted ? 'Promoted' : 'Promote to Design'}
                 </button>
            )}
             <button
                onClick={onRegenerate}
                disabled={showLoader}
                aria-label="Regenerate Design"
                className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshIcon className={`text-xl ${isLoading ? 'animate-spin' : ''}`} />
              </button>
             <button
                onClick={handleCopyToClipboard}
                disabled={!content || showLoader}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 disabled:opacity-50"
            >
                {isCopied ? <Icon iconName="check" className="text-base text-green-500" /> : <Icon iconName="copy_all" className="text-base"/>}
                {isCopied ? 'Copied!' : 'Copy Code'}
            </button>
             <button
                onClick={handleDownload}
                disabled={!content || showLoader}
                aria-label="Download"
                className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                <DownloadIcon className="text-xl" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <XIcon className="text-2xl" />
            </button>
          </div>
        </header>
        
        <main className="relative flex-grow overflow-y-auto p-4 bg-slate-200/50 dark:bg-slate-950/50 min-h-0">
            {showContent && (
                isMermaidOutput ? (
                     <div ref={mermaidContainerRef} className="w-full h-full flex items-center justify-center design-render-container" style={{ transition: 'opacity 0.2s ease-in-out', opacity: showLoader ? 0.3 : 1 }} />
                ) : (
                    <div 
                        className="w-full design-render-container" 
                        dangerouslySetInnerHTML={{ __html: content }} 
                        style={{ transition: 'opacity 0.2s ease-in-out', opacity: showLoader ? 0.3 : 1 }} 
                    />
                )
            )}
            
            {showLoader && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="text-center text-slate-600 dark:text-slate-400 p-6 rounded-lg bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <LoaderIcon className="text-5xl animate-spin mx-auto" />
                        <p className="mt-4 font-semibold text-lg">Generating...</p>
                        <p className="text-sm">The AI is crafting your design.</p>
                    </div>
                </div>
            )}
            
            {error && !showLoader && (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-600 dark:text-red-400 max-w-lg">
                        <h3 className="font-semibold text-lg">Design Failed</h3>
                        <p className="text-sm mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-md">{error}</p>
                    </div>
                </div>
            )}
        </main>

        <footer className="flex justify-end items-center px-6 sm:px-8 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400">Design generated by AI</span>
        </footer>
      </div>
    </div>
  );
};