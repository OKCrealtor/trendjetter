import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ── Shared layout wrapper ──────────────────────────────────────────────────────
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111111;border-radius:9px;width:34px;height:34px;text-align:center;vertical-align:middle;">
                    <span style="color:#FFFFFF;font-size:17px;font-weight:800;line-height:34px;">#</span>
                  </td>
                  <td style="padding-left:9px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:800;color:#111111;letter-spacing:-0.03em;">trendjetter</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-radius:14px;border:1px solid #E4E4E7;padding:36px 36px 32px;box-shadow:0 2px 10px rgba(0,0,0,0.04);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 0 8px;text-align:center;">
              <p style="margin:0 0 5px;font-size:11px;color:#A1A1AA;">
                TrendJetter · trendjetter.io
              </p>
              <p style="margin:0;font-size:11px;color:#D4D4D8;">
                <a href="https://www.trendjetter.io/#/privacy" style="color:#D4D4D8;text-decoration:none;">Privacy</a>
                &nbsp;·&nbsp;
                <a href="https://www.trendjetter.io/#/terms" style="color:#D4D4D8;text-decoration:none;">Terms</a>
                &nbsp;·&nbsp;
                <a href="mailto:hi@trendjetter.io" style="color:#D4D4D8;text-decoration:none;">hi@trendjetter.io</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding-top:8px;">
        <a href="${url}" style="display:inline-block;background:#111111;color:#FFFFFF;font-size:14px;font-weight:700;letter-spacing:-0.01em;text-decoration:none;padding:12px 28px;border-radius:9px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

