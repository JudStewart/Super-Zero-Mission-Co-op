import json

settings = {
    "share_health": False,
    "share_ammo": False,
    "share_items": True,
    "swap_items": False,
}
def to_json():
    return json.dumps(settings)