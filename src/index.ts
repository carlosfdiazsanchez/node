import WebSocket from 'ws';
import express from 'express';
import cors from 'cors';
import { ARIClient, type ARIEvent } from './controllers/ariClient.ts';
import createCallRoutes from './routes/callRoutes.ts';

let ariClient: ARIClient;

const app = express();
app.use(cors());
app.use(express.json());

// Inicialización de ARI y rutas
async function main() {
  const ariURL = process.env.ARI_URL || 'wss://asterisk.ridinn.com/ari/events';
  const ariUser = process.env.ARI_USER || 'node';
  const ariPass = process.env.ARI_PASSWORD || 'ari_password';
  const appName = process.env.ARI_APP_NAME || 'node';

  // Parse base URL for HTTP
  let baseURL = ariURL.replace(/^wss?:\/\//, 'https://');
  baseURL = baseURL.replace('/ari/events', '');

  ariClient = new ARIClient(baseURL, ariUser, ariPass);
  // Montar rutas de llamadas
  app.use('/', createCallRoutes(ariClient));
  // Iniciar servidor Express
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
  });

  // Build WS URL y lógica de WebSocket ARI
  const url = new URL(ariURL);
  if (!url.searchParams.has('app')) url.searchParams.set('app', appName);
  if (ariUser) {
    url.searchParams.set('user', ariUser);
    url.searchParams.set('pass', ariPass);
  }
  const headers: Record<string, string> = {};
  if (ariUser) headers['Authorization'] = `Basic ${Buffer.from(`${ariUser}:${ariPass}`).toString('base64')}`;
  const activeCalls: Map<string, string> = new Map();
  while (true) {
    console.log(`Conectando a ARI ${url.toString()} (app=${appName})`);
    try {
      const ws = new WebSocket(url.toString(), { headers });
      ws.on('open', () => console.log('Conectado al WebSocket ARI'));
      // Mapa para emparejar canales y bridges
      const pendingCalls: Record<string, string> = {};
      ws.on('message', async (data: Buffer) => {
        try {
          const event: ARIEvent = JSON.parse(data.toString());
          console.log('Evento:', event.type);
          if (event.type === 'StasisStart' && event.channel) {
            const channelID = event.channel.id;
            const caller = event.channel.name;
            console.log('Llamada entrante en Stasis:', channelID, '(', caller, ')');
            // Si es la primera llamada, originar hacia el destino (2002)
            if (!pendingCalls[channelID]) {
              try {
                // Aceptar la llamada entrante
                await ariClient.answerChannel(channelID);
                console.log('Llamada entrante aceptada (answered):', channelID);
                const outgoingID = await ariClient.originate('PJSIP/2002', appName);
                pendingCalls[channelID] = outgoingID;
                pendingCalls[outgoingID] = channelID;
                console.log('Llamada originada:', channelID, '->', outgoingID);
                // Reproducir ringback en el canal de origen
                try {
                  await ariClient.playRingback(channelID);
                  console.log('Ringback iniciado en canal de origen:', channelID);
                } catch (err) {
                  console.error('Error reproduciendo ringback:', err);
                }
              } catch (err) {
                console.error('Error aceptando u originando llamada:', err);
              }
            } else {
              // Cuando el canal destino entra en Stasis, hacer el bridge
              const incomingID = pendingCalls[channelID];
              if (incomingID) {
                try {
                  console.log(`[BRIDGE] Creando bridge para canales: ${incomingID} y ${channelID}`);
                  // Detener ringback en el canal de origen antes de hacer el bridge
                  try {
                    await ariClient.stopPlayback(incomingID);
                    console.log('Ringback detenido en canal de origen:', incomingID);
                  } catch (err) {
                    console.error('Error deteniendo ringback:', err);
                  }
                  const bridgeID = await ariClient.createBridge();
                  console.log(`[BRIDGE] Bridge creado: ${bridgeID}`);
                  await ariClient.addChannelToBridge(bridgeID, incomingID);
                  console.log(`[BRIDGE] Canal añadido al bridge: ${incomingID}`);
                  await ariClient.addChannelToBridge(bridgeID, channelID);
                  console.log(`[BRIDGE] Canal añadido al bridge: ${channelID}`);
                  console.log(`[BRIDGE] Llamada conectada via bridge ${bridgeID}`);
                } catch (err) {
                  console.error('[BRIDGE] Error bridgeando canales:', err);
                }
              } else {
                console.warn(`[BRIDGE] No se encontró canal emparejado para ${channelID}`);
              }
            }
          }
          if (event.type === 'StasisEnd' && event.channel) {
            const channelID = event.channel.id;
            const pairedID = pendingCalls[channelID];
            if (pairedID) {
              delete pendingCalls[channelID];
              delete pendingCalls[pairedID];
              console.log('Llamada terminada:', channelID);
            }
          }
        } catch (err) {
          console.error('Error parseando evento:', err);
        }
      });
      ws.on('error', (err) => console.error('Error en WebSocket:', err));
      ws.on('close', () => console.log('Conexión cerrada, reintentando...'));
      await new Promise<void>((resolve) => { ws.on('close', resolve); });
    } catch (err) {
      console.error('Fallo conexión ARI:', err);
    }
    console.log('Reintentando en 5s...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Manejo de señales para shutdown graceful
process.on('SIGINT', () => {
  console.log('Terminando cliente ARI');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('Terminando cliente ARI');
  process.exit(0);
});
main().catch(console.error);
