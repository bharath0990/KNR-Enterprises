import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATEGORIES_DATA = [
  {
    id: 'Disinfectants & Chemicals',
    name: 'Bleaching Powder & Lime',
    telugu_name: 'బ్లీచింగ్ & లైమ్ పౌడర్',
    description: 'Industrial 33% chlorine bleaching powder & 90% hydrated lime sacks for Swachh Bharat sanitation.',
    display_order: 1,
    source_image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    slug: 'bleaching-powder-lime'
  },
  {
    id: 'Cleaning Chemicals',
    name: 'Cleaning Chemicals',
    telugu_name: 'క్లీనింగ్ రసాయనాలు',
    description: 'Commercial disinfectants, phenyle cans, and institutional liquid cleaning concentrates.',
    display_order: 2,
    source_image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80',
    slug: 'cleaning-chemicals'
  },
  {
    id: 'Pest & Vector Control',
    name: 'Vector & Mosquito Control',
    telugu_name: 'దోమల & కీటకాల నియంత్రణ',
    description: 'Malathion 5% DP, Deltaphog, thermal fogging machines, and larvicidal chemical formulations.',
    display_order: 3,
    source_image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800&auto=format&fit=crop&q=80',
    slug: 'vector-mosquito-control'
  },
  {
    id: 'Lighting Equipment',
    name: 'Lighting Equipment',
    telugu_name: 'లైటింగ్ పరికరాలు',
    description: 'Commercial outdoor lighting equipment and energy-efficient illumination accessories.',
    display_order: 4,
    source_image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
    slug: 'lighting-equipment'
  },
  {
    id: 'Municipal Infrastructure',
    name: 'Civic LED Street Lights',
    telugu_name: 'ఎల్ఈడీ వీధి దీపాలు',
    description: 'Heavy-duty IP66 municipal die-cast LED street lights with integrated surge protection.',
    display_order: 5,
    source_image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    slug: 'civic-led-street-lights'
  },
  {
    id: 'Cleaning Tools',
    name: 'Cleaning Tools',
    telugu_name: 'క్లీనింగ్ టూల్స్',
    description: 'Bundled brooms, spiked rakes (Mulhadanthi), sickles, crowbars, and municipal cleaning equipment.',
    display_order: 6,
    source_image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80',
    slug: 'cleaning-tools'
  },
  {
    id: 'Safety Equipment',
    name: 'Safety Equipment',
    telugu_name: 'భద్రతా పరికరాలు (PPE)',
    description: 'Head caps, safety shoes, protective gloves, reflective safety jackets, and masks.',
    display_order: 7,
    source_image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80',
    slug: 'safety-equipment'
  },
  {
    id: 'Waste Management',
    name: 'Waste Management',
    telugu_name: 'వ్యర్థాల నిర్వహణ & డబ్బాలు',
    description: '120L & 240L municipal HDPE wheeled dustbins, plastic baskets, and waste collection tricycles.',
    display_order: 8,
    source_image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&auto=format&fit=crop&q=80',
    slug: 'waste-management'
  },
  {
    id: 'Civic Landscaping',
    name: 'Green Mat Turf',
    telugu_name: 'ఆర్టిఫిషియల్ గడ్డి & పార్కులు',
    description: '35mm dense UV weather-resistant artificial landscape turf for civic parks and institutions.',
    display_order: 9,
    source_image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    slug: 'green-mat-turf'
  },
  {
    id: 'Sanitization Tools',
    name: 'Sanitization Tools & PPE',
    telugu_name: 'పారిశుద్ధ్య టూల్స్ & PPE',
    description: 'Battery backpack pressure sprayers, sanitization kits, and personal protective equipment.',
    display_order: 10,
    source_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    slug: 'sanitization-tools-ppe'
  }
];

async function run() {
  console.log('Authenticating admin...');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authErr) throw authErr;
  console.log('✓ Admin authenticated:', auth.user.email);

  for (const cat of CATEGORIES_DATA) {
    console.log(`\nProcessing category: ${cat.name} (${cat.id})...`);
    let finalImageUrl = cat.source_image;

    try {
      console.log(`  Downloading image from ${cat.source_image.slice(0, 50)}...`);
      const resp = await fetch(cat.source_image);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const storagePath = `categories/${cat.slug}.jpg`;

        console.log(`  Uploading to Supabase Storage: knr-products/${storagePath} (${buffer.length} bytes)...`);
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('knr-products')
          .upload(storagePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (!uploadErr && uploadData) {
          const { data: pubData } = supabase.storage
            .from('knr-products')
            .getPublicUrl(storagePath);

          if (pubData && pubData.publicUrl) {
            finalImageUrl = pubData.publicUrl;
            console.log(`  ✓ Uploaded to Storage: ${finalImageUrl}`);
          }
        } else {
          console.warn(`  Storage upload warning: ${uploadErr?.message}, using direct URL`);
        }
      }
    } catch (err) {
      console.warn(`  Could not download/upload image for ${cat.name}:`, err.message);
    }

    // Upsert into Supabase public.categories
    console.log(`  Saving category ${cat.name} with display_order ${cat.display_order}...`);
    const { error: upsertErr } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      telugu_name: cat.telugu_name,
      description: cat.description,
      image: finalImageUrl,
      display_order: cat.display_order,
      is_active: true
    });

    if (upsertErr) {
      console.error(`  ERROR upserting category ${cat.id}:`, upsertErr);
    } else {
      console.log(`  ✓ Category ${cat.name} saved successfully!`);
    }
  }

  // Verify all categories
  console.log('\n--- VERIFYING SAVED CATEGORIES ---');
  const { data: verified, error: verErr } = await supabase
    .from('categories')
    .select('id, name, display_order, image')
    .order('display_order', { ascending: true });

  if (verErr) throw verErr;
  console.log(`Total categories in Supabase: ${verified.length}`);
  verified.forEach((c) => {
    console.log(`  [${c.display_order}] ${c.name} (${c.id}) -> ${c.image}`);
  });
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
