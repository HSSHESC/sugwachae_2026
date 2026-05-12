from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__, static_folder='.')

DB = 'lab.db'

def init_db():
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        role TEXT
    )''')
    cur.execute("DELETE FROM users")
    cur.execute("INSERT INTO users VALUES (1, 'user',  '1234', 'user')")
    cur.execute("INSERT INTO users VALUES (2, 'admin', 'jadsfoijsoidfjoijewqinfoisnoifandsoifewoin', 'admin')")
    con.commit()
    con.close()

# -------------------------
# 정적 파일 서빙
# -------------------------
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# -------------------------
# 로그인 — SQL Injection 취약 (의도적)
# -------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password  = data.get('password', '')

    con = sqlite3.connect(DB)
    cur = con.cursor()

    # ⚠️ 취약: 입력값을 그대로 쿼리에 삽입
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    print(f"[SQL] {query}")          # 서버 콘솔에 쿼리 출력

    try:
        cur.execute(query)
        row = cur.fetchone()
    except Exception as e:
        con.close()
        return jsonify({'success': False, 'message': f'SQL 오류: {e}', 'query': query})

    con.close()

    if row:
        return jsonify({'success': True,  'message': f'{row[1]} 로그인 성공 (role: {row[3]})', 'query': query})
    else:
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.', 'query': query})


if __name__ == '__main__':
    init_db()
    print("서버 시작: http://localhost:5000")
    app.run(debug=True, port=5000)
