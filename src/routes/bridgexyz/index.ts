/* eslint-disable camelcase */
import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import fs, { fstat } from 'fs';
import { v4 as uuidv4 } from 'uuid';

import data from './data';
import {
  type Customer,
  type BankAccountCommon,
  BankAccountIBAN,
  BankAccountUS,
  LiquidationAddress,
  LiquidationAddressSepa,
} from './types';

// TODO: Idempontency key

const router = express.Router();

// Should be imported in the main file under the /bridgexyz route
// TODO: require API key?

router.get('/', (req: Request, res: Response) => {
  res.send('BridgeXYZ Mock API');
});

router.get('/persona/kyc', (req: Request, res: Response) => {
  const form = fs.readFileSync(`${__dirname}/kyc.html`, 'utf8');
  res.send(form);
});

router.post('/persona/kyc', (req: Request, res: Response) => {
  if (!req.body.session_token) {
    return res.status(400).json({
      code: 'bad_request',
      message: 'session_token is required',
    });
  }

  // Find the customer
  const c = Object.keys(data.customers).filter(
    (customerId) =>
      data.customers[customerId].kyc_link ===
      `http://${req.get('host')}/${req.get('baseUrl')}/persona/kyc?session_token=${req.body.session_token}`,
  );
  if (c.length === 0) {
    return res.status(404).json({
      code: 'Invalid',
      message: 'Unknown session id',
    });
  }
  if (c.length > 1) {
    return res.status(500).json({
      code: 'Multiple',
      message: 'Multiple customers with the same session token',
    });
  }
  if (req.body.kyc === 'valid') {
    data.customers[c[0]].kyc_status = 'approved';
  } else if (req.body.kyc === 'invalid') {
    data.customers[c[0]].kyc_status = 'rejected';
    data.customers[c[0]].rejection_reasons.push('KYC was invalid');
  } else {
    data.customers[c[0]].kyc_status = 'incomplete';
  }
  res.status(204).send();
});

router.post('v0/kyc_links', (req: Request, res: Response) => {
  const { full_name, email, type } = req.body;
  if (!full_name || !email || !type) {
    return res.status(400).json({
      code: 'bad_customer_request',
      message: 'fields missing from customer body.',
      name: `${full_name}`
        ? ''
        : `full_name${email}`
          ? ''
          : `email${type}`
            ? ''
            : 'type',
    });
  }
  if (req.body.type !== 'individual') {
    return res.status(400).json({
      code: 'bad_customer_request',
      message: 'customer type must be individual (or if not, talk to Alex!)',
    });
  }

  const customer_id = uuidv4();
  const kyc_id = uuidv4();
  data.customers[customer_id] = {
    kyc_link_id: kyc_id,
    first_name: req.body.full_name.split()[0],
    last_name: req.body.full_name.split().slice(1).join(' '),
    email: req.body.email,
    kyc_link: `http://${req.get('host')}/${req.get('baseUrl')}/persona/kyc?session_token=${uuidv4()}`,
    tos_link: `https://dashboard.bridge.xyz/accept-terms-of-service?session_token=${uuidv4()}`, // Peopole consuming can add redirect_uri
    kyc_status: 'not_started',
    tos_status: 'pending',
    address: {
      street_line_1: '',
      street_line_2: '',
      city: '',
      postal_code: '',
      state: '',
      country: '',
    },
    rejection_reasons: [],
    requirements_due: [],
    future_requirements_due: [],
    endorsements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    has_accepted_terms_of_service: false,
    external_accounts: {},
    liquidation_addresses: {},
  };

  return res.json({
    id: kyc_id,
    full_name: req.body.full_name,
    email: req.body.email,
    type: req.body.type,
    kyc_link: 'www.kyclink.com/blah',
    tos_link: 'www.toslink.com/blah',
    kyc_status: 'not_started',
    tos_status: 'pending',
    customer_id,
  });
});

router.get('v0/kyc_links/:kycLinkID', (req: Request, res: Response) => {
  const { kycLinkID } = req.params;
  const c = Object.keys(data.customers).filter(
    (customerId) => data.customers[customerId].kyc_link_id === kycLinkID,
  );
  if (c.length === 0) {
    return res.status(404).json(
      // TODO / NOTE This is from the docs, https://apidocs.bridge.xyz/reference/get_kyc-links-kyclinkid
      // But it really doesn't look right...
      {
        code: 'Invalid',
        message: 'Unknown customer id',
      },
    );
  }
  if (c.length > 1) {
    return res.status(500).json({
      code: 'Multiple',
      message: 'Multiple customers with the same kyc link id',
    });
  }

  router.get('other/');

  const customer = data.customers[c[0]];
  return res.json({
    id: customer.kyc_link_id,
    full_name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    type: 'individual',
    kyc_link: customer.kyc_link,
    tos_link: customer.tos_link,
    kyc_status: customer.kyc_status,
    tos_status: customer.tos_status,
    customer_id: c[0],
  });
});

