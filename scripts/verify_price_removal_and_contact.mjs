import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import assert from 'assert';
import fs from 'fs';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

assert(SUPABASE_URL && SUPABASE_ANON_KEY, 'Missing Supabase credentials in .env');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runVerification() {
  console.log('===============================================================');
  console.log(' KNR ENTERPRISES — AUDIT & VERIFICATION SUITE');
  console.log(' Public Prices Removal, Contact Person & Category Images');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`✓ TEST ${totalTests} PASSED: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ TEST ${totalTests} FAILED: ${name}`);
      console.error('  ', err.message);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`✓ TEST ${totalTests} PASSED: ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`✗ TEST ${totalTests} FAILED: ${name}`);
      console.error('  ', err.message);
      throw err;
    }
  }

  // TEST 1: NO VISIBLE ₹ PRICES IN PUBLIC COMPONENTS
  test('Verify zero visible ₹ pricing in public screens and modals', () => {
    const publicFiles = [
      'src/components/Screens/HomeScreen.tsx',
      'src/components/Screens/CatalogScreen.tsx',
      'src/components/ProductDetailModal.tsx',
      'src/components/CartDrawer.tsx',
      'src/components/RfqSubmissionModal.tsx',
      'src/components/ProformaModal.tsx',
    ];

    for (const file of publicFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      assert(!content.includes('formatINR('), `File ${file} still invokes formatINR()`);
      assert(!content.includes('Estimated Price'), `File ${file} still displays 'Estimated Price'`);
      assert(!content.includes('Indicative Est:'), `File ${file} still displays 'Indicative Est:'`);
      assert(!content.includes('₹{product.price'), `File ${file} still displays '₹{product.price'`);
      assert(!content.includes('₹{rel.price'), `File ${file} still displays '₹{rel.price'`);
      assert(!content.includes('₹{subtotal'), `File ${file} still displays '₹{subtotal'`);
    }
  });

  // TEST 2: PUBLIC WHOLESALE CTA LABELS PRESENT
  test('Verify wholesale quote CTA badges replace prices across public cards', () => {
    const homeContent = fs.readFileSync('src/components/Screens/HomeScreen.tsx', 'utf-8');
    assert(homeContent.includes('Contact for Pricing'), 'HomeScreen missing Contact for Pricing badge');
    assert(homeContent.includes('Wholesale Rate'), 'HomeScreen missing Wholesale Rate label');

    const catalogContent = fs.readFileSync('src/components/Screens/CatalogScreen.tsx', 'utf-8');
    assert(catalogContent.includes('Request a Quote'), 'CatalogScreen missing Request a Quote badge');
    assert(catalogContent.includes('Wholesale Rate'), 'CatalogScreen missing Wholesale Rate label');

    const detailContent = fs.readFileSync('src/components/ProductDetailModal.tsx', 'utf-8');
    assert(detailContent.includes('Request a Formal Quotation'), 'ProductDetailModal missing Request a Formal Quotation');
    assert(detailContent.includes('Contact for Pricing'), 'ProductDetailModal missing Contact for Pricing in related products');
  });

  // TEST 3: ADMIN PANEL INTERNAL PRICING PRESERVED
  test('Verify internal pricing is preserved in Admin Panel for quotation drafting', () => {
    const adminFiles = [
      'src/admin/components/QuotationBuilderModal.tsx',
      'src/admin/pages/DashboardOverviewPage.tsx',
      'src/admin/pages/EnquiriesPage.tsx',
      'src/admin/pages/ProductsPage.tsx',
      'src/admin/pages/RecycleBinPage.tsx',
    ];

    for (const file of adminFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      assert(content.includes('formatINR'), `Admin file ${file} does not have formatINR for internal quotations`);
    }
  });

  // TEST 4: CONTACT PERSON CONFIGURATION & LINKS
  test('Verify Contact Person (Harivardhan Reddy) and dialer/WhatsApp links', () => {
    const contactScreen = fs.readFileSync('src/components/Screens/ContactScreen.tsx', 'utf-8');
    assert(contactScreen.includes('Harivardhan Reddy'), 'ContactScreen missing Harivardhan Reddy');
    assert(contactScreen.includes('+91 9666469679') || contactScreen.includes('9666469679'), 'ContactScreen missing phone number');
    assert(contactScreen.includes('tel:'), 'ContactScreen missing tel: link');
    assert(contactScreen.includes('https://wa.me/'), 'ContactScreen missing WhatsApp link');

    const footer = fs.readFileSync('src/components/Footer.tsx', 'utf-8');
    assert(footer.includes('Harivardhan Reddy'), 'Footer missing Harivardhan Reddy');
    assert(footer.includes('+91 9666469679') || footer.includes('9666469679'), 'Footer missing phone number');

    const homeScreen = fs.readFileSync('src/components/Screens/HomeScreen.tsx', 'utf-8');
    assert(homeScreen.includes('Harivardhan Reddy'), 'HomeScreen missing Harivardhan Reddy');

    const settingsPage = fs.readFileSync('src/admin/pages/WebsiteSettingsPage.tsx', 'utf-8');
    assert(settingsPage.includes('contactPersonName'), 'WebsiteSettingsPage missing contactPersonName');
    assert(settingsPage.includes('contactPersonPhone'), 'WebsiteSettingsPage missing contactPersonPhone');
    assert(settingsPage.includes('contactPersonWhatsapp'), 'WebsiteSettingsPage missing contactPersonWhatsapp');
    assert(settingsPage.includes('showContactPerson'), 'WebsiteSettingsPage missing showContactPerson');
    assert(settingsPage.includes('contactPersonOrder'), 'WebsiteSettingsPage missing contactPersonOrder');
  });

  // TEST 5: SUPABASE CATEGORIES TABLE & STORAGE CDN IMAGES
  await testAsync('Verify all 10 categories in Supabase with Storage CDN URLs & sequential order', async () => {
    const { data: cats, error } = await supabase
      .from('categories')
      .select('id, name, display_order, image')
      .order('display_order', { ascending: true });

    assert(!error, `Failed to query Supabase categories: ${error?.message}`);
    assert.strictEqual(cats.length, 10, `Expected 10 categories in Supabase, found ${cats.length}`);

    const expectedCategories = [
      { order: 1, name: 'Bleaching Powder & Lime', id: 'Disinfectants & Chemicals' },
      { order: 2, name: 'Cleaning Chemicals', id: 'Cleaning Chemicals' },
      { order: 3, name: 'Vector & Mosquito Control', id: 'Pest & Vector Control' },
      { order: 4, name: 'Lighting Equipment', id: 'Lighting Equipment' },
      { order: 5, name: 'Civic LED Street Lights', id: 'Municipal Infrastructure' },
      { order: 6, name: 'Cleaning Tools', id: 'Cleaning Tools' },
      { order: 7, name: 'Safety Equipment', id: 'Safety Equipment' },
      { order: 8, name: 'Waste Management', id: 'Waste Management' },
      { order: 9, name: 'Green Mat Turf', id: 'Civic Landscaping' },
      { order: 10, name: 'Sanitization Tools & PPE', id: 'Sanitization Tools' },
    ];

    expectedCategories.forEach((exp, idx) => {
      const cat = cats[idx];
      assert.strictEqual(cat.display_order, exp.order, `Category at index ${idx} has order ${cat.display_order}, expected ${exp.order}`);
      assert.strictEqual(cat.id, exp.id, `Category at index ${idx} has id ${cat.id}, expected ${exp.id}`);
      assert.strictEqual(cat.name, exp.name, `Category at index ${idx} has name ${cat.name}, expected ${exp.name}`);
      assert(cat.image && cat.image.includes('knr-products/categories/'), `Category ${cat.name} does not have Storage CDN URL: ${cat.image}`);
      console.log(`    [${cat.display_order}] ${cat.name} -> ${cat.image}`);
    });
  });

  // TEST 6: SUPABASE WEBSITE_SETTINGS SYNC
  await testAsync('Verify Supabase website_settings table holds secondary phone for Harivardhan Reddy', async () => {
    const { data, error } = await supabase
      .from('website_settings')
      .select('phone_primary, phone_secondary, whatsapp_number, official_email')
      .eq('id', 'primary')
      .single();

    assert(!error, `Failed to query website_settings: ${error?.message}`);
    assert(data.phone_secondary && data.phone_secondary.includes('9666469679'), `Expected phone_secondary to contain 9666469679, got: ${data.phone_secondary}`);
    console.log(`    Primary Phone: ${data.phone_primary}`);
    console.log(`    Secondary Phone (Contact Person): ${data.phone_secondary}`);
  });

  // TEST 7: RFQ SUBMISSION WORKFLOW WITH UNTOUCHED BACKEND PRICING
  await testAsync('Verify live RFQ submission continues working with Supabase enquiries table', async () => {
    const testId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'test-' + Date.now();
    const testRef = `AUDIT-RFQ-${Date.now().toString().slice(-6)}`;
    const testEnquiry = {
      id: testId,
      customer_name: 'Audit Verification Department',
      mobile_number: '+91 9666469679',
      email: 'audit@knrenterprises.com',
      organisation: 'Telangana Municipal Audit Wing',
      mandal: 'Chevella',
      district: 'Ranga Reddy',
      enquiry_number: testRef,
      status: 'New',
      total_amount: 0,
      subtotal: 0,
      estimated_gst: 0,
      notes: 'Automated price removal and contact verification RFQ test.',
      source: 'automated_test_suite'
    };

    // Anonymous public guest submits RFQ (INSERT without SELECT)
    const { error: insErr } = await supabase
      .from('enquiries')
      .insert([testEnquiry]);

    assert(!insErr, `Failed to insert test enquiry as guest: ${insErr?.message}`);
    console.log(`    ✓ Public guest submitted RFQ test enquiry: ${testRef}`);

    // Admin verifies the enquiry in Supabase and cleans it up
    await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const { data: enqData, error: readErr } = await supabase
      .from('enquiries')
      .select('id, enquiry_number, customer_name, status')
      .eq('id', testId)
      .single();

    assert(!readErr && enqData, `Admin could not read inserted RFQ: ${readErr?.message}`);
    assert.strictEqual(enqData.enquiry_number, testRef, `Enquiry number mismatch`);
    console.log(`    ✓ Admin verified RFQ in database: ${enqData.enquiry_number}`);

    // Clean up test record so production records remain genuine
    await supabase.from('enquiries').delete().eq('id', testId);
    console.log(`    ✓ Cleaned up test RFQ record: ${testRef}`);
  });

  console.log('\n===============================================================');
  console.log(` AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================\n');
}

runVerification().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
