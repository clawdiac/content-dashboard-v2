import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Feedback files
const WORKSPACE_DIR = path.join(os.homedir(), '.openclaw', 'workspace');
const FEEDBACK_JSON_PATH = path.join(WORKSPACE_DIR, '.comfyui-feedback.json');
const STATS_JSON_PATH = path.join(WORKSPACE_DIR, '.comfyui-stats.json');
const SKILL_FILE_PATH = path.join(WORKSPACE_DIR, 'skills', 'comfyui', 'skill-file.md');

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
  
  const skillDir = path.dirname(SKILL_FILE_PATH);
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }
}

// Load feedback from JSON file
function loadFeedbackJSON() {
  try {
    if (!fs.existsSync(FEEDBACK_JSON_PATH)) {
      return { entries: [] };
    }
    const content = fs.readFileSync(FEEDBACK_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error loading feedback JSON:', err);
    return { entries: [] };
  }
}

// Save feedback to JSON file
function saveFeedbackJSON(feedback) {
  try {
    ensureDirectories();
    fs.writeFileSync(FEEDBACK_JSON_PATH, JSON.stringify(feedback, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving feedback JSON:', err);
    return false;
  }
}

// Append feedback to skill-file.md
function appendToSkillFile(filename, status, feedback_text, timestamp) {
  try {
    ensureDirectories();

    // Format entry
    const entry = `## Feedback Entry - ${timestamp}

- **Status:** ${status}
- **File:** ${filename}
- **Feedback:** ${feedback_text || 'No feedback provided'}
- **Suggestions:** (auto-generated suggestions could go here)

---

`;

    // Append to file
    fs.appendFileSync(SKILL_FILE_PATH, entry, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error appending to skill-file.md:', err);
    return false;
  }
}

// Calculate stats from feedback entries
function calculateStats(entries) {
  const total = entries.length;
  const approved = entries.filter(e => e.status === 'APPROVED').length;
  const rejected = entries.filter(e => e.status === 'REJECTED').length;
  const close = entries.filter(e => e.status === 'CLOSE').length;
  
  const success_rate = total === 0 ? 0 : (approved / total);
  const average_feedback_length = total === 0 
    ? 0 
    : entries.reduce((sum, e) => sum + (e.feedback_text?.length || 0), 0) / total;

  // Extract patterns from feedback
  const patterns = {};
  const keywords = ['color', 'composition', 'lighting', 'contrast', 'saturation', 'focus', 'noise'];
  
  for (const keyword of keywords) {
    const count = entries.filter(e => 
      e.feedback_text?.toLowerCase().includes(keyword)
    ).length;
    if (count > 0) {
      patterns[`${keyword}_issues`] = count;
    }
  }

  return {
    total,
    approved,
    rejected,
    close,
    success_rate: parseFloat(success_rate.toFixed(3)),
    average_feedback_length: parseFloat(average_feedback_length.toFixed(2)),
    patterns,
    calculated_at: new Date().toISOString(),
  };
}

// Save stats to JSON file
function saveStatsJSON(stats) {
  try {
    ensureDirectories();
    fs.writeFileSync(STATS_JSON_PATH, JSON.stringify(stats, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving stats JSON:', err);
    return false;
  }
}

// Load stats from JSON file
export async function getStats() {
  try {
    const feedback = loadFeedbackJSON();
    const stats = calculateStats(feedback.entries);
    return stats;
  } catch (err) {
    console.error('Error getting stats:', err);
    return {
      total: 0,
      approved: 0,
      rejected: 0,
      close: 0,
      success_rate: 0,
      average_feedback_length: 0,
      patterns: {},
      calculated_at: new Date().toISOString(),
    };
  }
}

// Main function: Save feedback and update all persistence stores
export async function saveFeedback(filename, status, feedback_text) {
  try {
    ensureDirectories();

    const timestamp = new Date().toISOString();

    // Load existing feedback
    const feedback = loadFeedbackJSON();

    // Check if entry already exists and update it, or add new
    const existingIndex = feedback.entries.findIndex(e => e.filename === filename);
    const entry = {
      filename,
      status,
      feedback_text,
      timestamp,
      prompt_ref: null, // Could be extracted from filename or metadata
    };

    if (existingIndex >= 0) {
      feedback.entries[existingIndex] = entry;
    } else {
      feedback.entries.push(entry);
    }

    // Save to JSON
    const jsonSaved = saveFeedbackJSON(feedback);
    if (!jsonSaved) {
      throw new Error('Failed to save feedback JSON');
    }

    // Append to skill-file.md
    const skillFileSaved = appendToSkillFile(filename, status, feedback_text, timestamp);
    if (!skillFileSaved) {
      throw new Error('Failed to append to skill-file.md');
    }

    // Calculate and save stats
    const stats = calculateStats(feedback.entries);
    const statsSaved = saveStatsJSON(stats);
    if (!statsSaved) {
      throw new Error('Failed to save stats');
    }

    console.log(`✅ Feedback saved: ${filename} → ${status}`);

    return {
      success: true,
      timestamp,
      message: 'Feedback saved successfully',
    };
  } catch (err) {
    console.error('Error in saveFeedback:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Initialize: Ensure directories exist
ensureDirectories();

console.log('💾 Feedback handler initialized');
console.log(`📄 Feedback JSON: ${FEEDBACK_JSON_PATH}`);
console.log(`📊 Stats JSON: ${STATS_JSON_PATH}`);
console.log(`📝 Skill file: ${SKILL_FILE_PATH}`);
