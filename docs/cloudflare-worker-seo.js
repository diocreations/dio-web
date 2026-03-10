/**
 * Cloudflare Worker for SEO Pre-rendering
 * 
 * This worker detects search engine bots and serves pre-rendered HTML
 * so that blog content is visible in the page source.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to Cloudflare Dashboard → Workers & Pages → Create Worker
 * 2. Paste this code
 * 3. Set up a route: diocreations.eu/blog/* → this worker
 * 4. Deploy
 */

// Bot user agents to detect
const BOT_USER_AGENTS = [
  'googlebot',
  'google-inspectiontool', 
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'rogerbot',
  'mj12bot',
  'petalbot'
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if this is a blog route
    const blogMatch = url.pathname.match(/^\/blog\/([a-zA-Z0-9_-]+)$/);
    
    if (blogMatch && isBot(userAgent)) {
      const slug = blogMatch[1];
      
      // Fetch pre-rendered HTML from your backend
      const prerenderUrl = `https://www.diocreations.eu/api/ssr/blog/${slug}`;
      
      try {
        const response = await fetch(prerenderUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Robots-Tag': 'index, follow',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (error) {
        console.error('Pre-render fetch failed:', error);
      }
    }
    
    // For regular users or non-blog routes, pass through to origin
    return fetch(request);
  }
};
