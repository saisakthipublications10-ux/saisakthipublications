// scripts/seed-firestore.ts
import { adminDb } from '../src/lib/firebase-admin';

async function seedFirestore() {
  const now = new Date().toISOString();
  const batch = adminDb.batch();

  const locations = [
    { id: 'kelambakkam', name: 'Kelambakkam', slug: 'kelambakkam', isActive: true, displayOrder: 1 },
    { id: 'porur', name: 'Porur', slug: 'porur', isActive: true, displayOrder: 2 },
    { id: 'vadapalani', name: 'Vadapalani', slug: 'vadapalani', isActive: true, displayOrder: 3 },
    { id: 'anna-nagar', name: 'Anna Nagar', slug: 'anna-nagar', isActive: true, displayOrder: 4 },
    { id: 'chrompet', name: 'Chrompet', slug: 'chrompet', isActive: true, displayOrder: 5 },
  ];

  for (const loc of locations) {
    batch.set(adminDb.collection('locations').doc(loc.id), { ...loc, updatedAt: now }, { merge: true });
  }

  const newspapers = [
    { id: 'omr-voice', name: 'OMR Voice', slug: 'omr-voice' },
    { id: 'tambaram-times', name: 'Tambaram Times', slug: 'tambaram-times' },
    { id: 'nanganallur-times', name: 'Saisakthi Publications', slug: 'nanganallur-times' },
    { id: 'velachery-mail', name: 'Velachery Mail', slug: 'velachery-mail' },
  ];

  for (const paper of newspapers) {
    batch.set(
      adminDb.collection('newspapers').doc(paper.id),
      {
        ...paper,
        logoUrl: null,
        isActive: true,
        supportedCategoryIds: [],
        supportedFormatIds: [],
        cutoffHoursBeforePublication: 48,
        publicationDaysOfWeek: [], // Admin configures actual publication days
        updatedAt: now,
      },
      { merge: true }
    );
  }

  const categories = [
    { id: 'classified', name: 'Classified Advertisement', isEnabled: true },
    { id: 'display', name: 'Display Advertisement', isEnabled: true },
    { id: 'matrimonial', name: 'Matrimonial Advertisement', isEnabled: true },
    { id: 'property', name: 'Property Advertisement', isEnabled: true },
    { id: 'recruitment', name: 'Recruitment Advertisement', isEnabled: true },
    { id: 'business', name: 'Business Advertisement', isEnabled: true },
    { id: 'public-notice', name: 'Public Notice', isEnabled: true },
    { id: 'obituary', name: 'Obituary / Remembrance Notice', isEnabled: true },
  ];

  for (const cat of categories) {
    batch.set(adminDb.collection('ad_categories').doc(cat.id), cat, { merge: true });
  }

  const formats = [
    {
      id: 'text-classified',
      code: 'TEXT_CLASSIFIED',
      name: 'Text-Only Classified',
      requiresDimensions: false,
      requiresWordCount: true,
      allowsColorChoice: false,
      allowedMimeTypes: [],
      maxFileSizeBytes: 0,
      specInstructions: 'Plain running text charged by word count.',
      isEnabled: true,
    },
    {
      id: 'box-ad',
      code: 'BOX_AD',
      name: 'Box Advertisement',
      requiresDimensions: false,
      requiresWordCount: true,
      allowsColorChoice: true,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      maxFileSizeBytes: 10 * 1024 * 1024,
      specInstructions: 'Bordered single-column classified box.',
      isEnabled: true,
    },
    {
      id: 'display-ad',
      code: 'DISPLAY_AD',
      name: 'Display Advertisement',
      requiresDimensions: true,
      requiresWordCount: false,
      allowsColorChoice: true,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      maxFileSizeBytes: 25 * 1024 * 1024,
      specInstructions: 'High-resolution 300 DPI CMYK PDF or PNG matching exact column width x height cm.',
      isEnabled: true,
    },
    {
      id: 'custom-ad',
      code: 'CUSTOM_AD',
      name: 'Custom Advertisement',
      requiresDimensions: true,
      requiresWordCount: false,
      allowsColorChoice: true,
      allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
      maxFileSizeBytes: 25 * 1024 * 1024,
      specInstructions: 'Special jacket, ear-panel, or custom layout subject to editorial verification.',
      isEnabled: true,
    },
  ];

  for (const fmt of formats) {
    batch.set(adminDb.collection('ad_formats').doc(fmt.id), fmt, { merge: true });
  }

  await batch.commit();
  console.log('Seeded 5 locations, 4 newspapers, 8 categories, and 4 formats into Firestore.');
}

seedFirestore().catch(console.error);