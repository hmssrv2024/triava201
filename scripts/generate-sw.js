import { generateSW } from 'workbox-build';

async function buildSW() {
  try {
    const { count, size, warnings } = await generateSW({
      globDirectory: 'public',
      globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,svg,ico,webp,ogg}'],
      swDest: 'public/sw.js',
      clientsClaim: true,
      skipWaiting: true,
    });

    warnings.forEach(warn => console.warn(warn));
    console.log(`Generated service worker, which will precache ${count} files, totaling ${size} bytes.`);
  } catch (error) {
    console.error('Service worker generation failed:', error);
    process.exit(1);
  }
}

buildSW();
