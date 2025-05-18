/**
 * Admin function to list all subscribers
 * @param {EventContext} context - The context object.
 * @returns {Response} - The response object.
 */
export async function onRequestGet(context) {
  // Check for basic auth or other authentication method
  // This is a simple example - in production, use proper authentication
  const authHeader = context.request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"',
        'Content-Type': 'text/plain'
      }
    });
  }

  // Decode the Base64 auth string (username:password)
  try {
    const encodedCreds = authHeader.split(' ')[1];
    const decodedCreds = atob(encodedCreds);
    const [username, password] = decodedCreds.split(':');
    
    // Simple hardcoded credentials (replace with secure authentication in production)
    if (username !== 'admin' || password !== 'password123') {
      return new Response('Invalid credentials', { status: 401 });
    }
  } catch (e) {
    return new Response('Invalid authorization header', { status: 401 });
  }

  // Get list of Facebook users from KV
  try {
    // List first 50 Facebook users using the correct KV binding and prefix
    const facebookUsers = await context.env.facebook.list({
      prefix: 'facebook.',
      limit: 50
    });

    // Fetch details for each Facebook user
    const userPromises = facebookUsers.keys.map(async (key) => {
      try {
        const userData = await context.env.facebook.get(key.name, 'json');
        return {
          id: key.name.replace('facebook.', ''), // Extract Facebook ID
          ...userData,
          created: new Date(key.metadata.createdOn).toISOString()
        };
      } catch (e) {
        return { 
          id: key.name.replace('facebook.', ''),
          error: "Malformed user data",
          raw: await context.env.facebook.get(key.name, 'text')
        };
      }
    });

    const users = await Promise.all(userPromises);
    
    return new Response(JSON.stringify({
      count: users.length,
      facebookUsers: users
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error("Error fetching Facebook users:", e);
    return new Response(JSON.stringify({ 
      error: "Failed to retrieve Facebook users",
      details: e.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
