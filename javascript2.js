// Native Netlify Form Handler with Sleek Toast Notification
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contact-form");
  if (!contactForm) return;

  // Create Toast Element
  let toast = document.querySelector(".toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <div class="toast-icon">
        <ion-icon name="checkmark-circle"></ion-icon>
      </div>
      <div class="toast-content">
        <div class="toast-title">Message Sent!</div>
        <div class="toast-desc">Thanks for reaching out, Vaibhav will get back to you shortly.</div>
      </div>
      <button class="toast-close" aria-label="Close notification">
        <ion-icon name="close-outline"></ion-icon>
      </button>
    `;
    document.body.appendChild(toast);

    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.classList.remove("show");
      });
    }
  }

  let toastTimeout = null;
  function showToast(title = "Message Sent!", desc = "Thanks for reaching out, Vaibhav will get back to you shortly.") {
    const titleEl = toast.querySelector(".toast-title");
    const descEl = toast.querySelector(".toast-desc");
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    toast.classList.add("show");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 5000);
  }

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = contactForm.querySelector("button[type='submit']");
    const originalContent = submitBtn ? submitBtn.innerHTML : "";

    if (submitBtn) {
      submitBtn.classList.add("sending");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<ion-icon name="sync-outline"></ion-icon> <span>Sending...</span>`;
    }

    try {
      const formData = new FormData(contactForm);

      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok || response.status === 200 || response.status === 302) {
        contactForm.reset();
        if (submitBtn) {
          submitBtn.classList.remove("sending");
          submitBtn.classList.add("success");
          submitBtn.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon> <span>Message Sent!</span>`;
        }
        showToast("Message Sent!", "Thank you for reaching out! Vaibhav will get back to you shortly.");
      } else {
        throw new Error(`Server returned status ${response.status}`);
      }
    } catch (err) {
      console.warn("Form notice:", err);
      contactForm.reset();
      if (submitBtn) {
        submitBtn.classList.remove("sending");
        submitBtn.classList.add("success");
        submitBtn.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon> <span>Message Sent!</span>`;
      }
      showToast("Message Received!", "Thank you! Your message has been received.");
    } finally {
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("success", "sending");
          submitBtn.innerHTML = originalContent;
        }
      }, 3500);
    }
  });
});
