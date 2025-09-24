// Using built-in fetch (Node.js 18+)

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  fine_tuning: {
    is_allowed: boolean;
    finetuning_requested: boolean;
    finetuning_state: string;
  };
}

interface ElevenLabsError {
  detail: {
    status: string;
    message: string;
  };
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
  }

  private async makeRequest(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json() as ElevenLabsError;
      throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`);
    }

    return response;
  }

  /**
   * Create a new voice from training samples
   */
  async createVoice(name: string, description: string, files: { name: string; data: Buffer }[]): Promise<string> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    // Add each audio file
    files.forEach((file, index) => {
      const blob = new Blob([file.data], { type: 'audio/wav' });
      formData.append('files', blob, file.name);
    });

    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json() as ElevenLabsError;
      throw new Error(`Failed to create voice: ${error.detail?.message || response.statusText}`);
    }

    const result = await response.json() as { voice_id: string };
    return result.voice_id;
  }

  /**
   * Generate speech from text using a voice
   */
  async generateSpeech(text: string, voiceId: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json() as ElevenLabsError;
      throw new Error(`Failed to generate speech: ${error.detail?.message || response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Get voice details including training status
   */
  async getVoice(voiceId: string): Promise<ElevenLabsVoice> {
    const response = await this.makeRequest(`/voices/${voiceId}`);
    return await response.json() as ElevenLabsVoice;
  }

  /**
   * List all available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    const response = await this.makeRequest('/voices');
    const result = await response.json() as { voices: ElevenLabsVoice[] };
    return result.voices;
  }

  /**
   * Delete a voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    await this.makeRequest(`/voices/${voiceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Convert base64 audio data to Buffer for API calls
   */
  convertBase64ToBuffer(base64Data: string): Buffer {
    // Remove data:audio/wav;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:audio\/[a-z]+;base64,/, '');
    return Buffer.from(cleanBase64, 'base64');
  }

  /**
   * Convert Buffer to base64 data URL for frontend
   */
  convertBufferToBase64(buffer: Buffer, mimeType: string = 'audio/mpeg'): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}

export const elevenLabsService = new ElevenLabsService();