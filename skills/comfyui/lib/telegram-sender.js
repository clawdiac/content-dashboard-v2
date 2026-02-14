import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * TelegramSender - Sends generated images/videos to Telegram for approval
 * - Sends media with caption
 * - Tracks approval status
 * - Handles feedback collection
 */
export class TelegramSender {
  constructor(config = {}) {
    this.botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;
    this.apiEndpoint = 'https://api.telegram.org/bot';
    this.approvalMessages = new Map(); // Track sent approval messages
    this.validateConfig();
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    if (!this.botToken) {
      console.warn('⚠️  TELEGRAM_BOT_TOKEN not set - Telegram integration will be mocked');
    }
    if (!this.chatId) {
      console.warn('⚠️  TELEGRAM_CHAT_ID not set - Will use default placeholder');
    }
  }

  /**
   * Send image for approval
   * @param {string} imagePath - Full path to image file
   * @param {Object} metadata - Approval context
   * @returns {Promise<{messageId, status}>}
   */
  async sendImageForApproval(imagePath, metadata = {}) {
    try {
      const { idea, jobId, promptUsed } = metadata;

      // If no Telegram credentials, mock the response
      if (!this.botToken || !this.chatId) {
        return this._mockSendImage(imagePath, metadata);
      }

      const imageBuffer = readFileSync(imagePath);
      const caption = this._buildCaption(idea, jobId, promptUsed);

      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('photo', blob, `comfyui-${jobId}.jpg`);
      formData.append('chat_id', this.chatId);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(
        `${this.apiEndpoint}${this.botToken}/sendPhoto`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const messageId = data.result.message_id;

      this.approvalMessages.set(jobId, {
        messageId,
        type: 'image',
        chatId: this.chatId,
        idea,
        status: 'pending_approval',
        sentAt: new Date(),
        response: null,
      });

      return { messageId, status: 'sent', type: 'image' };
    } catch (error) {
      console.error('Failed to send image to Telegram:', error);
      throw error;
    }
  }

  /**
   * Send video for approval
   * @param {string} videoPath - Full path to video file
   * @param {Object} metadata - Approval context
   * @returns {Promise<{messageId, status}>}
   */
  async sendVideoForApproval(videoPath, metadata = {}) {
    try {
      const { idea, jobId, promptUsed } = metadata;

      // If no Telegram credentials, mock the response
      if (!this.botToken || !this.chatId) {
        return this._mockSendVideo(videoPath, metadata);
      }

      const videoBuffer = readFileSync(videoPath);
      const caption = this._buildCaption(idea, jobId, promptUsed);

      const formData = new FormData();
      const blob = new Blob([videoBuffer], { type: 'video/mp4' });
      formData.append('video', blob, `comfyui-${jobId}.mp4`);
      formData.append('chat_id', this.chatId);
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      const response = await fetch(
        `${this.apiEndpoint}${this.botToken}/sendVideo`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const messageId = data.result.message_id;

      this.approvalMessages.set(jobId, {
        messageId,
        type: 'video',
        chatId: this.chatId,
        idea,
        status: 'pending_approval',
        sentAt: new Date(),
        response: null,
      });

      return { messageId, status: 'sent', type: 'video' };
    } catch (error) {
      console.error('Failed to send video to Telegram:', error);
      throw error;
    }
  }

  /**
   * Wait for approval response (polling)
   * @param {string} jobId
   * @param {Object} options
   * @returns {Promise<{response, feedback}>}
   */
  async waitForApproval(jobId, options = {}) {
    const maxWaitMs = options.maxWaitMs || 3600000; // 1 hour default
    const pollingInterval = options.pollingInterval || 5000; // 5 seconds
    const startTime = Date.now();

    const approval = this.approvalMessages.get(jobId);
    if (!approval) {
      throw new Error(`Approval message not found for job: ${jobId}`);
    }

    if (!this.botToken || !this.chatId) {
      return this._mockWaitForApproval(jobId);
    }

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(
          `${this.apiEndpoint}${this.botToken}/getUpdates?limit=100`
        );

        if (!response.ok) {
          throw new Error(`Telegram API error: ${response.status}`);
        }

        const data = await response.json();
        const updates = data.result || [];

        for (const update of updates) {
          const message = update.message;
          if (
            message &&
            message.chat.id === parseInt(this.chatId) &&
            message.reply_to_message?.message_id === approval.messageId
          ) {
            const text = message.text?.toUpperCase() || '';

            if (text.includes('APPROVE')) {
              approval.status = 'approved';
              approval.response = 'APPROVE';
              approval.feedback = this._extractFeedback(message.text);
              return { response: 'APPROVE', feedback: approval.feedback };
            }

            if (text.includes('REJECT')) {
              approval.status = 'rejected';
              approval.response = 'REJECT';
              approval.feedback = this._extractFeedback(message.text);
              return { response: 'REJECT', feedback: approval.feedback };
            }

            // Any other response is treated as feedback for revision
            approval.status = 'feedback';
            approval.response = 'FEEDBACK';
            approval.feedback = message.text;
            return { response: 'FEEDBACK', feedback: message.text };
          }
        }

        await this._delay(pollingInterval);
      } catch (error) {
        console.error('Error checking for approval:', error);
        await this._delay(pollingInterval);
      }
    }

    approval.status = 'timeout';
    throw new Error(`Approval timeout for job: ${jobId}`);
  }

