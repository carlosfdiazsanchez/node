import { Router, type Request, type Response } from 'express';
import { answerChannel } from '../ari/ari-api-rest.ts';

const answerRouter = Router();

answerRouter.post('/answer', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    console.log('Answer request for channelId:', channelId);

    if (!channelId) {
      return res.status(400).json({ error: 'Falta channelId' });
    }

    try {
        await answerChannel(channelId);
        console.log(`[API] Canal ${channelId} contestado correctamente`);
        res.json({ ok: true });
    } catch (err: any) {
      console.error(`[API] Error al contestar canal ${channelId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
});

export { answerRouter };
