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

def get_all_apps(limit=20, offset=0, max_price=None, sort_by='downloads', sort_order='desc'):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        query_parts = ["SELECT a.*, (SELECT tag_id FROM app_tags at WHERE at.app_id = a.app_id LIMIT 1) as category FROM app a"]
        params = []
        
        if max_price is not None:
             query_parts.append("WHERE price <= ?")
             params.append(max_price)
             
        # Safe sorting
        allowed_sorts = ['price', 'rating', 'downloads', 'app_name']
        if sort_by not in allowed_sorts:
            sort_by = 'downloads'
        if sort_order.lower() not in ['asc', 'desc']:
            sort_order = 'desc'
            
        query_parts.append(f"ORDER BY {sort_by} {sort_order}")
        
        query_parts.append("LIMIT ? OFFSET ?")
        params.extend([limit, offset])
        
        query = " ".join(query_parts)
        apps = conn.execute(query, params).fetchall()
        
        # Convert to list of dicts
        result = [dict(row) for row in apps]
        return result
    except sqlite3.Error as e:
        print(f"Error fetching apps: {e}")
        return None
    finally:
        conn.close()

def get_apps_by_category(category_tag, limit=20, offset=0, max_price=None, sort_by='downloads', sort_order='desc'):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        base_query = """
            SELECT a.*, (SELECT tag_id FROM app_tags at WHERE at.app_id = a.app_id LIMIT 1) as category
            FROM app a
            JOIN app_tags at ON a.app_id = at.app_id
            WHERE at.tag_id = ?
        """
        params = [category_tag]
        
        if max_price is not None:
            base_query += " AND price <= ?"
            params.append(max_price)
            
        # Safe sorting
        allowed_sorts = ['price', 'rating', 'downloads', 'app_name']
        if sort_by not in allowed_sorts:
            sort_by = 'downloads'
        if sort_order.lower() not in ['asc', 'desc']:
            sort_order = 'desc'
            
        base_query += f" ORDER BY {sort_by} {sort_order}"
            
        base_query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        apps = conn.execute(base_query, params).fetchall()
        return [dict(row) for row in apps]
    except sqlite3.Error as e:
        print(f"Error fetching apps by category: {e}")
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

def search_apps(query_string, category_tag=None, max_price=None, sort_by='downloads', sort_order='desc'):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        if category_tag:
             sql = """
                SELECT a.*, (SELECT tag_id FROM app_tags at WHERE at.app_id = a.app_id LIMIT 1) as category
                FROM app a
                JOIN app_tags at ON a.app_id = at.app_id
                WHERE a.app_name LIKE ? AND at.tag_id = ?
            """
             params = [f'%{query_string}%', category_tag]
        else:
            sql = """
                SELECT a.*, (SELECT tag_id FROM app_tags at WHERE at.app_id = a.app_id LIMIT 1) as category
                FROM app a
                WHERE a.app_name LIKE ?
            """
            params = [f'%{query_string}%']
            
        if max_price is not None:
            sql += " AND price <= ?"
            params.append(max_price)
            
        # Safe sorting
        allowed_sorts = ['price', 'rating', 'downloads', 'app_name']
        if sort_by not in allowed_sorts:
            sort_by = 'downloads'
        if sort_order.lower() not in ['asc', 'desc']:
            sort_order = 'desc'
            
        sql += f" ORDER BY {sort_by} {sort_order}"

        apps = conn.execute(sql, params).fetchall()
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

def remove_download(app_id, user_id):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        # 1. Delete from user_apps
        conn.execute("DELETE FROM user_apps WHERE app_id = ? AND user_id = ?", (app_id, user_id))

        # 3. Update user.app_ids cache
        cursor = conn.cursor()
        cursor.execute("SELECT app_id FROM user_apps WHERE user_id = ?", (user_id,))
        app_ids = [row[0] for row in cursor.fetchall()]
        conn.execute("UPDATE user SET app_ids = ? WHERE user_id = ?", (json.dumps(app_ids), user_id))

        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error removing download: {e}")
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

        # 4. Update app rating
        conn.execute("""
            UPDATE app 
            SET rating = COALESCE((SELECT AVG(stars) FROM comments WHERE app_id = ?), 0)
            WHERE app_id = ?
        """, (app_id, app_id))

        conn.commit()
        return new_comment_id
    except sqlite3.Error as e:
        print(f"Error adding comment: {e}")
        return None
    finally:
        conn.close()

def update_comment(comment_id, user_id, stars, comment_text):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        # Verify ownership and get app_id
        cursor.execute("SELECT user_id, app_id FROM comments WHERE comment_id = ?", (comment_id,))
        row = cursor.fetchone()
        if not row or row['user_id'] != user_id:
            return False # Not found or not owner
            
        app_id = row['app_id']

        cursor.execute(
            "UPDATE comments SET stars = ?, comment = ? WHERE comment_id = ?",
            (stars, comment_text, comment_id)
        )

        # Update app rating
        conn.execute("""
            UPDATE app 
            SET rating = COALESCE((SELECT AVG(stars) FROM comments WHERE app_id = ?), 0)
            WHERE app_id = ?
        """, (app_id, app_id))

        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error updating comment: {e}")
        return False
    finally:
        conn.close()

def delete_comment(comment_id, user_id):
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        # Verify ownership and get app_id for cache update
        cursor.execute("SELECT user_id, app_id FROM comments WHERE comment_id = ?", (comment_id,))
        row = cursor.fetchone()
        if not row or row['user_id'] != user_id:
            return False
            
        app_id = row['app_id']

        # Delete
        cursor.execute("DELETE FROM comments WHERE comment_id = ?", (comment_id,))
        
        # Update caches (app_page and user)
        # 1. App Page
        cursor.execute("SELECT comment_id FROM comments WHERE app_id = ?", (app_id,))
        app_comment_ids = [r[0] for r in cursor.fetchall()]
        conn.execute("UPDATE app_page SET comment_ids = ? WHERE app_id = ?", (json.dumps(app_comment_ids), app_id))

        # 2. User
        cursor.execute("SELECT comment_id FROM comments WHERE user_id = ?", (user_id,))
        user_comment_ids = [r[0] for r in cursor.fetchall()]
        conn.execute("UPDATE user SET comment_ids = ? WHERE user_id = ?", (json.dumps(user_comment_ids), user_id))

        # 3. Update app rating
        conn.execute("""
            UPDATE app 
            SET rating = COALESCE((SELECT AVG(stars) FROM comments WHERE app_id = ?), 0)
            WHERE app_id = ?
        """, (app_id, app_id))

        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error deleting comment: {e}")
        return False
    finally:
        conn.close()
