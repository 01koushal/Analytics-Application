from dotenv import load_dotenv
from pymongo import MongoClient
import os

load_dotenv(override=True)

client = MongoClient(os.getenv("MONGO_URI"))

client.admin.command("ping")

print("CONNECTED")