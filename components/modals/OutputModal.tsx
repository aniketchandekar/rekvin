
import React, { useCallback, useState } from 'react';
import { XIcon, Icon } from '../Icons.tsx';

interface OutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const OutputModal: React.FC<OutputModalProps> = ({ isOpen, onClose, title, content }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    });
  }, [content]);

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'output'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFormattedContent = (text: string) => {
    // A simple parser to format text with headings and lists.
    const lines = text.split('\n');
    // FIX: Changed JSX.Element to React.ReactNode to avoid namespace errors.
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-5">
                    {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            listItems.push(line.substring(2));
            return;
        }

        flushList(); // End any existing list

        // FIX: Replaced dynamic JSX tag with React.createElement to fix type errors.
        if (line.match(/^#+\s/)) { // Heading
            const match = line.match(/^(#+)\s/)!;
            const level = Math.min(match[1].length, 6);
            const Tag = `h${level + 1}`;
            elements.push(React.createElement(Tag, { key: index }, line.replace(/^(#+)\s/, '')));
        } else if (line.trim().length > 0) { // Paragraph
            elements.push(<p key={index}>{line}</p>);
        }
        // Empty lines are effectively ignored, creating space between paragraphs.
    });

    flushList(); // Flush any remaining list items at the end
    return elements;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="output-modal-title"
    >
      <div
        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col transform transition-all animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 sm:px-8 py-4 flex-shrink-0 border-b border-slate-200 dark:border-slate-800">
          <h2 id="output-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white truncate" title={title}>{title} - Output</h2>
          <div className="flex items-center gap-2">
            <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 border ${isCopied ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
            >
                <Icon iconName={isCopied ? 'check' : 'content_copy'} className="text-base" />
                {isCopied ? 'Copied!' : 'Copy Text'}
            </button>
            <button
                onClick={handleDownload}
                aria-label="Download Text"
                className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <Icon iconName="download" className="text-xl" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <XIcon className="text-2xl" />
            </button>
          </div>
        </header>
        
        <main className="flex-grow overflow-y-auto p-6 sm:p-8 bg-white dark:bg-slate-950/50 min-h-0">
           <article className="prose prose-slate dark:prose-invert max-w-none">
              {renderFormattedContent(content)}
           </article>
        </main>
      </div>
    </div>
  );
};

export default OutputModal;
