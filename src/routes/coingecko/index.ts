import express, { type Request, type Response } from 'express';

const router = express.Router();

// Should be imported in the main file under the /coingecko route

router.get('/', (req: Request, res: Response) => {
  res.send('Coingecko Mock API');
});

export default router;
