/**
 * Handles POST requests to /logout
 * @param {EventContext} context - The context object.
 * @returns {Response} - The response object.
 */
export async function onRequestPost(context) {
  // In a real application, you would handle session invalidation here.
  // For now, we just return the initial logged-out state HTML.

  // This HTML should match the initial state in public/index.html,
  // including the wrapper div, Bootstrap classes, and matching index.html structure/text.
  // Since the target is body, we need to reconstruct the whole body content with the theme class.
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
            <input type="tel" class="form-control" id="phoneInput" name="phone" required placeholder="+1-555-123-4567" pattern="^[\d\s+()-]{7,15}$">
             <div class="invalid-tooltip">
              Please enter a valid phone number (7-15 digits/chars).
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Join List</button>
          <!-- Removed Cancel button as the form is always visible now -->
        </form>
    </div>
    <!-- Bootstrap JS Bundle needed for validation UI -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
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
    </script>
</body>
  `;

  // Note: The logout button in login.js targets 'body' with innerHTML swap.
  // So this response will replace the entire body content.
  // So this response will replace the entire body content.
  return new Response(loggedOutContent, {
    headers: { 'Content-Type': 'text/html' },
  });
}
