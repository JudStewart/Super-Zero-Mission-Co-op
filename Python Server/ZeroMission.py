from flask import Blueprint, request, Response
from Settings import settings
import SuperMetroid
import json

# Game Information

ability_dict = {
    0x80800000: "Power Grip",
    0x40400000: "Morph Ball",
    0x20200000: "Gravity Suit",
    0x10100000: "Varia Suit",
    0x08080000: "Screw Attack",
    0x04040000: "Space Jump",
    0x02020000: "Speed Booster",
    0x01010000: "High Jump",
    
    0x8080: "Morph Ball Bombs",
    
    0x1010: "Charge",
    0x0808: "Plasma",
    0x0404: "Wave",
    0x0202: "Ice",
    0x0101: "Long",
    
    
    0x80000000: "Power Grip",
    0x40000000: "Morph Ball",
    0x20000000: "Gravity Suit",
    0x10000000: "Varia Suit",
    0x08000000: "Screw Attack",
    0x04000000: "Space Jump",
    0x02000000: "Speed Booster",
    0x01000000: "High Jump",
    
    0x8000: "Morph Ball Bombs",
    
    0x1000: "Charge",
    0x0800: "Plasma",
    0x0400: "Wave",
    0x0200: "Ice",
    0x0100: "Long",
}

abilities = {
    "Power Grip": False,
    "Morph Ball": False,
    "Gravity Suit": False,
    "Varia Suit": False,
    "Screw Attack": False,
    "Space Jump": False,
    "Speed Booster": False,
    "High Jump": False,
    "Morph Ball Bombs": False,
    "Charge": False,
    "Plasma": False,
    "Wave": False,
    "Ice": False,
    "Long": False,
}

# Share Items

ability_value = 0
missile_tanks = 0
super_missile_tanks = 0
power_bomb_tanks = 0
energy_tanks = 0

# Share Health
health = 99

# Share Ammo
missiles = 0
supers = 0
power_bombs = 0

def parse_ability_value(value = -1):
    if value == -1: value = ability_value
    for mask, ability in ability_dict.items():
        abilities[ability] = bool(value & mask)
    pass
        
def parse_super_metroid_abilities(sm_abilities: dict):
    for ability, has in sm_abilities.items():
        if ability in abilities:
            if has:
                print(f"[ZERO MISSION] - - Setting shared ability {ability} to true")
                abilities[ability] = has
    update_ability_value()
        
def parse_super_metroid_beams(sm_beams: dict):
    for beam, has in sm_beams.items():
        if beam in abilities:
            if has:
                print(f"[ZERO MISSION] - - Setting shared beam {beam} to true")
                abilities[beam] = has
    update_ability_value()
            
def update_ability_value():
    global ability_value
    for mask, ability in ability_dict.items():
        if abilities.get(ability, False):
            ability_value |= mask

def status():
    return {
        "abilities": ability_value,
        "missile capacity": missile_tanks * 5,
        "supers capacity": super_missile_tanks * 2,
        "powerbombs capacity": power_bomb_tanks * 2,
        "energy capacity": (energy_tanks * 100) + 99,
        "health": health,
        "missiles": missiles,
        "super missiles": supers,
        "power bombs": power_bombs
    }

def apply_status(stats):
    global ability_value
    ability_value = stats['abilities']
    global missile_tanks
    missile_tanks = stats['missile capacity'] / 5
    global super_missile_tanks
    super_missile_tanks = stats['supers capacity'] / 2
    global power_bomb_tanks
    power_bomb_tanks = stats['powerbombs capacity'] / 2
    global energy_tanks
    energy_tanks = (stats['energy capacity'] - 99) / 100
    global health
    health = stats['health']
    global missiles
    missiles = stats['missiles']
    global supers
    supers = stats['super missiles']
    global power_bombs
    power_bombs = stats['power bombs']

def zm_save():
    Saves.save()

# Flask Routes

zero_mission = Blueprint('Zero Mission', __name__, url_prefix='/mzm')

