"""
SEO Pre-rendering Routes for Search Engine Bots
Serves pre-rendered HTML to crawlers (Googlebot, Bingbot, etc.)
Regular users get the normal React SPA
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from database import db, logger
from datetime import datetime
import html
import re

router = APIRouter()

# Bot user agents to detect
BOT_USER_AGENTS = [
    'googlebot', 'google-inspectiontool', 'bingbot', 'slurp', 'duckduckbot',
    'baiduspider', 'yandexbot', 'sogou', 'exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'linkedinbot', 'twitterbot', 'applebot', 'semrushbot',
    'ahrefsbot', 'mj12bot', 'petalbot', 'dotbot', 'rogerbot'
]

def is_bot(user_agent: str) -> bool:
    """Check if request is from a search engine bot"""
    if not user_agent:
        return False
    ua_lower = user_agent.lower()
    return any(bot in ua_lower for bot in BOT_USER_AGENTS)

def strip_html_tags(text: str) -> str:
    """Remove HTML tags for meta description"""
    if not text:
        return ""
    clean = re.sub(r'<[^>]+>', '', text)
    clean = html.unescape(clean)
    return clean[:160].strip()

def generate_blog_html(post: dict, site_url: str = "https://www.diocreations.eu", include_react_hydration: bool = False) -> str:
    """Generate SEO-optimized HTML for a blog post with full content visible in source"""
    title = html.escape(post.get('title', 'Blog Post'))
    description = strip_html_tags(post.get('excerpt') or post.get('content', ''))[:160]
    content = post.get('content', '')
    author = html.escape(post.get('author', 'DIOCREATIONS'))
    published_at = post.get('published_at', post.get('created_at', ''))
    featured_image = post.get('featured_image', f'{site_url}/og-blog.png')
    slug = post.get('slug', '')
    category = html.escape(post.get('category', 'General'))
    tags = post.get('tags', [])
    
    # Format date for schema.org
    if published_at:
        try:
            dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
            date_iso = dt.strftime('%Y-%m-%dT%H:%M:%S+00:00')
            date_display = dt.strftime('%B %d, %Y')
        except (ValueError, AttributeError):
            date_iso = published_at
            date_display = published_at
    else:
        date_iso = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')
        date_display = datetime.now().strftime('%B %d, %Y')
    
    # Ensure full URL for image
    if featured_image and not featured_image.startswith('http'):
        featured_image = f"{site_url}{featured_image}"
    
    canonical_url = f"{site_url}/blog/{slug}"
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | DIOCREATIONS Blog</title>
    <meta name="description" content="{html.escape(description)}">
    <meta name="author" content="{author}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="{canonical_url}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{html.escape(description)}">
    <meta property="og:image" content="{featured_image}">
    <meta property="og:site_name" content="DIOCREATIONS">
    <meta property="article:published_time" content="{date_iso}">
    <meta property="article:author" content="{author}">
    <meta property="article:section" content="{category}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{canonical_url}">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{html.escape(description)}">
    <meta name="twitter:image" content="{featured_image}">
    
    <!-- Favicon -->
    <link rel="icon" href="{site_url}/favicon.ico">
    
    <!-- Schema.org Article -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{title}",
        "description": "{html.escape(description)}",
        "image": "{featured_image}",
        "author": {{
            "@type": "Person",
            "name": "{author}"
        }},
        "publisher": {{
            "@type": "Organization",
            "name": "DIOCREATIONS",
            "logo": {{
                "@type": "ImageObject",
                "url": "{site_url}/logo.png"
            }}
        }},
        "datePublished": "{date_iso}",
        "dateModified": "{date_iso}",
        "mainEntityOfPage": {{
            "@type": "WebPage",
            "@id": "{canonical_url}"
        }},
        "articleSection": "{category}",
        "keywords": "{', '.join(tags) if tags else category}"
    }}
    </script>
    
    <!-- BreadcrumbList Schema -->
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "{site_url}"
            }},
            {{
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "{site_url}/blog"
            }},
            {{
                "@type": "ListItem",
                "position": 3,
                "name": "{title}",
                "item": "{canonical_url}"
            }}
        ]
    }}
    </script>
</head>
<body>
    <header>
        <nav>
            <a href="{site_url}">DIOCREATIONS</a>
            <a href="{site_url}/blog">Blog</a>
            <a href="{site_url}/services">Services</a>
            <a href="{site_url}/contact">Contact</a>
        </nav>
    </header>
    
    <main>
        <article>
            <header>
                <h1>{title}</h1>
                <p>
                    <span>By {author}</span> |
                    <time datetime="{date_iso}">{date_display}</time> |
                    <span>Category: {category}</span>
                </p>
            </header>
            
            <div class="content">
                {content}
            </div>
            
            <footer>
                <p>Tags: {', '.join(tags) if tags else 'General'}</p>
            </footer>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2024 DIOCREATIONS. All rights reserved.</p>
        <nav>
            <a href="{site_url}/privacy">Privacy Policy</a>
            <a href="{site_url}/terms">Terms of Service</a>
        </nav>
    </footer>
</body>
</html>'''

def generate_blog_list_html(posts: list, site_url: str = "https://www.diocreations.eu") -> str:
    """Generate SEO-optimized HTML for blog listing page"""
    posts_html = ""
    for post in posts:
        title = html.escape(post.get('title', 'Untitled'))
        slug = post.get('slug', '')
        excerpt = strip_html_tags(post.get('excerpt') or post.get('content', ''))[:200]
        posts_html += f'''
        <article>
            <h2><a href="{site_url}/blog/{slug}">{title}</a></h2>
            <p>{html.escape(excerpt)}...</p>
        </article>
        '''
    
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | DIOCREATIONS - Digital Excellence Articles</title>
    <meta name="description" content="Read the latest articles on web development, AI solutions, SEO, digital marketing, and business growth from DIOCREATIONS experts.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{site_url}/blog">
    
    <meta property="og:type" content="website">
    <meta property="og:url" content="{site_url}/blog">
    <meta property="og:title" content="Blog | DIOCREATIONS">
    <meta property="og:description" content="Read the latest articles on web development, AI solutions, and digital excellence.">
    <meta property="og:image" content="{site_url}/og-blog.png">
    
    <script type="application/ld+json">
    {{
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "DIOCREATIONS Blog",
        "description": "Latest articles on web development, AI solutions, and digital excellence",
        "url": "{site_url}/blog",
        "publisher": {{
            "@type": "Organization",
            "name": "DIOCREATIONS"
        }}
    }}
    </script>
</head>
<body>
    <header>
        <nav>
            <a href="{site_url}">DIOCREATIONS</a>
            <a href="{site_url}/blog">Blog</a>
        </nav>
    </header>
    <main>
        <h1>DIOCREATIONS Blog</h1>
        <p>Latest articles on web development, AI solutions, SEO, and digital growth.</p>
        {posts_html}
    </main>
    <footer>
        <p>&copy; 2024 DIOCREATIONS. All rights reserved.</p>
    </footer>
</body>
</html>'''


# Pre-rendered blog post endpoint for SEO bots
@router.get("/prerender/blog/{slug}", response_class=HTMLResponse)
async def prerender_blog_post(slug: str, request: Request):
    """Serve pre-rendered HTML for blog post (for SEO bots)"""
    post = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not post:
        return HTMLResponse(content="<html><body><h1>404 - Post Not Found</h1></body></html>", status_code=404)
    
    site_url = "https://www.diocreations.eu"
    html_content = generate_blog_html(post, site_url)
    return HTMLResponse(content=html_content)


@router.get("/prerender/blog", response_class=HTMLResponse)
async def prerender_blog_list(request: Request):
    """Serve pre-rendered HTML for blog listing (for SEO bots)"""
    posts = await db.blog.find({"is_published": True}, {"_id": 0}).sort("order", 1).to_list(100)
    site_url = "https://www.diocreations.eu"
    html_content = generate_blog_list_html(posts, site_url)
    return HTMLResponse(content=html_content)


# SSR endpoint - serves full HTML page that can replace index.html for blog routes
@router.get("/ssr/blog/{slug}", response_class=HTMLResponse)
async def ssr_blog_post(slug: str, request: Request):
    """
    Server-Side Rendered blog post - returns complete HTML with content visible in page source.
    This endpoint should be used with Cloudflare Workers or nginx to serve to search bots.
    """
    post = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not post:
        return HTMLResponse(
            content="""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>404 - Not Found</title></head>
<body><h1>Page Not Found</h1></body>
</html>""",
            status_code=404
        )
    
    site_url = "https://www.diocreations.eu"
    html_content = generate_blog_html(post, site_url)
    return HTMLResponse(content=html_content)


# Endpoint to get blog content as JSON for client-side hydration
@router.get("/blog-seo/{slug}")
async def get_blog_seo_data(slug: str):
    """
    Returns blog post data with SEO-ready HTML snippet.
    Frontend can use this to inject content into the page.
    """
    post = await db.blog.find_one({"slug": slug}, {"_id": 0})
    if not post:
        return {"error": "not_found"}
    
    return {
        "title": post.get("title", ""),
        "description": strip_html_tags(post.get("excerpt") or post.get("content", ""))[:160],
        "content": post.get("content", ""),
        "author": post.get("author", "DIOCREATIONS"),
        "category": post.get("category", "General"),
        "featured_image": post.get("featured_image", ""),
        "published_at": post.get("published_at", post.get("created_at", "")),
        "slug": slug
    }
