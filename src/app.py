"""
High School Management System API

A simple FastAPI application that allows students to view, sign up for,
and unregister from extracurricular activities at Mergington High School.
"""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Mergington High School API",
    description="API for viewing and signing up for extracurricular activities",
)

# Mount static files
current_dir = Path(__file__).parent

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(current_dir, "static")),
    name="static",
)

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": [
            "michael@mergington.edu",
            "daniel@mergington.edu",
        ],
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": [
            "emma@mergington.edu",
            "sophia@mergington.edu",
        ],
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": [
            "john@mergington.edu",
            "olivia@mergington.edu",
        ],
    },
    "Badminton Club": {
        "description": "Practice badminton and compete with fellow students",
        "schedule": "Mondays, 3:30 PM - 4:30 PM",
        "max_participants": 16,
        "participants": [],
    },
    "Volleyball Club": {
        "description": "Learn teamwork and volleyball skills",
        "schedule": "Wednesdays, 3:30 PM - 4:30 PM",
        "max_participants": 18,
        "participants": [],
    },
    "Photography Club": {
        "description": "Explore photography, composition, and visual storytelling",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 15,
        "participants": [],
    },
    "Drama Club": {
        "description": "Practice acting and perform in school productions",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 20,
        "participants": [],
    },
    "Science Club": {
        "description": "Explore science through experiments and projects",
        "schedule": "Fridays, 3:30 PM - 4:30 PM",
        "max_participants": 16,
        "participants": [],
    },
    "Debate Club": {
        "description": "Develop critical thinking and public speaking skills",
        "schedule": "Wednesdays, 3:30 PM - 4:30 PM",
        "max_participants": 14,
        "participants": [],
    },
}


@app.get("/")
def root():
    """Redirect to the website."""
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    """Return all activities and their participants."""
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Register a student for an activity."""

    if activity_name not in activities:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    activity = activities[activity_name]

    # Prevent duplicate registrations
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up for this activity",
        )

    # Prevent registration when the activity is full
    if len(activity["participants"]) >= activity["max_participants"]:
        raise HTTPException(
            status_code=400,
            detail="Activity is full",
        )

    activity["participants"].append(email)

    return {
        "message": f"Signed up {email} for {activity_name}",
        "participants": activity["participants"],
    }


@app.delete("/activities/{activity_name}/signup")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity."""

    if activity_name not in activities:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    activity = activities[activity_name]

    if email not in activity["participants"]:
        raise HTTPException(
            status_code=404,
            detail="Student is not signed up for this activity",
        )

    activity["participants"].remove(email)

    return {
        "message": f"Unregistered {email} from {activity_name}",
        "participants": activity["participants"],
    }
