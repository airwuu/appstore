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

def get_all_users():
    conn = get_db_connection()
    if not conn:
        return None
    try:
        users = conn.execute("SELECT user_id, username, app_ids FROM user ORDER BY username").fetchall()
        result = []
        for row in users:
            u = dict(row)
            try:
                u['app_ids'] = json.loads(u['app_ids']) if u['app_ids'] else []
            except json.JSONDecodeError:
                u['app_ids'] = []
            result.append(u)
        return result
    except sqlite3.Error as e:
        print(f"Error fetching users: {e}")
        return None
    finally:
        conn.close()

def record_download(app_id, user_id):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        # 1. Insert into user_apps (ignore if already exists)
        conn.execute("INSERT OR IGNORE INTO user_apps (app_id, user_id) VALUES (?, ?)", (app_id, user_id))
        
        # 2. Update app download count
        conn.execute("""
            UPDATE app 
            SET downloads = (SELECT COUNT(*) FROM user_apps WHERE app_id = ?)
            WHERE app_id = ?
        """, (app_id, app_id))

        # 3. Update user.app_ids cache
        cursor = conn.cursor()
        cursor.execute("SELECT app_id FROM user_apps WHERE user_id = ?", (user_id,))
        app_ids = [row[0] for row in cursor.fetchall()]
        conn.execute("UPDATE user SET app_ids = ? WHERE user_id = ?", (json.dumps(app_ids), user_id))

        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error recording download: {e}")
        return False
    finally:
        conn.close()

def add_comment(app_id, user_id, stars, comment_text):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor()
        # 1. Insert comment
        cursor.execute(
            "INSERT INTO comments (app_id, user_id, stars, comment) VALUES (?, ?, ?, ?)",
            (app_id, user_id, stars, comment_text)
        )
        new_comment_id = cursor.lastrowid

        # 2. Update app_page.comment_ids cache
        cursor.execute("SELECT comment_id FROM comments WHERE app_id = ?", (app_id,))
        app_comment_ids = [row[0] for row in cursor.fetchall()]
        conn.execute("UPDATE app_page SET comment_ids = ? WHERE app_id = ?", (json.dumps(app_comment_ids), app_id))

        # 3. Update user.comment_ids cache
        cursor.execute("SELECT comment_id FROM comments WHERE user_id = ?", (user_id,))
        user_comment_ids = [row[0] for row in cursor.fetchall()]
        conn.execute("UPDATE user SET comment_ids = ? WHERE user_id = ?", (json.dumps(user_comment_ids), user_id))

        conn.commit()
        return new_comment_id
    except sqlite3.Error as e:
        print(f"Error adding comment: {e}")
        return None
    finally:
        conn.close()
