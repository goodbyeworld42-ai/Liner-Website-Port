import json

d = json.load(open('/home/z/my-project/liner-app/src/languages/locales/en.json'))
print('top-level keys:', list(d.keys())[:10])
s = d.get('settings', {})
print('settings keys sample:', list(s.keys())[:25])
print('autoplay_similar:', json.dumps(s.get('autoplay_similar'), ensure_ascii=False))
print('track_double_click:', json.dumps(s.get('track_double_click'), ensure_ascii=False))
