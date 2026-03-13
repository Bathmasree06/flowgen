import random
from datetime import datetime, timedelta
import psycopg2

# =============================
# CONFIG (change password)
# =============================
DB_CONFIG = {
    "dbname": "flowgen_db",
    "user": "postgres",
    "password": "Bathu@123",  # ✅ CHANGE THIS
    "host": "127.0.0.1",
    "port": 5432
}
print("Using DB_CONFIG:", DB_CONFIG)

random.seed(42)

# =============================
# GLOBAL NAME POOL (less repetition)
# =============================
FIRST_NAMES = [
    # Indian
    "Aarav","Vihaan","Vivaan","Aditya","Arjun","Karthik","Krishna","Rahul","Rohan","Siddharth",
    "Ishaan","Naveen","Pranav","Varun","Surya","Harish","Ajay","Manoj","Kiran","Akash",
    "Ananya","Aishwarya","Priya","Meera","Nithya","Kavya","Divya","Sneha","Lakshmi","Deepika",
    "Shreya","Swathi","Keerthi","Revathi","Aditi","Sanya","Riya","Pooja","Ira","Madhu",

    # Western
    "James","Oliver","Liam","Noah","Ethan","Mason","Lucas","Henry","Jack","Leo",
    "Emma","Sophia","Isabella","Mia","Charlotte","Amelia","Harper","Ella","Ava","Grace",

    # European
    "Luca","Matteo","Giulia","Elena","Sofia","Nina","Jonas","Marek","Anika","Leonie",
    "Hugo","Arthur","Clara","Louise","Theo","Marta","Inez","Freya","Ida","Erik",

    # East Asian
    "Hiroshi","Yuki","Sora","Ren","Kaito","Haruto","Aiko","Hana","Mei","Yuna",
    "Minho","Jisoo","Seojun","Yejin","Jiwoo","Yujin","Chen","Wei","Jia","Tao"
]

LAST_NAMES = [
    # Indian
    "Sharma","Iyer","Kumar","Reddy","Menon","Patel","Das","Nair","Gupta","Singh",
    "Shah","Joshi","Jain","Rao","Bhat","Verma","Mishra","Srinivasan","Kulkarni","Chatterjee",

    # Western
    "Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin",

    # European
    "Muller","Schmidt","Dubois","Moreau","Rossi","Ferrari","Bianchi","Kowalski","Novak","Horvat",

    # East Asian
    "Tanaka","Suzuki","Sato","Nakamura","Kim","Park","Lee","Choi","Wang","Zhang"
]

def generate_unique_names(n=1000):
    """
    Generates fully unique names using combinations.
    Guarantees no duplicates by using a set.
    If collisions happen, adds middle initial / numeric tag.
    """
    used = set()
    names = []

    while len(names) < n:
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"

        # Resolve collisions
        if name in used:
            mid = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
            name = f"{first} {mid}. {last}"

        # Still collision? add small numeric suffix
        if name in used:
            name = f"{name} {random.randint(1, 99)}"

        if name not in used:
            used.add(name)
            names.append(name)

    return names

# =============================
# Company structure (includes Maintenance)
# =============================
DIVISIONS = [
    "Product Engineering",
    "Platform Engineering",
    "Data & AI",
    "Cloud & DevOps",
    "Security & Compliance",
    "Quality Assurance",
    "Maintenance & Support"
]

# Primary skills should match what your company does
PRIMARY_SKILLS = [
    "Frontend",
    "Backend",
    "Mobile",
    "QA",
    "DevOps",
    "Data",
    "ML",
    "Security",
    "Maintenance"
]

TEAM_MAP = {
    "Product Engineering": ["Frontend", "Backend", "Mobile"],
    "Platform Engineering": ["Backend", "DevOps"],
    "Data & AI": ["Data", "ML"],
    "Cloud & DevOps": ["DevOps"],
    "Security & Compliance": ["Security", "Backend"],
    "Quality Assurance": ["QA"],
    "Maintenance & Support": ["Maintenance"]
}

