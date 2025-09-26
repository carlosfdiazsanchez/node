export interface ARIEvent {
  type: string;
  channel?: ARIChannel;
  bridge?: ARIBridge;
  timestamp: string;
}

export interface ARIChannel {
  id: string;
  name: string;
  state: string;
}

export interface ARIBridge {
  id: string;
}

export class ARIClient {
  private baseURL: string;
  private user: string;
  private pass: string;

  constructor(baseURL: string, user: string, pass: string) {
    this.baseURL = baseURL;
    this.user = user;
    this.pass = pass;
  }

  private async doRequest(method: string, path: string, body?: any): Promise<Response> {
    const url = this.baseURL + path;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.user) {
      const auth = Buffer.from(`${this.user}:${this.pass}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }
    const options: any = {
      method,
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    // @ts-ignore
    return fetch(url, options);
  }

  async originate(endpoint: string, app: string): Promise<string> {
    const data = { endpoint, app, extension: 's' };
    console.log('[ARIClient] Intentando originate:', JSON.stringify(data));
    const resp = await this.doRequest('POST', '/ari/channels', data);
    console.log('[ARIClient] Respuesta originate:', resp.status, resp.statusText);
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[ARIClient] Originate falló. Status:', resp.status, 'Body:', body);
      throw new Error(`Originate failed: ${body}`);
    }
    const location = resp.headers.get('Location');
    console.log('[ARIClient] Header Location:', location);
    if (location) {
      const parts = location.split('/');
      return parts[parts.length - 1];
    }
    // Fallback: intentar extraer el id del canal del body JSON
    try {
      const body = await resp.json();
      if (body && body.id) {
        console.log('[ARIClient] Canal creado por body JSON:', body.id);
        return body.id;
      }
    } catch (e) {
      console.error('[ARIClient] Error parseando body JSON:', e);
    }
    throw new Error('No location header ni id en body JSON');
  }

  async createBridge(): Promise<string> {
    const data = { type: 'mixing' };
    const resp = await this.doRequest('POST', '/ari/bridges', data);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Create bridge failed: ${body}`);
    }
    const location = resp.headers.get('Location');
    if (location) {
      const parts = location.split('/');
      return parts[parts.length - 1];
    }
    throw new Error('No location header');
  }

  async addChannelToBridge(bridgeID: string, channelID: string): Promise<void> {
    const resp = await this.doRequest('POST', `/ari/bridges/${bridgeID}/addChannel?channel=${channelID}`);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Add channel failed: ${body}`);
    }
  }

  async answerChannel(channelID: string): Promise<void> {
    const resp = await this.doRequest('POST', `/ari/channels/${channelID}/answer`);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Answer failed: ${body}`);
    }
  }

  async hangupChannel(channelID: string): Promise<void> {
    const resp = await this.doRequest('DELETE', `/ari/channels/${channelID}`);
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Hangup failed: ${body}`);
    }
  }
}