router.get(
  'v0/customers/:customerID/external_accounts',
  (req: Request, res: Response) => {
    const { customerID } = req.params;
    if (!data.customers[customerID]) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown customer id',
      });
    }

    return res.json(data.customers[customerID].external_accounts);
  },
);

router.post(
  'v0/customers/:customerID/external_accounts',
  (req: Request, res: Response) => {
    let {
      currency,
      bank_name,
      account_owner_name,
      account_type,
      iban,
      account,
      account_owner_type,
      first_name,
      last_name,
      business_name,
      address,
    } = req.body;

    account_type = account_type || 'us';
    currency = currency || 'usd';

    if (
      account_type === 'us' &&
      (!account ||
        !account.routing_number ||
        !account.account_number ||
        typeof account.account_number !== 'string' ||
        typeof account.routing_number !== 'string')
    ) {
      return res.status(400).json({
        code: 'bad_request',
        message:
          'account containing routing_number and account_number as strings are required for us account',
      });
    }

    if (
      account_type === 'us' &&
      (!address || !address.street_line_1 || !address.city || !address.country)
    ) {
      return res.status(400).json({
        code: 'bad_request',
        message:
          'address, street_line_1, city, country are required for us account',
      });
    }

    // TODO: Sometimes state and postal code are required

    if (
      account_type === 'iban' &&
      (!iban || !iban.bic || !iban.account_number || !iban.country)
    ) {
      return res.status(400).json({
        code: 'bad_request',
        message:
          'iban, bic, account_number, and country are required for iban account',
      });
    }

    if (account_type === 'iban' && !account_owner_type) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'account_owner_type is required for iban account',
      });
    }
    if (account_type === 'iban') {
      if (account_owner_type === 'individual' && (!first_name || !last_name)) {
        return res.status(400).json({
          code: 'bad_request',
          message:
            'first_name and last_name are required for individual iban account',
        });
      }
      if (account_owner_type === 'company' && !business_name) {
        return res.status(400).json({
          code: 'bad_request',
          message: 'business_name is required for company iban account',
        });
      }
    }

    if (!account_owner_name) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'account_owner_name is required',
      });
    }

    if (currency != 'usd' && currency != 'eur') {
      return res.status(400).json({
        code: 'bad_request',
        message: 'currency must be usd or eur',
      });
    }

    if (currency === 'eur') {
      if (account_type != 'iban') {
        return res.status(400).json({
          code: 'bad_request',
          message: 'account_type must be iban if currency is eur',
        });
      }
    }

    if (account_type != 'us' && account_type != 'iban') {
      return res.status(400).json({
        code: 'bad_request',
        message: 'account_type must be us or iban',
      });
    }

    if (account_type === 'us') {
      if (
        typeof account.accountNumber !== 'string' ||
        typeof account.routingNumber !== 'string'
      ) {
        return res.status(400).json({
          code: 'bad_request',
          message: 'account_number and routing_number must be strings',
        });
      }
    }

    // Does the customer exist?
    if (!data.customers[req.params.customerID]) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown customer id',
      });
    }

    const account_id = uuidv4();

    const bankAccount: BankAccountCommon = {
      id: account_id,
      currency,
      customer_id: req.params.customerID,
      account_owner_name,
      bank_name,
      last_4:
        account_type === 'us'
          ? account.account_number.slice(-4)
          : iban.account_number.slice(-4),
      active: true,
      beneficiary_address_valid: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (account_type === 'us') {
      data.customers[req.params.customerID].external_accounts[account_id] = {
        account_type: 'us',
        account: {
          last_4: account.account_number.slice(-4),
          routing_number: account.routing_number,
        },
        ...bankAccount,
      };
    } else {
      data.customers[req.params.customerID].external_accounts[account_id] = {
        account_type: 'iban',
        account: {
          last_4: iban.account_number.slice(-4),
          bic: iban.bic,
          country: iban.country,
        },
        account_owner_type: 'individual',
        ...bankAccount,
      };
    }
  },
);

