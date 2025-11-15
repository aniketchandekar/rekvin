import * as ai from '../lib/ai.ts';
import { Project, Resource, ResourceFile, ResourceLink, Workflow, FlowNode, FlowEdge, FlowViewport, DesignArtifact, DevTask, DesignArtifactStatus, DevTaskStatus } from './types.ts';

// Re-export types for convenience if other files still point here (optional but good practice during refactor)
export type { Project, Resource, ResourceFile, ResourceLink, Workflow, FlowNode, FlowEdge, FlowViewport, UserRole, DesignArtifact, DevTask, DesignArtifactStatus, DevTaskStatus } from './types.ts';


interface AppData {
  projects: Project[];
}

// --- DATABASE INITIALIZATION ---

const DB_KEY = 'rekvin_app_data';

let db: AppData = loadState();

function loadState(): AppData {
  try {
    const serializedState = localStorage.getItem(DB_KEY);
    if (serializedState === null) {
      return { projects: [] };
    }
    const state = JSON.parse(serializedState);
    // Basic validation and migration
    if (Array.isArray(state.projects)) {
        state.projects.forEach((p: any) => { // Use any for migration
            if (!p.workflows) p.workflows = [];
            if (Array.isArray(p.workflows)) {
                p.workflows.forEach((w: any) => {
                    if (!w.viewport) w.viewport = { x: 0, y: 0, zoom: 1 };
                });
            }
            if (!p.userRole) p.userRole = 'Other';
            if (!p.designArtifacts) p.designArtifacts = [];
            if (!p.devTasks) p.devTasks = [];
        });
        return state;
    }
  } catch (err) {
    console.error("Could not load state from localStorage", err);
  }
  return { projects: [] };
}

