
import { Buffer } from 'node:buffer';

const config = {
  baseUrl: 'https://asterisk.ridinn.com/ari',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function answerChannel(channelId: string): Promise<void> {
  const url = `${config.baseUrl}/channels/${channelId}/answer`;
  await fetch(url, {
    method: 'POST',
    headers: {
  'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      'Content-Type': 'application/json',
    },
  });
}

export async function hangupChannel(channelId: string): Promise<void> {
  const url = `${config.baseUrl}/channels/${channelId}`;
  await fetch(url, {
    method: 'DELETE',
    headers: {
  'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      'Content-Type': 'application/json',
    },
  });
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
    console.log(`[startMohOnChannel] MOH iniciada en canal ${channelId}`);
  } catch (error) {
    console.error(`[startMohOnChannel] Error al iniciar MOH en canal ${channelId}:`, error);
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
    console.log(`[stopMohOnChannel] MOH detenida en canal ${channelId}`);
  } catch (error) {
    console.error(`[stopMohOnChannel] Error al detener MOH en canal ${channelId}:`, error);
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
    return data;
  } catch (error) {
    console.error(`[originateChannel] Error al originar llamada a ${endpoint}:`, error);
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
  } catch (error) {
      console.error(`[playAudioOnChannel] Error al reproducir audio en canal ${channelId}:`, error);
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
    console.log(`[createBridge] Bridge ${bridgeId} creado.`);
  } catch (error) {
    console.error(`[createBridge] Error al crear bridge ${bridgeId}:`, error);
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
    console.log(`[addChannelToBridge] Canal ${channelId} añadido al bridge ${bridgeId}`);
  } catch (error) {
    console.error(`[addChannelToBridge] Error al añadir canal ${channelId} al bridge ${bridgeId}:`, error);
  }
}
