export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('<h1>Email Confirmation Failed</h1><p>No confirmation token provided.</p>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    const kvNamespace = env.MAILING_LIST; // Using MAILING_LIST as per wrangler.toml
    const tokenKey = `TOKEN:${token}`;
    const tokenDataJson = await kvNamespace.get(tokenKey);

    if (!tokenDataJson) {
      return new Response('<h1>Email Confirmation Failed</h1><p>Invalid or expired token. Please try signing up again.</p>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const tokenData = JSON.parse(tokenDataJson);
    const email = tokenData.email; // This should be the lowercased email used as the main key

    // Optional: Check for token expiry if not solely relying on KV's TTL (KV TTL is generally sufficient)
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      await kvNamespace.delete(tokenKey); // Clean up expired token
      return new Response('<h1>Email Confirmation Failed</h1><p>Confirmation token has expired. Please try signing up again.</p>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Get the subscriber's record using the email (which is the key in login.js)
    const subscriberKey = email; // email from tokenData is already lowercased
    const subscriberJson = await kvNamespace.get(subscriberKey);

    if (!subscriberJson) {
      // This case should be rare if token exists, but good to handle
      return new Response('<h1>Email Confirmation Failed</h1><p>User record not found.</p>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const subscriberData = JSON.parse(subscriberJson);

    if (subscriberData.emailConfirmed) {
      await kvNamespace.delete(tokenKey); // Clean up token if already confirmed
      return new Response('<h1>Email Already Confirmed</h1><p>Your email address has already been confirmed.</p>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Verify the token stored in the user record matches the one from the URL
    if (subscriberData.confirmationToken !== token) {
        // This indicates a mismatch, possibly an old token or an issue.
        return new Response('<h1>Email Confirmation Failed</h1><p>Token mismatch. Please try signing up again or contact support.</p>', {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
        });
    }

    // Update subscriber data
    subscriberData.emailConfirmed = true;
    subscriberData.confirmationToken = null; 
    subscriberData.confirmationTokenExpiresAt = null;

    await kvNamespace.put(subscriberKey, JSON.stringify(subscriberData));
    await kvNamespace.delete(tokenKey); // Delete the used token

    return new Response('<h1>Email Confirmed Successfully!</h1><p>Thank you for confirming your email address.</p>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Email confirmation error:', error);
    return new Response('<h1>Email Confirmation Failed</h1><p>An unexpected error occurred. Please try again later.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