# Task types + templates (realistic corporate work)
TASK_LIBRARY = {
    "Frontend": {
        "types": ["UI Feature", "UI Bug Fix", "Dashboard Enhancement", "Accessibility Fix"],
        "titles": [
            "Implement responsive dashboard layout",
            "Fix alignment issues in task table",
            "Create sidebar navigation component",
            "Improve empty state UX in tasks module",
            "Add filters and sorting to task view",
            "Fix login page validation errors",
            "Optimize UI for mobile view"
        ]
    },
    "Backend": {
        "types": ["API Development", "Bug Fix", "Database Integration", "Performance Improvement"],
        "titles": [
            "Build API for manager task listing",
            "Create employee task status update endpoint",
            "Fix API response format issues",
            "Optimize query for tasks and assignments",
            "Implement secure login authentication API",
            "Add pagination to tasks endpoint"
        ]
    },
    "Mobile": {
        "types": ["Mobile UI", "Mobile Bug Fix", "Navigation Integration"],
        "titles": [
            "Build employee task update screen for mobile",
            "Fix mobile layout issues in login flow",
            "Implement role selection navigation on mobile app"
        ]
    },
    "QA": {
        "types": ["Manual Testing", "Automation Testing", "Regression Testing"],
        "titles": [
            "Write test cases for login & routing",
            "Perform regression testing for dashboard flows",
            "Test API endpoints for task allocation",
            "Create bug report for failed allocations"
        ]
    },
    "DevOps": {
        "types": ["CI/CD", "Deployment", "Monitoring Setup", "Infrastructure Fix"],
        "titles": [
            "Setup CI/CD pipeline for Flowgen backend",
            "Dockerize PostgreSQL + backend services",
            "Configure monitoring for API health endpoints",
            "Fix deployment configuration for database connection"
        ]
    },
    "Data": {
        "types": ["ETL", "Analytics Report", "Data Cleanup"],
        "titles": [
            "Generate weekly workload analytics dataset",
            "Clean task completion history records",
            "Create reporting view for task risk analysis",
            "Prepare dataset for ML training pipeline"
        ]
    },
    "ML": {
        "types": ["Model Training", "Feature Engineering", "Model Evaluation"],
        "titles": [
            "Train completion delay risk prediction model",
            "Build feature set from tasks and assignments",
            "Evaluate model accuracy and confusion matrix",
            "Tune risk thresholds for manager dashboard"
        ]
    },
    "Security": {
        "types": ["Auth Hardening", "Security Fix", "Access Control"],
        "titles": [
            "Implement role-based access checks for APIs",
            "Secure password storage using hashing strategy",
            "Add audit logs for task allocation updates",
            "Fix vulnerable endpoints lacking validation"
        ]
    },
    "Maintenance": {
        "types": ["Incident Fix", "Hotfix", "Support Ticket", "Bug Triage"],
        "titles": [
            "Resolve urgent production bug in task allocation",
            "Apply hotfix for login failure issue",
            "Investigate performance slowdown reports",
            "Close pending support tickets related to task updates",
            "Triage bug backlog and assign severity"
        ]
    }
}

PRIORITIES = ["Low", "Medium", "High"]
DESIGNATIONS = ["Junior Engineer", "Software Engineer", "Senior Engineer", "Lead Engineer"]
EXP_LEVELS = ["Beginner", "Intermediate", "Advanced"]

def create_connection():
    return psycopg2.connect(**DB_CONFIG)

def insert_managers(cur, count=100):
    managers = []
    manager_names = generate_unique_names(count)

    for i in range(1, count + 1):
        mid = f"MGR{i:04d}"
        name = manager_names[i - 1]
        division = random.choice(DIVISIONS)
        team_skill = random.choice(TEAM_MAP[division])
        team_name = f"{division} - {team_skill}"

        email = f"{mid.lower()}@flowgen.com"
        password = f"mgr{i:04d}@123"
        managers.append((mid, name, team_name, email, password))

    cur.executemany("""
        INSERT INTO managers (manager_id, name, team_name, email, password)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (manager_id) DO NOTHING
    """, managers)

def insert_employees(cur, count=1000):
    employees = []
    employee_names = generate_unique_names(count)

    for i in range(1, count + 1):
        eid = f"EMP{i:04d}"
        name = employee_names[i - 1]

        designation = random.choices(DESIGNATIONS, weights=[4, 6, 3, 1])[0]
        exp_level = random.choices(EXP_LEVELS, weights=[4, 5, 3])[0]

        primary_skill = random.choice(PRIMARY_SKILLS)

        hourly_rate = random.choice([180, 220, 260, 320, 380, 450])
        weekly_capacity = random.choice([30, 35, 40, 45])

        email = f"{eid.lower()}@flowgen.com"
        password = f"emp{i:04d}@123"

        manager_id = f"MGR{random.randint(1, 100):04d}"

        employees.append((
            eid, name, designation, primary_skill, exp_level,
            hourly_rate, weekly_capacity, email, password, manager_id
        ))

    cur.executemany("""
        INSERT INTO employees (
            employee_id, name, designation, primary_skill, experience_level,
            hourly_rate, weekly_capacity, email, password, manager_id
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (employee_id) DO NOTHING
    """, employees)

def estimate_hours(required_skill, task_type, priority):
    base = random.randint(2, 8)

    if required_skill in ["DevOps", "ML", "Security", "Data"]:
        base += random.randint(2, 6)
    if task_type in ["Incident Fix", "Hotfix"]:
        base += random.randint(1, 3)

    if priority == "High":
        base += random.randint(2, 4)
    elif priority == "Medium":
        base += random.randint(0, 2)

    return max(1, base)