router.get(
  'v0/customers/:customerID/external_accounts/:externalAccountID',
  (req: Request, res: Response) => {
    if (!req.params.customerID || !req.params.externalAccountID) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'customerID and externalAccountID are required',
      });
    }

    if (!data.customers[req.params.customerID]) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown customer id',
      });
    }

    if (
      !data.customers[req.params.customerID].external_accounts[
        req.params.externalAccountID
      ]
    ) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown external account id',
      });
    }

    const externalAccount =
      data.customers[req.params.customerID].external_accounts[
        req.params.externalAccountID
      ];
    return res.json({
      id: req.params.externalAccountID,
      account_type: externalAccount.account_type,
      currency: externalAccount.currency,
      customer_id: externalAccount.customer_id,
      account_owner_name: externalAccount.account_owner_name,
      bank_name: externalAccount.bank_name,
      last_4: externalAccount.last_4,
      active: externalAccount.active,
      beneficiary_address_valid: externalAccount.beneficiary_address_valid,
      account: externalAccount.account,
      created_at: externalAccount.created_at,
      updated_at: externalAccount.updated_at,
    });
  },
);

router.get('/v0/customers/:customerID', (req: Request, res: Response) => {
  const customer = data.customers[req.params.customerID];
  // See if customer exists
  if (!customer) {
    return res.status(404).json({
      code: 'Invalid',
      message: 'Unknown customer id',
    });
  }

  return res.json({
    id: req.params.customerID,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    status: customer.status,
    has_accepted_terms_of_service: customer.has_accepted_terms_of_service,
    address: customer.address,
    rejection_reasons: customer.rejection_reasons,
    requirements_due: customer.requirements_due,
    future_requirements_due: customer.future_requirements_due,
    endorsements: customer.endorsements,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
  });
});

router.post(
  'v0/customers/:customerID/liquidation_addresses',
  (req: Request, res: Response) => {
    const customer = data.customers[req.params.customerID];
    // See if customer exists
    if (!customer) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown customer id',
      });
    }

    const {
      chain,
      currency,
      external_account_id,
      destination_payment_rail,
      destination_currency,
    } = req.body;
    if (!chain || !currency) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'chain and currency are required',
      });
    }

    const bankAccount =
      data.customers[req.params.customerID].external_accounts[
        external_account_id
      ];
    if (!bankAccount) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown external account id',
      });
    }

    if (destination_currency !== 'usd' && destination_currency !== 'eur') {
      return res.status(400).json({
        code: 'bad_request',
        message: 'destination_currency must be usd or eur',
      });
    }

    if (
      destination_payment_rail === 'sepa' &&
      (destination_currency !== 'eur' ||
        currency !== 'usdc' ||
        chain !== 'arbitrum')
    ) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'SEPA is only supported for USDC on Arbitrum',
      });
    }

    if (
      destination_currency === 'eur' &&
      (destination_payment_rail !== 'sepa' ||
        currency !== 'usdc' ||
        chain !== 'arbitrum')
    ) {
      return res.status(400).json({
        code: 'bad_request',
        message: 'eur is only supported for USDC on Arbitrum',
      });
    }

    customer.liquidation_addresses = customer.liquidation_addresses || {};
    const la_id = uuidv4();

    if (destination_payment_rail === 'sepa') {
      customer.liquidation_addresses[la_id] = {
        chain,
        currency,
        external_account_id,
        address: `0x${crypto.randomBytes(20).toString('hex')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        destination_sepa_reference: `SEPA reference`,
        destination_payment_rail: 'sepa',
        destination_currency: 'eur',
      };
    } else {
      customer.liquidation_addresses[la_id] = {
        chain,
        currency,
        external_account_id,
        address: `0x${crypto.randomBytes(20).toString('hex')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return res.json(customer.liquidation_addresses[la_id]);
  },
);

router.get(
  'v0/customers/:customerID/liquidation_addresses/:liquidationAddressID',
  (req: Request, res: Response) => {
    if (!data.customers[req.params.customerID]) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown customer id',
      });
    }
    if (
      !data.customers[req.params.customerID].liquidation_addresses[
        req.params.liquidationAddressID
      ]
    ) {
      return res.status(404).json({
        code: 'Invalid',
        message: 'Unknown liquidation address id',
      });
    }

    const la =
      data.customers[req.params.customerID].liquidation_addresses[
        req.params.liquidationAddressID
      ];

    return res.json({
      id: req.params.liquidationAddressID,
      chain: la.chain,
      currency: la.currency,
      external_account_id: la.external_account_id,
      address: la.address,
      created_at: la.created_at,
      updated_at: la.updated_at,
    });
  },
);

router.get('v0/developer/fees', (req: Request, res: Response) => {
  return res.json({
    default_liquidation_address_fee_percent: '1.3',
  });
});

export default router;
