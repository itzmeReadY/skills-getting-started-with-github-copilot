document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");

      if (!response.ok) {
        throw new Error("Could not load activities");
      }

      const activities = await response.json();
      activitiesList.replaceChildren();

      const selectedActivity = activitySelect.value;
      activitySelect.replaceChildren();

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select an activity";
      placeholder.disabled = true;
      placeholder.selected = true;
      activitySelect.appendChild(placeholder);

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const heading = document.createElement("h4");
        heading.textContent = name;
        activityCard.appendChild(heading);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        activityCard.appendChild(schedule);

        const spotsLeft =
          details.max_participants - details.participants.length;

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(
          availabilityLabel,
          `${spotsLeft} spots left`
        );
        activityCard.appendChild(availability);

        // Display participants for this activity.
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

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "unregister-button";
            deleteButton.textContent = "✕";
            deleteButton.title = `Unregister ${email}`;
            deleteButton.setAttribute(
              "aria-label",
              `Unregister ${email} from ${name}`
            );

            deleteButton.addEventListener("click", async () => {
              deleteButton.disabled = true;

              try {
                const url =
                  `/activities/${encodeURIComponent(name)}/signup` +
                  `?email=${encodeURIComponent(email)}`;

                const deleteResponse = await fetch(url, {
                  method: "DELETE",
                });

                const result = await deleteResponse.json();

                if (!deleteResponse.ok) {
                  throw new Error(
                    result.detail || "Could not unregister student"
                  );
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(error.message, "error");
                deleteButton.disabled = false;
              }
            });

            participantItem.append(participantEmail, deleteButton);
            participantsList.appendChild(participantItem);
          });

          participantsSection.appendChild(participantsList);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

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

  // Register a student and immediately refresh the activity cards.
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

      // Update participant information without a browser refresh.
      await fetchActivities();
    } catch (error) {
      showMessage(
        error.message || "Failed to sign up. Please try again.",
        "error"
      );
      console.error("Error signing up:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  fetchActivities();
});
