var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../.wrangler/tmp/pages-5Qg0fC/functionsWorker-0.811059813348654.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("<h1>Email Confirmation Failed</h1><p>No confirmation token provided.</p>", {
      status: 400,
      headers: { "Content-Type": "text/html" }
    });
  }
  try {
    const kvNamespace = env.MAILING_LIST;
    const tokenKey = `TOKEN:${token}`;
    const tokenDataJson = await kvNamespace.get(tokenKey);
    if (!tokenDataJson) {
      return new Response("<h1>Email Confirmation Failed</h1><p>Invalid or expired token. Please try signing up again.</p>", {
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    const tokenData = JSON.parse(tokenDataJson);
    const email = tokenData.email;
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt) {
      await kvNamespace.delete(tokenKey);
      return new Response("<h1>Email Confirmation Failed</h1><p>Confirmation token has expired. Please try signing up again.</p>", {
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    const subscriberKey = email;
    const subscriberJson = await kvNamespace.get(subscriberKey);
    if (!subscriberJson) {
      return new Response("<h1>Email Confirmation Failed</h1><p>User record not found.</p>", {
        status: 404,
        headers: { "Content-Type": "text/html" }
      });
    }
    const subscriberData = JSON.parse(subscriberJson);
    if (subscriberData.emailConfirmed) {
      await kvNamespace.delete(tokenKey);
      return new Response("<h1>Email Already Confirmed</h1><p>Your email address has already been confirmed.</p>", {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    }
    if (subscriberData.confirmationToken !== token) {
      return new Response("<h1>Email Confirmation Failed</h1><p>Token mismatch. Please try signing up again or contact support.</p>", {
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    subscriberData.emailConfirmed = true;
    subscriberData.confirmationToken = null;
    subscriberData.confirmationTokenExpiresAt = null;
    await kvNamespace.put(subscriberKey, JSON.stringify(subscriberData));
    await kvNamespace.delete(tokenKey);
    return new Response("<h1>Email Confirmed Successfully!</h1><p>Thank you for confirming your email address.</p>", {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("Email confirmation error:", error);
    return new Response("<h1>Email Confirmation Failed</h1><p>An unexpected error occurred. Please try again later.</p>", {
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function sendEmail({ to, subject, text, html, redirectUrl, MAILHOP_USER, MAILHOP_PASS }) {
  console.log("sendEmail function called with params:", { to, subject, MAILHOP_USER: !!MAILHOP_USER, MAILHOP_PASS: !!MAILHOP_PASS });
  if (!MAILHOP_USER || !MAILHOP_PASS) {
    throw new Error("MAILHOP_USER and MAILHOP_PASS must be provided to sendEmail function");
  }
  const rawString = `${MAILHOP_USER.trim()}:${MAILHOP_PASS.trim()}`;
  const credentials = btoa(rawString);
  console.log("Raw auth string length:", rawString.length);
  console.log("Base64 credentials length:", credentials.length);
  const requestBody = {
    messages: [{
      from: {
        name: "selfie.pr",
        email: "noreply@selfie.pr"
      },
      to: [{
        email: to
      }],
      subject,
      text,
      html
    }]
  };
  console.log("Sending email request:", {
    url: "https://api.outbound.mailhop.org/v1/send",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials.substring(0, 10)}...`
      // Only show part of credentials for security
    },
    body: {
      to: requestBody.messages[0].to[0].email,
      subject: requestBody.messages[0].subject
    }
  });
  try {
    const response = await fetch("https://api.outbound.mailhop.org/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify({
        messages: [{
          from: {
            name: "selfie.pr",
            email: "noreply@selfie.pr"
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
    console.log("Email API response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : "")
    });
    if (!response.ok) {
      console.error("Email API error details:", {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText
      });
      try {
        const error = JSON.parse(responseText);
        throw new Error(`Failed to send email: ${error.message || "Unknown error"}`);
      } catch (e) {
        throw new Error(`Failed to send email: Status ${response.status} - ${responseText}`);
      }
    }
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (fetchError) {
    console.error("Fetch error in sendEmail:", fetchError);
    throw new Error(`Email sending failed: ${fetchError.message}`);
  }
}
__name(sendEmail, "sendEmail");
__name2(sendEmail, "sendEmail");
async function onRequestGet2(context) {
  const testEmailParams = {
    to: "beguelin@gmail.com",
    // CHANGE THIS to a real email address you can check
    subject: "Test Email from Cloudflare Pages Function",
    text: "This is a test email sent from the /api/test-email endpoint.",
    html: "<p>This is a <strong>test email</strong> sent from the <code>/api/test-email</code> endpoint.</p>"
    // redirectUrl is not used by the sendEmail function directly for sending,
    // but it's part of its signature. We can omit it or pass null/undefined
    // if it's not strictly needed by the core email sending logic.
    // For now, let's assume it's not critical for the direct MailHop API call.
  };
  try {
    const mailUser = context.env.MAILHOP_USER;
    const mailPass = context.env.MAILHOP_PASS;
    if (!mailUser || !mailPass) {
      console.error("MAILHOP_USER and MAILHOP_PASS must be configured in Cloudflare environment variables.");
      return new Response(JSON.stringify({
        success: false,
        error: "Server configuration error: Email credentials not set."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log(`Attempting to send test email to: ${testEmailParams.to}`);
    const result = await sendEmail({
      ...testEmailParams,
      MAILHOP_USER: mailUser,
      MAILHOP_PASS: mailPass
    });
    console.log("Test email sent successfully:", result);
    return new Response(JSON.stringify({ success: true, message: "Test email sent successfully!", details: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function onRequestGet3(context) {
  const email = context.params.email.toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "Email parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const subscriberData = await context.env.MAILING_LIST.get(email);
    if (!subscriberData) {
      return new Response(JSON.stringify({ error: "Subscriber not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const subscriber = JSON.parse(subscriberData);
    return new Response(JSON.stringify(subscriber), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error fetching subscriber:", e);
    return new Response(JSON.stringify({ error: "Failed to retrieve subscriber data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestGet4(context) {
  const authHeader = context.request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Area"',
        "Content-Type": "text/plain"
      }
    });
  }
  try {
    const encodedCreds = authHeader.split(" ")[1];
    const decodedCreds = atob(encodedCreds);
    const [username, password] = decodedCreds.split(":");
    if (username !== "admin" || password !== "admin") {
      return new Response("Invalid credentials", { status: 401 });
    }
  } catch (e) {
    return new Response("Invalid authorization header", { status: 401 });
  }
  try {
    const facebookUsers = await context.env.facebook.list({
      prefix: "email",
      // No prefix needed since we're already in the facebook KV namespace
      limit: 50
    });
    const userPromises = facebookUsers.keys.map(async (key) => {
      try {
        const userData = await context.env.facebook.get(key.name, "json");
        return {
          id: key.name,
          // Keys are raw Facebook IDs
          ...userData,
          created: new Date(key.metadata.createdOn).toISOString()
        };
      } catch (e) {
        return {
          id: key.name,
          error: "Malformed user data",
          raw: await context.env.facebook.get(key.name, "text")
        };
      }
    });
    const users = await Promise.all(userPromises);
    return new Response(JSON.stringify({
      count: users.length,
      facebookUsers: users
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Error fetching Facebook users:", e);
    return new Response(JSON.stringify({
      error: "Failed to retrieve Facebook users",
      details: e.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
async function onRequestPost(context) {
  let name = "Operator";
  let email = "user@domain.net";
  let phone = "N/A";
  let status = "success";
  let errorMessage = "";
  let isNewSubscriber = true;
  try {
    const formData = await context.request.formData();
    name = formData.get("name") || "Operator";
    email = formData.get("email") || "";
    phone = formData.get("phone") || "";
    if (!email || !email.includes("@") || !name || !phone) {
      status = "error";
      errorMessage = "Required fields are missing or invalid";
    } else {
      const key = email.toLowerCase();
      if (!context.env.MAILING_LIST) {
        console.error("MAILING_LIST KV namespace not found in context.env. Check wrangler.toml, ensure you're in the project root, and consider updating Wrangler or using --kv flag.");
        status = "error";
        errorMessage = "Server configuration error: Mailing list service is unavailable.";
        throw new Error(errorMessage);
      }
      const existingData2 = await context.env.MAILING_LIST.get(key);
      let subscriber;
      if (existingData2) {
        isNewSubscriber = false;
        subscriber = JSON.parse(existingData2);
      } else {
        const confirmationToken = crypto.randomUUID();
        const tokenLifetimeSeconds = 24 * 60 * 60;
        const tokenExpiresAt = Date.now() + tokenLifetimeSeconds * 1e3;
        subscriber = {
          name,
          email,
          // Original case email
          phone,
          joined: (/* @__PURE__ */ new Date()).toISOString(),
          emailConfirmed: false,
          confirmationToken,
          confirmationTokenExpiresAt: tokenExpiresAt
        };
        await context.env.MAILING_LIST.put(key, JSON.stringify(subscriber));
        const tokenKvKey = `TOKEN:${confirmationToken}`;
        await context.env.MAILING_LIST.put(
          tokenKvKey,
          JSON.stringify({ email: key, expiresAt: tokenExpiresAt }),
          { expirationTtl: tokenLifetimeSeconds }
        );
        const mailUser = context.env.MAILHOP_USER;
        const mailPass = context.env.MAILHOP_PASS;
        if (mailUser && mailPass) {
          const baseUrl = new URL(context.request.url).origin;
          const confirmationLink = `${baseUrl}/api/confirm-email?token=${confirmationToken}`;
          const emailSubject = "Confirm Your Email for code.pr";
          const emailTextBody = `Hello ${name},

Please confirm your email address by clicking this link: ${confirmationLink}

If you did not sign up for code.pr, please ignore this email.

Thanks,
The code.pr Team`;
          const emailHtmlBody = `<p>Hello ${name},</p><p>Please confirm your email address by clicking the link below:</p><p><a href="${confirmationLink}">Confirm Your Email</a></p><p>If you did not sign up for code.pr, please ignore this email.</p><p>Thanks,<br>The code.pr Team</p>`;
          try {
            console.log("Attempting to send confirmation email to:", email);
            const emailResult = await sendEmail({
              to: email,
              // Send to original case email
              subject: emailSubject,
              text: emailTextBody,
              html: emailHtmlBody,
              MAILHOP_USER: mailUser,
              MAILHOP_PASS: mailPass
            });
            console.log("Email send result:", emailResult);
          } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            errorMessage = "Registered, but failed to send confirmation email. Please contact support if you don't receive it shortly.";
          }
        } else {
          console.error("Email credentials (MAILHOP_USER, MAILHOP_PASS) not configured. Cannot send confirmation email.");
          errorMessage = "Registered, but server email configuration is incomplete. Confirmation email not sent.";
        }
        let subscribersList = [];
        try {
          const existingList = await context.env.MAILING_LIST.get("all_subscribers");
          if (existingList) {
            subscribersList = JSON.parse(existingList);
          }
        } catch (e) {
          console.error("Error retrieving subscriber list:", e);
        }
        if (!subscribersList.includes(key)) {
          subscribersList.push(key);
          await context.env.MAILING_LIST.put("all_subscribers", JSON.stringify(subscribersList));
        }
      }
    }
  } catch (e) {
    console.error("Failed to process form or store in KV:", e);
    status = "error";
    errorMessage = "An error occurred processing your request.";
  }
  let responseContent;
  if (status === "error") {
    responseContent = `
      <div id="auth-section" class="container mt-5 text-center error-message">
        <p class="text-danger">Error: ${errorMessage}</p>
        <button hx-post="/logout" hx-target="body" hx-swap="innerHTML" class="btn btn-secondary">Try Again</button>
      </div>
    `;
    return new Response(responseContent, {
      headers: { "Content-Type": "text/html" },
      status: 400
      // Or appropriate error status
    });
  }
  if (isNewSubscriber) {
    responseContent = `
      <div id="auth-section" class="container mt-5 text-center logged-in-message">
        <h4>Confirmation Email Sent</h4>
        <p>An email confirmation has been sent to <strong>${email}</strong>.</p>
        <p>Please check your inbox (and spam folder) and click the link to complete your registration.</p>
        ${errorMessage ? `<p class="text-warning small">${errorMessage}</p>` : ""}
      </div>
    `;
  } else {
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
    headers: { "Content-Type": "text/html" }
  });
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestPost2(context) {
  const loggedOutContent = `
<body class="sci-fi-theme">
    <div class="text-center pt-4"> <!-- Added container for logo -->
        <img src="/images/code-pr_logo.png" alt="Code PR Logo" class="logo-image mb-4">
    </div>
    <div id="auth-section" class="container mt-3 text-center"> <!-- Reduced margin-top -->
        <p class="mb-4">Join our mailing list to keep up with Holberton Coding School and other tech related events.</p>
        <!-- Form moved directly here, added Bootstrap validation -->
        <form hx-post="/login" hx-target="#auth-section" hx-swap="outerHTML" class="mb-3 needs-validation" novalidate>
          <div class="mb-3 text-start position-relative"> <!-- Added position-relative for feedback positioning -->
            <label for="nameInput" class="form-label">Name</label>
            <input type="text" class="form-control" id="nameInput" name="name" required placeholder="Enter your full name">
            <div class="invalid-tooltip"> <!-- Bootstrap invalid feedback -->
              Please enter your name.
            </div>
          </div>
          <div class="mb-3 text-start position-relative">
            <label for="emailInput" class="form-label">Email Address</label>
            <input type="email" class="form-control" id="emailInput" name="email" required placeholder="skynet.initiator@cyberdyne.com">
             <div class="invalid-tooltip">
              Please enter a valid email address.
            </div>
          </div>
          <div class="mb-3 text-start position-relative">
            <label for="phoneInput" class="form-label">Phone Number</label>
            <!-- Added pattern for basic phone structure (allows digits, +, -, (), spaces, 7-15 chars total) -->
            <input type="tel" class="form-control" id="phoneInput" name="phone" required placeholder="+1-555-123-4567" pattern="^[ds+()-]{7,15}$">
             <div class="invalid-tooltip">
              Please enter a valid phone number (7-15 digits/chars).
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Join List</button>
          <!-- Removed Cancel button as the form is always visible now -->
        </form>
    </div>
    <!-- Bootstrap JS Bundle needed for validation UI -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"><\/script>
    <script>
      // Integrate Bootstrap validation with HTMX lifecycle
      (() => {
        'use strict'
        // Find the form
        const form = document.querySelector('.needs-validation'); // Assuming only one such form

        if (form) {
          // Listen for the htmx:beforeRequest event triggered by this form
          form.addEventListener('htmx:beforeRequest', function (event) {
            // Check the browser's native form validation
            if (!form.checkValidity()) {
              // Form is invalid: prevent the HTMX request
              event.preventDefault();
              console.log("HTMX request prevented due to invalid form."); // Debug log
              // Add was-validated class to show Bootstrap feedback
              form.classList.add('was-validated');
            } else {
              // Form is valid: allow the HTMX request to proceed
              // Optionally remove was-validated if you want errors to clear before successful submit
               form.classList.remove('was-validated');
               console.log("Form is valid, allowing HTMX request."); // Debug log
            }
          });

          // Optional: Clear validation state when HTMX swaps content back in (e.g., after successful submit)
          // This might be needed if the success message replaces the form, then logout brings it back.
          // document.body.addEventListener('htmx:afterSwap', function(event) {
          //   if (event.detail.target.id === 'auth-section') {
          //      const potentiallyNewForm = document.querySelector('.needs-validation');
          //      if (potentiallyNewForm) {
          //          potentiallyNewForm.classList.remove('was-validated');
          //      }
          //   }
          // });
        }
      })()
    <\/script>
</body>
  `;
  return new Response(loggedOutContent, {
    headers: { "Content-Type": "text/html" }
  });
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
async function onRequest(context) {
  return new Response("<div>Hello from Cloudflare Workers!</div>", {
    headers: { "Content-Type": "text/html" }
  });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
var routes = [
  {
    routePath: "/api/confirm-email",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/test-email",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/subscriber/:email",
    mountPath: "/subscriber",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/admin",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/login",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/logout",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/hello",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../.nodenv/versions/20.9.0/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../.nodenv/versions/20.9.0/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-LxXzq3/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../.nodenv/versions/20.9.0/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-LxXzq3/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.811059813348654.js.map
