

import { GoogleGenAI } from "@google/genai";
import { Project, Resource, FlowNode, FlowEdge } from '../data/types.ts';
import { allWorkflowNodes, getNodeDefByTitle, WorkflowNodeDef, MERMAID_ENABLED_NODES, HTML_DESIGN_NODES } from '../data/workflow-constants.ts';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const SUPPORTED_MIME_TYPES_FOR_ANALYSIS = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

const categoriesText = `
- User Interview: Transcripts or notes from 1:1 user interviews.
- Survey: Raw responses or analysis from user surveys.
- Usability-Test: Notes or recordings from usability testing sessions.
- Competitor Research: Documents containing market and competitor analysis.
- Internal Stakeholder Notes: Feedback, ideas, or meeting notes from the internal team.
- Product Requirements: PRDs, specs, or feature lists.
- Customer Feedback: Support tickets, app reviews, social media comments, or other forms of customer feedback.
- Analytics Report: Quantitative usage data, like from Google Analytics or other analytics platforms.
- Other: If it does not fit into any of a categories above.`;

export async function analyzeContent(
  data: string, // for files: base64 string, for links: url string
  isUrl: boolean,
  mimeType?: string
): Promise<{ summary: string; category: string }> {
  const modelName = 'gemini-2.5-flash';
  
  const basePrompt = `You are an expert design research assistant. Analyze the following resource and provide a brief, one-sentence summary and categorize it into one of the following types.

Categories:
${categoriesText}

Respond ONLY with a valid JSON object in the following format, with no markdown formatting or other text:
{
  "summary": "A brief, one-sentence summary of the document.",
  "category": "The most appropriate category from the list above."
}`;
  
  const contents = isUrl
    ? `${basePrompt}\n\nResource URL (infer content from this): "${data}"`
    : { parts: [
        { inlineData: { mimeType: mimeType!, data: data } },
        { text: basePrompt },
      ] };
  
  try {
     if (!isUrl && !SUPPORTED_MIME_TYPES_FOR_ANALYSIS.includes(mimeType!)) {
        throw new Error(`File type '${mimeType || 'unknown'}' is not supported for analysis, but can be downloaded.`);
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    
    if (parsedData.summary && parsedData.category) {
      return {
          summary: parsedData.summary,
          category: parsedData.category,
      };
    }
    
    throw new Error("Analysis result is malformed or missing required fields.");

  } catch (error: any) {
      console.error("Error during Gemini API call or parsing:", error);
      // Re-throw a more specific error to be caught by the caller
      const message = error.message || "An unknown error occurred during analysis.";
      throw new Error(message.includes('MIME type') ? 'Unsupported file type for analysis.' : message);
  }
}

export async function analyzeText(
  textContent: string,
): Promise<{ summary: string; category: string }> {
  const modelName = 'gemini-2.5-flash';

  const prompt = `You are an expert design research assistant. The following text is a generated output from a workflow node. Analyze this document and provide a brief, one-sentence summary and categorize it into one of the following types.

Categories:
${categoriesText}

Respond ONLY with a valid JSON object in the following format, with no markdown formatting or other text:
{
  "summary": "A brief, one-sentence summary of the document.",
  "category": "The most appropriate category from the list above."
}

---
DOCUMENT CONTENT:
${textContent}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);
    
    if (parsedData.summary && parsedData.category) {
      return {
          summary: parsedData.summary,
          category: parsedData.category,
      };
    }
    
    throw new Error("Analysis result is malformed or missing required fields.");

  } catch (error: any) {
      console.error("Error during text analysis:", error);
      const message = error.message || "An unknown error occurred during text analysis.";
      throw new Error(message);
  }
}


/**
 * Generates an output for a specific workflow node based on its inputs.
 */
export async function processNodeData(
  node: FlowNode,
  project: Project,
  allResources: Resource[],
  allNodes: FlowNode[],
  allEdges: FlowEdge[]
): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const modelName = 'gemini-2.5-flash';

  // 1. Gather input from the node's own linked resource and description
  let directInput = '';
  if (node.data.resourceId) {
    const resource = allResources.find(r => r.id === node.data.resourceId);
    if (resource && resource.status === 'processed') {
      const resourceName = resource.type === 'file' ? resource.name : resource.url;
      directInput += `Directly linked resource "${resourceName}":\n${resource.description}\n\n`;
    }
  }
  if (node.data.customDescription) {
    directInput += `Node description provided by user:\n${node.data.customDescription}\n\n`;
  }
  if (node.data.title === 'Project Brief') {
    directInput += `Project Brief:\nName: ${project.name}\nGoal: ${project.goal}\n\n`;
  }

  // 2. Gather input from connected parent nodes
  const incomingEdges = allEdges.filter(e => e.target === node.id);
  const parentNodeIds = incomingEdges.map(e => e.source);
  const parentNodes = allNodes.filter(n => parentNodeIds.includes(n.id));

  const parentInputs = parentNodes.map(parentNode => {
    if (parentNode.data.outputStatus === 'generated' && parentNode.data.outputContent) {
      return `Input from node "${parentNode.data.title}":\n${parentNode.data.outputContent}`;
    }
    if (parentNode.data.resourceId) {
      const resource = allResources.find(r => r.id === parentNode.data.resourceId);
      if (resource && resource.status === 'processed') {
        const resourceName = resource.type === 'file' ? resource.name : resource.url;
        return `Input from node "${parentNode.data.title}" (linked resource "${resourceName}"):\n${resource.description}`;
      }
    }
     if (parentNode.data.title === 'Project Brief') {
      return `Input from node "${parentNode.data.title}":\nProject Name: ${project.name}\nProject Goal: ${project.goal}`;
    }
    if (parentNode.data.customDescription) {
        return `Input from node "${parentNode.data.title}":\n${parentNode.data.customDescription}`;
    }
    return null;
  }).filter(Boolean).join('\n\n');

  const combinedInputs = directInput + parentInputs;

  if (combinedInputs.trim() === '') {
    throw new Error("No processable input found. Please link a resource, add a description, or connect input nodes with generated output.");
  }

  // 3. Construct the prompt
  const prompt = `You are an expert design research analyst working on project "${project.name}".
The project's goal is: "${project.goal}".

Your current task is to perform the action of a "${node.data.title}" node in a workflow.
Based on the following inputs, generate a concise and relevant output as plain text. Use line breaks, spacing, and simple markers like '*' for lists to structure the information.

---
INPUT DATA:
${combinedInputs}
---

OUTPUT for "${node.data.title}":`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error(`Error during Gemini API call for node "${node.data.title}":`, error);
    const message = error.message || "An unknown error occurred during generation.";
    throw new Error(`Generation failed: ${message}`);
  }
}


/**
 * Generates a synthesis report from a collection of text summaries.
 * This specifically targets "Synthesize Findings" nodes.
 */
export async function synthesizeData(resourceSummaries: string[]): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  if (resourceSummaries.length === 0) {
    return "No data provided to synthesize.";
  }

  const modelName = 'gemini-2.5-flash';
  const prompt = `You are an expert design research analyst. Synthesize the following research data from multiple sources into a single report. Identify common themes, user pain points, and key quotes. Structure your output as a comprehensive yet easy-to-read plain text report. Use line breaks, spacing, and simple markers like '*' for lists to ensure readability.

---
RESEARCH DATA:
${resourceSummaries.map((summary, index) => `Source ${index + 1}:\n${summary}`).join('\n\n')}
---

SYNTHESIS REPORT:`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text;
  } catch (error: any) {
    console.error("Error during Gemini API call for synthesis:", error);
    const message = error.message || "An unknown error occurred during synthesis.";
    throw new Error(`Synthesis failed: ${message}`);
  }
}

/**
 * Suggests next workflow nodes based on the current node.
 */
export async function suggestNextNodes(
  currentNode: FlowNode,
  project: Project
): Promise<WorkflowNodeDef[]> {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const modelName = 'gemini-2.5-flash';

  // Provide a list of all possible nodes for the model to choose from.
  const availableNodesString = allWorkflowNodes
    .map(n => `- "${n.title}": ${n.description}`)
    .join('\n');

  const currentNodeContext = `The current node is "${currentNode.data.title}".
Its description/output is: ${currentNode.data.outputContent || currentNode.data.customDescription || 'Not specified'}.`;

  const prompt = `You are an expert UX design and product management process consultant.
You are working on a project named "${project.name}" with the goal: "${project.goal}".

${currentNodeContext}

Based on the current node and project goal, suggest up to 3 logical next-step nodes from the list below.
Only suggest nodes that would realistically follow the current one. Do not suggest nodes that are conceptually prior steps.
Your response MUST be a valid JSON array of strings, where each string is the exact title of a suggested node from the list.
Example: ["Create Persona", "Journey Map", "Synthesize Findings"]

--- AVAILABLE NODES ---
${availableNodesString}
---

SUGGESTED NEXT NODES (JSON Array):`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // disable thinking for low latency suggestions
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const suggestedTitles: string[] = JSON.parse(jsonStr);

    if (!Array.isArray(suggestedTitles)) {
        throw new Error("Response is not a JSON array.");
    }
    
    // Map titles back to full node definitions
    const suggestedNodeDefs = suggestedTitles
      .map(title => getNodeDefByTitle(title))
      .filter((def): def is WorkflowNodeDef => !!def); // Type guard to filter out undefined

    return suggestedNodeDefs;

  } catch (error: any) {
    console.error(`Error during Gemini API call for node suggestions:`, error);
    const message = error.message || "An unknown error occurred during suggestion generation.";
    throw new Error(`Suggestion failed: ${message}`);
  }
}

const getDesignPrompt = (nodeTitle: string, textContent: string, platform: 'Mobile' | 'Desktop'): string => {
  const htmlBaseInstructions = `
You are an expert UI/UX designer and frontend developer tasked with creating a beautiful, production-quality user interface. Your task is to convert the following plain text content into a single, self-contained HTML file representing a user interface component or screen.

**TARGET PLATFORM: ${platform}**
The layout, component sizes, and spacing MUST be appropriate for a **${platform}** screen.
- For **Mobile**, prioritize a single-column layout, touch-friendly targets, and efficient use of vertical space.
- For **Desktop**, you can use multi-column layouts, hover effects, and leverage the wider viewport.

**CRITICAL HTML REQUIREMENTS:**

1.  **Self-Contained & Portable:** The output MUST be a single HTML snippet. Use Tailwind CSS classes for styling. Tailwind is already included on the page where this will be rendered. Do NOT include \`<html>\`, \`<head>\`, or \`<body>\` tags. Just provide the component's HTML structure. Do NOT include script tags or any JavaScript.

2.  **Aesthetically Beautiful & Modern:** The UI must be clean, modern, and visually stunning. Pay close attention to typography, spacing, and visual hierarchy. Use modern design patterns.

3.  **Theme-Agnostic Design:** The UI should be designed to work flawlessly on **BOTH light and dark backgrounds**. Use Tailwind's dark mode variants (e.g., \`dark:bg-gray-800\`, \`dark:text-white\`) to ensure compatibility. The host page will toggle a 'dark' class on the root element.

4.  **Use Tailwind CSS:** Style all elements using Tailwind CSS utility classes. Do NOT use inline \`style\` attributes or \`<style>\` blocks. For example, use \`class="bg-blue-500 text-white p-2 rounded"\` instead of \`style="background-color:blue; color:white; padding:8px; border-radius:4px;"\`.

5.  **Clean Output:** The final output must ONLY be the HTML code for the component. Do not include comments or markdown fences (like \`\`\`html\`).
`;

  const mermaidBaseInstructions = `
You are an expert diagramming assistant. Your task is to convert the following plain text content into a valid Mermaid.js graph definition.

**CRITICAL MERMAID.JS REQUIREMENTS:**

1.  **Valid Syntax:** The output MUST be only the Mermaid graph definition code. Do not include comments, explanations, or markdown fences (like \`\`\`mermaid\`).
2.  **Theme-Agnostic Styling:** Use \`classDef\` to define styles that will work on both light and dark themes. Use neutral but professional colors. For example: \`classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px,color:#333\`. The rendering engine will apply appropriate theme variables.
3.  **Graph Direction:** Use an appropriate graph direction (e.g., \`graph TD\` for top-down, \`graph LR\` for left-to-right).
4.  **Clarity:** The diagram should be clean, logical, and easy to understand. Use descriptive node text.

**TARGET PLATFORM: ${platform}**
- For **Mobile**, favor a top-down (\`TD\`) layout to better fit vertical screens.
- For **Desktop**, a left-to-right (\`LR\`) layout is often suitable.
`;

  if (HTML_DESIGN_NODES.includes(nodeTitle)) {
    switch (nodeTitle) {
      case 'Wireframe':
        return `${htmlBaseInstructions}
        Design a low-fidelity wireframe as an HTML component based on the textual description.
        **Key Requirements:**
        - **Black & White UI:** The color palette MUST be strictly black, white, and shades of gray (e.g., using Tailwind's \`slate\` or \`gray\` color scales). **Do not use any brand or accent colors**.
        - **Low-Fidelity but Clean:** While this is a wireframe, ensure the layout is clean, well-balanced, and follows modern UI design principles for the target platform. Focus on layout, structure, and hierarchy. Use simple placeholder styles, such as light gray backgrounds for image placeholders (\`bg-slate-200 dark:bg-slate-700\`) and simple borders for containers.
        - **Placeholder Content:** Represent text with descriptive labels (e.g., "User Name", "Submit Button") rather than full sentences.
        - **Single Page HTML:** The output must be a single, self-contained HTML structure representing one screen or view.

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
      case 'Prototype':
        return `${htmlBaseInstructions}
        Design a high-fidelity, clean, and modern HTML component based on the textual description of an interactive prototype.
        **Key Requirements:**
        - **Minimal & Professional UI:** The component should look like a polished piece of a web or mobile application, with excellent, modern aesthetics. Use a professional and minimal color palette that works well in both light and dark modes. Be creative and produce a visually stunning, production-quality component.
        - **Clickable Elements:** The component should appear interactive. Use \`<button>\` elements for actions and \`<a>\` tags with \`href="#"\` for links to make them feel clickable. Ensure these elements are styled appropriately as interactive controls.
        - **High-Fidelity:** Use appropriate Tailwind CSS classes to create a realistic and aesthetically pleasing UI. Include elements like buttons, forms, cards, etc., as described, with attention to detail in spacing, typography, and visual hierarchy.

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
      case 'Design System':
        return `${htmlBaseInstructions}
        Design a set of HTML components that represent the described Design System.
        - Create examples for colors, typography (headings, paragraphs), and components (buttons, inputs, cards).
        - Arrange them in a clear style-guide format, using headings to separate sections.
        - For colors, show swatches with their corresponding Tailwind class names or hex codes.
        - For components, show different states (e.g., primary button, secondary button, disabled button).

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
       case 'Create Persona':
        return `${htmlBaseInstructions}
        Design a Persona profile card component for a user of a **${platform}** application. The input text contains details about a user persona (name, demographics, goals, frustrations, etc.).
        - Create a visually appealing layout with a placeholder for a photo (a simple circle or square with a neutral background is fine).
        - Organize the information into clear sections like "About", "Goals", "Frustrations".
        - Use icons where appropriate to make sections more scannable.
        - Use typography to create a clear visual hierarchy.

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
      case 'Brainstorming':
        return `${htmlBaseInstructions}
        Design a set of styled cards or a mind-map-like layout based on the brainstorming output for a **${platform}** application.
        - Place the central idea in a prominent position.
        - Group related ideas into categorized sections or cards.
        - Use typography and spacing to create a clear visual hierarchy between main ideas and sub-points.

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
    }
  }

  if (MERMAID_ENABLED_NODES.includes(nodeTitle)) {
      const diagramType = (nodeTitle === 'User Flow') ? 'flowchart diagram (`graph TD` or `graph LR`)' : 'diagram';
      return `${mermaidBaseInstructions}
        Generate a Mermaid.js ${diagramType} based on the text for a **${platform}** application.
        - Represent steps, screens, or ideas as nodes.
        - Use arrows to connect the nodes, clearly showing relationships or sequence.
        - Arrange the layout logically to be easily followed.
        - Make the entire diagram visually clean and easy to understand at a glance.

        --- TEXT CONTENT ---
        ${textContent}
        --- END CONTENT ---`;
  }

  // Fallback for any other case
  return `Provide a structured summary of the following text: ${textContent}`;
};

/**
 * Generates an SVG visual design from a node's text output.
 */
export async function generateVisualDesign(nodeTitle: string, textContent: string, platform: 'Mobile' | 'Desktop'): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const modelName = 'gemini-2.5-flash';
  
  const prompt = getDesignPrompt(nodeTitle, textContent, platform);

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    
    let designCode = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = designCode.match(fenceRegex);
    if (match && match[2]) {
        designCode = match[2].trim();
    }
    return designCode;

  } catch (error: any) {
    console.error(`Error during Gemini API call for visual design generation:`, error);
    const message = error.message || "An unknown error occurred during SVG generation.";
    throw new Error(`Design generation failed: ${message}`);
  }
}