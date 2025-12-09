import sqlite3
import json
import random
import string
from datetime import datetime, timedelta

DB_NAME = "app_data.db"

# --- Helpers for Random Data ---

def random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def get_random_username():
    adjectives = ["Happy", "Grumpy", "Silly", "Super", "Lazy", "Fast", "Cyber", "Mega", "Tiny"]
    nouns = ["Cat", "Dog", "Coder", "Gamer", "Bot", "User", "Pilot", "Chef", "Ninja"]
    return f"{random.choice(adjectives)}_{random.choice(nouns)}_{random.randint(100, 999)}"

def get_random_app_name():
    prefixes = ["Pocket", "Infinite", "Daily", "Pro", "Ultra", "Smart", "Virtual"]
    nouns = ["Tasker", "Weather", "Notes", "Music", "Chat", "Wallet", "Fit", "Cam"]
    return f"{random.choice(prefixes)} {random.choice(nouns)} {random.randint(1, 2024)}"

def random_date(start_year=2023):
    start = datetime(start_year, 1, 1)
    end = datetime.now()
    return start + timedelta(days=random.randint(0, (end - start).days))

# --- Main Seeding Logic ---

def seed_database(num_users=10, num_apps=5):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    print(f"Seeding database with {num_users} users and {num_apps} apps...")

    # 1. Create Users
    new_users = []
    for _ in range(num_users):
        new_users.append((get_random_username(), random_date()))
    
    cursor.executemany("INSERT INTO user (username, creation_date) VALUES (?, ?)", new_users)
    print(f" - Added {len(new_users)} new users.")

    # 2. Create Apps & App Pages (One by one to safely get IDs)
    # We switched from executemany to a loop to ensure we get valid lastrowid
    new_app_ids = []
    
    for _ in range(num_apps):
        # Insert App
        name = get_random_app_name()
        icon = f"{name.lower().replace(' ', '_')}_icon.png"
        price = random.choice([0.0, 0.99, 1.99, 4.99, 9.99])
        
        cursor.execute("INSERT INTO app (app_name, icon, price) VALUES (?, ?, ?)", (name, icon, price))
        new_app_id = cursor.lastrowid # Guaranteed to work with single execute
        new_app_ids.append(new_app_id)
        
        # Insert App Page immediately using the known ID
        desc = f"Auto-generated description for app {new_app_id}. Best app ever!"
        images = json.dumps([f"img_{random_string()}.jpg", f"img_{random_string()}.jpg"])
        
        cursor.execute("INSERT INTO app_page (app_id, description, images, last_update) VALUES (?, ?, ?, ?)",
                       (new_app_id, desc, images, random_date()))
                       
    print(f" - Added {len(new_app_ids)} new apps and pages.")

    # 3. Assign Tags to New Apps
    # Fetch all tag IDs first
    cursor.execute("SELECT tag_id FROM tags")
    existing_tags = [row[0] for row in cursor.fetchall()]
    
    if existing_tags:
        app_tags_data = []
        for app_id in new_app_ids:
            # Assign 1-2 random tags
            chosen_tags = random.sample(existing_tags, k=random.randint(1, min(2, len(existing_tags))))
            for tag in chosen_tags:
                app_tags_data.append((app_id, tag))
        
        cursor.executemany("INSERT OR IGNORE INTO app_tags (app_id, tag_id) VALUES (?, ?)", app_tags_data)

    # 4. Simulate Activity (Installs & Comments)
    # Fetch ALL user IDs and App IDs to create random connections
    cursor.execute("SELECT user_id FROM user")
    all_user_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT app_id FROM app")
    all_app_ids = [row[0] for row in cursor.fetchall()]

    if all_user_ids and all_app_ids:
        # Random Installs
        installs = []
        num_installs = len(all_user_ids) * 2 # Average 2 installs per user
        
        for _ in range(num_installs):
            uid = random.choice(all_user_ids)
            aid = random.choice(all_app_ids)
            installs.append((aid, uid))
            
        cursor.executemany("INSERT OR IGNORE INTO user_apps (app_id, user_id) VALUES (?, ?)", installs)
        print(f" - Simulated {len(installs)} app installs.")

        # Random Comments
        comments = []
        num_comments = int(len(all_user_ids) * 0.5) # 50% of users comment
        
        for _ in range(num_comments):
            uid = random.choice(all_user_ids)
            aid = random.choice(all_app_ids)
            stars = round(random.uniform(1.0, 5.0), 1)
            text = f"Review from {uid}: {random_string(15)}"
            comments.append((aid, uid, stars, text))
            
        cursor.executemany("INSERT INTO comments (app_id, user_id, stars, comment) VALUES (?, ?, ?, ?)", comments)
        print(f" - Added {len(comments)} new comments.")

    conn.commit()
    conn.close()
    
    # 5. Run the Cache Updater
    update_caches()

def update_caches():
    print("Updating JSON cache fields for entire database...")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # 1. Update user.app_ids
    cursor.execute("SELECT user_id FROM user")
    users = cursor.fetchall()
    for (uid,) in users:
        cursor.execute("SELECT app_id FROM user_apps WHERE user_id = ?", (uid,))
        app_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE user SET app_ids = ? WHERE user_id = ?", (json.dumps(app_ids), uid))

    # 2. Update user.comment_ids
    for (uid,) in users:
        cursor.execute("SELECT comment_id FROM comments WHERE user_id = ?", (uid,))
        comment_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE user SET comment_ids = ? WHERE user_id = ?", (json.dumps(comment_ids), uid))

    # 3. Update app_page.comment_ids & app.downloads
    cursor.execute("SELECT app_id FROM app")
    apps = cursor.fetchall()
    for (aid,) in apps:
        # Comments
        cursor.execute("SELECT comment_id FROM comments WHERE app_id = ?", (aid,))
        comment_ids = [row[0] for row in cursor.fetchall()]
        cursor.execute("UPDATE app_page SET comment_ids = ? WHERE app_id = ?", (json.dumps(comment_ids), aid))
        
        # Downloads
        cursor.execute("SELECT COUNT(*) FROM user_apps WHERE app_id = ?", (aid,))
        count = cursor.fetchone()[0]
        cursor.execute("UPDATE app SET downloads = ? WHERE app_id = ?", (count, aid))

    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    seed_database()
