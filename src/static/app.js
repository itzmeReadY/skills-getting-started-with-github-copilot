
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let messageTimer;

  function showMessage(message, type) {
    clearTimeout(messageTimer);

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;

    messageTimer = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Request failed"
      );
    }

    return data;
  }

  async function fetchActivities() {
    try {
      const activities = await request("/activities");
      const previousValue = activitySelect.value;

      activitiesList.replaceChildren();
      activitySelect.replaceChildren();

      const placeholder = new Option("Select an activity", "");
      activitySelect.appendChild(placeholder);

      for (const [name, details] of Object.entries(activities)) {
        const activityCard = document.createElement("article");
        activityCard.className = "activity-card";

        const heading = document.createElement("h4");
        heading.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.textContent = `Schedule: ${details.schedule}`;

        const spotsLeft =
          details.max_participants - details.participants.length;

        const availability = document.createElement("p");
        availability.textContent =
          `Availability: ${spotsLeft} spots left`;

        activityCard.append(
          heading,
          description,
          schedule,
          availability
        );

        // Display all registered participants.
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent =
          `Participants (${details.participants.length})`;

        participantsSection.appendChild(participantsHeading);

        if (details.participants.length === 0) {
          const empty = document.createElement("p");
          empty.className = "no-participants";
          empty.textContent = "No students signed up yet.";

          participantsSection.appendChild(empty);
        } else {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          // Create a participant row and unregister button.
          for (const email of details.participants) {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "unregister-button";
            deleteButton.textContent = "✕";

            deleteButton.setAttribute(
              "aria-label",
              `Unregister ${email} from ${name}`
            );

            deleteButton.addEventListener("click", async () => {
              if (!confirm(`Unregister ${email} from ${name}?`)) {
                return;
              }

              deleteButton.disabled = true;

              try {
                const url =
                  `/activities/${encodeURIComponent(name)}/signup` +
                  `?email=${encodeURIComponent(email)}`;

                const result = await request(url, {
                  method: "DELETE",
                });

                showMessage(result.message, "success");

                // Refresh participants immediately after unregistering.
                await fetchActivities();
              } catch (error) {
                showMessage(error.message, "error");
                deleteButton.disabled = false;
              }
            });

            participantItem.append(
              participantEmail,
              deleteButton
            );

            participantsList.appendChild(participantItem);
          }

          participantsSection.appendChild(participantsList);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        const option = new Option(name, name);
        option.disabled = spotsLeft <= 0;

        activitySelect.appendChild(option);
      }

      if (
        previousValue &&
        [...activitySelect.options].some(
          (option) =>
            option.value === previousValue && !option.disabled
        )
      ) {
        activitySelect.value = previousValue;
      }
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please reload the page.";

      showMessage(error.message, "error");
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;

    if (!email || !activity) {
      showMessage(
        "Please enter an email and select an activity.",
        "error"
      );
      return;
    }

    const submitButton = signupForm.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
      const url =
        `/activities/${encodeURIComponent(activity)}/signup` +
        `?email=${encodeURIComponent(email)}`;

      const result = await request(url, {
        method: "POST",
      });

      showMessage(result.message, "success");
      signupForm.reset();

      // Update participants without manually refreshing the browser.
      await fetchActivities();
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  fetchActivities();
});
