#!/usr/bin/env node

import { WorkflowManager } from './lib/workflow-manager.js';
import { TelegramSender } from './lib/telegram-sender.js';
import { PromptEngine } from './lib/prompt-engine.js';
import { SkillFileManager } from './lib/skill-file-manager.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * ComfyUI OpenClaw Skill
 * 
 * Main orchestrator for content generation workflow:
 * 1. Build prompt from idea + learnings
 * 2. Queue to ComfyUI
 * 3. Wait for generation
 * 4. Send to Telegram for approval
 * 5. Learn from feedback
 * 6. Update skill file
 */
export class ComfyUISkill {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || process.env.COMFYUI_API_ENDPOINT,
      telegramBotToken: config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: config.telegramChatId || process.env.TELEGRAM_CHAT_ID,
      outputDir: config.outputDir || `${process.env.HOME}/.openclaw/cache/comfyui-outputs`,
      skillFilePath: config.skillFilePath || `${process.env.HOME}/.openclaw/workspace/skills/comfyui/skill-file.md`,
      ...config,
    };

    // Initialize components
    this.workflowManager = new WorkflowManager({
      apiEndpoint: this.config.apiEndpoint,
    });

    this.telegramSender = new TelegramSender({
      botToken: this.config.telegramBotToken,
      chatId: this.config.telegramChatId,
    });

    this.skillFileManager = new SkillFileManager({
      skillFilePath: this.config.skillFilePath,
    });

    this.promptEngine = new PromptEngine({
      skillData: this.skillFileManager.export(),
    });

    this.jobs = new Map(); // Track jobs in progress
  }

  /**
   * Generate content from an idea
   * This is the main entry point for the skill
   * 
   * @param {Object} request - { idea, type: 'image'|'video', context, waitForApproval }
   * @returns {Promise<Object>} - { jobId, status, outputs, approval }
   */
  async generate(request) {
    const {
      idea,
      type = 'image',
      context = {},
      waitForApproval = true,
      category = null,
    } = request;

    console.log(`\n🎬 ComfyUI Skill: Generating ${type}`);
    console.log(`   Idea: ${idea}`);
    console.log(`   Category: ${category || 'General'}`);

    try {
      // Step 1: Build prompt from idea + learnings
      console.log(`\n📝 Step 1: Building prompt...`);
      const prompt = this._buildPromptForIdea(idea, type, category, context);
      console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

      // Step 2: Queue to ComfyUI
      console.log(`\n⏳ Step 2: Queuing to ComfyUI...`);
      const workflow = this._loadWorkflow(type);
      const populated = this._populateWorkflow(workflow, prompt);
      
      const queueResult = await this.workflowManager.queueWorkflow(populated, {
        clientId: `openclaw-${idea.substring(0, 20)}-${Date.now()}`,
      });

      console.log(`   Job ID: ${queueResult.jobId}`);
      console.log(`   Prompt ID: ${queueResult.promptId}`);

      // Step 3: Wait for generation
      console.log(`\n⏳ Step 3: Waiting for generation (this may take a minute)...`);
      const genResult = await this.workflowManager.pollJobStatus(queueResult.jobId, {
        maxWaitMs: 300000, // 5 minutes
      });

      if (genResult.status !== 'completed') {
        throw new Error(`Generation failed: ${genResult.error}`);
      }

      console.log(`   ✅ Generation complete!`);
      const outputPath = this._saveOutputs(queueResult.jobId, genResult.outputs, type);
      console.log(`   Saved to: ${outputPath}`);

      // Step 4: Send to Telegram for approval (if requested)
      let approvalResult = null;
      if (waitForApproval) {
        console.log(`\n📱 Step 4: Sending to Telegram for approval...`);
        const telegramResult = await this._sendForApproval(
          outputPath,
          type,
          { idea, jobId: queueResult.jobId, prompt }
        );

        if (!telegramResult.isMocked) {
          console.log(`   Message ID: ${telegramResult.messageId}`);
          console.log(`   Waiting for response...`);
          approvalResult = await this.telegramSender.waitForApproval(queueResult.jobId);
          console.log(`   Response: ${approvalResult.response}`);
        } else {
          approvalResult = telegramResult;
          console.log(`   [MOCK MODE] Auto-approved`);
        }

        // Step 5: Learn from feedback
        console.log(`\n📚 Step 5: Updating skill from feedback...`);
        await this._learnFromFeedback(
          queueResult.jobId,
          idea,
          prompt,
          approvalResult.response,
          outputPath,
          category
        );
        console.log(`   ✅ Skill updated!`);
      }

      return {
        jobId: queueResult.jobId,
        promptId: queueResult.promptId,
        status: 'completed',
        type,
        idea,
        prompt,
        outputPath,
        approvalStatus: approvalResult?.response || 'not_requested',
        feedback: approvalResult?.feedback || null,
      };
    } catch (error) {
      console.error(`❌ Generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate AI streamer reaction (specialized)
   */
  async generateStreamerReaction(scenario, context = {}) {
    return this.generate({
      idea: `AI streamer reacting to: ${scenario}`,
      type: 'image',
      category: 'AI Streamer Reactions',
      context: {
        ...context,
        emotion: context.emotion || 'shocked',
        intensity: context.intensity || 'high',
      },
      waitForApproval: true,
    });
  }

  /**
   * Generate sports/gaming highlight
   */
  async generateHighlight(moment, context = {}) {
    return this.generate({
      idea: `${context.sport || 'Gaming'} highlight: ${moment}`,
      type: context.contentType === 'video' ? 'video' : 'image',
      category: 'Gaming Highlights',
      context,
      waitForApproval: true,
    });
  }

  /**
   * Generate NiggaBets branded content
   */
  async generateNiggaBetsContent(idea, context = {}) {
    const prompt = this.promptEngine.buildNiggaBetsPrompt(idea, context);
    return this.generate({
      idea: `NiggaBets - ${idea}`,
      type: context.contentType === 'video' ? 'video' : 'image',
      category: 'NiggaBets Content',
      context: {
        ...context,
        customPrompt: prompt,
      },
      waitForApproval: true,
    });
  }

  /**
   * Get skill statistics
   */
  getStats() {
    return this.skillFileManager.getStats();
  }

  /**
   * Get approved prompts by category
   */
  getApprovedPrompts(category = null) {
    return this.skillFileManager.getApprovedByCategory(category);
  }

  /**
   * Get discovered patterns
   */
  getPatterns(category = null) {
    if (category) {
      return this.skillFileManager.getPatternsByCategory(category);
    }
    return this.skillFileManager.getPatterns();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    return this.workflowManager.getJobStatus(jobId);
  }

  /**
   * Set API endpoint (for RunPod or other ComfyUI instance)
   */
  setApiEndpoint(endpoint) {
    this.config.apiEndpoint = endpoint;
    this.workflowManager.setApiEndpoint(endpoint);
  }

  /**
   * Health check
   */
  async healthCheck() {
    const result = await this.workflowManager.healthCheck();
    return {
      apiHealthy: result,
      hasLearnings: this.skillFileManager.getStats().totalApproved > 0,
      endpoint: this.config.apiEndpoint,
    };
  }

  /**
   * Private: Build prompt for idea
   * @private
   */
  _buildPromptForIdea(idea, type, category, context) {
    if (context.customPrompt) {
      return context.customPrompt;
    }

    if (category === 'AI Streamer Reactions') {
      return this.promptEngine.buildStreamerReactionPrompt(idea, context);
    }

    if (category === 'Gaming Highlights') {
      return this.promptEngine.buildHighlightPrompt(idea, context);
    }

    return this.promptEngine.buildPrompt(idea, { type, category, ...context });
  }

  /**
   * Private: Load workflow template
   * @private
   */
  _loadWorkflow(type) {
    const templatePath = resolve(
      new URL(import.meta.url).pathname,
      '..',
      `templates/${type}-workflow.json`
    );
    const content = readFileSync(templatePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Private: Populate workflow with prompt and settings
   * @private
   */
  _populateWorkflow(workflow, prompt) {
    const populated = JSON.parse(JSON.stringify(workflow));

    // Find and populate text encoding node (usually node "2")
    for (const [nodeId, node] of Object.entries(populated)) {
      if (node.class_type === 'CLIPTextEncode (Positive)') {
        node.inputs.text = prompt;
      }

      // Set generation parameters
      if (node.class_type === 'KSampler' || node.class_type === 'KSamplerVideo') {
        node.inputs.seed = Math.floor(Math.random() * 1000000000);
        node.inputs.steps = 30;
        node.inputs.cfg = 7.5;
      }
    }

    return populated;
  }

  /**
   * Private: Save outputs from generation
   * @private
   */
  _saveOutputs(jobId, outputs, type) {
    // This is a placeholder - in real implementation would:
    // 1. Download images/videos from ComfyUI
    // 2. Save to output directory
    // 3. Return path
    const outputPath = `${this.config.outputDir}/${jobId}-${type}`;
    console.log(`   (Saving to: ${outputPath})`);
    return outputPath;
  }

  /**
   * Private: Send to Telegram for approval
   * @private
   */
  async _sendForApproval(outputPath, type, metadata) {
    if (type === 'video') {
      return this.telegramSender.sendVideoForApproval(outputPath, metadata);
    }
    return this.telegramSender.sendImageForApproval(outputPath, metadata);
  }

  /**
   * Private: Learn from feedback
   * @private
   */
  async _learnFromFeedback(jobId, idea, prompt, response, outputPath, category) {
    if (response === 'APPROVE') {
      this.skillFileManager.recordApproved({
        prompt,
        idea,
        result: `Generated successfully. Output: ${outputPath}`,
        notes: 'User approved via Telegram',
        category: category || 'General',
      });

      this.promptEngine.updateFromFeedback({
        response: 'APPROVE',
        idea,
        prompt,
        result: outputPath,
      });
    } else if (response === 'REJECT') {
      this.skillFileManager.recordFailed({
        prompt,
        idea,
        failure: 'User rejected the output',
        fix: 'Try alternative prompt modifications',
        category: category || 'General',
      });
    }
  }
}

/**
 * CLI Entry Point
 * Usage: node index.js --idea "..." --type image
 */
async function main() {
  const args = process.argv.slice(2);
  const request = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--idea' && args[i + 1]) {
      request.idea = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      request.type = args[i + 1];
      i++;
    } else if (args[i] === '--category' && args[i + 1]) {
      request.category = args[i + 1];
      i++;
    } else if (args[i] === '--endpoint' && args[i + 1]) {
      process.env.COMFYUI_API_ENDPOINT = args[i + 1];
      i++;
    } else if (args[i] === '--stats') {
      const skill = new ComfyUISkill();
      console.log(JSON.stringify(skill.getStats(), null, 2));
      process.exit(0);
    } else if (args[i] === '--health-check') {
      const skill = new ComfyUISkill();
      const health = await skill.healthCheck();
      console.log(JSON.stringify(health, null, 2));
      process.exit(0);
    }
  }

  if (!request.idea) {
    console.log('Usage: node index.js --idea "your idea" [--type image|video] [--category "category"]');
    console.log('Or: node index.js --stats');
    console.log('Or: node index.js --health-check');
    process.exit(1);
  }

  try {
    const skill = new ComfyUISkill();
    const result = await skill.generate(request);
    console.log('\n✅ Success!');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ComfyUISkill;
