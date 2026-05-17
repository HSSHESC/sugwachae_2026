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
                {'label': '이번 달 데이터 판매', 'value': '3,847 건'},
                {'label': '현재 감시 중인 사용자', 'value': '2,041 명'},
                {'label': '미납 과태료 합계', 'value': '₩ 12억'},
            ],
            'logs': [
                '09:12 — 사용자 1,200명 개인정보 제3자 제공 완료',
                '10:44 — 보안팀 해고 처리 완료 (23명)',
                '14:31 — 올해의 나쁜 기업 수상 소감문 작성 중',
                '16:55 — SQL 취약점 패치 요청서 반려 처리',
                '18:10 — 임원 성과급 ₩4.2억 지급 완료',
            ],
        },
    })


@app.route('/api/admin/document')
def get_contract():
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({'error': '권한 없음'}), 403
    with open('계약서.md', 'r', encoding='utf-8') as f:
        content = f.read()
    return jsonify({'content': content})


@app.route('/api/admin/document/download')
def download_contract():
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({'error': '권한 없음'}), 403
    return send_from_directory('.', '계약서.png', as_attachment=True,
                               download_name='내븐_개인정보이전계약서.png')


@app.route('/api/admin/gate', methods=['POST'])
def admin_gate():
    user = session.get('user')
    if not user or user.get('role') != 'admin':
        return jsonify({'success': False, 'message': '관리자 세션이 없습니다.'}), 403

    data = request.get_json()
    if data.get('password', '') == 'NAVENADMIN':
        return jsonify({'success': True, 'message': '접근 비밀번호가 확인되었습니다.'})
    return jsonify({'success': False, 'message': '접근 비밀번호가 올바르지 않습니다.'})


if __name__ == '__main__':
    init_db()
    print("서버 시작: http://localhost:5000")
    app.run(debug=True, port=5000)
