
import WebSocket from 'ws';
import { answerChannel, playAudioOnChannel } from './ari-api-rest.ts';

const config = {
  baseUrl: process.env.ARI_URL || 'wss://asterisk.ridinn.com/ari/events',
  user: process.env.ARI_USER || 'node',
  pass: process.env.ARI_PASS || 'ari_password',
  appName: process.env.ARI_APP_NAME || 'node',
};

const baseURL = config.baseUrl.replace(/^wss?:\/\//, 'https://');

const configForHttp = {
  baseUrl: baseURL,
  user: config.user,
  pass: config.pass,
  appName: config.appName,
};

export async function handleIncomingCall(channelId: string) {
  console.log(`[handleIncomingCall] Iniciando para canal: ${channelId}`);
  try {
    await answerChannel(configForHttp, channelId);
    console.log(`[handleIncomingCall] Canal ${channelId} contestado`);
    await playAudioOnChannel(configForHttp, channelId, 'sound:ring');
    console.log(`[handleIncomingCall] Audio 'sound:ring' reproducido en canal ${channelId}`);
  } catch (error) {
    console.error(`[handleIncomingCall] Error en canal ${channelId}:`, error);
  }
}

export const setupAri = () => {

  const url = new URL(config.baseUrl);

  url.searchParams.set('app', config.appName);
  url.searchParams.set('user', config.user);
  url.searchParams.set('pass', config.pass);

  const headers: Record<string, string> = {
    'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
  };

  const ws = new WebSocket(url.toString(), { headers });

  ws.on('open', () => {
    console.log('Conectado a ARI WebSocket');
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const event = JSON.parse(data.toString());
      if (event.type === 'StasisStart' && event.channel && event.application === config.appName) {
        console.log('Llamada entrante:', event.channel.id);
        handleIncomingCall(event.channel.id);
      }
    } catch (err) {
      console.error('Error procesando evento ARI:', err);
    }
  });

  ws.on('error', (err) => {
    console.error('Error en WebSocket ARI:', err);
  });

  ws.on('close', () => {
    console.log('WebSocket ARI cerrado');
  });
};
