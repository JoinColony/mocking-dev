type PriceResponse = { [key: string]: { [key: string]: number } };
type Customer = {
  kyc_link_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  has_accepted_terms_of_service: boolean;
  address: {
    street_line_1: string;
    street_line_2: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
  };
  rejection_reasons: string[];
  requirements_due: string[];
  future_requirements_due: string[];
  endorsements: {
    name: string;
    status: string;
    additional_requirements: string[];
  }[];
  created_at: string;
  updated_at: string;
  kyc_link: string;
  tos_link: string;
  kyc_status: KYCStatus;
  tos_status: TOSStatus;
  external_accounts: { [key: string]: BankAccountUS | BankAccountIBAN };
  liquidation_addresses: {
    [key: string]: LiquidationAddress | LiquidationAddressSepa;
  };
};

type LiquidationAddress = {
  currency: string;
  address: string;
  created_at: string;
  updated_at: string;
  chain: string;
  external_account_id: string;
  drains: Drain[];
};

type Drain = {
  id: string;
  amount: string;
  state: string;
  created_at: string;
  deposit_tx_hash: string;
  receipt: {
    destination_currency: string;
    url: string;
  };
};

type LiquidationAddressSepa = LiquidationAddress & {
  destination_sepa_reference: string;
  destination_payment_rail: 'sepa';
  destination_currency: 'eur';
};

type BankAccountCommon = {
  id: string;
  // "account_type": "iban" | "us"
  currency: string;
  customer_id: string;
  account_owner_name: string;
  bank_name: string;
  last_4: string;
  active: boolean;
  beneficiary_address_valid: boolean;
  created_at: string;
  updated_at: string;
};

type BankAccountUS = BankAccountCommon & {
  account_type: 'us';
  account: {
    last_4: string;
    routing_number: string;
  };
};

type BankAccountIBAN = BankAccountCommon & {
  account_type: 'iban';
  account: {
    last_4: string;
    bic: string;
    country: string;
  };
  account_owner_type: 'individual' | 'company';
};

type KYCStatus =
  | 'not_started'
  | 'pending'
  | 'incomplete'
  | 'awaiting_ubo'
  | 'manual_review'
  | 'under_review'
  | 'approved'
  | 'rejected';

type TOSStatus = 'pending' | 'approved';

export type {
  PriceResponse,
  Customer,
  BankAccountCommon,
  BankAccountUS,
  BankAccountIBAN,
  KYCStatus,
  TOSStatus,
  LiquidationAddress,
  LiquidationAddressSepa,
  Drain,
};
