import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# This automatically finds your .env file and loads the variables
load_dotenv()

def get_db_connection():
    try:
        # Notice how we use the variable NAMES here, not the actual passwords
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None