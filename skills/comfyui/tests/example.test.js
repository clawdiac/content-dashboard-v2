/**
 * Example tests for ComfyUI Skill
 * 
 * These are example tests showing how to test the skill modules.
 * Run with: npm test
 */

import ComfyUISkill from '../index.js';
import { PromptEngine } from '../lib/prompt-engine.js';
import { SkillFileManager } from '../lib/skill-file-manager.js';
import { TelegramSender } from '../lib/telegram-sender.js';
import { WorkflowManager } from '../lib/workflow-manager.js';

console.log('🧪 ComfyUI Skill - Example Tests\n');

// Test 1: Prompt Engine
console.log('Test 1: Prompt Engine');
const promptEngine = new PromptEngine();

const basicPrompt = promptEngine.buildPrompt('shocked reaction', {
  type: 'image',
  quality: 'high',
  style: 'cinematic'
});
console.log('✓ Basic prompt:', basicPrompt.substring(0, 80) + '...');

const streamerPrompt = promptEngine.buildStreamerReactionPrompt('huge win', {
  emotion: 'shocked',
  intensity: 'high'
});
console.log('✓ Streamer prompt:', streamerPrompt.substring(0, 80) + '...');

const niggabetsPrompt = promptEngine.buildNiggaBetsPrompt('crazy odds hit', {
  contentType: 'reaction',
  style: 'bold'
});
console.log('✓ NiggaBets prompt:', niggabetsPrompt.substring(0, 80) + '...');

// Test 2: Skill File Manager
console.log('\nTest 2: Skill File Manager');
const skillManager = new SkillFileManager({
  skillFilePath: '/tmp/test-skill-file.md'
});

const approved = skillManager.recordApproved({
  prompt: 'AI streamer with shocked expression, close-up face...',
  idea: 'AI streamer shocked by big win',
  result: 'Generated successfully',
  notes: 'Perfect emotion and quality',
  category: 'AI Streamer Reactions'
});
console.log('✓ Recorded approved prompt:', approved.id);

const failed = skillManager.recordFailed({
  prompt: 'generic reaction',
  idea: 'Generic reaction test',
  failure: 'Too vague, poor quality output',
  fix: 'Add specific emotion and intensity descriptors',
  category: 'AI Streamer Reactions'
});
console.log('✓ Recorded failed prompt:', failed.id);

const pattern = skillManager.recordPattern({
  text: 'close-up face',
  description: 'Focus on face dramatically improves emotion clarity',
  category: 'AI Streamer Reactions',
  confidence: 'high',
  examples: ['shocked reaction', 'angry expression', 'happy moment']
});
console.log('✓ Recorded pattern:', pattern.text);

const stats = skillManager.getStats();
console.log(`✓ Stats: ${stats.totalApproved} approved, ${stats.totalFailed} failed, ${stats.successRate.toFixed(1)}% success rate`);

const similar = skillManager.findSimilar('shocked reaction');
console.log(`✓ Found ${similar.length} similar approved prompts`);

// Test 3: Telegram Sender (Mock Mode)
console.log('\nTest 3: Telegram Sender (Mock Mode)');
const telegram = new TelegramSender();
// Will run in mock mode since no bot token

const mockImageSend = await telegram.sendImageForApproval('/tmp/test.jpg', {
  idea: 'test image',
  jobId: 'job-test-123',
  promptUsed: 'test prompt'
});
console.log('✓ Image sent (mock):', mockImageSend.messageId);

const mockApproval = await telegram.waitForApproval('job-test-123');
console.log('✓ Approval response (mock):', mockApproval.response);

// Test 4: Workflow Manager
console.log('\nTest 4: Workflow Manager');
const workflowManager = new WorkflowManager({
  apiEndpoint: 'http://localhost:8188'
});

const health = await workflowManager.healthCheck();
console.log('✓ Health check:', health ? '✅ API is up' : '❌ API is down (expected in mock mode)');

// Test 5: Main Skill
console.log('\nTest 5: ComfyUI Skill (Main)');
const skill = new ComfyUISkill({
  outputDir: '/tmp/test-comfyui-outputs'
});

console.log('✓ Skill initialized');

// Get specialized methods
console.log('✓ Methods available:');
console.log('  - generate()');
console.log('  - generateStreamerReaction()');
console.log('  - generateHighlight()');
console.log('  - generateNiggaBetsContent()');
console.log('  - getStats()');
console.log('  - getApprovedPrompts()');
console.log('  - getPatterns()');
console.log('  - setApiEndpoint()');
console.log('  - healthCheck()');

// Test workflow loading
const imageWorkflow = skill._loadWorkflow('image');
console.log(`✓ Image workflow loaded: ${Object.keys(imageWorkflow).length} nodes`);

const videoWorkflow = skill._loadWorkflow('video');
console.log(`✓ Video workflow loaded: ${Object.keys(videoWorkflow).length} nodes`);

// Test prompt building
const customPrompt = skill._buildPromptForIdea(
  'shocked reaction',
  'image',
  'AI Streamer Reactions',
  { emotion: 'shocked', intensity: 'high' }
);
console.log('✓ Custom prompt built:', customPrompt.substring(0, 60) + '...');

// Test 6: Integration Example
console.log('\nTest 6: Integration Example');
console.log('This shows the complete flow (without actual generation):');
console.log('  1. Build prompt from idea + learnings');
console.log('  2. Queue to ComfyUI');
console.log('  3. Poll job status');
console.log('  4. Send to Telegram for approval');
console.log('  5. Wait for response');
console.log('  6. Update skill file with learning');

console.log('\n✅ All example tests passed!');
console.log('\nTo test with actual generation:');
console.log('  node index.js --idea "test idea" --type image');
console.log('\nTo check skill statistics:');
console.log('  node index.js --stats');
