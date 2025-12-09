import sqlite3
import pandas as pd

DB_NAME = "app_data.db"

def run_query(cursor, title, sql, params=()):
    print("-" * 80)
    print(f"QUERY: {title}")
    print(f"SQL: {sql.strip()}")
    print("-" * 80)
    
    try:
        cursor.execute(sql, params)
        
        if sql.strip().upper().startswith("SELECT") or sql.strip().upper().startswith("WITH"):
            columns = [description[0] for description in cursor.description]
            results = cursor.fetchall()
            if results:
                df = pd.DataFrame(results, columns=columns)
                pd.set_option('display.max_columns', None)
                pd.set_option('display.width', 1000)
                print(df)
            else:
                print("(No results returned)")
        else:
            print(f"Rows affected: {cursor.rowcount}")
            
    except sqlite3.Error as e:
        print(f"ERROR: {e}")
    print("\n")

def main():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # ==========================================
    # SECTION 1: BASIC RETRIEVAL
    # ==========================================
    
    run_query(cursor, "1. Get Basic User Profile", 
        "SELECT user_id, username, creation_date FROM user LIMIT 5;")

    run_query(cursor, "2. Find 'Free' Apps", 
        "SELECT app_name, rating FROM app WHERE price = 0;")

    run_query(cursor, "3. Search Apps by Name (Partial Match)", 
        "SELECT app_id, app_name, price FROM app WHERE app_name LIKE ?;", ('%Game%',))

    run_query(cursor, "4. Get Full App Details (One-to-One Join)", 
        """
        SELECT a.app_name, a.rating, p.description, p.last_update 
        FROM app a
        JOIN app_page p ON a.app_id = p.app_id
        WHERE a.app_id = 1;
        """)

    # ==========================================
    # SECTION 2: AGGREGATIONS & GROUPING
    # ==========================================

    run_query(cursor, "5. Total Revenue Estimate (Price * Downloads)", 
        "SELECT SUM(price * downloads) as total_revenue_usd FROM app;")

    run_query(cursor, "6. Count Apps per Price Point", 
        """
        SELECT price, COUNT(*) as app_count 
        FROM app 
        GROUP BY price 
        ORDER BY app_count DESC;
        """)

    run_query(cursor, "7. Average Rating of All Apps", 
        "SELECT AVG(rating) as global_avg_rating FROM app;")

    run_query(cursor, "8. Find 'Strict' Critics (Users who give low ratings)", 
        """
        SELECT user_id, AVG(stars) as avg_given_rating, COUNT(*) as review_count
        FROM comments
        GROUP BY user_id
        HAVING avg_given_rating < 4.0;
        """)

    # ==========================================
    # SECTION 3: JOINS & RELATIONSHIPS
    # ==========================================

    run_query(cursor, "9. List All Apps Installed by a Specific User", 
        """
        SELECT u.username, a.app_name, a.price 
        FROM user u
        JOIN user_apps ua ON u.user_id = ua.user_id
        JOIN app a ON ua.app_id = a.app_id
        WHERE u.username = 'alice_wonder';
        """)

    run_query(cursor, "10. View Review Feed (Join Comments, Users, Apps)", 
        """
        SELECT u.username, a.app_name, c.stars, c.comment 
        FROM comments c
        JOIN user u ON c.user_id = u.user_id
        JOIN app a ON c.app_id = a.app_id
        ORDER BY c.date DESC LIMIT 5;
        """)

    run_query(cursor, "11. Tag Explorer (Find apps with specific tag)", 
        """
        SELECT t.tag_id, a.app_name 
        FROM tags t
        JOIN app_tags at ON t.tag_id = at.tag_id
        JOIN app a ON at.app_id = a.app_id
        WHERE t.tag_id = 'productivity';
        """)

    # ==========================================
    # SECTION 4: COMPLEX & ANALYTICAL
    # ==========================================

    run_query(cursor, "12. Cross-Sell Analysis (Users who installed App A also installed...)", 
        """
        SELECT a2.app_name, COUNT(*) as common_users
        FROM user_apps ua1
        JOIN user_apps ua2 ON ua1.user_id = ua2.user_id -- Same user
        JOIN app a2 ON ua2.app_id = a2.app_id
        WHERE ua1.app_id = 1 -- Assuming App ID 1 is the target
          AND ua2.app_id != 1 -- Exclude the app itself
        GROUP BY a2.app_name
        ORDER BY common_users DESC;
        """)

    run_query(cursor, "13. Apps with More Downloads than Average (Subquery)", 
        """
        SELECT app_name, downloads 
        FROM app 
        WHERE downloads > (SELECT AVG(downloads) FROM app);
        """)

    run_query(cursor, "14. Categorize Apps by Price (CASE Statement)", 
        """
        SELECT app_name, price,
            CASE 
                WHEN price = 0 THEN 'Free'
                WHEN price < 3.0 THEN 'Cheap'
                ELSE 'Premium'
            END as price_category
        FROM app;
        """)

    run_query(cursor, "15. Identify Potential Spam (Users with many reports against them)", 
        """
        SELECT u.username, COUNT(r.report_id) as report_count
        FROM user u
        JOIN reports r ON u.user_id = r.reported_user_id
        GROUP BY u.username
        ORDER BY report_count DESC;
        """)

    run_query(cursor, "16. Orphaned Reports (Left Join check)", 
        """
        SELECT r.report_id, r.comment, u.username as reported_user
        FROM reports r
        LEFT JOIN user u ON r.reported_user_id = u.user_id
        WHERE u.user_id IS NULL; 
        -- If user was deleted, this returns rows.
        """)

    # ==========================================
    # SECTION 5: MAINTENANCE & UPDATES
    # ==========================================

    run_query(cursor, "17. Calculate & Update App Ratings based on Comments", 
        """
        UPDATE app 
        SET rating = (
            SELECT AVG(stars) 
            FROM comments 
            WHERE comments.app_id = app.app_id
        )
        WHERE EXISTS (SELECT 1 FROM comments WHERE comments.app_id = app.app_id);
        """)

    run_query(cursor, "18. Increment Download Count (Simulating an Install)", 
        "UPDATE app SET downloads = downloads + 1 WHERE app_id = 2;")

    run_query(cursor, "19. Delete Old Reports (Cleanup)", 
        "DELETE FROM reports WHERE created_at < date('now', '-1 year');")

    run_query(cursor, "20. Check Integrity (Find Junction entries for non-existent apps)", 
        """
        SELECT * FROM user_apps 
        WHERE app_id NOT IN (SELECT app_id FROM app);
        """)

    # ==========================================
    # SECTION 6: MORE INSERT/UPDATE/DELETE
    # ==========================================

    run_query(cursor, "21. Insert a New User", 
        "INSERT INTO user (username) VALUES ('demo_user_123');")

    # Verify the insert
    run_query(cursor, "21a. Verify Insert", 
        "SELECT user_id, username FROM user WHERE username = 'demo_user_123';")

    run_query(cursor, "22. Update User's Name", 
        "UPDATE user SET username = 'demo_user_updated' WHERE username = 'demo_user_123';")

    # Verify the update
    run_query(cursor, "22a. Verify Update", 
        "SELECT user_id, username FROM user WHERE username = 'demo_user_updated';")

    run_query(cursor, "23. Delete the User", 
        "DELETE FROM user WHERE username = 'demo_user_updated';")

    # Verify the delete
    run_query(cursor, "23a. Verify Delete", 
        "SELECT user_id, username FROM user WHERE username = 'demo_user_updated';")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
