from flask import Flask, jsonify, request
from flask_cors import CORS
import db_utils

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js development

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
