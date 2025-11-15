# Rekvin: Design Research Copilot

Rekvin helps you turn raw research into actionable insights and polished designs, effortlessly. It's your AI-powered partner for the entire design lifecycle, from initial research synthesis to final design validation.

## Key Features

- **Centralized Research Hub**: Aggregate all your research materials—user interviews, survey results, competitor analysis, articles, and more—in one place. Rekvin accepts files (PDF, DOCX, TXT) and web links.

- **AI-Powered Analysis**: When you add a resource, Rekvin's AI, powered by the Gemini API, automatically analyzes it, providing a concise summary and categorizing it for easy filtering and retrieval.

- **Visual Workflow Editor**: Go beyond simple documents. Build powerful, visual workflows by connecting nodes representing different research and design tasks. The editor provides AI-powered suggestions for your next steps, helping you build logical and effective processes.

- **Intelligent Artifact Generation**: Each node in your workflow isn't just a placeholder. Run the workflow, and Rekvin's AI will process each step, using the outputs of parent nodes as context to generate new text-based artifacts like user personas, journey maps, problem statements, and more.

- **AI-Powered Design Generation**: Instantly transform text artifacts into polished visual outputs. Generate theme-agnostic SVG graphics for diagrams like journey maps, black-and-white HTML wireframes for structural layouts, and high-fidelity, interactive HTML prototypes. All designs are portable and ready for your reports or design tools.

- **Contextual AI Chat**: Chat with an AI assistant that understands the context of your project, your resources, and the specific workflow node you're working on. Ask questions, brainstorm ideas, and get instant, relevant feedback.

- **Light & Dark Mode**: Work comfortably at any time of day with a beautifully designed interface that adapts to your preferred theme.

## Our Mission

Our goal is to bridge the gap between research and design, creating a seamless, intelligent, and efficient process. By automating tedious tasks and providing powerful analytical tools, Rekvin empowers designers and researchers to focus on what they do best: creating exceptional user experiences.

---

### Technologies Used

Rekvin is built with a modern, performant, and reliable tech stack:

- **Frontend**: React, TypeScript, Tailwind CSS
- **Diagramming**: React Flow
- **AI & Language Models**: Google Gemini API
- **Styling & Icons**: Tailwind Typography, Material Symbols

This application is a demonstration of what's possible with the Google Gemini API.

## Getting Started: How to Run Locally

Follow these steps to download and run this project on your own machine.

### 1. Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Safari).
- A local web server to serve the project files. If you have Node.js installed, you can use the `serve` package:
  - Open a terminal in the project's root directory.
  - Run the command: `npx serve`

### 2. Configure Your API Key

This project uses the Google Gemini API and requires an API key to function.

1.  **Get an API Key**: If you don't have one, create a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Edit `index.html`**: Open the `index.html` file in your code editor.
3.  **Find the script tag** near the bottom of the file with the comment `IMPORTANT: For local development...`.
4.  **Replace the placeholder `'YOUR_GEMINI_API_KEY'`** with your actual Gemini API key.

```html
<!-- Inside index.html -->
<script>
  // IMPORTANT: For local development, replace 'YOUR_GEMINI_API_KEY' with your actual Google Gemini API key.
  window.process = {
    env: {
      API_KEY: 'YOUR_GEMINI_API_KEY' // <--- Paste your key here
    }
  };
</script>
```

**Important**: Be careful not to expose your API key in public repositories.

### 3. Run the Application

1.  Start your local web server from the project's root directory (e.g., by running `npx serve`).
2.  Open your web browser and navigate to the address provided by the server (usually `http://localhost:3000`).
3.  The application should now be running and fully functional.