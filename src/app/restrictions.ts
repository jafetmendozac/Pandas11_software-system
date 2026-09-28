/**
 * This file outlines the operational capabilities and restrictions of the AI assistant
 * within this project environment, specifically for visualization and testing purposes.
 *
 * Capabilities:
 * - Read files and directories: Access content of files and list directory contents using `read` and `glob`.
 * - Search file content: Find patterns within files using `grep`.
 * - Execute shell commands: Run bash commands with user confirmation, primarily for project utilities (e.g., `npm start`, `git status`) using `bash`.
 * - Write/Edit files: Modify existing files or create new ones, but ONLY when explicitly instructed by the user and with confirmation.
 * - Web fetching: Retrieve content from URLs using `webfetch`.
 * - Task delegation: Launch specialized sub-agents for complex tasks like code exploration or general research using `task`.
 * - Ask questions: Interact with the user for clarification or decisions using `question`.
 * - Manage To-Do lists: Create and update task lists for multi-step operations using `todowrite`.
 *
 * Restrictions:
 * - No proactive modifications: The AI will not modify any files or execute commands that alter the project state
 *   without explicit user instruction and confirmation.
 * - Adherence to conventions: All modifications will strictly follow existing project conventions, style,
 *   and architectural patterns as observed in the codebase.
 * - No external dependencies: Will not install new NPM dependencies or packages without user approval.
 * - No hardcoded secrets: Will never introduce code that exposes sensitive information.
 * - Focus on request: Actions are strictly limited to fulfilling the user's request.
 * - No assumptions: The AI will verify file paths and existing code before making changes.
 *
 * This file serves as a reference for understanding the AI's operational boundaries
 * during development, testing, and visualization tasks.
 */

// Example of how to access these restrictions in an Angular component (for illustrative purposes)
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AiRestrictionsService {
  getCapabilities(): string[] {
    return [
      'Read files and directories',
      'Search file content',
      'Execute shell commands (with confirmation)',
      'Write/Edit files (with explicit instruction and confirmation)',
      'Web fetching',
      'Task delegation to sub-agents',
      'Ask clarifying questions',
      'Manage To-Do lists'
    ];
  }

  getRestrictions(): string[] {
    return [
      'No proactive modifications',
      'Adherence to project conventions',
      'No external dependencies without approval',
      'No hardcoded secrets',
      'Strictly focused on user request',
      'No assumptions; always verify'
    ];
  }
}
