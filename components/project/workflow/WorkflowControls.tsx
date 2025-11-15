

import React from 'react';
import { Icon, LoaderIcon, ZoomInIcon, ZoomOutIcon, FitScreenIcon, LockIcon, UnlockIcon, DeleteSweepIcon } from '../../Icons.tsx';

interface WorkflowControlsProps {
    onRun: () => void;
    isRunning: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitView: () => void;
    onLockToggle: () => void;
    isLocked: boolean;
    runDisabled: boolean;
    onClearCanvas: () => void;
}

const ControlButton: React.FC<{ onClick: () => void, 'aria-label': string, children: React.ReactNode, disabled?: boolean, isActive?: boolean, tooltip: string }> = ({ children, isActive, tooltip, ...props }) => (
    <div className="relative group/tooltip">
        <button
            type="button"
            className={`p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 ${isActive ? 'bg-slate-200 dark:bg-slate-700/70' : ''}`}
            {...props}
        >
            {children}
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">{tooltip}</div>
    </div>
);

const WorkflowControls: React.FC<WorkflowControlsProps> = ({
    onRun,
    isRunning,
    onZoomIn,
    onZoomOut,
    onFitView,
    onLockToggle,
    isLocked,
    runDisabled,
    onClearCanvas,
}) => {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-2 bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-lg p-2 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-600 pr-2">
                    <ControlButton onClick={onZoomIn} aria-label="Zoom in" tooltip="Zoom In">
                        <ZoomInIcon className="text-xl" />
                    </ControlButton>
                    <ControlButton onClick={onZoomOut} aria-label="Zoom out" tooltip="Zoom Out">
                        <ZoomOutIcon className="text-xl" />
                    </ControlButton>
                    <ControlButton onClick={onFitView} aria-label="Fit view" tooltip="Fit to View">
                        <FitScreenIcon className="text-xl" />
                    </ControlButton>
                </div>

                <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-600 pr-2">
                    <ControlButton onClick={onLockToggle} aria-label={isLocked ? "Unlock canvas" : "Lock canvas"} isActive={isLocked} tooltip={isLocked ? 'Unlock Canvas' : 'Lock Canvas'}>
                        {isLocked ? <LockIcon className="text-xl" /> : <UnlockIcon className="text-xl" />}
                    </ControlButton>
                     <ControlButton onClick={onClearCanvas} aria-label="Clear canvas" tooltip="Clear Canvas">
                        <DeleteSweepIcon className="text-xl text-red-500/90 dark:text-red-500/80" />
                    </ControlButton>
                </div>
                                
                <button
                    onClick={onRun}
                    disabled={isRunning || runDisabled}
                    className="flex items-center gap-2 px-4 py-2 font-semibold text-slate-100 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-900 dark:text-slate-900 dark:bg-slate-200 dark:hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isRunning ? <LoaderIcon className="animate-spin text-xl" /> : <Icon iconName="play_arrow" className="text-xl" />}
                    {isRunning ? 'Running...' : 'Run Workflow'}
                </button>
            </div>
        </div>
    );
};

export default WorkflowControls;