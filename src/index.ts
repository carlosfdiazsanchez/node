import express from 'express';
import cors from 'cors';

import setupAriHandlers from './controllers/ariFlow.ts';

const app = express();
app.use(cors());
app.use(express.json());

const ariURL = process.env.ARI_URL || 'http://asterisk.ridinn.com:8088/ari';
const ariUser = process.env.ARI_USER || 'node';
const ariPass = process.env.ARI_PASSWORD || 'ari_password';
const appName = process.env.ARI_APP_NAME || 'node';

setupAriHandlers({ ariUrl: ariURL, ariUser, ariPass, appName });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