  /**
   * Get approval tracking info
   */
  getApprovalStatus(jobId) {
    return this.approvalMessages.get(jobId);
  }

  /**
   * Get all approval messages
   */
  getAllApprovals() {
    return Array.from(this.approvalMessages.values());
  }

  /**
   * Build approval caption
   * @private
   */
  _buildCaption(idea, jobId, promptUsed) {
    let caption = `[APPROVAL] ${idea || 'Generated Content'}\n\n`;
    caption += `Job ID: \`${jobId}\`\n`;
    if (promptUsed) {
      caption += `Prompt: \`${promptUsed.substring(0, 100)}...\`\n`;
    }
    caption += `\nReply with:\n`;
    caption += `✅ APPROVE\n`;
    caption += `❌ REJECT\n`;
    caption += `📝 [FEEDBACK] to request changes`;
    return caption;
  }

  /**
   * Extract feedback from response
   * @private
   */
  _extractFeedback(text) {
    if (!text) return null;
    const match = text.match(/\[FEEDBACK\](.*)/i);
    return match ? match[1].trim() : text;
  }

  /**
   * Mock send image (for testing without Telegram)
   * @private
   */
  async _mockSendImage(imagePath, metadata) {
    const mockMessageId = Math.random().toString(36).slice(2, 10);
    console.log(`📸 [MOCK] Sending image: ${imagePath}`);
    console.log(`   Idea: ${metadata.idea}`);
    console.log(`   Message ID: ${mockMessageId}`);

    this.approvalMessages.set(metadata.jobId, {
      messageId: mockMessageId,
      type: 'image',
      idea: metadata.idea,
      status: 'pending_approval',
      sentAt: new Date(),
      response: null,
      isMocked: true,
    });

    return { messageId: mockMessageId, status: 'sent', type: 'image', isMocked: true };
  }

  /**
   * Mock send video (for testing without Telegram)
   * @private
   */
  async _mockSendVideo(videoPath, metadata) {
    const mockMessageId = Math.random().toString(36).slice(2, 10);
    console.log(`🎥 [MOCK] Sending video: ${videoPath}`);
    console.log(`   Idea: ${metadata.idea}`);
    console.log(`   Message ID: ${mockMessageId}`);

    this.approvalMessages.set(metadata.jobId, {
      messageId: mockMessageId,
      type: 'video',
      idea: metadata.idea,
      status: 'pending_approval',
      sentAt: new Date(),
      response: null,
      isMocked: true,
    });

    return { messageId: mockMessageId, status: 'sent', type: 'video', isMocked: true };
  }

  /**
   * Mock wait for approval (for testing without Telegram)
   * @private
   */
  async _mockWaitForApproval(jobId) {
    console.log(`⏳ [MOCK] Waiting for approval on job: ${jobId}`);
    console.log(`   (Auto-approving in mock mode)`);
    const approval = this.approvalMessages.get(jobId);
    if (approval) {
      approval.status = 'approved';
      approval.response = 'APPROVE';
      approval.feedback = null;
    }
    return { response: 'APPROVE', feedback: null, isMocked: true };
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TelegramSender;
