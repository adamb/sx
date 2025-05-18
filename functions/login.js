import { sendEmail } from './email.js'; // For sending confirmation email
// crypto.randomUUID() is globally available in Cloudflare Workers/Pages environment

/**
 * Handles POST requests to /login
 * Stores user information in Cloudflare KV, sends confirmation email for new users, and returns confirmation message
 * @param {EventContext} context - The context object.
 * @returns {Response} - The response object.
 */
export async function onRequestPost(context) {
  let name = 'Operator'; // Default name
  let email = 'user@domain.net'; // Default email
  let phone = 'N/A'; // Default phone
  let status = "success";
  let errorMessage = "";
  let isNewSubscriber = true;
  
  try {
    // Get form data
    const formData = await context.request.formData();
    name = formData.get('name') || 'Operator';
    email = formData.get('email') || '';
    phone = formData.get('phone') || '';
    
    // Basic server-side validation as a security measure
    if (!email || !email.includes('@') || !name || !phone) {
      status = "error";
      errorMessage = "Required fields are missing or invalid";
    } else {
      // Use email as the key for the KV store (must be unique)
      const key = email.toLowerCase();

      // Check if MAILING_LIST binding is available
      if (!context.env.MAILING_LIST) {
        console.error("MAILING_LIST KV namespace not found in context.env. Check wrangler.toml, ensure you're in the project root, and consider updating Wrangler or using --kv flag.");
        status = "error";
        errorMessage = "Server configuration error: Mailing list service is unavailable.";
        // This will skip to the error handling block at the end of the try-catch
        throw new Error(errorMessage); 
      }
      
      // Check if this email already exists in the KV store
      const existingData = await context.env.MAILING_LIST.get(key);
      let subscriber; // Define subscriber here to be accessible later
      
      if (existingData) {
        // Email already exists in our system
        isNewSubscriber = false;
        subscriber = JSON.parse(existingData); // Load existing subscriber data
        // We'll return a special message but won't overwrite the existing data
      } else {
        // Create a new subscriber record
        const confirmationToken = crypto.randomUUID();
        const tokenLifetimeSeconds = 24 * 60 * 60; // 24 hours
        const tokenExpiresAt = Date.now() + (tokenLifetimeSeconds * 1000);

        subscriber = {
          name: name,
          email: email, // Original case email
          phone: phone,
          joined: new Date().toISOString(),
          emailConfirmed: false,
          confirmationToken: confirmationToken,
          confirmationTokenExpiresAt: tokenExpiresAt
        };
        
        // Store in Cloudflare KV
        await context.env.MAILING_LIST.put(key, JSON.stringify(subscriber));

        // Store the token lookup (token -> email) in KV with an expiration
        // 'key' is the lowercased email
        const tokenKvKey = `TOKEN:${confirmationToken}`;
        await context.env.MAILING_LIST.put(
          tokenKvKey,
          JSON.stringify({ email: key, expiresAt: tokenExpiresAt }),
          { expirationTtl: tokenLifetimeSeconds }
        );
        
        // Send confirmation email
        const mailUser = context.env.MAILHOP_USER;
        const mailPass = context.env.MAILHOP_PASS;

        if (mailUser && mailPass) {
          const baseUrl = new URL(context.request.url).origin;
          const confirmationLink = `${baseUrl}/api/confirm-email?token=${confirmationToken}`;
          const emailSubject = 'Confirm Your Email for code.pr';
          const emailTextBody = `Hello ${name},\n\nPlease confirm your email address by clicking this link: ${confirmationLink}\n\nIf you did not sign up for code.pr, please ignore this email.\n\nThanks,\nThe code.pr Team`;
          const emailHtmlBody = `<p>Hello ${name},</p><p>Please confirm your email address by clicking the link below:</p><p><a href="${confirmationLink}">Confirm Your Email</a></p><p>If you did not sign up for code.pr, please ignore this email.</p><p>Thanks,<br>The code.pr Team</p>`;

          try {
            console.log('Attempting to send confirmation email to:', email);
            const emailResult = await sendEmail({
              to: email, // Send to original case email
              subject: emailSubject,
              text: emailTextBody,
              html: emailHtmlBody,
              MAILHOP_USER: mailUser,
              MAILHOP_PASS: mailPass,
            });
            console.log('Email send result:', emailResult);
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Potentially update errorMessage or status here if needed
            errorMessage = "Registered, but failed to send confirmation email. Please contact support if you don't receive it shortly.";
            // status could be set to a specific error state if desired
          }
        } else {
          console.error('Email credentials (MAILHOP_USER, MAILHOP_PASS) not configured. Cannot send confirmation email.');
          errorMessage = "Registered, but server email configuration is incomplete. Confirmation email not sent.";
        }
        
        // Maintain a list of all subscribers (useful for listing)
        let subscribersList = [];
        try {
          const existingList = await context.env.MAILING_LIST.get('all_subscribers');
          if (existingList) {
            subscribersList = JSON.parse(existingList);
          }
        } catch (e) {
          console.error("Error retrieving subscriber list:", e);
          // Continue with empty list if there was an error
        }
        
        // Add the new subscriber email to the list if not already present
        if (!subscribersList.includes(key)) {
          subscribersList.push(key);
          await context.env.MAILING_LIST.put('all_subscribers', JSON.stringify(subscribersList));
        }
      }
    }
  } catch (e) {
    console.error("Failed to process form or store in KV:", e);
    status = "error";
    errorMessage = "An error occurred processing your request.";
  }
  
  // Prepare response based on status
  let responseContent;

  if (status === "error") {
    responseContent = `
      <div id="auth-section" class="container mt-5 text-center error-message">
        <p class="text-danger">Error: ${errorMessage}</p>
        <button hx-post="/logout" hx-target="body" hx-swap="innerHTML" class="btn btn-secondary">Try Again</button>
      </div>
    `;
    return new Response(responseContent, {
      headers: { 'Content-Type': 'text/html' },
      status: 400 // Or appropriate error status
    });
  }
  
  // Success response
  if (isNewSubscriber) {
    // For new subscribers, inform them about email confirmation
    responseContent = `
      <div id="auth-section" class="container mt-5 text-center logged-in-message">
        <h4>Confirmation Email Sent</h4>
        <p>An email confirmation has been sent to <strong>${email}</strong>.</p>
        <p>Please check your inbox (and spam folder) and click the link to complete your registration.</p>
        ${errorMessage ? `<p class="text-warning small">${errorMessage}</p>` : ''}
      </div>
    `;
  } else {
    // For existing subscribers
    // Parse the existingData here to ensure subscriber is defined
    let subscriber = null;
    try {
      if (existingData) {
        subscriber = JSON.parse(existingData);
      }
    } catch (e) {
      console.error("Error parsing existing subscriber data:", e);
    }
    
    let successMessage = "You were already on our mailing list!";
    if (subscriber && !subscriber.emailConfirmed) {
        successMessage = "You are on our mailing list but haven't confirmed your email yet. Please check your inbox for the confirmation link, or sign up again to receive a new one.";
    } else if (subscriber && subscriber.emailConfirmed) {
        successMessage = "Welcome back! Your email is confirmed.";
    }

    responseContent = `
      <div id="auth-section" class="container mt-5 text-center logged-in-message">
        <p>Welcome back, <strong>${name}</strong>!</p>
        <p class="text-success small">${successMessage}</p>
        <button hx-post="/logout" hx-target="body" hx-swap="innerHTML" class="btn btn-secondary">Start Over</button>
      </div>
    `;
  }
  
  return new Response(responseContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}
