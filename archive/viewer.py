import sqlite3
import pandas as pd
from flask import Flask, render_template_string

app = Flask(__name__)
DB_NAME = "app_data.db"

# A simple HTML template with Bootstrap for styling
TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Database Viewer</title>
    <!-- Bootstrap CSS for nice tables -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { padding: 20px; background: #f4f6f9; }
        .container { max-width: 1200px; }
        .table-card { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
            margin-bottom: 30px; 
            border: 1px solid #e1e4e8;
        }
        h2 { 
            color: #2c3e50; 
            font-size: 1.5rem;
            margin-bottom: 15px; 
            display: flex;
            align-items: center;
        }
        h2 span {
            background: #e9ecef;
            color: #495057;
            font-size: 0.8rem;
            padding: 4px 8px;
            border-radius: 4px;
            margin-left: 10px;
        }
        /* Custom scrollbar for wide tables */
        .table-responsive::-webkit-scrollbar { height: 8px; }
        .table-responsive::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="mb-4">📂 App Data Visualization</h1>
        
        {% if not tables %}
            <div class="alert alert-warning">No tables found in {{ db_name }}</div>
        {% endif %}

        {% for table_name, table_data in tables.items() %}
        <div class="table-card">
            <h2>
                {{ table_name }} 
                <span>{{ table_data.row_count }} rows</span>
            </h2>
            <div class="table-responsive">
                {{ table_data.html | safe }}
            </div>
        </div>
        {% endfor %}
    </div>
</body>
</html>
"""

def get_db_connection():
    try:
        # uri=True allows read-only mode if needed, but standard is fine here
        conn = sqlite3.connect(DB_NAME)
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

@app.route('/')
def index():
    conn = get_db_connection()
    if not conn:
        return "Error: Could not connect to database. Make sure 'init_db.py' has been run."
    
    # 1. Get list of all tables in the database
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables_info = cursor.fetchall()
    
    tables_data = {}
    
    # 2. Loop through every table and convert to HTML
    for table in tables_info:
        table_name = table[0]
        
        # Skip internal SQLite tables
        if table_name == "sqlite_sequence":
            continue
            
        try:
            # Use Pandas to read the SQL table directly into a DataFrame
            df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
            
            # Generate HTML table with Bootstrap classes
            html_table = df.to_html(
                classes="table table-hover table-striped table-sm table-bordered", 
                index=False, # Don't show the pandas index column
                border=0     # Let Bootstrap handle borders
            )
            
            tables_data[table_name] = {
                'html': html_table,
                'row_count': len(df)
            }
        except Exception as e:
            print(f"Error reading table {table_name}: {e}")
        
    conn.close()
    return render_template_string(TEMPLATE, tables=tables_data, db_name=DB_NAME)

if __name__ == '__main__':
    # Host 0.0.0.0 is required to make the server accessible from outside the Docker container
    print(f"Starting viewer for {DB_NAME}...")
    app.run(debug=True, host='0.0.0.0', port=5000)
