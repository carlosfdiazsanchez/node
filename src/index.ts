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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});

setupAri();
