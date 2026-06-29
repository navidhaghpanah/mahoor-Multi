import { NextRequest, NextResponse } from 'next/server';

// GET /api/kenar/callback?code=...&state=...
// Divar OAuth redirect after the owner grants permission.
// Exchanges code → access_token (business_token).
// Owner copies access_token from the JSON response into Vercel env as KENAR_BUSINESS_TOKEN.
//
// To initiate: redirect owner's browser to:
// https://oauth.divar.ir/oauth2/auth
//   ?client_id=freckle-silent-bird
//   &redirect_uri=https://app.mahoorrlste.ir/api/kenar/callback
//   &scope=SUBMIT_POST%20offline_access
//   &state=<random>
//   &response_type=code
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error, description: searchParams.get('error_description') },
      { status: 400 },
    );
  }
  if (!code) {
    return NextResponse.json({ error: 'missing code parameter' }, { status: 400 });
  }

  const clientSecret = process.env.KENAR_OAUTH_SECRET;
  if (!clientSecret) {
    return NextResponse.json({ error: 'KENAR_OAUTH_SECRET not set in env' }, { status: 500 });
  }

  try {
    const tokenRes = await fetch('https://oauth.divar.ir/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        client_id:     'freckle-silent-bird',
        client_secret: clientSecret,
        grant_type:    'authorization_code',
        redirect_uri:  'https://app.mahoorrlste.ir/api/kenar/callback',
        code,
      }),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('[Kenar OAuth] token exchange failed:', data);
      return NextResponse.json({ error: 'token exchange failed', detail: data }, { status: 502 });
    }

    // Return plaintext so owner can easily copy the token
    return NextResponse.json({
      ok: true,
      instruction: 'Copy access_token below into Vercel → Environment Variables as KENAR_BUSINESS_TOKEN, then redeploy.',
      access_token:  data.access_token,
      expires_in:    data.expires_in,
      refresh_token: data.refresh_token ?? null,
      token_type:    data.token_type,
      state,
    });
  } catch (e: any) {
    console.error('[Kenar OAuth] callback error:', e?.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
