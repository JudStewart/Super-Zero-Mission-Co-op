import ZeroMission
import SuperMetroid
import Settings
import json
import datetime

save_file_path = "SMZM Save " + str(datetime.datetime.now()) + ".json"

def save_json():
    return {
        "Super Metroid Status": SuperMetroid.status(),
        "Super Metroid Beams": SuperMetroid.beams,
        "Super Metroid Abilities": SuperMetroid.abilities,
        "Zero Mission Status": ZeroMission.status(),
        "Zero Mission Abilities": ZeroMission.abilities,
        "Settings": Settings.to_json(),
    }

def save():
    save_file = open(save_file_path, "w")
    json.dump(save_json(), save_file)
    save_file.close()

def load(load_file):
    save = json.load(load_file)

    SuperMetroid.apply_status(save['Super Metroid Status'])
    SuperMetroid.beams = save['Super Metroid Beams']
    SuperMetroid.abilities = save['Super Metroid Abilities']
    ZeroMission.apply_status(save['Zero Mission Status'])
    ZeroMission.abilities = save['Zero Mission Abilities']
    Settings.settings = json.loads(save['Settings'])

