document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Display a message to the user.
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Fetch activities and render the cards.
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");

      if (!response.ok) {
        throw new Error("Could not load activities");
      }

      const activities = await response.json();

      activitiesList.replaceChildren();

      // Preserve the current dropdown selection during refresh.
      const selectedActivity = activitySelect.value;
      activitySelect.replaceChildren();

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select an activity";
      placeholder.disabled = true;
      placeholder.selected = true;
      activitySelect.appendChild(placeholder);

      Object.entries(activities).forEach(([name, details]) => {
        const card = document.createElement("div");
        card.className = "activity-card";

        const heading = document.createElement("h4");
        heading.textContent = name;
        card.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        card.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        card.appendChild(schedule);

        const spotsLeft =
          details.max_participants - details.participants.length;

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(
          availabilityLabel,
          `${spotsLeft} spots left`
        );
        card.appendChild(availability);

        // Participants section.
        const participantsSection = document.createElement("section");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent =
          `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "no-participants";
          emptyMessage.textContent = "No students signed up yet.";
          participantsSection.appendChild(emptyMessage);
        } else {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((email) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "unregister-button";
            removeButton.textContent = "✕";
            removeButton.title = `Unregister ${email}`;
            removeButton.setAttribute(
              "aria-label",
              `Unregister ${email} from ${name}`
            );

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;

              try {
                const url =
                  `/activities/${encodeURIComponent(name)}/signup` +
                  `?email=${encodeURIComponent(email)}`;

                const response = await fetch(url, {
                  method: "DELETE",
                });

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(
                    result.detail || "Could not unregister student"
                  );
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(error.message, "error");
                removeButton.disabled = false;
              }
            });

            participantItem.append(participantEmail, removeButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.appendChild(participantsList);
        }

        card.appendChild(participantsSection);
        activitiesList.appendChild(card);

        // Populate activity dropdown.
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Keep the previous selection if it still exists.
      if (
        selectedActivity &&
        [...activitySelect.options].some(
          (option) => option.value === selectedActivity
        )
      ) {
        activitySelect.value = selectedActivity;
      }
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again.";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle student signup.
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;

    if (!email || !activity) {
      showMessage("Please enter your email and select an activity.", "error");
      return;
    }

    const submitButton = signupForm.querySelector(
      'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const url =
        `/activities/${encodeURIComponent(activity)}/signup` +
        `?email=${encodeURIComponent(email)}`;

      const response = await fetch(url, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "An error occurred");
      }

      showMessage(result.message, "success");
      signupForm.reset();

      // Immediately refresh participant lists and availability.
      await fetchActivities();
    } catch (error) {
      showMessage(error.message || "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  // Initial page load.
  fetchActivities();
});
