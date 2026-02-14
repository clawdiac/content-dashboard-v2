import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { mkdir } from 'fs/promises';

/**
 * SkillFileManager - Persistent storage for skill learning
 * - Track approved prompts
 * - Record failed attempts
 * - Store discovered patterns
 * - Format as markdown for human readability
 */
export class SkillFileManager {
  constructor(config = {}) {
    this.skillFilePath = config.skillFilePath || 
      `${process.env.HOME}/.openclaw/workspace/skills/comfyui/skill-file.md`;
    this.data = {
      approvedPrompts: [],
      failedPrompts: [],
      patterns: [],
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        totalApproved: 0,
        totalFailed: 0,
      },
    };
    this._load();
  }

  /**
   * Load existing skill file
   * @private
   */
  _load() {
    try {
      if (existsSync(this.skillFilePath)) {
        const content = readFileSync(this.skillFilePath, 'utf-8');
        const parsed = this._parseMarkdown(content);
        this.data = {
          ...this.data,
          ...parsed,
        };
        this.data.metadata.lastUpdated = new Date();
      }
    } catch (error) {
      console.error('Failed to load skill file:', error);
      // Start fresh if load fails
    }
  }

  /**
   * Record an approved prompt
   * @param {Object} entry - { prompt, idea, result, notes, category }
   */
  recordApproved(entry) {
    const approved = {
      prompt: entry.prompt,
      idea: entry.idea,
      result: entry.result || 'Image/Video generated successfully',
      notes: entry.notes || 'User approved',
      category: entry.category || 'General',
      timestamp: new Date().toISOString(),
      id: this._generateId(),
    };

    this.data.approvedPrompts.push(approved);
    this.data.metadata.totalApproved = this.data.approvedPrompts.length;
    this.data.metadata.lastUpdated = new Date();
    this.save();

    return approved;
  }

  /**
   * Record a failed prompt
   * @param {Object} entry - { prompt, idea, failure, fix, category }
   */
  recordFailed(entry) {
    const failed = {
      prompt: entry.prompt,
      idea: entry.idea,
      failure: entry.failure || 'Unknown reason',
      fix: entry.fix || 'Try alternative approach',
      category: entry.category || 'General',
      timestamp: new Date().toISOString(),
      id: this._generateId(),
    };

    this.data.failedPrompts.push(failed);
    this.data.metadata.totalFailed = this.data.failedPrompts.length;
    this.data.metadata.lastUpdated = new Date();
    this.save();

    return failed;
  }

  /**
   * Record a discovered pattern
   * @param {Object} pattern - { text, description, category, confidence }
   */
  recordPattern(pattern) {
    const recorded = {
      text: pattern.text,
      description: pattern.description || '',
      category: pattern.category || 'General',
      confidence: pattern.confidence || 'medium',
      examples: pattern.examples || [],
      timestamp: new Date().toISOString(),
      id: this._generateId(),
    };

    // Check if pattern already exists
    const existing = this.data.patterns.find(p => p.text === recorded.text);
    if (existing) {
      existing.examples = [...new Set([...existing.examples, ...(recorded.examples || [])])];
      existing.timestamp = recorded.timestamp;
    } else {
      this.data.patterns.push(recorded);
    }

    this.data.metadata.lastUpdated = new Date();
    this.save();

    return recorded;
  }

  /**
   * Get all approved prompts by category
   * @param {string} category - Optional filter
   * @returns {Array<Object>}
   */
  getApprovedByCategory(category = null) {
    if (!category) return this.data.approvedPrompts;
    return this.data.approvedPrompts.filter(p => p.category === category);
  }

  /**
   * Get all failed prompts
   * @returns {Array<Object>}
   */
  getFailed() {
    return this.data.failedPrompts;
  }

  /**
   * Get all patterns
   * @returns {Array<Object>}
   */
  getPatterns() {
    return this.data.patterns;
  }

  /**
   * Get patterns by category
   * @param {string} category
   * @returns {Array<Object>}
   */
  getPatternsByCategory(category) {
    return this.data.patterns.filter(p => p.category === category);
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return {
      totalApproved: this.data.approvedPrompts.length,
      totalFailed: this.data.failedPrompts.length,
      totalPatterns: this.data.patterns.length,
      categories: [...new Set([
        ...this.data.approvedPrompts.map(p => p.category),
        ...this.data.failedPrompts.map(p => p.category),
      ])],
      successRate: this.data.approvedPrompts.length / 
        (this.data.approvedPrompts.length + this.data.failedPrompts.length) * 100 || 0,
      lastUpdated: this.data.metadata.lastUpdated,
    };
  }

  /**
   * Find similar approved prompts
   * @param {string} query
   * @returns {Array<Object>}
   */
  findSimilar(query) {
    const queryWords = query.toLowerCase().split(/\s+/);
    return this.data.approvedPrompts
      .map(p => ({
        ...p,
        similarity: queryWords.filter(w => 
          p.prompt.toLowerCase().includes(w) || 
          p.idea.toLowerCase().includes(w)
        ).length / queryWords.length,
      }))
      .filter(p => p.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }

  /**
   * Save skill file
   */
  save() {
    try {
      const dirPath = dirname(this.skillFilePath);
      if (!existsSync(dirPath)) {
        mkdir(dirPath, { recursive: true });
      }

      const markdown = this._toMarkdown();
      writeFileSync(this.skillFilePath, markdown, 'utf-8');
      console.log(`✅ Skill file saved: ${this.skillFilePath}`);
    } catch (error) {
      console.error('Failed to save skill file:', error);
      throw error;
    }
  }

  /**
   * Convert data to markdown format
   * @private
   */
  _toMarkdown() {
    let md = '# ComfyUI Skill File\n\n';
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Success Rate: ${this.getStats().successRate.toFixed(1)}% (${this.data.approvedPrompts.length}/${this.data.approvedPrompts.length + this.data.failedPrompts.length})\n\n`;

    // Approved Prompts Section
    md += '## ✅ Approved Prompts (What Works)\n\n';
    if (this.data.approvedPrompts.length === 0) {
      md += '_No approved prompts yet. Generate and approve content to build patterns._\n\n';
    } else {
      const grouped = this._groupByCategory(this.data.approvedPrompts);
      for (const [category, prompts] of Object.entries(grouped)) {
        md += `### ${category}\n\n`;
        for (const p of prompts) {
          md += `- **Idea:** ${p.idea}\n`;
          md += `  - **Prompt:** \`${p.prompt}\`\n`;
          md += `  - **Result:** ${p.result}\n`;
          md += `  - **Notes:** ${p.notes}\n`;
          md += `  - **Date:** ${new Date(p.timestamp).toLocaleDateString()}\n\n`;
        }
      }
    }

    // Failed Prompts Section
    md += '## ❌ Failed Prompts (Don\'t Repeat)\n\n';
    if (this.data.failedPrompts.length === 0) {
      md += '_No failed prompts recorded yet._\n\n';
    } else {
      const grouped = this._groupByCategory(this.data.failedPrompts);
      for (const [category, prompts] of Object.entries(grouped)) {
        md += `### ${category}\n\n`;
        for (const p of prompts) {
          md += `- **Idea:** ${p.idea}\n`;
          md += `  - **Failed Prompt:** \`${p.prompt}\`\n`;
          md += `  - **Why:** ${p.failure}\n`;
          md += `  - **Try Instead:** ${p.fix}\n`;
          md += `  - **Date:** ${new Date(p.timestamp).toLocaleDateString()}\n\n`;
        }
      }
    }

    // Patterns Section
    md += '## 🎯 Discovered Patterns\n\n';
    if (this.data.patterns.length === 0) {
      md += '_Patterns discovered through approved content will appear here._\n\n';
    } else {
      const grouped = this._groupByCategory(this.data.patterns);
      for (const [category, patterns] of Object.entries(grouped)) {
        md += `### ${category}\n\n`;
        for (const p of patterns) {
          md += `- **Pattern:** ${p.text}\n`;
          md += `  - **Description:** ${p.description}\n`;
          md += `  - **Confidence:** ${p.confidence}\n`;
          if (p.examples && p.examples.length > 0) {
            md += `  - **Examples:** ${p.examples.slice(0, 3).join(', ')}\n`;
          }
          md += '\n';
        }
      }
    }

    // Statistics Section
    const stats = this.getStats();
    md += '## 📊 Statistics\n\n';
    md += `- **Total Approved:** ${stats.totalApproved}\n`;
    md += `- **Total Failed:** ${stats.totalFailed}\n`;
    md += `- **Total Patterns:** ${stats.totalPatterns}\n`;
    md += `- **Success Rate:** ${stats.successRate.toFixed(1)}%\n`;
    md += `- **Categories:** ${stats.categories.join(', ') || 'None yet'}\n`;
    md += `- **Last Updated:** ${stats.lastUpdated.toISOString()}\n`;

    return md;
  }

  /**
   * Parse markdown skill file
   * @private
   */
  _parseMarkdown(content) {
    // Simple parser - just extracts from markdown structure
    // In production, could use a more sophisticated parser
    const data = {
      approvedPrompts: [],
      failedPrompts: [],
      patterns: [],
    };

    // This is a placeholder - full parsing would extract entries from sections
    // For now, we rely on in-memory storage and overwrite files completely

    return data;
  }

  /**
   * Group items by category
   * @private
   */
  _groupByCategory(items) {
    return items.reduce((acc, item) => {
      const category = item.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Export data for analysis
   */
  export() {
    return {
      ...this.data,
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Reset skill file (careful!)
   */
  reset() {
    this.data = {
      approvedPrompts: [],
      failedPrompts: [],
      patterns: [],
      metadata: {
        created: new Date(),
        lastUpdated: new Date(),
        totalApproved: 0,
        totalFailed: 0,
      },
    };
    this.save();
  }
}

export default SkillFileManager;