@zero_mission.route('/settings')
def mzm_settings():
    output = (str(settings['share_health']) + " "
        + str(settings['share_ammo']) + " "
        + str(settings['share_items']) + " "
        + str(settings['swap_items']))
    return output

# @zero_mission.route('/value/<string:name>')
# def mzm_get_value(name):
#     return status()[name]

@zero_mission.route('/status')
def mzm_status():
    return " ".join(str(n) for n in status().values())

# -------------------------- Acquired -------------------------------------------------------------

@zero_mission.route('/acquired', methods = ['POST'])
def mzm_received_item():
    new_ability_value = int(request.form['payload'])

    global ability_value
    new_item = ability_dict.get(new_ability_value - ability_value, hex(new_ability_value))
    
    ability_value = new_ability_value
    parse_ability_value()
    
    if settings['share_items']:
        SuperMetroid.parse_zero_mission_abilities(abilities)
    
    print(f"MZM player acquired item '{new_item}'")
    zm_save()
    return str(ability_value)

@zero_mission.route('/acquired/missiles', methods = ['POST'])
def mzm_missile_tank():
    capacity = int(request.form['payload'])
    global missile_tanks
    if capacity // 5 > missile_tanks:
        missile_tanks = capacity // 5
    
    if settings['share_items']:
        SuperMetroid.missile_tanks = missile_tanks
    
    print(f"MZM player acquired missile tank number {missile_tanks}")
    zm_save()
    return "success"

@zero_mission.route('/acquired/supers', methods = ['POST'])
def mzm_super_missile_tank():
    capacity = int(request.form['payload'])
    global super_missile_tanks
    super_missile_tanks = capacity // 2
    
    if settings['share_items']:
        SuperMetroid.super_missile_tanks = super_missile_tanks
    
    print(f"MZM player acquired super missile tank number {super_missile_tanks}")
    zm_save()
    return "success"

@zero_mission.route('/acquired/powerbombs', methods = ['POST'])
def mzm_power_bomb_tank():
    capacity = int(request.form['payload'])
    global power_bomb_tanks
    power_bomb_tanks = capacity // 2
    
    if settings['share_items']:
        SuperMetroid.power_bomb_tanks = power_bomb_tanks
        
    print(f"MZM player acquired power bomb tank number {power_bomb_tanks}")
    zm_save()
    return "success"
    
@zero_mission.route('/acquired/energy', methods = ['POST'])
def mzm_energy_tank():
    capacity = int(request.form['payload'])
    global energy_tanks
    energy_tanks = (capacity - 99) // 100
    
    if settings['share_items']:
        SuperMetroid.energy_tanks = energy_tanks
    
    print(f"MZM player acquired e-tank number {energy_tanks} (new capacity is {capacity})")
    zm_save()
    return "success"
    

# -------------------------------------------- Health ------------------------------------------

@zero_mission.route('/health', methods = ['GET', 'POST'])
def mzm_health():
    global health
    health = int(request.form['payload'])

    if settings['share_health']:
        SuperMetroid.health = health
    
    zm_save()
    return "success"

# ---------------------------------------------- Ammo -------------------------------------------

@zero_mission.route('/ammo/missiles', methods = ['GET', 'POST'])
def mzm_missiles():
    global missiles
    missiles = int(request.form['payload'])
    if settings['share_ammo']:
        SuperMetroid.missiles = missiles
    zm_save()
    return "success"

@zero_mission.route('/ammo/supers', methods = ['GET', 'POST'])
def mzm_supers():
    global supers
    supers = int(request.form['payload'])
    if settings['share_ammo']:
        SuperMetroid.supers = supers
    zm_save()
    return "success"

@zero_mission.route('/ammo/powerbombs', methods = ['GET', 'POST'])
def mzm_power_bombs():
    global power_bombs
    power_bombs = int(request.form['payload'])
    if settings['share_ammo']:
        SuperMetroid.power_bombs = power_bombs
    zm_save()
    return "success"


@zero_mission.route('/abilities')
def mzm_abilities():
    return Response(json.dumps(abilities))