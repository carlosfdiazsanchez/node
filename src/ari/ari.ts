
import WebSocket from 'ws';
import { answerChannel, playAudioOnChannel } from './ari-api-rest.ts';

const config = {
  baseUrl: 'wss://asterisk.ridinn.com/ari/events',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function handleIncomingCall(channelId: string) {
  console.log(`[handleIncomingCall] Iniciando para canal: ${channelId}`);
  try {
    await answerChannel(channelId);
    await playAudioOnChannel(channelId, 'sound:ring');
  } catch (error) {
    console.error(`[handleIncomingCall] Error en canal ${channelId}:`, error);
  }
}

export const setupAri = async (app:any) => {

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });

  const url = new URL(config.baseUrl);

  url.searchParams.set('app', config.appName);
  url.searchParams.set('user', config.user);
  url.searchParams.set('pass', config.pass);

  const headers: Record<string, string> = {
    'Authorization': 'Basic ' + Buffer.from(`${config.user}:${config.pass}`).toString('base64'),
  };

  let shouldReconnect = true;
  while (shouldReconnect) {
    console.log(`Conectando a ARI ${url.toString()} (app=${config.appName})`);
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url.toString(), { headers });

      ws.on('open', () => console.log('Conectado al WebSocket ARI'));

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          console.log('Evento:', event.type);
          if (event.type === 'StasisStart' && event.channel) {
            console.log('Llamada entrante:', event.channel.id);
            // handleIncomingCall(event.channel.id);
          }
          if (event.type === 'ApplicationReplaced') {
            console.warn('Evento ApplicationReplaced recibido. Cerrando aplicación para evitar bucle de reconexión.');
            shouldReconnect = false;
            if (ws) ws.close();
            process.exit(0);
          }
        } catch (err) {
          console.error('Error procesando evento ARI:', err);
        }
      });

      ws.on('error', (err) => console.error('Error en WebSocket:', err));

      ws.on('close', () => {
        if (shouldReconnect) {
          console.log('Conexión cerrada, reintentando...');
        } else {
          console.log('Conexión cerrada. No se reintentará.');
        }
      });

      // Esperar a que el WebSocket se cierre antes de continuar
      await new Promise(resolve => ws!.once('close', resolve));

    } catch (error) {
      console.error('Fallo conexión ARI:', error);
    }
    if (shouldReconnect) {
      console.log('Reintentando en 5s...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
