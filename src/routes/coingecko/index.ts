/* eslint-disable camelcase */
import express, { type Request, type Response } from 'express';

const router = express.Router();

// Should be imported in the main file under the /coingecko route

router.get('/', (req: Request, res: Response) => {
  res.send('Coingecko Mock API');
});

router.get('/api/v3/simple/price/', (req: Request, res: Response) => {
  const { ids, vs_currencies } = req.query;
  if (!ids) {
    return res.status(400).json({ error: 'Missing parameter ids' });
  }
  if (!vs_currencies) {
    return res.status(400).json({ error: 'Missing parameter vs_currencies' });
  }

  const idsArray =
    typeof req.query.ids === 'string' ? req.query.ids.split(',') : undefined;
  if (!idsArray) {
    return res.status(400).json({ error: 'Invalid parameter ids' });
  }

  const vsCurrenciesArray =
    typeof req.query.vs_currencies === 'string'
      ? req.query.vs_currencies.split(',')
      : undefined;
  if (!vsCurrenciesArray) {
    return res.status(400).json({ error: 'Invalid parameter vs_currencies' });
  }

  type PriceResponse = { [key: string]: { [key: string]: number } };

  const response = {} as PriceResponse;
  idsArray.forEach((id) => {
    response[id] = {};
    vsCurrenciesArray.forEach((currency) => {
      response[id][currency] = Math.random() * 1000;
    });
  });

  return res.json(response);
});

router.get(
  '/api/v3/simple/token_price/:networkName',
  (req: Request, res: Response) => {
    const { contract_addresses, vs_currencies } = req.query;
    if (!contract_addresses) {
      return res
        .status(400)
        .json({ error: 'Missing parameter contract_addresses' });
    }
    if (!vs_currencies) {
      return res.status(400).json({ error: 'Missing parameter vs_currencies' });
    }

    if (req.params.networkName !== 'arbitrum-one') {
      return res.status(400).json({ error: 'Invalid network' });
    }

    const vsCurrenciesArray =
      typeof req.query.vs_currencies === 'string'
        ? req.query.vs_currencies.split(',')
        : undefined;
    if (!vsCurrenciesArray) {
      return res.status(400).json({ error: 'Invalid parameter vs_currencies' });
    }

    const contractAddressesArray =
      typeof req.query.contract_addresses === 'string'
        ? req.query.contract_addresses
            .split(',')
            .map((address) => address.toLowerCase())
        : undefined;
    if (!contractAddressesArray) {
      return res
        .status(400)
        .json({ error: 'Invalid parameter contract_addresses' });
    }

    type PriceResponse = { [key: string]: { [key: string]: number } };

    const response = {} as PriceResponse;
    contractAddressesArray.forEach((address) => {
      response[address] = {};
      vsCurrenciesArray.forEach((currency) => {
        response[address][currency] = Math.random() * 1000;
      });
    });

    return res.json(response);
  },
);
export default router;
