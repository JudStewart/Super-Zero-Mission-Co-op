from flask import Blueprint, request, Response
from Settings import settings
import ZeroMission
import json

# Game Info

ability_dict = {
    0x01000100: "Varia Suit",
    0x02000200: "Spring Ball",
    0x04000400: "Morph Ball",
    0x08000800: "Screw Attack",
    0x20002000: "Gravity Suit",
    0x00010001: "High Jump",
    0x00020002: "Space Jump",
    0x00100010: "Morph Ball Bombs",
    0x00200020: "Speed Booster",
    0x00400040: "Grapple Beam",
    0x00800080: "X-Ray",
}

# Reminder: Super Metroid does some jank if you equip certain beams together. Be careful.
beam_dict = {
    0x00100010: "Charge",
    0x01000100: "Wave",
    0x02000200: "Ice",
    0x04000400: "Spazer",
    0x08000800: "Plasma",
}

abilities = {
    "Varia Suit": False,
    "Spring Ball": False,
    "Morph Ball": False,
    "Screw Attack": False,
    "Gravity Suit": False,
    "High Jump": False,
    "Space Jump": False,
    "Morph Ball Bombs": False,
    "Speed Booster": False,
    "Grapple Beam": False,
    "X-Ray": False,
}
beams = {
    "Charge": False,
    "Wave": False,
    "Ice": False,
    "Spazer": False,
    "Plasma": False
}

# Share items
ability_value = 0
beam_value = 0
missile_tanks = 0
super_missile_tanks = 0
power_bomb_tanks = 0
energy_tanks = 0

# share health
health = 99

# share ammo
missiles = 0
supers = 0
power_bombs = 0

# value will be a hex value formatted 0xAABBAABB
# where AA and BB will be the same values both times
# if the ability is equipped. 
def parse_abilities(value = -1):
    if value == -1: value = ability_value
    for mask, ability in ability_dict.items():
        abilities[ability] = bool(value & mask)
    update_ability_value()

def parse_beams(value = -1):
    if value == -1: value = ability_value
    for mask, beam in beam_dict.items():
        beams[beam] = bool(value & mask) 
    update_beam_value()

def parse_zero_mission_abilities(mzm_abilities: dict):
    for ability, has in mzm_abilities.items():
        if ability in abilities:
            if has:
                print(f"[SUPER METROID] - - Setting shared ability {ability} to {has}")
                abilities[ability] = has
        elif ability in beams:
            if has:
                print(f"[SUPER METROID] - - Setting shared beam {ability} to {has}")
                beams[ability] = has
            
    update_ability_value()
    update_beam_value()
    
def update_ability_value():
    global ability_value
    for mask, ability in ability_dict.items():
        if abilities.get(ability, False):
            ability_value |= mask
    # print("[DEBUG - SM] - - Updated ability value. New value is " + hex(ability_value))

def update_beam_value():
    global beam_value
    for mask, beam in beam_dict.items():
        if beams.get(beam, False):
            if not (beam == "Spazer" and beams.get("Plasma", False)):
                beam_value |= mask

# Flask Routes


# TODO: picking up charge beam in SM gives spazer?
# TODO: picking up wave beam in SM gives plasma and then breaks the game
# TODO: Handle beam logic; once you get plasma you can't disable spazer and 
#       can't shoot anymore


super_metroid = Blueprint('Super Metroid', __name__, url_prefix='/sm')

def handle_options():
    resp = Response()
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Headers'] = 'content-type'
    return resp

# -------------------------------------- Acquired --------------------------------------------

@super_metroid.route('/acquired/missiles', methods = ['POST', 'OPTIONS'])
def sm_missile_tank():
    if request.method == 'OPTIONS':
        return handle_options()
    
    capacity = request.json['capacity']
    global missile_tanks
    missile_tanks = capacity // 5
    print("New SM Missile Capacity is " + str(capacity))
    
    if settings['share_items']:
        ZeroMission.missile_tanks = missile_tanks
    
    resp = handle_options()
    resp.data = json.dumps({"capacity" : capacity})
    return resp
    
@super_metroid.route('/acquired/supers', methods=['POST', 'OPTIONS'])
def sm_super_tank():
    if request.method == 'OPTIONS':
        return handle_options()
    
    capacity = request.json['capacity']
    global super_missile_tanks
    super_missile_tanks = capacity // 5
    print("New SM Super Missile Capacity is " + str(capacity))
    
    if settings['share_items']:
        ZeroMission.super_missile_tanks = super_missile_tanks
    
    resp = handle_options()
    resp.data = json.dumps({"capacity": capacity})
    return resp
    
