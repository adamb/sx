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

  // Get list of all subscribers from KV
  try {
    // Fetch the list of all subscriber emails
    const allSubscribersList = await context.env.MAILING_LIST.get('all_subscribers');
    
    if (!allSubscribersList) {
      return new Response(JSON.stringify({ subscribers: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailList = JSON.parse(allSubscribersList);
    
    // Fetch details for each subscriber (can be done in parallel)
    const subscriberPromises = emailList.map(email => 
      context.env.MAILING_LIST.get(email).then(data => JSON.parse(data))
    );
    
    const subscribers = await Promise.all(subscriberPromises);
    
    // Return subscribers as JSON
    return new Response(JSON.stringify({ subscribers }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error("Error fetching subscribers:", e);
    return new Response(JSON.stringify({ error: "Failed to retrieve subscribers" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}