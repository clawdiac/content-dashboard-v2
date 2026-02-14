/**
 * PromptEngine - Builds detailed prompts from ideas + learnings
 * - Expands ideas into detailed prompts
 * - Applies patterns from skill file
 * - Learns from feedback
 * - Builds templates for content types
 */
export class PromptEngine {
  constructor(config = {}) {
    this.skillData = config.skillData || {};
    this.modelConfig = config.modelConfig || this._defaultModelConfig();
  }

  /**
   * Build a detailed prompt from an idea using learned patterns
   * @param {string} idea - User's content idea
   * @param {Object} context - Additional context (type: 'image'|'video', style, etc)
   * @returns {string} Detailed prompt
   */
  buildPrompt(idea, context = {}) {
    const { type = 'image', style, category, quality = 'high' } = context;

    // Start with the idea
    let prompt = idea;

    // Apply learned patterns if available
    if (this.skillData.patterns && this.skillData.patterns.length > 0) {
      const patterns = this._selectRelevantPatterns(idea, category);
      if (patterns.length > 0) {
        prompt += ', ' + patterns.join(', ');
      }
    }

    // Apply quality enhancements
    prompt += this._getQualityModifier(quality);

    // Apply style if specified
    if (style) {
      prompt += `, ${style} style`;
    }

    // Add technical specifications based on type
    prompt += this._getTechnicalSpecs(type, quality);

    // Apply category-specific enhancements
    if (category) {
      prompt += this._getCategoryEnhancements(category);
    }

    return prompt;
  }

  /**
   * Build a prompt for AI streamer reactions
   */
  buildStreamerReactionPrompt(scenario, context = {}) {
    const { emotion = 'shocked', intensity = 'high' } = context;

    let prompt = `AI streamer character reacting with ${emotion} expression to ${scenario}`;

    if (intensity === 'high') {
      prompt += ', intense emotional expression, wide eyes, dramatic facial reaction';
    } else {
      prompt += ', subtle emotional expression';
    }

    // Apply learned patterns for streamer reactions
    const approvedReactions = this.skillData.approvedPrompts?.filter(
      p => p.category === 'AI Streamer Reactions'
    ) || [];

    if (approvedReactions.length > 0) {
      const patterns = approvedReactions
        .slice(0, 2)
        .map(p => this._extractPatternDetails(p.prompt))
        .filter(p => p);
      if (patterns.length > 0) {
        prompt += ', ' + patterns.join(', ');
      }
    }

    prompt += ', close-up face, cinematic lighting, professional headshot';

    return prompt;
  }

  /**
   * Build a prompt for sports/gaming highlight
   */
  buildHighlightPrompt(moment, context = {}) {
    const { sport = 'gaming', intensity = 'high' } = context;

    let prompt = `${sport.charAt(0).toUpperCase() + sport.slice(1)} highlight: ${moment}`;

    if (intensity === 'high') {
      prompt += ', epic moment, dramatic lighting, dynamic composition, slow-motion effect suggested';
    }

    prompt += ', professional broadcast quality, high resolution';

    return prompt;
  }

  /**
   * Build a prompt for "NiggaBets" branded content (edgy/casual tone)
   */
  buildNiggaBetsPrompt(idea, context = {}) {
    const { contentType = 'reaction', style = 'casual' } = context;

    let prompt = `NiggaBets style content: ${idea}`;

    // Apply edgy/casual style
    if (style === 'casual') {
      prompt += ', unfiltered energy, authentic vibes, street-style aesthetic';
    } else if (style === 'bold') {
      prompt += ', bold typography, high contrast, eye-catching design';
    }

    // Add content-type specific enhancements
    if (contentType === 'reaction') {
      prompt += ', genuine reaction, candid moment, high emotion';
    } else if (contentType === 'highlight') {
      prompt += ', explosive action, dramatic moment, peak energy';
    } else if (contentType === 'overlay') {
      prompt += ', bold text overlay, vibrant colors, meme-ready composition';
    }

    prompt += ', shareable format, social media optimized';

    return prompt;
  }

  /**
   * Update engine with feedback from approval process
   * @param {Object} feedback - { jobId, response, idea, prompt, result }
   */
  updateFromFeedback(feedback) {
    const { response, idea, prompt, result, notes } = feedback;

    if (response === 'APPROVE') {
      this._recordApprovedPrompt({
        prompt,
        idea,
        result,
        notes: notes || 'Auto-approved',
        timestamp: new Date(),
      });
    } else if (response === 'REJECT') {
      this._recordFailedPrompt({
        prompt,
        idea,
        failure: notes || 'User rejected',
        timestamp: new Date(),
      });
    }

    // Extract and learn patterns
    this._learnPatterns(prompt, response);
  }

