import json

with open("data_clubs.json", "rt", encoding="utf-8") as f:
    clubs = json.load(f)

with open("data_fighters.json", "rt", encoding="utf-8") as f:
    fighters = json.load(f)

fighter_dict = { f["id"]: f for f in fighters }

for c in clubs:
    print(f"## {c['name']} (Advantage: {c['home_advantage']}, Persona: {c['ai_persona']})")
    for fid in c["fighter_ids"]:
        if fid in fighter_dict:
            f = fighter_dict[fid]
            print(f"- **{f['name']}** - Age: {f['age']}, Archetype: {f['personality']['archetype']}")
    print("")
