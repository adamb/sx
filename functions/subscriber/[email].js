/**
 * Get a specific subscriber by email
 * @param {EventContext} context - The context object.
 * @returns {Response} - The response object.
 */
export async function onRequestGet(context) {
  // Get the email from the URL parameter
  const email = context.params.email.toLowerCase();
  
  if (!email) {
    return new Response(JSON.stringify({ error: "Email parameter is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Fetch the subscriber data from KV
    const subscriberData = await context.env.MAILING_LIST.get(email);
    
    if (!subscriberData) {
      return new Response(JSON.stringify({ error: "Subscriber not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse and return the subscriber data
    const subscriber = JSON.parse(subscriberData);
    
    return new Response(JSON.stringify(subscriber), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error("Error fetching subscriber:", e);
    return new Response(JSON.stringify({ error: "Failed to retrieve subscriber data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}