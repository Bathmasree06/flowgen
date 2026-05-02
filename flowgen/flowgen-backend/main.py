from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db_connection
from psycopg2.extras import RealDictCursor
from typing import Union
import datetime
import joblib
import pandas as pd

# --- LOAD MACHINE LEARNING MODEL ---
try:
    allocation_model = joblib.load('flowgen_allocation_model.joblib')
    print("✅ ML Model loaded successfully into FastAPI!")
except Exception as e:
    allocation_model = None
    print(f"⚠️ Warning: ML model not found. Using fallback. Error: {e}")

app = FastAPI(title="Flowgen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    employee_id: str
    password: str

class TaskUpdateRequest(BaseModel):
    employee_id: str
    actual_hours: Union[int, float]
    status: str

class TaskCreateRequest(BaseModel):
    title: str
    task_type: str
    required_skill: str
    priority: str
    estimated_hours: float
    due_date: str
    created_by_manager_id: str

class RecommendationRequest(BaseModel):
    required_skill: str
    estimated_hours: float

class TaskAssignRequest(BaseModel):
    task_id: int
    employee_id: str
    assigned_by_manager_id: str

@app.get("/")
def read_root():
    return {"status": "success", "message": "Flowgen backend is running"}

@app.get("/api/test-db")
def test_db_connection():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT COUNT(*) FROM employees;")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return {"status": "success", "employee_count": result['count']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.post("/api/login")
def login(request: LoginRequest):
    try:
        conn = get_db_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Check the employees table first
        cursor.execute("SELECT * FROM employees WHERE employee_id = %s", (request.employee_id,))
        user = cursor.fetchone()
        role = "employee"
        
        # 2. If not found, check the managers table
        if not user:
            cursor.execute("SELECT * FROM managers WHERE manager_id = %s", (request.employee_id,))
            user = cursor.fetchone()
            role = "manager"
            
        cursor.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    # 3. Validate user credentials
    if not user:
        raise HTTPException(status_code=401, detail="Invalid ID: User not found in system")
    
    db_password = user.get('password_hash') or user.get('password')
    if db_password != request.password:
        raise HTTPException(status_code=401, detail="Invalid Password")

    # 4. Standardize the data payload for the React frontend
    # Because the tables have slightly different column names (employee_id vs manager_id)
    user_id = user.get('employee_id') or user.get('manager_id')
    designation = user.get('designation') or user.get('team_name', 'Management')

    return {
        "status": "success",
        "message": "Authentication successful",
        "data": {
            "employee_id": user_id, # React relies on this key name
            "name": user.get('name', ''),
            "email": user.get('email', ''),
            "designation": designation,
            "primary_skill": user.get('primary_skill', 'Leadership'),
            "experience_level": user.get('experience_level', 'Senior'),
            "manager_id": user.get('manager_id', ''),
            "weekly_capacity": user.get('weekly_capacity', 40),
            "status": user.get('status', 'active'),
            "role": role
        }
    }
    

@app.get("/api/employees/{employee_id}/tasks")
def get_employee_tasks(employee_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT t.task_id, t.title, t.task_type, t.priority, t.due_date, t.estimated_hours,
                   a.status, a.allocation_type, a.actual_hours 
            FROM tasks t
            JOIN task_assignments a ON t.task_id = a.task_id
            WHERE a.employee_id = %s
            ORDER BY t.due_date ASC;
        """
        cursor.execute(query, (employee_id,))
        tasks = cursor.fetchall()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "Tasks retrieved successfully", "data": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.put("/api/tasks/{task_id}/update")
def update_task(task_id: str, request: TaskUpdateRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE task_assignments 
            SET actual_hours = %s, status = %s 
            WHERE task_id = %s AND employee_id = %s
        """, (request.actual_hours, request.status, task_id, request.employee_id))
        
        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
            
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "Task updated successfully"}
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

