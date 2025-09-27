
import WebSocket from 'ws';
import { answerChannel, startMohOnChannel, createBridge, addChannelToBridge, originateChannel, stopMohOnChannel } from './ari-api-rest.ts';

const config = {
  baseUrl: 'wss://asterisk.ridinn.com/ari/events',
  user: 'node',
  pass: 'ari_password',
  appName: 'node',
};

export async function handleIncomingCall(channelId: string) {
  try {
    console.log(`[CALL] Iniciando flujo para canal entrante: ${channelId}`);
    await answerChannel(channelId);
    console.log(`[CALL] Canal ${channelId} contestado correctamente.`);

    await startMohOnChannel(channelId, 'default');
    console.log(`[CALL] MOH iniciada en canal ${channelId}.`);

    const bridgeId = 'bridge-' + channelId;
    await createBridge(bridgeId);
    console.log(`[CALL] Bridge ${bridgeId} creado.`);

    await addChannelToBridge(bridgeId, channelId);
    console.log(`[CALL] Canal ${channelId} agregado al bridge ${bridgeId}.`);

    inboundCalls.set(bridgeId, channelId);

    await originateChannel('PJSIP/2002', config.appName);
    console.log(`[CALL] Canal destino originado a PJSIP/2002 para bridgeId=${bridgeId}`);
  } catch (error) {
    console.error(`[ERROR] handleIncomingCall canal ${channelId}:`, error);
  }
}

const inboundCalls = new Map<string, string>();

export const setupAri = async (app: any) => {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`[INIT] API escuchando en http://localhost:${PORT}`);
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
      console.log(`[INIT] Conectando a ARI ${url.toString()} (app=${config.appName})`);
      let ws: WebSocket | null = null;
      try {
        ws = new WebSocket(url.toString(), { headers });

        ws.on('open', () => console.log('[WS] Conectado al WebSocket ARI'));

        ws.on('message', async (data: WebSocket.Data) => {
          try {
            const event = JSON.parse(data.toString());

            if (event.type === 'StasisStart' && event.channel) {
              if (event.args && event.args.length > 0) {
                // Es el canal ORIGINADO
                const bridgeId = event.args[0];
                await addChannelToBridge(bridgeId, event.channel.id);
                console.log(`[WS] Canal originado ${event.channel.id} agregado al bridge ${bridgeId}`);

                // Recuperar el canal entrante del Map
                const inboundChannelId = inboundCalls.get(bridgeId);
                if (inboundChannelId) {
                  await stopMohOnChannel(inboundChannelId);
                  console.log(`[WS] MOH detenido para canal entrante ${inboundChannelId}.`);
                  inboundCalls.delete(bridgeId); // limpieza
                }
              } else {
                // Es la llamada entrante
                console.log(`[WS] Llamada entrante detectada: ${event.channel.id}`);
                await handleIncomingCall(event.channel.id);
              }
            }

            if (event.type === 'StasisEnd') {
              console.log(`[WS] StasisEnd para canal: ${event.channel ? event.channel.id : 'desconocido'}`);
              // Aquí podrías manejar la limpieza si es necesario
            }

            if (event.type === 'ApplicationReplaced') {
              console.warn('[WS] Evento ApplicationReplaced recibido. Cerrando aplicación para evitar bucle de reconexión.');
              shouldReconnect = false;
              if (ws) ws.close();
              process.exit(0);
            }
          } catch (err) {
            console.error('[ERROR] procesando evento ARI:', err);
          }
        });

        ws.on('error', (err) => console.error('[ERROR] WebSocket:', err));

        ws.on('close', () => {
          if (shouldReconnect) {
            console.log('[WS] Conexión cerrada, reintentando...');
          } else {
            console.log('[WS] Conexión cerrada. No se reintentará.');
          }
        });

        await new Promise(resolve => ws!.once('close', resolve));

      } catch (error) {
        console.error('[ERROR] Fallo conexión ARI:', error);
      }
      if (shouldReconnect) {
        console.log('[WS] Reintentando en 5s...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('[ERROR] setupAri:', error);
  }
};

