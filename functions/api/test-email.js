import { sendEmail } from '../email.js';

export async function onRequestGet(context) {
  // Define test email parameters
  const testEmailParams = {
    to: 'beguelin@gmail.com', // CHANGE THIS to a real email address you can check
    subject: 'Test Email from Cloudflare Pages Function',
    text: 'This is a test email sent from the /api/test-email endpoint.',
    html: '<p>This is a <strong>test email</strong> sent from the <code>/api/test-email</code> endpoint.</p>',
    // redirectUrl is not used by the sendEmail function directly for sending,
    // but it's part of its signature. We can omit it or pass null/undefined
    // if it's not strictly needed by the core email sending logic.
    // For now, let's assume it's not critical for the direct MailHop API call.
  };

  try {
    // It's important to get environment variables from the context in Cloudflare Functions
    // The sendEmail function tries process.env but context.env is the correct way for Pages/Workers
    const mailUser = context.env.MAILHOP_USER;
    const mailPass = context.env.MAILHOP_PASS;

    if (!mailUser || !mailPass) {
      console.error('MAILHOP_USER and MAILHOP_PASS must be configured in Cloudflare environment variables.');
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error: Email credentials not set.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // The sendEmail function in email.js already handles MAILHOP_USER and MAILHOP_PASS
    // by trying to read from process.env.
    // For Cloudflare Pages/Workers, environment variables are on `context.env`.
    // We should ensure sendEmail can access these.
    // One way is to pass them explicitly, or modify sendEmail to accept `context.env`.
    // For now, let's assume sendEmail will pick them up if wrangler is configured correctly
    // or if we modify email.js slightly.
    // Given the current email.js, it uses process.env.
    // When running with `wrangler pages dev`, you need to ensure these are available.
    // You might need to use a .dev.vars file or pass them via `wrangler pages dev --binding MAILHOP_USER="user" --binding MAILHOP_PASS="pass"`

    console.log(`Attempting to send test email to: ${testEmailParams.to}`);
    const result = await sendEmail({
      ...testEmailParams,
      MAILHOP_USER: mailUser,
      MAILHOP_PASS: mailPass,
    });

    console.log('Test email sent successfully:', result);
    return new Response(JSON.stringify({ success: true, message: 'Test email sent successfully!', details: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to send test email:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