  /**
   * Get suggested improvements based on feedback
   * @param {Object} feedback - { issue, context }
   * @returns {Array<string>} Suggested prompt modifications
   */
  getSuggestedImprovements(feedback) {
    const { issue, context } = feedback;
    const suggestions = [];

    if (issue.includes('expression') || issue.includes('face')) {
      suggestions.push('closer face composition');
      suggestions.push('more dramatic facial expression');
      suggestions.push('better lighting on face');
    }

    if (issue.includes('quality') || issue.includes('resolution')) {
      suggestions.push('8k resolution');
      suggestions.push('professional cinematography');
      suggestions.push('high definition');
    }

    if (issue.includes('emotion') || issue.includes('energy')) {
      suggestions.push('higher intensity');
      suggestions.push('more dramatic moment');
      suggestions.push('peak emotion captured');
    }

    if (issue.includes('color') || issue.includes('style')) {
      suggestions.push('vibrant color palette');
      suggestions.push('consistent color grading');
      suggestions.push('professional color correction');
    }

    return suggestions;
  }

  /**
   * Get similar successful prompts
   * @param {string} idea
   * @returns {Array<Object>}
   */
  getSimilarSuccessful(idea) {
    if (!this.skillData.approvedPrompts) return [];

    return this.skillData.approvedPrompts
      .filter(p => this._calculateSimilarity(idea, p.idea) > 0.5)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  }

  /**
   * Private: Get quality modifier
   * @private
   */
  _getQualityModifier(quality) {
    const modifiers = {
      low: ', basic quality',
      medium: ', good quality, detailed',
      high: ', high quality, highly detailed, professional',
      ultra: ', ultra high quality, masterpiece, extreme detail, stunning',
    };
    return modifiers[quality] || modifiers.high;
  }

  /**
   * Private: Get technical specs
   * @private
   */
  _getTechnicalSpecs(type, quality) {
    if (type === 'video') {
      return ', video format, smooth motion, 24fps cinematic';
    }
    if (quality === 'ultra') {
      return ', 8k resolution, intricate details';
    }
    return ', high resolution';
  }

  /**
   * Private: Get category enhancements
   * @private
   */
  _getCategoryEnhancements(category) {
    const enhancements = {
      'AI Streamer Reactions': ', close-up face, authentic expression, professional lighting',
      'Gaming Highlights': ', action scene, dynamic composition, dramatic lighting',
      'Sports Moments': ', athletic action, stadium atmosphere, professional broadcast quality',
      'Meme Content': ', funny composition, shareable format, high contrast',
      'Character Design': ', detailed character, unique personality, professional illustration',
    };
    return enhancements[category] || '';
  }

  /**
   * Private: Select relevant patterns
   * @private
   */
  _selectRelevantPatterns(idea, category) {
    if (!this.skillData.patterns) return [];

    return this.skillData.patterns
      .filter(p => {
        if (category && p.category !== category) return false;
        return this._isRelevant(idea, p.text);
      })
      .slice(0, 2)
      .map(p => p.text);
  }

  /**
   * Private: Extract pattern details from prompt
   * @private
   */
  _extractPatternDetails(prompt) {
    // Extract key quality/style descriptors
    const patterns = prompt.match(/\b(professional|cinematic|dramatic|high quality|close-up|detailed)\b/gi);
    return patterns ? patterns.slice(0, 2).join(', ') : null;
  }

  /**
   * Private: Record approved prompt
   * @private
   */
  _recordApprovedPrompt(data) {
    if (!this.skillData.approvedPrompts) {
      this.skillData.approvedPrompts = [];
    }
    this.skillData.approvedPrompts.push({
      ...data,
      status: 'APPROVED',
    });
  }

  /**
   * Private: Record failed prompt
   * @private
   */
  _recordFailedPrompt(data) {
    if (!this.skillData.failedPrompts) {
      this.skillData.failedPrompts = [];
    }
    this.skillData.failedPrompts.push({
      ...data,
      status: 'FAILED',
    });
  }

  /**
   * Private: Learn patterns from prompts
   * @private
   */
  _learnPatterns(prompt, response) {
    if (!this.skillData.patterns) {
      this.skillData.patterns = [];
    }

    // Extract quality modifiers
    const qualityKeywords = [
      'professional', 'cinematic', 'dramatic', 'high quality',
      'detailed', 'stunning', 'masterpiece', 'close-up'
    ];

    for (const keyword of qualityKeywords) {
      if (prompt.toLowerCase().includes(keyword) && response === 'APPROVE') {
        const existing = this.skillData.patterns.find(p => p.text === keyword);
        if (existing) {
          existing.score = (existing.score || 1) + 1;
        } else {
          this.skillData.patterns.push({
            text: keyword,
            score: 1,
            timestamp: new Date(),
          });
        }
      }
    }
  }

  /**
   * Private: Calculate similarity between two strings
   * @private
   */
  _calculateSimilarity(str1, str2) {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const common = words1.filter(w => words2.includes(w)).length;
    return common / Math.max(words1.length, words2.length);
  }

  /**
   * Private: Check if pattern is relevant
   * @private
   */
  _isRelevant(idea, pattern) {
    const ideaWords = idea.toLowerCase().split(/\s+/);
    return ideaWords.some(word => pattern.toLowerCase().includes(word));
  }

  /**
   * Private: Default model config
   * @private
   */
  _defaultModelConfig() {
    return {
      imageModel: 'stable-diffusion-3',
      videoModel: 'dino-v3',
      sampler: 'DPM++ 2M Karras',
      steps: 30,
      cfgScale: 7.5,
    };
  }
}

export default PromptEngine;
