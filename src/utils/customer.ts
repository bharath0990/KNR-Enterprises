/**
 * KNR Enterprises — Customer Deduplication & Normalization Utility
 * Ensures 100% consistent customer identification across Dashboard and Directory
 */

export function getCustomerDedupKey(customer: {
  mobileNumber?: string;
  phone?: string;
  email?: string;
  customerName?: string;
  name?: string;
  organisation?: string;
}): string | null {
  const phone = customer.mobileNumber || customer.phone || '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return `phone:${digits.slice(-10)}`;
  }

  const email = (customer.email || '').trim().toLowerCase();
  if (email.includes('@')) {
    return `email:${email}`;
  }

  const name = (customer.customerName || customer.name || '').trim().toLowerCase();
  const org = (customer.organisation || '').trim().toLowerCase();
  if (name || org) {
    return `entity:${name}|${org}`;
  }

  return null;
}

