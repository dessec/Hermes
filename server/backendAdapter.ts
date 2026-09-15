/**
 * OpenClaw Backend Engine Adapter
 * 
 * Provides an abstracted, provider-agnostic inference bridge so the console can
 * execute queries via:
 * 1. Kaggle Polling Worker (Default queue-based architecture)
 * 2. Direct Ollama API (via OLLAMA_BASE_URL)
 * 3. OpenAI-Compatible API (via OPENAI_COMPATIBLE_URL / OPENAI_API_KEY)
 * 4. Custom Webhook Agent (via AGENT_WEBHOOK_URL)
 * 5. Offline Simulator (Default fallback for testing without active worker)
 */

export interface InferenceConfig {
  ollamaBaseUrl?: string;
  openaiCompatibleUrl?: string;
  openaiApiKey?: string;
  agentWebhookUrl?: string;
  defaultModel: string;
  defaultAgent: string;
}

export interface InferenceResult {
  content: string;
  model: string;
  agent: string;
  provider: 'kaggle_worker' | 'ollama' | 'openai_compatible' | 'webhook' | 'simulator';
}

export class BackendAdapter {
  private config: InferenceConfig;

  constructor() {
    this.config = {
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL?.trim(),
      openaiCompatibleUrl: process.env.OPENAI_COMPATIBLE_URL?.trim(),
      openaiApiKey: process.env.OPENAI_API_KEY?.trim(),
      agentWebhookUrl: process.env.AGENT_WEBHOOK_URL?.trim(),
      defaultModel: process.env.DEFAULT_MODEL || 'qwen3:14b-q4_K_M',
      defaultAgent: process.env.DEFAULT_AGENT || 'kaggle-strategist',
    };
  }

  public getActiveProvider(): string {
    if (this.config.ollamaBaseUrl) return 'Direct Ollama Endpoint';
    if (this.config.openaiCompatibleUrl) return 'OpenAI-Compatible Endpoint';
    if (this.config.agentWebhookUrl) return 'Custom Webhook Agent';
    return 'Kaggle Worker Queue / Broker';
  }

  public getPublicInfo() {
    return {
      activeProvider: this.getActiveProvider(),
      hasDirectOllama: Boolean(this.config.ollamaBaseUrl),
      hasOpenAICompatible: Boolean(this.config.openaiCompatibleUrl),
      hasWebhook: Boolean(this.config.agentWebhookUrl),
      defaultModel: this.config.defaultModel,
      defaultAgent: this.config.defaultAgent,
    };
  }

  /**
   * Attempts direct upstream inference if an external provider is configured.
   * Returns null if no direct provider is configured (allowing worker queue polling).
   */
  public async tryDirectInference(
    prompt: string,
    model?: string,
    agent?: string
  ): Promise<InferenceResult | null> {
    const selectedModel = model || this.config.defaultModel;
    const selectedAgent = agent || this.config.defaultAgent;

    // 1. Direct Ollama API
    if (this.config.ollamaBaseUrl) {
      try {
        const url = `${this.config.ollamaBaseUrl.replace(/\/+$/, '')}/api/generate`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            prompt: prompt,
            stream: false,
          }),
        });
        if (res.ok) {
          const data: any = await res.json();
          return {
            content: data.response || '',
            model: selectedModel,
            agent: selectedAgent,
            provider: 'ollama',
          };
        }
      } catch (err) {
        console.error('Ollama direct inference failed, falling back to queue:', err);
      }
    }

    // 2. OpenAI-Compatible API (e.g. vLLM, LM Studio, Groq, Together, DeepSeek)
    if (this.config.openaiCompatibleUrl) {
      try {
        const url = `${this.config.openaiCompatibleUrl.replace(/\/+$/, '')}/chat/completions`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (this.config.openaiApiKey) {
          headers['Authorization'] = `Bearer ${this.config.openaiApiKey}`;
        }
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: `You are ${selectedAgent}, an expert computational strategist and code synthesizer.` },
              { role: 'user', content: prompt }
            ],
          }),
        });
        if (res.ok) {
          const data: any = await res.json();
          const reply = data.choices?.[0]?.message?.content || '';
          return {
            content: reply,
            model: selectedModel,
            agent: selectedAgent,
            provider: 'openai_compatible',
          };
        }
      } catch (err) {
        console.error('OpenAI-compatible inference failed, falling back to queue:', err);
      }
    }

    // 3. Custom Webhook Agent
    if (this.config.agentWebhookUrl) {
      try {
        const res = await fetch(this.config.agentWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: selectedModel,
            agent: selectedAgent,
          }),
        });
        if (res.ok) {
          const data: any = await res.json();
          return {
            content: data.response || data.content || data.reply || JSON.stringify(data),
            model: selectedModel,
            agent: selectedAgent,
            provider: 'webhook',
          };
        }
      } catch (err) {
        console.error('Webhook inference failed, falling back to queue:', err);
      }
    }

    return null;
  }
}

export const backendAdapter = new BackendAdapter();