@app.get("/api/managers/{manager_id}/team")
def get_manager_team(manager_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch all employees who report to this specific manager
        query = """
            SELECT employee_id, name, designation, primary_skill, 
                   experience_level, weekly_capacity, status 
            FROM employees 
            WHERE manager_id = %s
            ORDER BY name ASC;
        """
        cursor.execute(query, (manager_id,))
        team = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "message": "Team retrieved successfully",
            "data": team
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.get("/api/managers/{manager_id}/tasks")
def get_manager_tasks(manager_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch all tasks assigned by this manager, including who is working on them
        query = """
            SELECT t.task_id, t.title, t.task_type, t.priority, t.due_date, t.estimated_hours,
                   a.status, a.actual_hours, a.employee_id, e.name as employee_name
            FROM tasks t
            JOIN task_assignments a ON t.task_id = a.task_id
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE a.assigned_by_manager_id = %s
            ORDER BY t.due_date ASC;
        """
        cursor.execute(query, (manager_id,))
        tasks = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "message": "Manager tasks retrieved successfully",
            "data": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

@app.post("/api/managers/{manager_id}/recommendations")
def get_recommendations(manager_id: str, request: RecommendationRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. ISOLATION RULE: Fetch ONLY employees reporting to this manager
        cursor.execute("""
            SELECT employee_id, name, primary_skill, experience_level, weekly_capacity 
            FROM employees WHERE manager_id = %s
        """, (manager_id,))
        team = cursor.fetchall()
        
        # If the manager has no team, return empty
        if not team:
            return {"status": "success", "data": []}
            
        recommendations = []
        
        for emp in team:
            # 2. Calculate current workload for this employee
            cursor.execute("""
                SELECT SUM(t.estimated_hours) as total_assigned
                FROM tasks t
                JOIN task_assignments a ON t.task_id = a.task_id
                WHERE a.employee_id = %s AND a.status != 'completed'
            """, (emp['employee_id'],))
            workload_result = cursor.fetchone()
            current_workload = workload_result['total_assigned'] if workload_result['total_assigned'] else 0
            
            weekly_cap = emp['weekly_capacity'] if emp['weekly_capacity'] else 40
            available_capacity = weekly_cap - current_workload
            
            score = 0
            reasons = []
            
            # --- 3. INTELLIGENT ML SCORING ALGORITHM ---
            if allocation_model:
                # Prepare data for model: ['estimated_hours', 'skill_match', 'exp_num', 'pri_num']
                skill_match = 1 if str(emp['primary_skill']).lower() == str(request.required_skill).lower() else 0
                
                exp_map = {'Junior': 1, 'Mid-Level': 2, 'Senior': 3, 'Lead': 4}
                exp_num = exp_map.get(emp['experience_level'], 2)
                pri_num = 2 # Default priority to medium for capacity testing
                
                # Predict probability of success
                features = pd.DataFrame([[request.estimated_hours, skill_match, exp_num, pri_num]], 
                                        columns=['estimated_hours', 'skill_match', 'exp_num', 'pri_num'])
                
                success_prob = allocation_model.predict_proba(features)[0][1] 
                score = int(success_prob * 100)
                
                # Generate human-readable reasons based on AI output
                if score >= 80:
                    reasons.append("ML Predicts High Success")
                elif score >= 50:
                    reasons.append("ML Predicts Moderate Success")
                else:
                    reasons.append("ML Predicts Risk of Delay")
                    
                if skill_match == 1: reasons.append("Exact Skill Match")
                
                # Safety override: Penalize if they don't have enough weekly hours
                if available_capacity < request.estimated_hours:
                    score -= 20
                    reasons.append("Warning: Over Capacity")
            else:
                # Fallback rule-based heuristic if ML fails
                if str(emp['primary_skill']).lower() == str(request.required_skill).lower():
                    score += 60
                    reasons.append("Exact skill match")
                if available_capacity >= request.estimated_hours:
                    score += 40
                    reasons.append("Has capacity")
                
            recommendations.append({
                "employee_id": emp['employee_id'],
                "name": emp['name'],
                "match_score": max(0, min(100, score)), # Ensure score never goes below 0 or above 100
                "reason": " • ".join(reasons) if reasons else "Available",
                "available_capacity": available_capacity
            })
            
        cursor.close()
        conn.close()
        
        # Sort by highest score first and return top 3
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            "status": "success",
            "data": recommendations[:3] 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine failed: {str(e)}")

import random # Ensure this is at the top of your file if it isn't already

@app.post("/api/tasks/create-and-assign")
def create_and_assign_task(request: dict):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # FIX: Generate a custom task ID like 'T49281'
        new_task_id = f"T{random.randint(10000, 99999)}"
        
        # 1. Insert Task WITH the generated task_id
        cursor.execute("""
            INSERT INTO tasks (task_id, title, task_type, required_skill, priority, estimated_hours, due_date, created_by_manager_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING task_id;
        """, (new_task_id, request['title'], request['task_type'], request['required_skill'], request['priority'], 
              float(request['estimated_hours']), request['due_date'], request['created_by_manager_id']))
        
        inserted_task_id = cursor.fetchone()['task_id']
        
        # 2. Insert Assignment
        cursor.execute("""
            INSERT INTO task_assignments (task_id, employee_id, assigned_by_manager_id, allocation_type, status)
            VALUES (%s, %s, %s, %s, 'to_do');
        """, (inserted_task_id, request['assigned_employee_id'], request['created_by_manager_id'], 'algorithmic'))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Task created and assigned successfully"}
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"🔥 DATABASE ERROR ON ASSIGNMENT: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")