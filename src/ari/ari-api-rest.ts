
import { Buffer } from 'node:buffer';

const config = {
  baseUrl: 'https://asterisk.ridinn.com/ari',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function originateChannel(endpoint: string, app: string): Promise<string> {
  const url = `${config.baseUrl}/channels`;
  const body = {
    endpoint,
    app,
    extension: '2002',
    context: 'from-external'
  };
  const authHeader = 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64');
  console.log('[originateChannel] URL:', url);
  console.log('[originateChannel] Body:', body);
  console.log('[originateChannel] Authorization header:', authHeader);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  console.log('[originateChannel] Response status:', resp.status);
  console.log('[originateChannel] Response headers:', Object.fromEntries(resp.headers.entries()));
  let responseJson;
  try {
    responseJson = await resp.clone().json();
    console.log('[originateChannel] Response JSON:', responseJson);
  } catch (err) {
    console.log('[originateChannel] No se pudo parsear JSON:', err);
  }
  if (!resp.ok) throw new Error('No se pudo originar el canal');
  const location = resp.headers.get('Location');
  if (location) {
    const parts = location.split('/');
    return parts[parts.length - 1];
  }
  const data = responseJson;
  if (data && data.id) return data.id;
  throw new Error('No se pudo obtener el id del canal originado');
}

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

export async function playAudioOnChannel(channelId: string, media: string): Promise<void> {
  const url = `${config.baseUrl}/channels/${channelId}/play`;
  await fetch(url, {
    method: 'POST',
    headers: {
  'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ media ,lang: 'es' }),
  });
}

export async function createBridge(): Promise<string> {
  const url = `${config.baseUrl}/bridges`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
  'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'mixing' }),
  });
  if (!resp.ok) throw new Error('No se pudo crear el bridge');
  const location = resp.headers.get('Location');
  if (location) {
    const parts = location.split('/');
    return parts[parts.length - 1];
  }
  const data = await resp.json();
  if (data && data.id) return data.id;
  throw new Error('No se pudo obtener el id del bridge');
}

export async function addChannelsToBridge(bridgeId: string, channelIds: string[]): Promise<void> {
  const url = `${config.baseUrl}/bridges/${bridgeId}/addChannel?channel=${channelIds.join(',')}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
      'Content-Type': 'application/json',
    },
  });
}
