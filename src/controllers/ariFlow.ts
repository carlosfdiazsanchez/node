
import AriClient from 'ari-client';

export interface SetupAriHandlersOptions {
  ariUrl: string;
  ariUser: string;
  ariPass: string;
  appName: string;
}

export default function setupAriHandlers({ ariUrl, ariUser, ariPass, appName }: SetupAriHandlersOptions) {
  AriClient.connect(ariUrl, ariUser, ariPass, (err: Error | null, ari: any) => {
    if (err) {
      console.error('Error conectando a ARI:', err);
      return;
    }
    ari.on('StasisStart', (event: any, incoming: any) => {
      if (!event.args || event.args[0] !== appName) return;
      console.log('Llamada entrante:', incoming.id);
      incoming.answer()
        .then(() => {
          // Reproducir ringback
          return incoming.play({ media: 'sound:ring' });
        })
        .then((ringPlayback: any) => {
          // Originar llamada a agente
          const outgoing = ari.Channel();
          outgoing.on('StasisStart', (event2: any, outChan: any) => {
            if (!event2.args || event2.args[0] !== appName) return;
            // Bridgear ambos canales
            const bridge = ari.Bridge();
            bridge.create({ type: 'mixing' })
              .then(() => bridge.addChannel({ channel: [incoming.id, outChan.id] }))
              .then(() => ringPlayback.stop())
              .then(() => {
                console.log('Bridge creado y ringback detenido');
              });
          });
          outgoing.originate({
            endpoint: 'PJSIP/2002',
            app: appName,
            appArgs: appName
          });
        });
    });
    ari.start(appName);
  });
}
