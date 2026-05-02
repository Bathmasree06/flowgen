import os
import pandas as pd
import psycopg2
from sklearn.ensemble import RandomForestClassifier
import joblib
from dotenv import load_dotenv

# Load database credentials from your backend .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'flowgen-backend', '.env')
load_dotenv(dotenv_path)

print("Connecting to PostgreSQL database...")
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"), 
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"), 
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

# Fetch historical completed tasks
print("Fetching historical task data...")
query = """
    SELECT 
        t.estimated_hours, t.required_skill, t.priority,
        e.primary_skill, e.experience_level, e.weekly_capacity,
        a.on_time
    FROM task_assignments a
    JOIN tasks t ON a.task_id = t.task_id
    JOIN employees e ON a.employee_id = e.employee_id
    WHERE a.status = 'completed';
"""
df = pd.read_sql(query, conn)
conn.close()

if df.empty:
    print("Error: No completed tasks found in database to train the model.")
    exit()

print(f"Data loaded successfully. Training on {len(df)} records.")

# --- FEATURE ENGINEERING ---
# 1. Create a binary feature: Do the required task skills match the employee's primary skill?
df['skill_match'] = (df['required_skill'] == df['primary_skill']).astype(int)

# 2. Convert text experience levels to numbers
exp_map = {'Junior': 1, 'Mid-Level': 2, 'Senior': 3, 'Lead': 4}
df['exp_num'] = df['experience_level'].map(exp_map).fillna(2) 

# 3. Convert text priority to numbers
pri_map = {'low': 1, 'medium': 2, 'high': 3}
df['pri_num'] = df['priority'].map(pri_map).fillna(2)

# --- DEFINE X (Features) and Y (Target) ---
X = df[['estimated_hours', 'skill_match', 'exp_num', 'pri_num']]
y = df['on_time'].astype(int)

# --- TRAIN THE MODEL ---
print("Training Random Forest Classifier...")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)

# --- EXPORT THE MODEL ---
joblib.dump(clf, '../flowgen-backend/flowgen_allocation_model.joblib')
print("✅ Success! Model trained and saved to flowgen-backend/flowgen_allocation_model.joblib")