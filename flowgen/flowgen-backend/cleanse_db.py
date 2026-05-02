import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    print("Connecting to database to run the data cleanser...")
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"), 
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "flowgen_db"), 
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD")
    )
    cursor = conn.cursor()

    # 1. Fix Cross-Team Assignments
    print("1/3 Reassigning tasks to enforce strict manager-employee hierarchy...")
    cursor.execute("""
        UPDATE task_assignments ta 
        SET employee_id = (
            SELECT employee_id 
            FROM employees e 
            WHERE e.manager_id = ta.assigned_by_manager_id 
            ORDER BY random() 
            LIMIT 1
        )
        WHERE ta.assigned_by_manager_id IS NOT NULL;
    """)

    # 2. Fix Due Dates for Active Tasks (Make them due in May/June 2026)
    print("2/3 Shifting Active tasks to realistic future due dates (May/June 2026)...")
    cursor.execute("""
        UPDATE tasks t
        SET due_date = CURRENT_DATE + (estimated_hours / 4 + random() * 20)::int * interval '1 day'
        FROM task_assignments ta
        WHERE t.task_id = ta.task_id AND ta.status != 'completed';
    """)

    # 3. Fix Due Dates for Completed Tasks (Make them strictly in the past)
    print("3/3 Shifting Completed tasks to the recent past to build realistic ML history...")
    cursor.execute("""
        UPDATE tasks t
        SET due_date = CURRENT_DATE - (random() * 30 + 1)::int * interval '1 day'
        FROM task_assignments ta
        WHERE t.task_id = ta.task_id AND ta.status = 'completed';
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Success! Your database logic is now completely repaired and ready for review.")

except Exception as e:
    if conn:
        conn.rollback()
    print(f"Error: {e}")