// ── Welcome email ──────────────────────────────────────────────────────────────
function welcomeHtml(name: string): string {
  const firstName = name.split(' ')[0] || 'there';
  return layout(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111111;letter-spacing:-0.03em;line-height:1.15;">
      Hey ${firstName}, you're in.
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#71717A;line-height:1.7;">
      TrendJetter is live and ready. Here's how to get your first hashtag set in under a minute.
    </p>

    <hr style="border:none;border-top:1px solid #F4F4F5;margin:0 0 22px;" />

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#111111;letter-spacing:0.07em;text-transform:uppercase;">
      Start here
    </p>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${[
        ['Generate hashtags for your next post', 'https://www.trendjetter.io/#/generator'],
        ['See what is trending right now', 'https://www.trendjetter.io/#/trends'],
        ['Save your best sets to Collections', 'https://www.trendjetter.io/#/collections'],
      ].map(([label, url]) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #F9F9F9;">
          <a href="${url}" style="font-size:14px;color:#111111;text-decoration:none;font-weight:500;">
            <span style="color:#0891B2;margin-right:8px;">→</span>${label}
          </a>
        </td>
      </tr>`).join('')}
    </table>

    <div style="height:26px;"></div>

    ${btn('Generate your first hashtag set →', 'https://www.trendjetter.io/#/generator')}

    <div style="height:28px;"></div>

    <p style="margin:0 0 4px;font-size:14px;color:#52525B;line-height:1.7;">
      Questions? Just reply to this email.
    </p>
    <p style="margin:0;font-size:14px;color:#52525B;">
      Will<br />
      <span style="color:#A1A1AA;font-size:13px;">Founder, TrendJetter</span>
    </p>
  `);
}

// ── Day 3 drip ────────────────────────────────────────────────────────────────
function day3Html(name: string): string {
  const firstName = name.split(' ')[0] || 'there';
  return layout(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111111;letter-spacing:-0.03em;line-height:1.15;">
      ${firstName}, have you tried it yet?
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#71717A;line-height:1.7;">
      You signed up a few days ago. If you haven't run your first search yet, it takes about 30 seconds.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#F9FAFB;border:1px solid #E4E4E7;border-radius:10px;padding:18px 20px;margin-bottom:22px;">
      <tr>
        <td>
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#111111;letter-spacing:0.07em;text-transform:uppercase;">How it works</p>
          <p style="margin:0 0 8px;font-size:14px;color:#52525B;line-height:1.65;">
            1. Type your niche or topic into the generator.
          </p>
          <p style="margin:0 0 8px;font-size:14px;color:#52525B;line-height:1.65;">
            2. Pick your platform (Instagram, TikTok, YouTube, LinkedIn).
          </p>
          <p style="margin:0;font-size:14px;color:#52525B;line-height:1.65;">
            3. Get a scored hashtag set, ranked best to worst.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 22px;font-size:14px;color:#52525B;line-height:1.7;">
      That's it. No spreadsheet. No copy-pasting from Reddit threads. Just hashtags that match what's actually gaining traction right now.
    </p>

    ${btn('Try the generator →', 'https://www.trendjetter.io/#/generator')}

    <div style="height:28px;"></div>

    <p style="margin:0 0 4px;font-size:14px;color:#52525B;line-height:1.7;">
      Hit reply if you have any questions. I read every one.
    </p>
    <p style="margin:0;font-size:14px;color:#52525B;">
      Will<br />
      <span style="color:#A1A1AA;font-size:13px;">Founder, TrendJetter</span>
    </p>
  `);
}

// ── Day 7 drip ────────────────────────────────────────────────────────────────
function day7Html(name: string): string {
  const firstName = name.split(' ')[0] || 'there';
  return layout(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111111;letter-spacing:-0.03em;line-height:1.15;">
      Founder pricing closes July 15.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#71717A;line-height:1.7;">
      Hey ${firstName}. We launched TrendJetter with 100 founder seats at $19/mo. That locks in forever, no matter what the price goes to later. We're down to the last handful.
    </p>

    <table cellpadding="0" cellspacing="0" width="100%" style="background:#111111;border-radius:12px;padding:22px 24px;margin-bottom:22px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0891B2;letter-spacing:0.08em;text-transform:uppercase;">Pro Founder</p>
          <p style="margin:0 0 12px;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.03em;">
            $19<span style="font-size:14px;font-weight:400;color:#71717A;">/mo</span>
            <span style="font-size:14px;font-weight:500;color:#52525B;text-decoration:line-through;margin-left:8px;">$29</span>
          </p>
          <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">1,000 searches/mo</p>
          <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">Unlimited platforms</p>
          <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">Smart Collections</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">Price locked forever</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 22px;font-size:14px;color:#52525B;line-height:1.7;">
      After July 15 the price goes up. If you've been on the fence, this is the window.
    </p>

    ${btn('Claim your founder seat →', 'https://www.trendjetter.io/#/account')}

    <div style="height:28px;"></div>

    <p style="margin:0 0 4px;font-size:14px;color:#52525B;line-height:1.7;">
      Questions? Just reply.
    </p>
    <p style="margin:0;font-size:14px;color:#52525B;">
      Will<br />
      <span style="color:#A1A1AA;font-size:13px;">Founder, TrendJetter</span>
    </p>
  `);
}

// ── Send functions ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — skipping welcome email for', email);
    return;
  }
  try {
    await resend.emails.send({
      from: 'Will at TrendJetter <hi@trendjetter.io>',
      to: email,
      subject: "You're in. Here's how to get started.",
      html: welcomeHtml(name),
    });
    console.log('[email] Welcome email sent to', email);
  } catch (err: any) {
    console.error('[email] Failed to send welcome email:', err.message);
  }
}

export async function sendDay3Email(email: string, name: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'Will at TrendJetter <hi@trendjetter.io>',
      to: email,
      subject: 'Have you tried TrendJetter yet?',
      html: day3Html(name),
    });
    console.log('[email] Day 3 email sent to', email);
  } catch (err: any) {
    console.error('[email] Failed to send day 3 email:', err.message);
  }
}

export async function sendDay7Email(email: string, name: string): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: 'Will at TrendJetter <hi@trendjetter.io>',
      to: email,
      subject: 'Founder pricing closes July 15.',
      html: day7Html(name),
    });
    console.log('[email] Day 7 email sent to', email);
  } catch (err: any) {
    console.error('[email] Failed to send day 7 email:', err.message);
  }
}
