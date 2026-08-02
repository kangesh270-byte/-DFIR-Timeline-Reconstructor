import requests

base = 'http://127.0.0.1:9001'
for label, headers in [('missing', {}), ('invalid', {'Authorization': 'Bearer invalid-token'})]:
    r = requests.get(f'{base}/users/profile', headers=headers, timeout=10)
    print(label, r.status_code)
    print(r.text)
    print('---')
