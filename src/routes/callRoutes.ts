import { Router, type Request, type Response } from 'express';
import { ARIClient } from '../controllers/ariClient.ts';

export default function createCallRoutes(ariClient: ARIClient) {
  const router = Router();

  router.post('/answer', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    console.log('Answer request for channelId:', channelId);

    if (!channelId) {
      return res.status(400).json({ error: 'Falta channelId' });
    }
    try {
      await ariClient.answerChannel(channelId);
      console.log(`[API] Canal ${channelId} contestado correctamente`);
      res.json({ ok: true });
    } catch (err: any) {
      console.error(`[API] Error al contestar canal ${channelId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/hangup', async (req: Request, res: Response) => {
    const { channelId } = req.body;

    console.log('Hangup request for channelId:', channelId);

    if (!channelId) {
      return res.status(400).json({ error: 'Falta channelId' });
    }
    try {
      await ariClient.hangupChannel(channelId);
      console.log(`[API] Canal ${channelId} colgado correctamente`);
      res.json({ ok: true });
    } catch (err: any) {
      console.error(`[API] Error al colgar canal ${channelId}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
