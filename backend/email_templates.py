"""
Diocreations Email Templates
Shared email styling and branding for all Diocreations emails
"""

# Diocreations brand colors
BRAND_PRIMARY = "#7c3aed"  # Violet
BRAND_DARK = "#1a1a2e"     # Dark navy
BRAND_GRADIENT = "linear-gradient(135deg,#1a1a2e 0%,#2d2d4a 100%)"

# Diocreations Logo with butterfly + text (uses website font styling)
# Note: Email clients have limited SVG animation support, but modern clients (Gmail, Apple Mail) support it
DIOCREATIONS_LOGO = '''
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;">
        <style>
          .lw,.rw{transform-origin:25px 25px;animation:flap .4s ease-in-out infinite alternate}
          .rw{animation-name:flapr}
          @keyframes flap{to{transform:rotate(-25deg)}}
          @keyframes flapr{to{transform:rotate(25deg)}}
        </style>
        <g class="rw">
          <path fill="#4D629A" d="M27.7 31.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98.48 6.14 2.64c1.27 1.28 1.52 3.09.56 4.06s-2.79.71-4.06-.56z"/>
          <path fill="#00A096" d="M31.26 27.5c-3.34 0-6.2-2.48-6.2-2.48s3.16-2.48 6.2-2.48c1.8 0 3.26 1.11 3.26 2.48s-1.46 2.48-3.26 2.48z"/>
          <path fill="#89BF4A" d="M31.19 22.39c-2.36 2.36-6.14 2.64-6.14 2.64s.48-3.99 2.64-6.14c1.27-1.27 3.09-1.52 4.05-.56s.72 2.79-.55 4.06z"/>
        </g>
        <g class="lw">
          <path fill="#8F5398" d="M22.3 31.11c2.36-2.36 2.64-6.14 2.64-6.14s-3.98.48-6.14 2.64c-1.27 1.27-1.52 3.09-.56 4.06s2.79.72 4.06-.56z"/>
          <path fill="#E16136" d="M18.74 27.45c3.34 0 6.2-2.48 6.2-2.48s-6.16-2.47-9.2-2.47c-1.8 0-3.26 1.11-3.26 2.47s1.46 2.48 3.26 2.48z"/>
          <path fill="#F3BE33" d="M18.81 22.34c2.36 2.36 6.14 2.64 6.14 2.64s-.49-3.98-2.65-6.14c-1.27-1.27-3.09-1.52-4.05-.55s-.72 2.78.56 4.05z"/>
        </g>
      </svg>
    </td>
    <td style="vertical-align:middle;">
      <span style="font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
        <span style="color:#ffffff;">DIO</span><span style="color:#a78bfa;">CREATIONS</span>
      </span>
    </td>
  </tr>
</table>
'''

# Logo for light backgrounds
DIOCREATIONS_LOGO_DARK = '''
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="vertical-align:middle;padding-right:12px;">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;">
        <style>
          .lw,.rw{transform-origin:25px 25px;animation:flap .4s ease-in-out infinite alternate}
          .rw{animation-name:flapr}
          @keyframes flap{to{transform:rotate(-25deg)}}
          @keyframes flapr{to{transform:rotate(25deg)}}
        </style>
        <g class="rw">
          <path fill="#4D629A" d="M27.7 31.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98.48 6.14 2.64c1.27 1.28 1.52 3.09.56 4.06s-2.79.71-4.06-.56z"/>
          <path fill="#00A096" d="M31.26 27.5c-3.34 0-6.2-2.48-6.2-2.48s3.16-2.48 6.2-2.48c1.8 0 3.26 1.11 3.26 2.48s-1.46 2.48-3.26 2.48z"/>
          <path fill="#89BF4A" d="M31.19 22.39c-2.36 2.36-6.14 2.64-6.14 2.64s.48-3.99 2.64-6.14c1.27-1.27 3.09-1.52 4.05-.56s.72 2.79-.55 4.06z"/>
        </g>
        <g class="lw">
          <path fill="#8F5398" d="M22.3 31.11c2.36-2.36 2.64-6.14 2.64-6.14s-3.98.48-6.14 2.64c-1.27 1.27-1.52 3.09-.56 4.06s2.79.72 4.06-.56z"/>
          <path fill="#E16136" d="M18.74 27.45c3.34 0 6.2-2.48 6.2-2.48s-6.16-2.47-9.2-2.47c-1.8 0-3.26 1.11-3.26 2.47s1.46 2.48 3.26 2.48z"/>
          <path fill="#F3BE33" d="M18.81 22.34c2.36 2.36 6.14 2.64 6.14 2.64s-.49-3.98-2.65-6.14c-1.27-1.27-3.09-1.52-4.05-.55s-.72 2.78.56 4.05z"/>
        </g>
      </svg>
    </td>
    <td style="vertical-align:middle;">
      <span style="font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
        <span style="color:#1a1a2e;">DIO</span><span style="color:#7c3aed;">CREATIONS</span>
      </span>
    </td>
  </tr>
</table>
'''


def get_email_wrapper(content: str, footer_text: str = "Diocreations | www.diocreations.eu") -> str:
    """
    Wrap email content in the standard Diocreations email template
    """
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;">
      <div style="font-family:'Segoe UI',Calibri,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
        {content}
        <div style="padding:16px 28px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
          {DIOCREATIONS_LOGO_DARK}
          <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">{footer_text}</p>
        </div>
      </div>
    </body>
    </html>
    '''


def get_email_header(title: str = "", subtitle: str = "") -> str:
    """
    Get the standard email header with logo
    """
    title_html = f'<h1 style="color:#fff;margin:16px 0 0;font-size:22px;letter-spacing:0.5px;">{title}</h1>' if title else ''
    subtitle_html = f'<p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">{subtitle}</p>' if subtitle else ''
    
    return f'''
    <div style="background:{BRAND_GRADIENT};padding:32px 28px;text-align:center;">
      {DIOCREATIONS_LOGO}
      {title_html}
      {subtitle_html}
    </div>
    '''


def get_success_badge(text: str = "Success") -> str:
    """Green success badge"""
    return f'''
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="color:#16a34a;font-weight:600;font-size:15px;margin:0;">✓ {text}</p>
    </div>
    '''


def get_info_box(lines: list) -> str:
    """Info box with gray background"""
    content = ''.join([f'<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">{line}</p>' for line in lines[:-1]])
    content += f'<p style="margin:0;font-size:13px;color:#6b7280;">{lines[-1]}</p>' if lines else ''
    return f'''
    <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;text-align:center;">
      {content}
    </div>
    '''
