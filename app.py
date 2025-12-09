from flask import Flask, jsonify, request
from flask_cors import CORS
import db_utils

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js development

@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "message": "Welcome to the App Store API",
        "endpoints": [
            "/health",
            "/api/apps",
            "/api/apps/<id>",
            "/api/search?q=<query>",
            "/api/categories"
        ]
    })

@app.route('/health')
def health_check():
    conn = db_utils.get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    else:
        return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

@app.route('/api/apps', methods=['GET'])
def get_apps():
    limit = request.args.get('limit', default=20, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    apps = db_utils.get_all_apps(limit, offset)
    if apps is None:
        return jsonify({"error": "Database error"}), 500
    
    return jsonify(apps)

@app.route('/api/apps/<int:app_id>', methods=['GET'])
def get_app_details(app_id):
    app_data = db_utils.get_app_details(app_id)
    if app_data is None:
        return jsonify({"error": "App not found or database error"}), 404
        
    return jsonify(app_data)

@app.route('/api/search', methods=['GET'])
def search_apps():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    results = db_utils.search_apps(query)
    if results is None:
         return jsonify({"error": "Database error"}), 500
         
    return jsonify(results)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = db_utils.get_categories()
    if categories is None:
        return jsonify({"error": "Database error"}), 500
        
    return jsonify(categories)

@app.route('/api/users', methods=['GET'])
def get_users():
    users = db_utils.get_all_users()
    if users is None:
        return jsonify({"error": "Database error"}), 500
    return jsonify(users)

@app.route('/api/apps/<int:app_id>/download', methods=['POST', 'DELETE'])
def download_app(app_id):
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    if request.method == 'POST':
        success = db_utils.record_download(app_id, user_id)
        if not success:
            return jsonify({"error": "Failed to record download"}), 500
        message = "Download recorded"
    
    elif request.method == 'DELETE':
        success = db_utils.remove_download(app_id, user_id)
        if not success:
            return jsonify({"error": "Failed to remove download"}), 500
        message = "App uninstalled"

    # Get updated app details to return new count
    app_data = db_utils.get_app_details(app_id)
    return jsonify({"message": message, "downloads": app_data['downloads']})

@app.route('/api/apps/<int:app_id>/comments', methods=['POST'])
def post_comment(app_id):
    data = request.json
    user_id = data.get('user_id')
    stars = data.get('stars')
    comment = data.get('comment')
    
    if not all([user_id, stars, comment]):
        return jsonify({"error": "Missing required fields"}), 400
        
    comment_id = db_utils.add_comment(app_id, user_id, stars, comment)
    if not comment_id:
        return jsonify({"error": "Failed to add comment"}), 500
        
    return jsonify({"message": "Comment added", "comment_id": comment_id})

    return jsonify({"message": "Comment added", "comment_id": comment_id})

@app.route('/api/comments/<int:comment_id>', methods=['PUT', 'DELETE'])
def manage_comment(comment_id):
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400

    if request.method == 'PUT':
        stars = data.get('stars')
        comment = data.get('comment')
        
        if stars is None or comment is None:
             return jsonify({"error": "Missing fields"}), 400
             
        success = db_utils.update_comment(comment_id, user_id, stars, comment)
        if success:
            return jsonify({"message": "Comment updated"})
        else:
            return jsonify({"error": "Failed to update comment"}), 403

    elif request.method == 'DELETE':
        success = db_utils.delete_comment(comment_id, user_id)
        if success:
             return jsonify({"message": "Comment deleted"})
        else:
             return jsonify({"error": "Failed to delete comment"}), 403

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
