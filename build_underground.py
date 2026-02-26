import json
import random

fighters = [
    # Tier 3
    {"name": "Svetlana Dragunov", "tier": 3, "flavor": "A towering, muscular Russian female pit fighter."},
    {"name": "Kaelen Mortis", "tier": 3, "flavor": "Intensely athletic with pure black eyes and pale skin."},
    {"name": "Valeria Voss", "tier": 3, "flavor": "A cold, calculating martial artist."},
    {"name": "Zoya Volkov", "tier": 3, "flavor": "Massive, hulking brawler with an emotionless expression."},
    {"name": "Xenia Rostova", "tier": 3, "flavor": "A sadistic, smiling fighter with a terrifying aura."},
    {"name": "Lilith Graves", "tier": 3, "flavor": "Highly arrogant, gothic features, and deadly."},
    {"name": "Morgana Rex", "tier": 3, "flavor": "Alpha female champion with a regal, brutal physique."},
    {"name": "Sloane Steele", "tier": 3, "flavor": "Seasoned veteran, completely battered but fearless."},

    # Tier 2
    {"name": "Daria Voronova", "tier": 2, "flavor": "Vicious Eastern European pit fighter."},
    {"name": "Roxy Thorne", "tier": 2, "flavor": "Erratic punk rocker turned fighter."},
    {"name": "Nova Kane", "tier": 2, "flavor": "Highly athletic, arrogant fighter showing off."},
    {"name": "Raven Croft", "tier": 2, "flavor": "Hungry, desperate underdog with wiry muscle."},
    {"name": "Cleo Stark", "tier": 2, "flavor": "Dominant, intense fighter staring down her opponent."},
    {"name": "Anya Petrov", "tier": 2, "flavor": "Precise, deadly underground submission specialist."},
    {"name": "Sasha Kravitz", "tier": 2, "flavor": "Sadistic brawler wearing a psychotic grin."},
    {"name": "Nadia Romanov", "tier": 2, "flavor": "Elite Russian fighter with an ice queen persona."},
    {"name": "Ingrid Frost", "tier": 2, "flavor": "Tall, broad-shouldered Nordic boss."},
    {"name": "Olga Ivanov", "tier": 2, "flavor": "Deeply unstable, rage-filled fighter."},
    {"name": "Petra Kage", "tier": 2, "flavor": "Terrifyingly calm alpha fighter."},
    {"name": "Vera Rex", "tier": 2, "flavor": "Viciously cruel fighter with a menacing sneer."},
    {"name": "Zara Blaze", "tier": 2, "flavor": "Flashy, arrogant, and highly stylized."},
    {"name": "Kara Knox", "tier": 2, "flavor": "Inflicting pure pain with highly vascular muscles."},
    {"name": "Maya Frost", "tier": 2, "flavor": "Highly technical, emotionless fighter."},
    {"name": "Gisele Morana", "tier": 2, "flavor": "Assassin type fighter with elegant features."},
    {"name": "Katarina Bane", "tier": 2, "flavor": "Explosive, unhinged, screaming in fury."},
    {"name": "Freya Storm", "tier": 2, "flavor": "Dominant, imposing Nordic pit boss."},
    {"name": "Isla Black", "tier": 2, "flavor": "Sinister fighter hiding in the shadows."},

    # Tier 1
    {"name": "Nina Kael", "tier": 1, "flavor": "Scrappy, Bruised newcomer pit fighter."},
    {"name": "Elena Silva", "tier": 1, "flavor": "Focused Hispanic underground fighter."},
    {"name": "Tara Grimm", "tier": 1, "flavor": "Angry, untrained brawler swinging wildly."},
    {"name": "Mila Thorne", "tier": 1, "flavor": "Nasty, cheap-shot fighter with a cruel sneer."},
    {"name": "Rosa Diaz", "tier": 1, "flavor": "Confident thug fighter with a tough stare."},
    {"name": "Carmen Reyes", "tier": 1, "flavor": "Overly confident, flashy street fighter."},
    {"name": "Tia Raze", "tier": 1, "flavor": "Wildly reckless, manic pit fighter."},
    {"name": "Zelda Vance", "tier": 1, "flavor": "Cold, dismissive newcomer keeping an ice queen facade."},
    {"name": "Rhea Thorne", "tier": 1, "flavor": "Viciously mean brawler enjoying inflicting pain."},
    {"name": "Luna Vega", "tier": 1, "flavor": "Quietly intense, calculating fighter."},
    {"name": "Gia Rossi", "tier": 1, "flavor": "Arrogant Italian fighter treating the ring like a runway."},
    {"name": "Lexi Venom", "tier": 1, "flavor": "Highly unpredictable, venomous fighter."},
    {"name": "Bianca Bane", "tier": 1, "flavor": "Deeply malicious newcomer glaring violently."},
    {"name": "Harper Blood", "tier": 1, "flavor": "Natural-born pit boss in training."},
    {"name": "Nyx Vance", "tier": 1, "flavor": "Gothic, emotionless fighter staring dead ahead."},
    {"name": "Talon Cross", "tier": 1, "flavor": "Highly focused, sharp fighter with calculating stare."},
    {"name": "Ivy Cross", "tier": 1, "flavor": "Desperate fighter fighting for survival."},
    {"name": "Serena Vane", "tier": 1, "flavor": "Arrogant showboating newcomer."},
    {"name": "Fiona Graves", "tier": 1, "flavor": "Brutal, merciless fighter ready to break bones."},
    {"name": "Hera Blood", "tier": 1, "flavor": "Violently angry brawler screaming in rage."},
    {"name": "Athena Stark", "tier": 1, "flavor": "Commanding, arrogant fighter feeling superior."},
    {"name": "Yulia Korshak", "tier": 1, "flavor": "Sadistic Russian newcomer smiling unpleasantly."},
    {"name": "Diana Varga", "tier": 1, "flavor": "Cold, methodical Eastern European fighter."}
]

