import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'crypto';

/**
 * WorkflowManager - Handles queuing workflows to ComfyUI API
 * - Queues jobs
 * - Polls job status
 * - Retrieves outputs
 * - Manages job history
 */
export class WorkflowManager {
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || process.env.COMFYUI_API_ENDPOINT || 'http://localhost:8188';
    this.pollingInterval = config.pollingInterval || 2000; // 2 seconds
    this.maxRetries = config.maxRetries || 5;
    this.jobs = new Map(); // Track active jobs
  }

  /**
   * Queue a workflow for execution
   * @param {Object} workflow - ComfyUI workflow object
   * @param {Object} options - Queue options
   * @returns {Promise<{jobId, status}>}
   */
  async queueWorkflow(workflow, options = {}) {
    try {
      const jobId = options.jobId || this._generateJobId();
      
      const payload = {
        prompt: workflow,
        client_id: options.clientId || `openclaw-${jobId}`,
      };

      const response = await fetch(`${this.apiEndpoint}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ComfyUI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const promptId = data.prompt_id;

      this.jobs.set(jobId, {
        jobId,
        promptId,
        workflow,
        status: 'queued',
        createdAt: new Date(),
        outputs: null,
        error: null,
      });

      return { jobId, promptId, status: 'queued' };
    } catch (error) {
      console.error('Failed to queue workflow:', error);
      throw error;
    }
  }

  /**
   * Poll job status and get outputs when ready
   * @param {string} jobId - Job ID returned from queueWorkflow
   * @param {Object} options - Polling options
   * @returns {Promise<{status, outputs, error}>}
   */
  async pollJobStatus(jobId, options = {}) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const maxWaitMs = options.maxWaitMs || 300000; // 5 minutes default
    const startTime = Date.now();
    let retryCount = 0;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const status = await this._checkPromptStatus(job.promptId);

        if (status.status === 'completed') {
          job.status = 'completed';
          job.outputs = status.outputs;
          return { status: 'completed', outputs: status.outputs };
        }

        if (status.status === 'failed') {
          job.status = 'failed';
          job.error = status.error;
          return { status: 'failed', error: status.error };
        }

        // Still processing
        await this._delay(this.pollingInterval);
      } catch (error) {
        retryCount++;
        if (retryCount > this.maxRetries) {
          job.status = 'error';
          job.error = error.message;
          throw error;
        }
        await this._delay(this.pollingInterval);
      }
    }

    job.status = 'timeout';
    job.error = `Job exceeded max wait time: ${maxWaitMs}ms`;
    throw new Error(job.error);
  }

  /**
   * Get current job status without waiting
   * @param {string} jobId
   * @returns {Promise<Object>}
   */
  async getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const status = await this._checkPromptStatus(job.promptId);
    return {
      jobId,
      promptId: job.promptId,
      status: status.status,
      outputs: status.outputs,
      error: status.error,
    };
  }

  /**
   * Get all job history
   * @returns {Map}
   */
  getJobHistory() {
    return this.jobs;
  }

  /**
   * Clear job history
   */
  clearJobHistory() {
    this.jobs.clear();
  }

  /**
   * Private: Check prompt status from ComfyUI API
   * @private
   */
  async _checkPromptStatus(promptId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/history/${promptId}`);
      
      if (response.status === 404) {
        return { status: 'processing', outputs: null };
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const history = await response.json();

      if (!history[promptId]) {
        return { status: 'processing', outputs: null };
      }

      const result = history[promptId];

      if (result.outputs) {
        return { status: 'completed', outputs: result.outputs };
      }

      if (result.error) {
        return { status: 'failed', error: result.error };
      }

      return { status: 'processing', outputs: null };
    } catch (error) {
      console.error('Error checking prompt status:', error);
      throw error;
    }
  }

  /**
   * Private: Generate unique job ID
   * @private
   */
  _generateJobId() {
    return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Private: Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set custom API endpoint
   */
  setApiEndpoint(endpoint) {
    this.apiEndpoint = endpoint;
  }

  /**
   * Health check - verify ComfyUI is reachable
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.apiEndpoint}/system/status`);
      return response.ok;
    } catch (error) {
      console.error('ComfyUI health check failed:', error);
      return false;
    }
  }
}

export default WorkflowManager;
