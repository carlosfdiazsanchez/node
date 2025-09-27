
import WebSocket from 'ws';
import { answerChannel, startMohOnChannel, createBridge, addChannelToBridge, originateChannel, stopMohOnChannel } from './ari-api-rest.ts';

const config = {
  baseUrl: 'wss://asterisk.ridinn.com/ari/events',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function handleIncomingCall(channelId: string) {
  console.log(`[handleIncomingCall] Iniciando para canal: ${channelId}`);
  try {
    // Contestar
    await answerChannel(channelId);

    // MOH
    await startMohOnChannel(channelId, 'default');

    // Crear bridge y agregar el canal entrante
    const bridgeId = 'bridge-' + channelId;
    await createBridge(bridgeId);
    await addChannelToBridge(bridgeId, channelId);

    // Originar canal destino
    await originateChannel('PJSIP/2002', config.appName);

    console.log(`[handleIncomingCall] Originado canal a PJSIP/2002 con bridgeId=${bridgeId}`);
  } catch (error) {
    console.error(`[handleIncomingCall] Error en canal ${channelId}:`, error);
  }
}

const inboundCalls = new Map<string, string>();

export const setupAri = async (app: any) => {
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

      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());

          if (event.type === 'StasisStart' && event.channel) {
            if (event.args && event.args.length > 0) {
              // Es el canal ORIGINADO
              const bridgeId = event.args[0];
              await addChannelToBridge(bridgeId, event.channel.id);
              console.log(`[ARI] Canal originado ${event.channel.id} agregado al bridge ${bridgeId}`);

              // Recuperar el canal entrante del Map
              const inboundChannelId = inboundCalls.get(bridgeId);
              if (inboundChannelId) {
                await addChannelToBridge(bridgeId, inboundChannelId);
                await stopMohOnChannel(inboundChannelId);
                console.log(`[ARI] Canal entrante ${inboundChannelId} agregado y MOH detenido.`);
                inboundCalls.delete(bridgeId); // limpieza
              }
            } else {
              // Es la llamada entrante
              console.log(`[ARI] Llamada entrante: ${event.channel.id}`);
              const bridgeId = `bridge-${event.channel.id}`;
              inboundCalls.set(bridgeId, event.channel.id);
              handleIncomingCall(event.channel.id);
            }
          }

          if (event.type === 'StasisEnd') {
            console.log('StasisEnd para canal:', event.channel ? event.channel.id : 'desconocido');
            // Aquí podrías manejar la limpieza si es necesario
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

