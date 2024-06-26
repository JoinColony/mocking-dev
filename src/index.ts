// src/index.js
import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Express, type Request, type Response } from 'express';

import bridgexyzRouter from './routes/bridgexyz/index.ts';
import { updateDrainListeners } from './routes/bridgexyz/listeners.ts';
import coingeckoRouter from './routes/coingecko/index.ts';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.options('*', cors());

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); // Parse URL-encoded bodies

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use('/coingecko', coingeckoRouter);
app.use('/bridgexyz', bridgexyzRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Update listeners every 10 seconds
setInterval(updateDrainListeners, 10 * 1000);
