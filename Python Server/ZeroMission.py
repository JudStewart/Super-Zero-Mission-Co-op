

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
    
    0x1010: "Charge Beam",
    0x0808: "Plasma Beam",
    0x0404: "Wave Beam",
    0x0202: "Ice Beam",
    0x0101: "Long Beam"
}

abilities = []
missile_tanks = 0
super_missile_tanks = 0
power_bomb_tanks = 0
energy_tanks = 0

def parse_memory_value(mem_value):
    abilities = []
    for val in ability_dict.keys():
        if (mem_value > val):
            mem_value -= val
            abilities.append(ability_dict[val])

def new_ability(mem_value):
    if mem_value in ability_dict:
        new = ability_dict[mem_value]
        abilities.append(new)
        return new
    else:
        parse_memory_value(mem_value)
        return None