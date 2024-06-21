import { type Customer } from './types.ts';

const data = {
  customers: {} as { [key: string]: Customer },
  tosIds: {} as { [key: string]: string }, // Session IDs mapped on to signed_agreement_ids
};

export default data;
