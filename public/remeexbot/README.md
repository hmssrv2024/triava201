# Remeex Visa Chatbot

An AI-powered chatbot that acts as a comprehensive, interactive user manual for the Remeex Visa financial service, guiding users through all its features and processes.

This project is built with React and TypeScript, using the Google Gemini API for its AI capabilities. It runs as a standalone web application using a modern, no-build-step setup with ES modules and import maps.

## ✨ Features

-   **AI-Powered Guidance:** Utilizes the Gemini API to provide intelligent and context-aware answers based on an extensive user manual.
-   **Interactive Chat:** A user-friendly, full-page chat interface for seamless interaction.
-   **Voice-to-Text:** Includes a microphone button to transcribe voice notes directly into the chat input (browser-dependent).
-   **Image Previews:** Users can see a thumbnail of an image they are about to upload.
-   **Secure Rendering:** Bot responses are sanitized to prevent XSS vulnerabilities.
-   **Ticket Creation:** A built-in flow for users to create support tickets for their issues.
-   **Responsive Design:** Works great on both desktop and mobile devices.

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript
-   **AI:** Google Gemini API (`gemini-2.5-flash`)
-   **Styling:** CSS-in-HTML (style tag in `index.html`)
-   **Dependencies:** Served via `esm.sh` (no local `node_modules` or build step needed)

## 🚀 Getting Started

### Prerequisites

You need to have an API key for the Google Gemini API.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **API Key:**
    This application requires a Google Gemini API key to be available as an environment variable named `API_KEY`. The application is designed to run in an environment where this is pre-configured.

3.  **Run Locally:**
    Since this project doesn't have a build step, you can serve the files using any simple local web server. The `npx serve` command is a great choice.

    ```bash
    # If you don't have 'serve' installed, you can run it with npx
    npx serve .
    ```
    This will start a server, typically at `http://localhost:3000`. You can open this URL in your browser to see the chatbot application running.

## 📁 Project Structure

The project is organized to separate the application source code from the public-facing files.

-   `src/`: Contains all React/TypeScript source code for the chatbot application.
    -   `components/`: Reusable React components that make up the chat UI.
    -   `services/`: Logic for communicating with the Gemini API (`geminiService.ts`).
    -   `App.tsx`: The root React component that orchestrates the chat application.
    -   `index.tsx`: The entry point that renders the React app into the DOM.
    -   `types.ts`: Shared TypeScript type definitions.
-   `index.html`: The main HTML file that serves as the shell for the chatbot application. It contains all styles and the import map for dependencies.
-   `metadata.json`: Project metadata.
-   `.gitignore`: Specifies files to be ignored by Git.
-   `README.md`: This file.