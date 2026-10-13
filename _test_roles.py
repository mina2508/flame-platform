import urllib.request, json

BASE = "http://localhost:4000/api"

def login(email, pw):
    body = json.dumps({"email": email, "password": pw}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", body, {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())["token"]

def try_post(path, token, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{path}", body, {"Content-Type": "application/json"})
    req.add_header("Authorization", f"Bearer {token}")
    try:
        urllib.request.urlopen(req); return "ALLOWED"
    except urllib.error.HTTPError as e:
        return f"{e.code}"

def try_get(path, token):
    req = urllib.request.Request(f"{BASE}{path}")
    req.add_header("Authorization", f"Bearer {token}")
    try:
        urllib.request.urlopen(req); return "ALLOWED"
    except urllib.error.HTTPError as e:
        return f"{e.code}"

users = {
    'admin': ('admin@flame.org', 'Flame@Admin2026'),
    'content_editor': ('content@flame.org', 'Flame@Content2026'),
    'reviewer': ('reviewer@flame.org', 'Flame@Review2026'),
    'form_manager': ('forms@flame.org', 'Flame@Forms2026'),
}

print(f"{'role':<16}{'addSchool':<12}{'addField':<12}{'viewApps':<12}{'addUser':<10}")
for role, (e, p) in users.items():
    t = login(e, p)
    s = try_post('/schools', t, {'name': 'Test', 'country': 'X'})
    f = try_post('/form-fields', t, {'label': 'T', 'key': 'ztest_'+role, 'type': 'text'})
    a = try_get('/applications', t)
    u = try_post('/users', t, {'name':'z','email':f'z_{role}@x.com','password':'p','role':'reviewer'})
    print(f"{role:<16}{s:<12}{f:<12}{a:<12}{u:<10}")
