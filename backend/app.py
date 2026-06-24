from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

client = MongoClient(os.getenv("MONGO_URI"))

db = client["analytics_db"]
events = db["events"]

@app.route("/")
def home():
    return {"message": "Analytics Backend Running"}
@app.route("/api/events", methods=["POST"])
def create_event():

    data = request.json

    events.insert_one(data)

    return jsonify({
        "success": True
    })

@app.route("/api/sessions")
def get_sessions():

    pipeline = [
        {
            "$group": {
                "_id": "$session_id",
                "event_count": {"$sum": 1}
            }
        },
        {
            "$sort": {
                "event_count": -1
            }
        }
    ]

    result = list(events.aggregate(pipeline))

    return jsonify(result)


@app.route("/api/heatmap")
def heatmap():

    page = request.args.get("page")

    data = list(
        events.find(
            {
                "page_url": page,
                "event_type": "click"
            },
            {
                "_id": 0
            }
        )
    )

    return jsonify(data)
if __name__ == "__main__":
    app.run(debug=True)