output = []
for i, f in enumerate(fighters):
    tier = f['tier']
    
    # Base stats per tier
    if tier == 3:
        p_base = 85
        t_base = 85
        s_base = 80
        age = random.randint(28, 38)
        payout = 45000 + random.randint(1, 5) * 1000
    elif tier == 2:
        p_base = 70
        t_base = 70
        s_base = 70
        age = random.randint(24, 32)
        payout = 15000 + random.randint(1, 5) * 1000
    else:
        p_base = 55
        t_base = 50
        s_base = 60
        age = random.randint(19, 27)
        payout = 7000 + random.randint(1, 3) * 1000
        
    power = p_base + random.randint(0, 15)
    tech = t_base + random.randint(0, 15)
    spd = s_base + random.randint(0, 15)
    
    archetypes = ["Brawler", "Sadistic", "Technical", "Submission"]
    arch = random.choice(archetypes)
    if "sadistic" in f['flavor'].lower() or "cruel" in f['flavor'].lower() or "mean" in f['flavor'].lower() or "malicious" in f['flavor'].lower():
        arch = "Sadistic"
    elif "technique" in f['flavor'].lower() or "precise" in f['flavor'].lower() or "calculating" in f['flavor'].lower():
        arch = "Technical"
        
    dom = 70 + random.randint(0, 30) if tier > 1 else 60 + random.randint(0, 30)
    
    obj = {
        "id": f"ug_{str(i+1).zfill(3)}",
        "name": f['name'],
        "age": age,
        "tier": tier,
        "core_stats": {
            "power": power,
            "technique": tech,
            "control": max(50, tech - 10),
            "speed": spd,
            "endurance": max(60, power - 10),
            "composure": max(40, tech - 5),
            "presence": 80 if tier == 3 else (65 if tier == 2 else 50)
        },
        "personality": {
            "dominance": dom,
            "archetype": arch
        },
        "style_affinities": {
            "naked_wrestling": 50 + random.randint(0, 40),
            "boxing": 50 + random.randint(0, 40),
            "catfight": 70 + random.randint(0, 30),
            "sexfight": 50 + random.randint(0, 40)
        },
        "flavor": f['flavor'],
        "payout_base": payout,
        "injury_modifier": 2.5 if tier == 3 else (1.8 if tier == 2 else 1.4)
    }
    output.append(obj)

with open('data_underground.json', 'w') as outf:
    json.dump(output, outf, indent=4)

print(f"Generated {len(output)} fighters to data_underground.json")
