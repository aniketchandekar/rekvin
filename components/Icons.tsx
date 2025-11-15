import React from 'react';

interface IconProps {
  iconName: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ iconName, className }) => (
  <span className={`material-symbols-outlined ${className || ''}`}>
    {iconName}
  </span>
);

export const PanelLeftCloseIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="menu_open" className={className} />;
export const PanelLeftOpenIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="menu" className={className} />;
export const SunIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="light_mode" className={className} />;
export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="dark_mode" className={className} />;
export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="add" className={className} />;
export const XIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="close" className={className} />;
export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="delete" className={className} />;
export const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="warning" className={className} />;
export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="chevron_right" className={className} />;
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="search" className={className} />;
export const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="cloud_upload" className={className} />;
export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="link" className={className} />;
export const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="article" className={className} />;
export const MoreVerticalIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="more_vert" className={className} />;
export const EditIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="edit" className={className} />;
export const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="progress_activity" className={className} />;
export const GripVerticalIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="drag_indicator" className={className} />;
export const WorkflowIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="lan" className={className} />;
export const ZoomInIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="zoom_in" className={className} />;
export const ZoomOutIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="zoom_out" className={className} />;
export const FitScreenIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="fit_screen" className={className} />;
export const LockIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="lock" className={className} />;
export const UnlockIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="lock_open" className={className} />;
export const HelpIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="help_outline" className={className} />;
export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="download" className={className} />;
export const UserRoleIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="person" className={className} />;
export const UnfoldMoreIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="unfold_more" className={className} />;
export const SuggestIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="auto_awesome" className={className} />;
export const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="refresh" className={className} />;
export const HubIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="hub" className={className} />;
export const SmartToyIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="smart_toy" className={className} />;
export const ChatIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="forum" className={className} />;
export const AccountTreeIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="account_tree" className={className} />;
export const ViewDesignIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="style" className={className} />;
export const ViewOutputIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="article" className={className} />;
export const DeleteSweepIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="delete_sweep" className={className} />;
export const ScienceIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="science" className={className} />;
export const CodeIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="code" className={className} />;
export const PromoteIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="upgrade" className={className} />;
export const MoreHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => <Icon iconName="more_horiz" className={className} />;
