
import { Buffer } from 'node:buffer';

const config = {
  baseUrl: 'https://asterisk.ridinn.com/ari',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function answerChannel(channelId: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/channels/${channelId}/answer`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    });
    console.log(`[OK] Canal ${channelId} contestado.`);
  } catch (error) {
    console.error(`[ERROR] answerChannel canal ${channelId}:`, error);
  }
}

export async function hangupChannel(channelId: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/channels/${channelId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
    });
    console.log(`[OK] Canal ${channelId} colgado.`);
  } catch (error) {
    console.error(`[ERROR] hangupChannel canal ${channelId}:`, error);
  }
}

export async function startMohOnChannel(channelId: string, className?: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/channels/${channelId}/moh`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: className ? JSON.stringify({ mohClass: className }) : undefined,
    });
    console.log(`[OK] MOH iniciada en canal ${channelId}`);
  } catch (error) {
    console.error(`[ERROR] startMohOnChannel canal ${channelId}:`, error);
  }
}

export async function stopMohOnChannel(channelId: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/channels/${channelId}/moh`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      },
    });
    console.log(`[OK] MOH detenida en canal ${channelId}`);
  } catch (error) {
    console.error(`[ERROR] stopMohOnChannel canal ${channelId}:`, error);
  }
}

export async function originateChannel(endpoint: string, app: string, appArgs?: string): Promise<any> {
  try {
    const url = `${config.baseUrl}/channels`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        app,
        appArgs: appArgs || 'outbound',
      }),
    });
    const data = await res.json();
    console.log(`[OK] Canal destino originado a ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`[ERROR] originateChannel a ${endpoint}:`, error);
  }
}

export async function playAudioOnChannel(channelId: string, media: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/channels/${channelId}/play`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media }),
    });
    console.log(`[OK] Audio reproducido en canal ${channelId}`);
  } catch (error) {
    console.error(`[ERROR] playAudioOnChannel canal ${channelId}:`, error);
  }
}

export async function createBridge(bridgeId: string, type: 'mixing' | 'holding' = 'mixing'): Promise<void> {
  try {
    const url = `${config.baseUrl}/bridges/${bridgeId}`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
    console.log(`[OK] Bridge ${bridgeId} creado.`);
  } catch (error) {
    console.error(`[ERROR] createBridge ${bridgeId}:`, error);
  }
}

export async function addChannelToBridge(bridgeId: string, channelId: string): Promise<void> {
  try {
    const url = `${config.baseUrl}/bridges/${bridgeId}/addChannel`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel: channelId }),
    });
    console.log(`[OK] Canal ${channelId} añadido al bridge ${bridgeId}`);
  } catch (error) {
    console.error(`[ERROR] addChannelToBridge canal ${channelId} bridge ${bridgeId}:`, error);
  }
}
