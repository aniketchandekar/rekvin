
import React from 'react';
import { XIcon, HubIcon, AccountTreeIcon, SmartToyIcon, ChatIcon, ViewDesignIcon } from './Icons.tsx';
import Logo from './Logo.tsx';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: <HubIcon className="text-2xl text-indigo-500" />,
    title: 'Centralized Research Hub',
    description: 'Aggregate files (PDF, DOCX) and links in one place. AI automatically summarizes and categorizes everything for you.',
  },
  {
    icon: <AccountTreeIcon className="text-2xl text-sky-500" />,
    title: 'Visual Workflow Editor',
    description: 'Map out your design process by connecting nodes. Get AI-powered suggestions to help you build logical and effective workflows.',
  },
  {
    icon: <SmartToyIcon className="text-2xl text-green-500" />,
    title: 'Intelligent Artifact Generation',
    description: 'Run your workflow and watch the AI generate text artifacts, using the output of one step as the input for the next.',
  },
  {
    icon: <ViewDesignIcon className="text-2xl text-pink-500" />,
    title: 'AI-Powered Design Generation',
    description: 'Turn text into designs: generate portable SVGs for diagrams, black & white HTML for wireframes, and high-fidelity HTML for interactive prototypes.',
  },
  {
    icon: <ChatIcon className="text-2xl text-amber-500" />,
    title: 'Contextual AI Chat',
    description: 'Chat with an AI that understands your project, resources, and current task to get instant, relevant feedback.',
  },
];

const techStack = ['React', 'TypeScript', 'Tailwind CSS', 'React Flow', 'Google Gemini API'];


const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col transform transition-all animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 sm:px-8 pt-6 pb-6 flex-shrink-0 text-center border-b border-slate-200 dark:border-slate-800 relative">
          <Logo className="w-16 h-16 mx-auto" />
          <h2 id="about-modal-title" className="text-3xl font-bold text-slate-900 dark:text-white mt-4">Rekvin</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Your Design Research Copilot</p>
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <XIcon className="text-2xl" />
          </button>
        </header>
        
        <main className="flex-grow overflow-y-auto px-6 sm:px-10 py-8 min-h-0">
          <section className="text-center max-w-2xl mx-auto">
             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Our Mission</h3>
             <p className="mt-2 text-slate-600 dark:text-slate-400">
                To bridge the gap between research and design, creating a seamless and intelligent process. Rekvin automates tedious tasks and provides powerful analytical tools, empowering you to create exceptional user experiences.
             </p>
          </section>

          <section className="mt-10">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 text-center mb-6">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                   <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full">
                     {feature.icon}
                   </div>
                   <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{feature.description}</p>
                   </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">Powered By</h3>
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
                {techStack.map(tech => (
                    <span key={tech} className="px-3 py-1 text-sm font-medium bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                        {tech}
                    </span>
                ))}
            </div>
          </section>
        </main>

        <footer className="flex justify-end items-center px-6 sm:px-8 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-semibold rounded-lg transition-colors text-slate-100 bg-slate-800 dark:text-slate-900 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
                Close
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AboutModal;