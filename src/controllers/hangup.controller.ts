import { Router, type Request, type Response } from 'express';
import { hangupChannel } from '../ari/ari-api-rest.ts';

const hangupRouter = Router();

hangupRouter.post('/hangup', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    console.log('Hangup request for channelId:', channelId);

    if (!channelId) {
      return res.status(400).json({ error: 'Falta channelId' });
    }

    try {
        await hangupChannel(channelId);
        console.log(`[API] Canal ${channelId} colgado correctamente`);
        res.json({ ok: true });
    } catch (err: any) {
      console.error(`[API] Error al colgar canal ${channelId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
});

export { hangupRouter };