@super_metroid.route('/acquired/powerbombs', methods=['POST', 'OPTIONS'])
def sm_power_bomb():
    if request.method == 'OPTIONS':
        return handle_options()
    
    capacity = request.json['capacity']
    global power_bomb_tanks
    power_bomb_tanks = capacity // 5
    print("New SM Power Bomb Capacity is " + str(capacity))
    
    if settings['share_items']:
        ZeroMission.power_bomb_tanks = power_bomb_tanks
    
    resp = handle_options()
    resp.data = json.dumps({"capacity": capacity})
    return resp
    
@super_metroid.route('/acquired/energy', methods=['POST', 'OPTIONS'])
def sm_energy_tank():
    if request.method == 'OPTIONS':
        return handle_options()
        
    capacity = request.json['capacity']
    global energy_tanks
    energy_tanks = (capacity - 99) // 100
    print(f"New SM Energy Capacity is {str(capacity)} ({str(energy_tanks)} tanks)")
    
    if settings['share_items']:
        ZeroMission.energy_tanks = energy_tanks
    
    resp = handle_options()
    resp.data = json.dumps({"capacity": capacity})
    return resp
    
@super_metroid.route('/abilities', methods=['GET', 'POST', 'OPTIONS'])
def sm_abilities():
    if request.method == 'OPTIONS':
        return handle_options()
    
    if request.method == 'POST':
        global ability_value
        ability_value |= request.json['ability value']
        parse_abilities()
        print("SM Ability value changed. New ability list is " + json.dumps(abilities, indent=4))
        
        if settings['share_items']:
            ZeroMission.parse_super_metroid_abilities(abilities)
    
    
    resp = handle_options()
    resp.data = json.dumps({
        "abilities": abilities
    })
    return resp
    
@super_metroid.route('/beams', methods=['GET', 'POST', 'OPTIONS'])
def sm_beams():
    if request.method == 'OPTIONS':
        return handle_options()
    
    if request.method == 'POST':
        global beam_value
        beam_value = request.json['beam value']
        parse_beams()
        print("SM Beam value changed. New beam list is " + json.dumps(beams, indent=4))
        
    if settings['share_items']:
        ZeroMission.parse_super_metroid_beams(beams)
    
    resp = handle_options()
    resp.data = json.dumps({
        "beams": beams
    })
    return resp


# ------------------------------------------------------- Health --------------------------------------

@super_metroid.route('/health', methods=['GET', 'POST', 'OPTIONS'])
def sm_health():
    if request.method == 'OPTIONS':
        return handle_options()

    if request.method == 'POST':
        global health
        health = request.json['health']
        if settings['share_health']:
            ZeroMission.health = health

    resp = handle_options()
    resp.data = json.dumps({
        "health": health
    })
    return resp

# ----------------------------------------------------- Ammo ------------------------------------------

@super_metroid.route('/ammo/missiles', methods=['GET', 'POST', 'OPTIONS'])
def sm_missiles():
    if request.method == 'OPTIONS':
        return handle_options()

    if request.method == 'POST':
        global missiles
        missiles = request.json['missiles']
        if settings['share_ammo']:
            ZeroMission.missiles = missiles
    
    resp = handle_options()
    resp.data = json.dumps({
        "missiles": missiles
    })
    return resp

@super_metroid.route('/ammo/supers', methods=['GET', 'POST', 'OPTIONS'])
def sm_supers():
    if request.method == 'OPTIONS':
        return handle_options()
    
    if request.method == 'POST':
        global supers
        supers = request.json['supers']
        if settings['share_ammo']:
            ZeroMission.supers = supers
    
    resp = handle_options()
    resp.data = json.dumps({
        "supers": supers
    })
    return resp

@super_metroid.route('/ammo/powerbombs', methods=['GET', 'POST', 'OPTIONS'])
def sm_power_bombs():
    if request.method == 'OPTIONS':
        return handle_options()
    
    if request.method == 'POST':
        global power_bombs
        power_bombs = request.json['power bombs']
        if settings['share_ammo']:
            ZeroMission.power_bombs = power_bombs
    
    resp = handle_options()
    resp.data = json.dumps({
        "power bombs": power_bombs
    })
    return resp

    
@super_metroid.route('/status', methods=['GET', 'OPTIONS'])
def sm_status():
    if request.method == 'OPTIONS':
        return handle_options()
        
    resp = handle_options()
    resp.data = json.dumps({
        "energy capacity": (energy_tanks * 100) + 99,
        "missile capacity": (missile_tanks * 5),
        "supers capacity": (super_missile_tanks * 5),
        "power bomb capacity": (power_bomb_tanks * 5),
        "ability value": ability_value,
        "beam value": beam_value,
        "health": health,
        "missiles": missiles,
        "supers": supers,
        "power bombs": power_bombs
    })
    return resp