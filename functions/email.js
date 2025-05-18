export async function sendEmail({ to, subject, text, html, redirectUrl, MAILHOP_USER, MAILHOP_PASS }) {
  console.log('sendEmail function called with params:', { to, subject, MAILHOP_USER: !!MAILHOP_USER, MAILHOP_PASS: !!MAILHOP_PASS });
  
  if (!MAILHOP_USER || !MAILHOP_PASS) {
    throw new Error('MAILHOP_USER and MAILHOP_PASS must be provided to sendEmail function');
  }

  // Create base64 encoded credentials for Basic Auth
  const rawString = `${MAILHOP_USER.trim()}:${MAILHOP_PASS.trim()}`;
  const credentials = btoa(rawString);

  console.log('Raw auth string length:', rawString.length);
  console.log('Base64 credentials length:', credentials.length);

  const requestBody = {
    messages: [{
      from: { 
        name: "code.pr",
        email: 'noreply@code.pr' 
      },
      to: [{ 
        email: to 
      }],
      subject,
      text,
      html
    }]
  };

  console.log('Sending email request:', {
    url: 'https://api.outbound.mailhop.org/v1/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials.substring(0, 10)}...`  // Only show part of credentials for security
    },
    body: {
      to: requestBody.messages[0].to[0].email,
      subject: requestBody.messages[0].subject
    }
  });

  try {
    const response = await fetch('https://api.outbound.mailhop.org/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        messages: [{
          from: { 
            name: "code.pr",
            email: 'noreply@code.pr' 
          },
          to: [{ 
            email: to 
          }],
          subject,
          text,
          html
        }]
      })
    });

    const responseText = await response.text();
    
    console.log('Email API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
    });
    
    if (!response.ok) {
      console.error('Email API error details:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText
      });
      try {
        const error = JSON.parse(responseText);
        throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
      } catch (e) {
        throw new Error(`Failed to send email: Status ${response.status} - ${responseText}`);
      }
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (fetchError) {
    console.error('Fetch error in sendEmail:', fetchError);
    throw new Error(`Email sending failed: ${fetchError.message}`);
  }
}