function saveState(): void {
  try {
    const serializedState = JSON.stringify(db);
    localStorage.setItem(DB_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
}

// --- PROJECT FUNCTIONS ---

/**
 * Returns all projects, sorted by creation date (newest first).
 */
export function getProjects(): Project[] {
  return [...db.projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves a single project by its ID.
 */
export function getProject(projectId: string): Project | undefined {
    return db.projects.find(p => p.id === projectId);
}


/**
 * Adds a new project to the database.
 */
export function addProject(projectData: Omit<Project, 'id' | 'createdAt' | 'resources' | 'workflows' | 'designArtifacts' | 'devTasks'>): Project {
  const newProject: Project = {
    ...projectData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    resources: [],
    workflows: [],
    designArtifacts: [],
    devTasks: [],
  };
  db.projects.push(newProject);
  saveState();
  return newProject;
}

/**
 * Updates an existing project's core details.
 */
export function updateProject(updatedProjectData: Omit<Project, 'createdAt' | 'resources' | 'workflows' | 'designArtifacts' | 'devTasks'>): Project | undefined {
  const projectIndex = db.projects.findIndex(p => p.id === updatedProjectData.id);
  if (projectIndex > -1) {
    const existingProject = db.projects[projectIndex];
    db.projects[projectIndex] = { ...existingProject, ...updatedProjectData };
    saveState();
    return db.projects[projectIndex];
  }
  return undefined;
}

/**
 * Deletes a project by its ID.
 */
export function deleteProject(projectId: string): void {
  db.projects = db.projects.filter(p => p.id !== projectId);
  saveState();
}

// --- RESOURCE FUNCTIONS ---

/**
 * Gets all resources for a specific project, sorted by creation date (newest first).
 */
export function getResourcesForProject(projectId: string): Resource[] {
  const project = getProject(projectId);
  if (!project) return [];
  return [...project.resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


function toDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

/**
 * Adds new files and links as resources to a project and starts analysis.
 */
export async function addResourcesToProject(projectId: string, files: File[], links: string[], onUpdate: () => void): Promise<Resource[]> {
  const project = getProject(projectId);
  if (!project) return [];

  const newFileResources: ResourceFile[] = files.map(file => ({
    id: crypto.randomUUID(),
    type: 'file',
    name: file.name,
    fileType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
    source: 'user',
    status: 'pending',
  }));

  const newLinkResources: ResourceLink[] = links.map(link => ({
    id: crypto.randomUUID(),
    type: 'link',
    url: link,
    createdAt: new Date().toISOString(),
    source: 'user',
    status: 'pending',
  }));
  
  const allNewResources = [...newFileResources, ...newLinkResources];

  project.resources.push(...allNewResources);
  saveState();
  onUpdate();

  const analyzeFileResource = async (resource: ResourceFile) => {
    const file = files.find(f => f.name === resource.name && f.size === resource.size);
    if (!file) {
      resource.status = 'failed';
      resource.description = 'Original file could not be found for analysis.';
      saveState();
      onUpdate();
      return;
    }

    // Infer MIME type if browser doesn't provide it
    let mimeType = file.type;
    if (!mimeType) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'md') {
            mimeType = 'text/markdown';
        }
        // DOCX usually has a MIME type, but as a fallback.
        if (extension === 'docx') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }
    }

    try {
        resource.status = 'processing';
        resource.fileType = mimeType; // Update resource with inferred mimeType

        const dataUrl = await toDataURL(file);
        resource.content = dataUrl;
        
        saveState();
        onUpdate();
        
        const base64Data = dataUrl.split(',')[1];
        const result = await ai.analyzeContent(base64Data, false, mimeType);
        
        resource.description = result.summary;
        resource.category = result.category;
        resource.status = 'processed';

    } catch(e: any) {
        console.error(`Failed to analyze file resource: ${resource.name}`, e);
        resource.status = 'failed';
        resource.description = e?.message || 'An unknown error occurred during analysis.';
    }
    saveState();
    onUpdate();
  }

  const analyzeLinkResource = async (resource: ResourceLink) => {
      try {
        resource.status = 'processing';
        saveState();
        onUpdate();

        const result = await ai.analyzeContent(resource.url, true);

        resource.description = result.summary;
        resource.category = result.category;
        resource.status = 'processed';

      } catch(e: any) {
        console.error(`Failed to analyze link resource: ${resource.url}`, e);
        resource.status = 'failed';
        resource.description = e?.message || 'An unknown error occurred during analysis.';
      }
      saveState();
      onUpdate();
  }

  const analysisPromises = [
      ...newFileResources.map(analyzeFileResource),
      ...newLinkResources.map(analyzeLinkResource),
  ];

  await Promise.all(analysisPromises);
  
  return allNewResources;
}


/**
 * Deletes a resource from a project.
 */
export function deleteResource(projectId: string, resourceId: string): void {
    const project = getProject(projectId);
    if (!project) return;
    project.resources = project.resources.filter(r => r.id !== resourceId);
    saveState();
}

/**
 * Creates a new resource from a workflow node's generated output.
 */
export async function addGeneratedResource(
  projectId: string,
  node: FlowNode,
  content: string
): Promise<ResourceFile> {
  const project = getProject(projectId);
  if (!project) throw new Error("Project not found");

  let summary = 'Analysis of this generated document is not available.';
  let category = 'Generated';

  try {
    const analysisResult = await ai.analyzeText(content);
    summary = analysisResult.summary;
    category = analysisResult.category;
  } catch (e: any) {
    console.error(`Failed to analyze generated resource content for node: ${node.data.title}`, e);
    // The resource card will show this failure message.
    summary = `Analysis failed: ${e.message || 'Unknown error'}`;
  }

  // Handle UTF-8 characters for btoa
  const base64Content = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/plain;base64,${base64Content}`;

  const newResource: ResourceFile = {
    id: crypto.randomUUID(),
    type: 'file',
    name: `${node.data.title} Output.txt`,
    fileType: 'text/plain',
    size: content.length,
    content: dataUrl,
    createdAt: new Date().toISOString(),
    source: 'generated',
    status: 'processed', // 'processed' because the content exists.
    description: summary, // Use the summary here.
    category: category,
  };

  project.resources.push(newResource);
  saveState();
  return newResource;
}


/**
 * Updates a resource's category.
 */
export function updateResourceCategory(projectId: string, resourceId: string, category: string | undefined): void {
    const project = getProject(projectId);
    if (!project) return;
    const resource = project.resources.find(r => r.id === resourceId);
    if (resource) {
        resource.category = category;
        saveState();
    }
}

// --- WORKFLOW & SYNTHESIS FUNCTIONS ---

/**
 * Sorts nodes topologically.
 * @param nodes - Array of workflow nodes.
 * @param edges - Array of workflow edges.
 * @returns A sorted array of nodes.
 */
export function topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    const nodeMap = new Map<string, FlowNode>();

    for (const node of nodes) {
        inDegree.set(node.id, 0);
        adj.set(node.id, []);
        nodeMap.set(node.id, node);
    }

    for (const edge of edges) {
        adj.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }

    const sorted: FlowNode[] = [];
    while (queue.length > 0) {
        const u = queue.shift()!;
        const node = nodeMap.get(u);
        if (node) {
            sorted.push(node);
        }

        for (const v of adj.get(u) || []) {
            inDegree.set(v, (inDegree.get(v) || 0) - 1);
            if (inDegree.get(v) === 0) {
                queue.push(v);
            }
        }
    }

    if (sorted.length !== nodes.length) {
        console.warn("Cycle detected in graph, or some nodes are unreachable. Topological sort may be incomplete.");
        const sortedNodeIds = new Set(sorted.map(n => n.id));
        for (const node of nodes) {
            if (!sortedNodeIds.has(node.id)) {
                sorted.push(node);
            }
        }
    }
    
    return sorted;
}

// --- WORKFLOW FUNCTIONS ---

/**
 * Gets all workflows for a specific project, sorted by creation date (newest first).
 */
export function getWorkflowsForProject(projectId: string): Workflow[] {
    const project = getProject(projectId);
    if (!project) return [];
    return [...project.workflows].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Adds a new workflow to a project.
 */
export function addWorkflow(projectId: string, data: {name: string, description: string}): Workflow {
    const project = getProject(projectId);
    if(!project) throw new Error("Project not found");

    const newWorkflow: Workflow = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        name: data.name,
        description: data.description,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
    };

    project.workflows.push(newWorkflow);
    saveState();
    return newWorkflow;
}

/**
 * Updates an existing workflow in a project.
 */
export function updateWorkflow(projectId: string, workflowData: Workflow): Workflow | undefined {
    const project = getProject(projectId);
    if (!project) return undefined;

    const workflowIndex = project.workflows.findIndex(w => w.id === workflowData.id);
    if (workflowIndex > -1) {
        project.workflows[workflowIndex] = { ...project.workflows[workflowIndex], ...workflowData };
        saveState();
        return project.workflows[workflowIndex];
    }
    return undefined;
}

/**
 * Deletes a workflow from a project.
 */
export function deleteWorkflow(projectId: string, workflowId: string): void {
    const project = getProject(projectId);
    if (!project) return;
    project.workflows = project.workflows.filter(w => w.id !== workflowId);
    saveState();
}

// --- DESIGN ARTIFACT FUNCTIONS ---

export function getDesignArtifactsForProject(projectId: string): DesignArtifact[] {
    const project = getProject(projectId);
    if (!project) return [];
    return [...project.designArtifacts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addDesignArtifact(
    projectId: string, 
    artifactData: Omit<DesignArtifact, 'id' | 'version' | 'createdAt' | 'status' | 'projectId'>
): DesignArtifact {
    const project = getProject(projectId);
    if (!project) throw new Error("Project not found");

    const existingArtifactsForNode = project.designArtifacts.filter(a => a.nodeId === artifactData.nodeId);
    const latestVersion = Math.max(0, ...existingArtifactsForNode.map(a => a.version));

    const newArtifact: DesignArtifact = {
        ...artifactData,
        id: crypto.randomUUID(),
        projectId,
        version: latestVersion + 1,
        createdAt: new Date().toISOString(),
        status: 'Draft',
    };

    project.designArtifacts.push(newArtifact);
    saveState();
    return newArtifact;
}

export function updateDesignArtifactStatus(projectId: string, artifactId: string, status: DesignArtifactStatus): void {
    const project = getProject(projectId);
    if (!project) return;
    const artifact = project.designArtifacts.find(a => a.id === artifactId);
    if (artifact) {
        artifact.status = status;
        saveState();
    }
}

// --- DEV TASK FUNCTIONS ---

export function getDevTasksForProject(projectId: string): DevTask[] {
    const project = getProject(projectId);
    if (!project) return [];
    return [...project.devTasks].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addDevTaskFromArtifact(projectId: string, artifactId: string): DevTask {
    const project = getProject(projectId);
    if (!project) throw new Error("Project not found");

    const artifact = project.designArtifacts.find(a => a.id === artifactId);
    if (!artifact) throw new Error("Source artifact not found");

    const newDevTask: DevTask = {
        id: crypto.randomUUID(),
        projectId,
        title: `Implement: ${artifact.nodeTitle} (v${artifact.version})`,
        status: 'To Do',
        createdAt: new Date().toISOString(),
        designArtifactId: artifact.id,
    };

    project.devTasks.push(newDevTask);
    saveState();
    return newDevTask;
}

export function updateDevTaskStatus(projectId: string, taskId: string, status: DevTaskStatus): void {
    const project = getProject(projectId);
    if (!project) return;
    const task = project.devTasks.find(t => t.id === taskId);
    if (task) {
        task.status = status;
        saveState();
    }
}
