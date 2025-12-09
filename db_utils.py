import sqlite3
import json

DB_NAME = "app_data.db"

def get_db_connection():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row  # Access columns by name
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def get_all_apps(limit=20, offset=0):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        # Join with app_page to get description/images if needed for card, but basic info is in 'app'
        # Let's return basic info for the list
        query = "SELECT * FROM app LIMIT ? OFFSET ?"
        apps = conn.execute(query, (limit, offset)).fetchall()
        
        # Convert to list of dicts
        result = [dict(row) for row in apps]
        return result
    except sqlite3.Error as e:
        print(f"Error fetching apps: {e}")
        return None
    finally:
        conn.close()

def get_app_details(app_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        # Fetch basic app info
        app_query = "SELECT * FROM app WHERE app_id = ?"
        app = conn.execute(app_query, (app_id,)).fetchone()
        
        if not app:
            return None
            
        # Fetch page details
        page_query = "SELECT * FROM app_page WHERE app_id = ?"
        page = conn.execute(page_query, (app_id,)).fetchone()
        
        # Fetch tags
        tags_query = """
            SELECT t.tag_id 
            FROM tags t
            JOIN app_tags at ON t.tag_id = at.tag_id
            WHERE at.app_id = ?
        """
        tags = conn.execute(tags_query, (app_id,)).fetchall()
        tag_list = [row['tag_id'] for row in tags]

        # Fetch comments (limit 5 for now)
        comments_query = """
            SELECT c.*, u.username 
            FROM comments c
            JOIN user u ON c.user_id = u.user_id
            WHERE c.app_id = ?
            ORDER BY c.date DESC
            LIMIT 5
        """
        comments = conn.execute(comments_query, (app_id,)).fetchall()
        comment_list = [dict(row) for row in comments]

        result = dict(app)
        if page:
            result.update(dict(page))
            # Parse images JSON if it exists
            if 'images' in result and result['images']:
                try:
                    result['images'] = json.loads(result['images'])
                except json.JSONDecodeError:
                    result['images'] = []
        
        result['tags'] = tag_list
        result['comments'] = comment_list
        
        return result
    except sqlite3.Error as e:
        print(f"Error fetching app details: {e}")
        return None
    finally:
        conn.close()

def search_apps(query_string):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        sql = "SELECT * FROM app WHERE app_name LIKE ?"
        apps = conn.execute(sql, (f'%{query_string}%',)).fetchall()
        return [dict(row) for row in apps]
    except sqlite3.Error as e:
        print(f"Error searching apps: {e}")
        return None
    finally:
        conn.close()

def get_categories():
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        sql = "SELECT * FROM tags"
        tags = conn.execute(sql).fetchall()
        return [dict(row) for row in tags]
    except sqlite3.Error as e:
        print(f"Error fetching categories: {e}")
        return None
    finally:
        conn.close()
