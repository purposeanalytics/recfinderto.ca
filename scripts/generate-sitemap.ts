import { readFileSync, writeFileSync } from 'fs';
import { categories } from '../src/services/categories';

const baseUrl = 'https://recfinderto.ca';
const urls: Array<{ loc: string; changefreq: string; priority: number; lastmod?: string }> = [];

// Helper to add URL with proper encoding
const addUrl = (path: string, changefreq: string = 'daily', priority: number = 0.8) => {
  const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
  urls.push({
    loc: fullUrl,
    changefreq,
    priority,
    lastmod: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  });
};

// Add homepage
addUrl('/', 'daily', 1.0);

// Add special date filters (only when no other filters)
addUrl('/?date=tomorrow', 'daily', 0.9);
addUrl('/?date=this-week', 'daily', 0.9);

// Add all categories
categories.forEach(category => {
  // Add category page
  addUrl(`/?category=${encodeURIComponent(category.id)}`, 'daily', 0.8);
  
  // Add category + subcategory combinations
  category.subcategories.forEach(subcategory => {
    // Skip fallback subcategories as they're less specific
    if (!subcategory.isFallback) {
      addUrl(`/?category=${encodeURIComponent(category.id)}&subcategory=${encodeURIComponent(subcategory.id)}`, 'daily', 0.7);
    }
  });
});

// Add popular programs (read from Drop-in.json if available)
try {
  const dropInData = JSON.parse(readFileSync('public/Drop-in.json', 'utf-8'));
  
  // Get unique course titles and count occurrences
  const courseTitleCounts = new Map<string, number>();
  dropInData.forEach((record: any) => {
    const title = record['Course Title'];
    if (title) {
      courseTitleCounts.set(title, (courseTitleCounts.get(title) || 0) + 1);
    }
  });
  
  // Sort by frequency and take top 50 most popular programs
  const popularPrograms = Array.from(courseTitleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([title]) => title);
  
  // Add URLs for popular programs
  popularPrograms.forEach(program => {
    addUrl(`/?program=${encodeURIComponent(program)}`, 'daily', 0.6);
  });
  
  console.log(`Added ${popularPrograms.length} popular programs to sitemap`);
} catch (error) {
  console.warn('Could not read Drop-in.json, skipping popular programs:', error);
}

// Generate sitemap XML
// Helper function to escape XML entities in URLs
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Write sitemap to public folder
writeFileSync('public/sitemap.xml', sitemap, 'utf-8');

console.log(`Generated sitemap.xml with ${urls.length} URLs`);
console.log(`Categories: ${categories.length}`);
console.log(`Subcategories: ${categories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`);
