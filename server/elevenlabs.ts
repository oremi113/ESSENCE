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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json() as ElevenLabsError;
        errorMessage = errorData.detail?.message || errorMessage;
      } catch {
        // Response isn't JSON, use status text
      }
      throw new Error(`ElevenLabs API error: ${errorMessage}`);
    }

    return response;
  }

  /**
   * Create a new voice from training samples
   */
  async createVoice(name: string, description: string, files: { name: string; data: Buffer; mimeType?: string }[]): Promise<string> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    // Add each audio file with proper MIME type and validation
    files.forEach((file, index) => {
      const mimeType = file.mimeType || 'audio/wav';
      
      // Check if MIME type is supported by ElevenLabs
      const supportedFormats = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/flac'];
      if (!supportedFormats.some(format => mimeType.includes(format.split('/')[1]))) {
        console.warn(`Potentially unsupported audio format: ${mimeType}. May cause voice creation issues.`);
      }
      
      const extension = mimeType.includes('webm') ? 'webm' : 
                      mimeType.includes('mp3') ? 'mp3' :
                      mimeType.includes('mpeg') ? 'mp3' :
                      mimeType.includes('m4a') ? 'm4a' :
                      mimeType.includes('flac') ? 'flac' : 'wav';
      const fileName = file.name.replace(/\.\w+$/, `.${extension}`);
      
      const blob = new Blob([file.data], { type: mimeType });
      formData.append('files', blob, fileName);
    });

    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json() as ElevenLabsError;
        errorMessage = errorData.detail?.message || errorMessage;
      } catch {
        // Response isn't JSON, use status text
      }
      throw new Error(`Failed to create voice: ${errorMessage}`);
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
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        },
        output_format: 'mp3_44100_128'
      }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json() as ElevenLabsError;
        errorMessage = errorData.detail?.message || errorMessage;
      } catch {
        // Response isn't JSON, use status text
      }
      throw new Error(`Failed to generate speech: ${errorMessage}`);
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
   * Returns buffer and extracted MIME type
   */
  convertBase64ToBuffer(base64Data: string): { buffer: Buffer; mimeType: string } {
    // Extract MIME type from data URL with robust regex that handles parameters
    const mimeMatch = base64Data.match(/^data:(audio\/[^;,]+)(?:[^,]*)?;base64,/i);
    const mimeType = mimeMatch ? mimeMatch[1] : 'audio/wav';
    
    // Remove data URL prefix if present (handles various formats)
    const cleanBase64 = base64Data.replace(/^data:[^,]+,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    return { buffer, mimeType };
  }

  /**
   * Convert Buffer to base64 data URL for frontend
   */
  convertBufferToBase64(buffer: Buffer, mimeType: string = 'audio/mpeg'): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}

export const elevenLabsService = new ElevenLabsService();