from datetime import datetime, timezone
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import PyMongoError


load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))
db = client["analytics_db"]
events = db["events"]

VALID_EVENT_TYPES = {"page_view", "click"}


def create_indexes():
    events.create_index([("session_id", ASCENDING)])
    events.create_index([("page_url", ASCENDING)])
    events.create_index([("timestamp", DESCENDING)])


def json_response(payload, status=200):
    return jsonify(payload), status


def parse_timestamp(value):
    if not isinstance(value, str) or not value.strip():
        return datetime.now(timezone.utc).isoformat()

    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("timestamp must be a valid ISO 8601 date string")

    return value


def validate_event(data):
    if not isinstance(data, dict):
        return None, "Request body must be a JSON object"

    session_id = data.get("session_id")
    event_type = data.get("event_type")
    page_url = data.get("page_url")

    if not isinstance(session_id, str) or not session_id.strip():
        return None, "session_id is required"

    if event_type not in VALID_EVENT_TYPES:
        return None, "event_type must be either page_view or click"

    if not isinstance(page_url, str) or not page_url.strip():
        return None, "page_url is required"

    try:
        timestamp = parse_timestamp(data.get("timestamp"))
    except ValueError as error:
        return None, str(error)

    event = {
        "session_id": session_id.strip(),
        "event_type": event_type,
        "page_url": page_url.strip(),
        "timestamp": timestamp,
    }

    if event_type == "click":
        x = data.get("x")
        y = data.get("y")

        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            return None, "x and y coordinates are required for click events"

        event["x"] = round(float(x), 2)
        event["y"] = round(float(y), 2)

    return event, None


def serialize_event(event):
    return {
        "id": str(event["_id"]),
        "session_id": event["session_id"],
        "event_type": event["event_type"],
        "page_url": event["page_url"],
        "timestamp": event["timestamp"],
        "x": event.get("x"),
        "y": event.get("y"),
    }


@app.errorhandler(404)
def not_found(_error):
    return json_response({"success": False, "error": "Route not found"}, 404)


@app.errorhandler(500)
def internal_error(_error):
    return json_response({"success": False, "error": "Internal server error"}, 500)


@app.route("/")
def home():
    return json_response({"success": True, "message": "Analytics Backend Running"})


@app.route("/api/events", methods=["POST"])
def create_event():
    event, error = validate_event(request.get_json(silent=True))

    if error:
        return json_response({"success": False, "error": error}, 400)

    try:
        result = events.insert_one(event)
    except PyMongoError:
        app.logger.exception("Failed to store analytics event")
        return json_response({"success": False, "error": "Failed to store event"}, 500)

    return json_response(
        {
            "success": True,
            "data": {
                "id": str(result.inserted_id),
            },
        },
        201,
    )


@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    pipeline = [
        {
            "$group": {
                "_id": "$session_id",
                "event_count": {"$sum": 1},
                "first_seen": {"$min": "$timestamp"},
                "last_seen": {"$max": "$timestamp"},
            }
        },
        {"$sort": {"last_seen": -1}},
        {
            "$project": {
                "_id": 0,
                "session_id": "$_id",
                "event_count": 1,
                "first_seen": 1,
                "last_seen": 1,
            }
        },
    ]

    try:
        sessions = list(events.aggregate(pipeline))
    except PyMongoError:
        app.logger.exception("Failed to fetch sessions")
        return json_response({"success": False, "error": "Failed to fetch sessions"}, 500)

    return json_response({"success": True, "data": sessions})


@app.route("/api/sessions/<session_id>", methods=["GET"])
def get_session_details(session_id):
    if not session_id.strip():
        return json_response({"success": False, "error": "session_id is required"}, 400)

    try:
        journey = list(
            events.find(
                {"session_id": session_id},
                {"_id": 1, "session_id": 1, "event_type": 1, "page_url": 1, "timestamp": 1, "x": 1, "y": 1},
            ).sort("timestamp", ASCENDING)
        )
    except PyMongoError:
        app.logger.exception("Failed to fetch session details")
        return json_response({"success": False, "error": "Failed to fetch session details"}, 500)

    if not journey:
        return json_response({"success": False, "error": "Session not found"}, 404)

    return json_response({"success": True, "data": [serialize_event(event) for event in journey]})


@app.route("/api/heatmap", methods=["GET"])
def get_heatmap():
    page = request.args.get("page", "").strip()

    if not page:
        return json_response({"success": False, "error": "page query parameter is required"}, 400)

    try:
        clicks = list(
            events.find(
                {"page_url": page, "event_type": "click"},
                {"_id": 0, "session_id": 1, "page_url": 1, "timestamp": 1, "x": 1, "y": 1},
            ).sort("timestamp", ASCENDING)
        )
    except PyMongoError:
        app.logger.exception("Failed to fetch heatmap data")
        return json_response({"success": False, "error": "Failed to fetch heatmap data"}, 500)

    return json_response({"success": True, "data": clicks})


with app.app_context():
    create_indexes()


if __name__ == "__main__":
    app.run(debug=True)
