import sqlite3
import json
import random
from datetime import datetime, timedelta

DB_NAME = "app_data.db"

def get_schema():
    return """
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        creation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        comment_ids TEXT, 
        app_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS app (
        app_id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        icon TEXT,
        price REAL DEFAULT 0.0,
        rating REAL DEFAULT 0.0,
        downloads INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_apps (
        app_id INTEGER,
        user_id INTEGER,
        PRIMARY KEY (app_id, user_id),
        FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        stars REAL CHECK(stars >= 0 AND stars <= 5),
        comment TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_page (
        app_id INTEGER PRIMARY KEY,
        description TEXT,
        images TEXT,
        last_update DATETIME,
        comment_ids TEXT,
        FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
        tag_id TEXT PRIMARY KEY,
        amount INTEGER DEFAULT 0,
        similar_tag_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS app_tags (
        app_id INTEGER,
        tag_id TEXT,
        PRIMARY KEY (app_id, tag_id),
        FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reported_app_id INTEGER,
        reported_user_id INTEGER,
        reported_comment_id INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reported_app_id) REFERENCES app(app_id) ON DELETE SET NULL,
        FOREIGN KEY (reported_user_id) REFERENCES user(user_id) ON DELETE SET NULL,
        FOREIGN KEY (reported_comment_id) REFERENCES comments(comment_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_reports (
        user_id INTEGER,
        report_ids TEXT,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_reports (
        app_id INTEGER,
        report_ids TEXT,
        PRIMARY KEY (app_id),
        FOREIGN KEY (app_id) REFERENCES app(app_id) ON DELETE CASCADE
    );
    """