def insert_tasks_and_assignments(cur, task_count=2500):
    # Fetch manager team_name
    cur.execute("SELECT manager_id, team_name FROM managers;")
    manager_rows = cur.fetchall()

    # Fetch employees
    cur.execute("SELECT employee_id, primary_skill, weekly_capacity FROM employees;")
    employee_rows = cur.fetchall()

    # Workload map (simple simulation)
    employee_workload = {e[0]: 0 for e in employee_rows}

    tasks = []
    assignments = []

    for i in range(1, task_count + 1):
        tid = f"T{i:05d}"

        manager_id, manager_team = random.choice(manager_rows)

        # Determine dominant skill from manager team string
        team_skill = manager_team.split(" - ")[-1].strip()

        # Use team skill to bias required_skill, but allow some variation
        if team_skill in PRIMARY_SKILLS and random.random() < 0.75:
            required_skill = team_skill
        else:
            required_skill = random.choice(PRIMARY_SKILLS)

        # Choose task type + title
        task_type = random.choice(TASK_LIBRARY[required_skill]["types"])
        title_base = random.choice(TASK_LIBRARY[required_skill]["titles"])
        title = f"{title_base} ({tid})"

        priority = random.choices(PRIORITIES, weights=[3, 5, 2])[0]
        est = estimate_hours(required_skill, task_type, priority)

        created_at = datetime.now() - timedelta(days=random.randint(1, 90))
        due_days = random.randint(3, 15)
        due_date = (created_at + timedelta(days=due_days)).date()

        tasks.append((tid, title, task_type, required_skill, priority, est, due_date, manager_id))

        # Employee selection: 85% match skill
        matching_emps = [e for e in employee_rows if e[1] == required_skill]
        if matching_emps and random.random() < 0.85:
            chosen = random.choice(matching_emps)
        else:
            chosen = random.choice(employee_rows)

        employee_id, emp_skill, weekly_capacity = chosen

        allocation_type = random.choices(["Manual", "Auto"], weights=[6, 4])[0]
        allocation_score = round(random.uniform(70, 99), 2) if allocation_type == "Auto" else None

        # Completion simulation
        completed = random.random() < 0.62

        status = "To Do"
        completed_at = None
        actual_hours = None
        on_time = None

        overload_ratio = employee_workload[employee_id] / max(1, weekly_capacity)

        if completed:
            status = random.choices(["Done", "In Progress"], weights=[85, 15])[0]

            # Actual hours depends on estimate + overload + mismatch penalty
            noise = random.randint(-2, 6)

            mismatch_penalty = 0
            if emp_skill != required_skill:
                mismatch_penalty = random.randint(1, 5)

            overload_penalty = int(overload_ratio * random.randint(1, 6))

            actual_hours = max(1, est + noise + mismatch_penalty + overload_penalty)

            delay_risk = 0.18
            if priority == "High":
                delay_risk += 0.18
            if overload_ratio > 0.85:
                delay_risk += 0.25
            if emp_skill != required_skill:
                delay_risk += 0.22
            if actual_hours > est + 3:
                delay_risk += 0.10

            late = random.random() < delay_risk

            if late:
                completed_at = created_at + timedelta(days=due_days + random.randint(1, 7))
                on_time = False
            else:
                completed_at = created_at + timedelta(days=random.randint(1, due_days))
                on_time = True

        # Update workload
        employee_workload[employee_id] += est

        assignments.append((
            tid, employee_id, manager_id, allocation_type, allocation_score,
            status, completed_at, actual_hours, on_time
        ))

    # Insert into tasks table
    cur.executemany("""
        INSERT INTO tasks (
            task_id, title, task_type, required_skill, priority,
            estimated_hours, due_date, created_by_manager_id
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (task_id) DO NOTHING
    """, tasks)

    # Insert into assignments
    cur.executemany("""
        INSERT INTO task_assignments (
            task_id, employee_id, assigned_by_manager_id, allocation_type,
            allocation_score, status, completed_at, actual_hours, on_time
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, assignments)

def main():
    conn = create_connection()
    cur = conn.cursor()

    print("✅ Seeding managers (100)...")
    insert_managers(cur, 100)

    print("✅ Seeding employees (1000)...")
    insert_employees(cur, 1000)

    print("✅ Seeding tasks + assignments (2500)...")
    insert_tasks_and_assignments(cur, 2500)

    conn.commit()
    cur.close()
    conn.close()

    print("\n🎉 DONE! Flowgen dataset seeded successfully:")
    print(" - 100 managers (unique names)")
    print(" - 1000 employees (unique names)")
    print(" - 2500 tasks with realistic domains & types")
    print(" - 2500 assignments with completion outcome + on_time label")

if __name__ == "__main__":
    main()
