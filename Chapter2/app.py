from flask import Flask, request, jsonify, send_from_directory, session
import sqlite3
import os

app = Flask(__name__, static_folder='.')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'chapter2-sqli-lab-secret')

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
        rows = cur.fetchall()
    except Exception as e:
        con.close()
        return jsonify({'success': False, 'message': f'SQL 오류: {e}', 'query': query})

    con.close()

    row = None
    if rows:
        row = next((item for item in rows if item[1] == username), rows[0])

    if row:
        session['user'] = {
            'id': row[0],
            'username': row[1],
            'role': row[3],
        }
        return jsonify({
            'success': True,
            'message': f'{row[1]} 로그인 성공 (role: {row[3]})',
            'query': query,
            'user': session['user'],
        })
    else:
        session.pop('user', None)
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.', 'query': query})


@app.route('/api/me')
def me():
    user = session.get('user')
    return jsonify({
        'authenticated': bool(user),
        'user': user,
    })


@app.route('/api/admin/verify')
def admin_verify():
    user = session.get('user')

    if not user:
        return jsonify({
            'authenticated': False,
            'authorized': False,
            'message': '로그인이 필요합니다.',
            'role': 'guest',
        }), 401

    if user.get('role') != 'admin':
        return jsonify({
            'authenticated': True,
            'authorized': False,
            'message': '관리자 권한이 필요합니다.',
            'role': user.get('role', 'user'),
            'user': user,
        }), 403

    return jsonify({
        'authenticated': True,
        'authorized': True,
        'message': '관리자 권한이 확인되었습니다.',
        'role': 'admin',
        'user': user,
        'dashboard': {
            'title': '관리자 권한 대시보드',
            'stats': [
                {'label': '권한 상태', 'value': 'ADMIN'},
                {'label': '운영진 세션', 'value': '활성'},
                {'label': '숨겨진 페이지', 'value': '접속 허용'},
            ],
            'logs': [
                '관리자 전용 참가자 명단 조회 가능',
                '체험전 운영 설정 변경 가능',
                'SQL Injection 실습 인증 완료',
            ],
        },
    })


if __name__ == '__main__':
    init_db()
    print("서버 시작: http://localhost:5000")
    app.run(debug=True, port=5000)
