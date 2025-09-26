import express from 'express';
import cors from 'cors';

import { setupAri } from './ari/ari.ts';
import { answerRouter } from './controllers/answer.controller.ts';
import { hangupRouter } from './controllers/hangup.controller.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/', answerRouter);
app.use('/', hangupRouter);

process.on('SIGINT', () => {
  console.log('Terminando cliente ARI');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Terminando cliente ARI');
  process.exit(0);
});

setupAri(app).catch(console.error);