def populate_data(cursor):
    print("Populating data...")

    # 1. Create Users
    users = [
        ("alice_wonder",), ("bob_builder",), ("charlie_code",), 
        ("diana_design",), ("evan_engineer",)
    ]
    cursor.executemany("INSERT INTO user (username) VALUES (?)", users)
    print(f"Inserted {len(users)} users.")

    # 2. Create Apps
    apps = [
        ("Super Tasker", "task_icon.png", 0.0),
        ("Mega Game", "game_icon.png", 4.99),
        ("Health Tracker", "health.png", 0.0),
        ("Photo Pro", "lens.png", 2.99),
        ("Budget Buddy", "money.png", 0.0)
    ]
    cursor.executemany("INSERT INTO app (app_name, icon, price) VALUES (?, ?, ?)", apps)
    print(f"Inserted {len(apps)} apps.")

    # 3. Create Tags
    tags = [
        ("productivity", ["utility", "office"]),
        ("game", ["entertainment", "fun"]),
        ("health", ["lifestyle", "fitness"]),
        ("photography", ["art", "design"]),
        ("finance", ["money", "business"])
    ]
    for t_id, similar in tags:
        cursor.execute("INSERT INTO tags (tag_id, similar_tag_ids) VALUES (?, ?)", 
                       (t_id, json.dumps(similar)))
    print(f"Inserted {len(tags)} tags.")

    # 4. Link Apps to Tags (Randomly)
    # Assuming IDs 1-5 for apps based on insertion order
    app_tag_pairs = [
        (1, "productivity"), (2, "game"), (3, "health"), 
        (4, "photography"), (5, "finance")
    ]
    cursor.executemany("INSERT INTO app_tags (app_id, tag_id) VALUES (?, ?)", app_tag_pairs)
    
    # Update tag amounts
    cursor.execute("UPDATE tags SET amount = amount + 1 WHERE tag_id IN (SELECT tag_id FROM app_tags)")

    # 5. Create App Pages (1:1 with Apps)
    for app_id in range(1, 6):
        desc = f"This is the description for App {app_id}."
        images = json.dumps([f"screen_{app_id}_1.jpg", f"screen_{app_id}_2.jpg"])
        cursor.execute("INSERT INTO app_page (app_id, description, images, last_update) VALUES (?, ?, ?, ?)",
                       (app_id, desc, images, datetime.now()))

    # 6. User Installs (user_apps)
    # Randomly assign apps to users
    installs = []
    for uid in range(1, 6):
        # Each user installs 1-3 random apps
        user_app_choices = random.sample(range(1, 6), k=random.randint(1, 3))
        for aid in user_app_choices:
            installs.append((aid, uid))
    
    cursor.executemany("INSERT INTO user_apps (app_id, user_id) VALUES (?, ?)", installs)
    print(f"Inserted {len(installs)} user installs.")

    # 7. Comments
    comments = []
    for uid in range(1, 6):
        # Users comment on apps they installed (simplified logic: just random apps)
        app_id = random.randint(1, 5)
        stars = round(random.uniform(3.5, 5.0), 1)
        txt = f"Great app! I gave it {stars} stars."
        comments.append((app_id, uid, stars, txt))
    
    cursor.executemany("INSERT INTO comments (app_id, user_id, stars, comment) VALUES (?, ?, ?, ?)", comments)
    print(f"Inserted {len(comments)} comments.")

    # 8. Reports
    reports = [
        (2, 1, None, "App crashes on load"), # User 1 reports App 2
        (None, 3, None, "User is spamming comments") # Report against User 3
    ]
    cursor.executemany("INSERT INTO reports (reported_app_id, reported_user_id, reported_comment_id, comment) VALUES (?, ?, ?, ?)", reports)

    # --- UPDATE CACHE FIELDS (The Complex Part) ---
    print("Updating JSON cache fields...")

    # Update user.app_ids (Apps installed by user)
    cursor.execute("SELECT user_id FROM user")
    all_users = cursor.fetchall()
    for (uid,) in all_users:
        cursor.execute("SELECT app_id FROM user_apps WHERE user_id = ?", (uid,))
        app_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE user SET app_ids = ? WHERE user_id = ?", (json.dumps(app_ids), uid))

    # Update user.comment_ids (Comments made by user)
    for (uid,) in all_users:
        cursor.execute("SELECT comment_id FROM comments WHERE user_id = ?", (uid,))
        comment_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE user SET comment_ids = ? WHERE user_id = ?", (json.dumps(comment_ids), uid))

    # Update app_page.comment_ids (Comments on this app)
    cursor.execute("SELECT app_id FROM app")
    all_apps = cursor.fetchall()
    for (aid,) in all_apps:
        cursor.execute("SELECT comment_id FROM comments WHERE app_id = ?", (aid,))
        comment_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE app_page SET comment_ids = ? WHERE app_id = ?", (json.dumps(comment_ids), aid))

    # Update app downloads count
    for (aid,) in all_apps:
        cursor.execute("SELECT COUNT(*) FROM user_apps WHERE app_id = ?", (aid,))
        count = cursor.fetchone()[0]
        cursor.execute("UPDATE app SET downloads = ? WHERE app_id = ?", (count, aid))

    # Update Reports Caches
    # User Reports
    cursor.execute("SELECT reported_user_id, report_id FROM reports WHERE reported_user_id IS NOT NULL")
    user_report_map = {}
    for uid, rid in cursor.fetchall():
        if uid not in user_report_map: user_report_map[uid] = []
        user_report_map[uid].append(rid)
    
    for uid, rids in user_report_map.items():
        cursor.execute("INSERT OR REPLACE INTO user_reports (user_id, report_ids) VALUES (?, ?)", (uid, json.dumps(rids)))

    # App Reports
    cursor.execute("SELECT reported_app_id, report_id FROM reports WHERE reported_app_id IS NOT NULL")
    app_report_map = {}
    for aid, rid in cursor.fetchall():
        if aid not in app_report_map: app_report_map[aid] = []
        app_report_map[aid].append(rid)

    for aid, rids in app_report_map.items():
        cursor.execute("INSERT OR REPLACE INTO app_reports (app_id, report_ids) VALUES (?, ?)", (aid, json.dumps(rids)))

def main():
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Run Schema
        cursor.executescript(get_schema())
        print("Schema created successfully.")
        
        # Populate
        populate_data(cursor)
        
        conn.commit()
        print(f"Database '{DB_NAME}' created and populated successfully!")
        
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
