from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db_connection
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Flowgen API")

# Configure CORS so React can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the structure of the incoming login request
class LoginRequest(BaseModel):
    employee_id: str
    password: str

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
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch the user by employee_id
        cursor.execute("SELECT * FROM employees WHERE employee_id = %s", (request.employee_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        # Check if user exists
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Employee ID")
        
        # Check password (adjust 'password_hash' if your database column is named differently, like 'password')
        db_password = user.get('password_hash') or user.get('password')
        if db_password != request.password:
            raise HTTPException(status_code=401, detail="Invalid Password")

        # Determine role based on designation for single-login architecture
        designation = str(user.get('designation', '')).lower()
        
        # Assuming managers have specific keywords in their designation. 
        # Adjust these keywords based on your seeder data (e.g., 'manager', 'director', 'lead')
        is_manager = "manager" in designation or "director" in designation or "lead" in designation
        
        role = "manager" if is_manager else "employee"

        return {
            "status": "success",
            "message": "Authentication successful",
            "data": {
                "employee_id": user['employee_id'],
                "designation": user['designation'],
                "role": role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")