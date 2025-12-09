import sqlite3
import db_utils
import json
import random
import string
from datetime import datetime, timedelta

DB_NAME = "app_data.db"
def adapt_datetime_iso(val):
    """Adapt datetime.datetime objects to ISO 8601 date strings."""
    return val.isoformat().encode('utf-8')

sqlite3.register_adapter(datetime, adapt_datetime_iso)
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
    
    # Fetch all user IDs (including new ones) to assign as developers
    cursor.execute("SELECT user_id FROM user")
    all_user_ids = [row[0] for row in cursor.fetchall()]

    # 2. Create Apps & App Pages (One by one to safely get IDs)
    # We switched from executemany to a loop to ensure we get valid lastrowid
    new_app_ids = []
    
    for _ in range(num_apps):
        # Insert App
        name = get_random_app_name()
        icon = f"{name.lower().replace(' ', '_')}_icon.png"
        price = random.choice([0.0, 0.99, 1.99, 4.99, 9.99])
        developer_id = random.choice(all_user_ids) if all_user_ids else None
        
        cursor.execute("INSERT INTO app (app_name, icon, price, developer_id) VALUES (?, ?, ?, ?)", (name, icon, price, developer_id))
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

    # COMMIT basic data so db_utils can see it
    conn.commit()
    conn.close() 

    # 4. Simulate Activity using db_utils (Handles caching & logic)
    print(" - Simulating activity via db_utils...")

    # Re-fetch IDs using new connections implicitly or just use what we have? 
    # db_utils functions take IDs. We need valid IDs.
    # We can use the IDs we just created, but we need ALL IDs if we want to mix with existing data.
    # Let's fetch all IDs like before using a temp connection or db_utils?
    # db_utils doesn't have "get_all_ids". Let's use sqlite briefly or trust the loop variables?
    # The original script fetched ALL users/apps (including old ones). Let's stick to that.
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM user")
    all_user_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute("SELECT app_id FROM app")
    all_app_ids = [row[0] for row in cursor.fetchall()]
    conn.close()

    if all_user_ids and all_app_ids:
        # Random Installs
        num_installs = len(all_user_ids) * 2
        count_installs = 0
        for _ in range(num_installs):
            uid = random.choice(all_user_ids)
            aid = random.choice(all_app_ids)
            if db_utils.record_download(aid, uid):
                count_installs += 1
        print(f" - Recorded {count_installs} app downloads.")

        # Random Comments
        num_comments = int(len(all_user_ids) * 0.5)
        count_comments = 0
        for _ in range(num_comments):
            uid = random.choice(all_user_ids)
            aid = random.choice(all_app_ids)
            stars = round(random.uniform(1.0, 5.0), 1)
            text = f"Review from {uid}: {random_string(15)}"
            if db_utils.add_comment(aid, uid, stars, text):
                count_comments += 1
                count_comments += 1
        print(f" - Added {count_comments} comments.")

        # Random Comment Reporting
        # Need to fetch comment IDs first
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("SELECT comment_id FROM comments")
        all_comment_ids = [row[0] for row in cursor.fetchall()]
        conn.close()

        if all_comment_ids:
            num_reports = int(len(all_comment_ids) * 0.2)
            count_reports = 0
            for _ in range(num_reports):
               cid = random.choice(all_comment_ids)
               reasons = ["Spam", "Offensive", "Not helpful", "Fake review"]
               if db_utils.add_report(cid, random.choice(reasons)):
                   count_reports += 1
            print(f" - Added {count_reports} comment reports.")

        # Random App Reporting
        num_app_reports = int(len(all_app_ids) * 0.1)
        count_app_reports = 0
        for _ in range(num_app_reports):
            aid = random.choice(all_app_ids)
            reasons = ["Copyright infringement", "Malware", "Inappropriate content", "Scam"]
            if db_utils.add_app_report(aid, random.choice(reasons)):
                count_app_reports += 1
        print(f" - Added {count_app_reports} app reports.")

    print("Done!")

if __name__ == "__main__":
    seed_database()
