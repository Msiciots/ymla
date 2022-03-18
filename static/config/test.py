import json
with open("glossaries.json", 'r') as f:
    data = json.loads(f.read())

print(data)