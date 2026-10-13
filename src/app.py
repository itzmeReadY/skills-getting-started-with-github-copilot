
"""High School Management System API."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Mergington High School API",
    description="Extracurricular activities",
)

app.mount(
    "/static",
    StaticFiles(
        directory=Path(__file__).resolve().parent / "static"
    ),
    name="static",
)

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
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    if activity_name not in activities:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    activity = activities[activity_name]
    email = email.strip().lower()

    if not email or "@" not in email:
        raise HTTPException(
            status_code=422,
            detail="Valid student email required",
        )

    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up for this activity",
        )

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
    if activity_name not in activities:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    activity = activities[activity_name]
    email = email.strip().lower()

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
