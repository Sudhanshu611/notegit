// backend/ai/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the Gemini API client using the environment key
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: 'gemini-pro' })
}

export const GeminiAI = {
  async generateCommitMessage(before, after) {
    try {
      const model = getModel()
      const prompt = `You are a Git commit message generator for NoteGit, a personal notes app.
Given the following change to a note, write a concise, clear commit message (max 60 characters).
Only output the message itself. No quotation marks, no explanation, no formatting.

BEFORE:
${before.slice(0, 500)}

AFTER:
${after.slice(0, 500)}`

      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      console.error('Error generating commit message:', error)
      return `Update note content - ${new Date().toLocaleTimeString()}`
    }
  },

  async summarizeDiff(diff) {
    try {
      const model = getModel()
      const diffText = diff
        .map(l => `${l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' '} ${l.content}`)
        .join('\n')

      const prompt = `You are an AI assistant summarizing changes between note versions.
Summarize the following note diff in 1-2 short, professional sentences. Be specific about what changed.

${diffText.slice(0, 1000)}`

      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      console.error('Error summarizing diff:', error)
      return 'Completed comparative review of changes between selected versions.'
    }
  },

  async analyzeEvolution(commits) {
    try {
      const model = getModel()
      const summary = commits.slice(0, 10).map(c =>
        `[${new Date(c.timestamp).toLocaleDateString()}] ${c.message}`
      ).join('\n')

      const prompt = `Analyze how this note has evolved over time based on the commit history.
Provide a short 2-3 sentence analysis of the progression of ideas, growth patterns, and focus areas.

COMMIT HISTORY (most recent first):
${summary}`

      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      console.error('Error analyzing note evolution:', error)
      return 'Evolution log: Note has been iteratively refined through commits. Conceptual density continues to grow.'
    }
  },

  async suggestBranch(currentContent, recentCommits) {
    try {
      const model = getModel()
      const prompt = `You are an AI branch advisor for NoteGit, a note app with Git-style branching.
Based on the note content and recent changes, decide if the content has diverged enough to warrant a separate branch.
If YES: output the branch name on the first line (lowercase, kebab-case, max 30 chars) and the reason on the second line.
If NO: output exactly "NO_BRANCH".

RECENT COMMITS:
${recentCommits.slice(0, 5).map(c => c.message).join('\n')}

CURRENT CONTENT PREVIEW:
${currentContent.slice(0, 600)}`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()
      if (text.startsWith('NO_BRANCH') || text.includes('NO_BRANCH')) return null
      
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length >= 2) {
        return { name: lines[0], reason: lines[1] }
      } else if (lines.length === 1) {
        return { name: lines[0], reason: 'Content exhibits significant thematic shift.' }
      }
      return null
    } catch (error) {
      console.error('Error suggesting branch:', error)
      return null
    }
  },

  async chat(question, noteContext) {
    try {
      const model = getModel()
      const prompt = `You are an AI assistant helping a developer or writer understand and improve their notes.
Answer the user's question about their note content concisely (2-4 sentences max).

NOTE CONTENT:
${noteContext.slice(0, 1500)}

QUESTION: ${question}`

      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      console.error('Error in AI chat:', error)
      return 'I encountered an error processing your query. Please check your network or try again.'
    }
  }
}
