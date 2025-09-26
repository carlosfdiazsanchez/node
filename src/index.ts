import express from 'express';
import cors from 'cors';

import { setupAri } from './ari/ari.ts';

const app = express();
app.use(cors());
app.use(express.json());

setupAri();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
