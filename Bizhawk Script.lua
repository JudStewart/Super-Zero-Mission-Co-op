
--------------------- Give Morphball --------------------------------------

-- console.log(memory.readbyte(0x300153E) .. memory.readbyte(0x300153F))

-- local newVal = memory.readbyte(0x300153E) + 0x40

-- memory.writebyte(0x300153E, newVal)
-- memory.writebyte(0x300153F, newVal)

------------------------------------- log to console if user presses "J" -------------------------------

-- local function logInput()
--     if input.get()["J"] ~= nil then
--         console.log("User inputted J")
--     end
-- end

-- event.onframestart(logInput)

-------------------------------- testing GET requests (didn't work) ------------------------

-- local function get()
--     local res = comm.httpGet("https://httpbin.org/get")
--     if input.get()["J"] ~= nil then
--         console.log(res)
--     end
-- end

-- event.onframestart(get)

----------------------------------- Checking for item changes on each frame -------------------------------

-- local prevAbilityVal = 0

-- local function abilityCollected()
--     local curAbilityVal = memory.read_u32_le(0x153C)
--     if prevAbilityVal ~= curAbilityVal then
--         gui.text(50, 50, "Player obtained new ability")
--         console.log("Player obtained a new ability. New ability value is " .. string.format("%x", curAbilityVal))
--     end
--     prevAbilityVal = curAbilityVal
-- end

-- memory.usememorydomain("IWRAM")

-- event.onframestart(abilityCollected)

------------------------- GET request on every frame (didn't work) ---------------------------

-- local function doGetReq() 
--     local res = comm.httpGet("localhost:5000/mzm")
--     gui.text(50, 50, res)
-- end

-- event.onframestart(doGetReq)



-------------------------- checking for specific items ----------------------------------------

-- These are doubled because one will trigger when an item is reequipped and one will trigger on item being added overall
-- local abilityMap = {
--     [0x0101] = "Long Beam",
--     [0x0100] = "Long Beam",
--     [0x0202] = "Ice Beam",
--     [0x0200] = "Ice Beam",
--     [0x0404] = "Wave Beam",
--     [0x0400] = "Wave Beam",
--     [0x0808] = "Plasma Beam",
--     [0x0800] = "Plasma Beam",
--     [0x1010] = "Charge Beam",
--     [0x1000] = "Charge Beam",

--     [0x8080] = "Morph Ball Bombs",
--     [0x8000] = "Morph Ball Bombs",

--     [0x40400000] = "Morph Ball",
--     [0x40000000] = "Morph Ball",
--     [0x01010000] = "High Jump",
--     [0x01000000] = "High Jump",
--     [0x02020000] = "Speed Booster",
--     [0x02000000] = "Speed Booster",
--     [0x04040000] = "Space Jump",
--     [0x04000000] = "Space Jump",
--     [0x08080000] = "Screw Attack",
--     [0x08000000] = "Screw Attack",
--     [0x10100000] = "Varia Suit",
--     [0x10000000] = "Varia Suit",
--     [0x20200000] = "Gravity Suit",
--     [0x20000000] = "Gravity Suit",
--     [0x80800000] = "Power Grip",
--     [0x80000000] = "Power Grip"
-- }

local function splitString(str, delim)
    if (str == "") then
        return {}
    end
    if delim == nil then
        delim = " "
    end
    local t = {}
    for substr in string.gmatch(str, "([^" .. delim .. "]+)") do
        table.insert(t, substr)
    end
    return t
end

local function strToBool(str)
    return string.lower(str) == "true"
end

local settingsString = comm.httpGet(comm.httpGetGetUrl() .. "/mzm/settings")
local settings = splitString(settingsString, " ")
local shareHealth = strToBool(settings[1])
local shareAmmo = strToBool(settings[2])
local shareItems = strToBool(settings[3])
local swapItems = strToBool(settings[4])

console.log("Connected! Using settings: ")
console.log("Share Health: " .. tostring(shareHealth))
console.log("Share Ammo: " .. tostring(shareAmmo))
console.log("Share Items: " .. tostring(shareItems))
console.log("Swap Items: " .. tostring(swapItems))

local abilities = 0
local healthCap = 99
local missileCap = 0
local superMissileCap = 0
local powerBombCap = 0

-- local function checkEquippedEqualsObtained(abilityValue)
--     -- if abilityValue is 0x12345678, this is 0x12
--     local eqAbility = bit.rshift(bit.band(abilityValue, 0xFF000000), 24)
--     -- and this is 0x34
--     local obAbility = bit.rshift(bit.band(abilityValue, 0x00FF0000), 16)
--     -- if they're the same, then the item has been obtained and equipped. If not, there's a cutscene playing and we'll ride that out

--     -- this is 0x78
--     local eqBeam = bit.band(abilityValue, 0x000000FF)
--     -- and this is 0x56.
--     local obBeam = bit.rshift(bit.band(abilityValue, 0x0000FF00), 8)

--     return (eqAbility == obAbility and eqBeam == obBeam)
-- end

--TODO: See if post request can go in background thread

local function abilityCollected()
    local newAbilities = memory.read_u32_le(0x153C)
    if abilities ~= newAbilities then
        local res = comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired", newAbilities)
        console.log("Player obtained new ability. (ability value is " .. newAbilities .. "). Response from server was " .. res)
    end
    abilities = newAbilities
end

local function eTankCollected()
    local newCap = memory.read_u16_le(0x1530)
    if healthCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/energy", newCap)
        console.log("Player obtained an eTank. New total energy is " .. newCap .. ". (" .. (newCap - 99) / 100 .. " energy tanks)")
    end
    healthCap = newCap
end

local function missileTankCollected()
    local newCap = memory.read_u16_le(0x1532)
    if missileCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/missiles", newCap)
        console.log("Player obtained a missile tank. New capacity is " .. newCap .. ". (" .. (newCap / 5) .. " missile tanks total)")
    end
    missileCap = newCap
end

local function superMissileTankCollected()
    local newCap = memory.readbyte(0x1534)
    if superMissileCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/supers", newCap)
        console.log("Player obtained a super missile tank. New capacity is " .. newCap .. ". (" .. (newCap / 2) .. " super missile tanks total)")
    end
    superMissileCap = newCap
end

local function powerBombTankCollected()
    local newCap = memory.readbyte(0x1535)
    if powerBombCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/powerbombs", newCap)
        console.log("Player obtained a power bomb tank. New capacity is " .. newCap .. ". (" .. (newCap / 2) .. " power bomb tanks total)")
    end
    powerBombCap = newCap
end

local function updateStatus()
    local statusString = comm.httpGet(comm.httpGetGetUrl() .. '/mzm/status')
    local status = splitString(statusString, " ")

    -- abilities
    local abilitiesValue = tonumber(status[1])
    if (abilitiesValue ~= abilities) then
        -- memory.writebyterange({
            -- [0x153C] = bit.band(abilitiesValue, 0xFF000000),
            -- [0x153D] = bit.band(abilitiesValue, 0x00FF0000),
            -- [0x153E] = bit.band(abilitiesValue, 0x0000FF00),
            -- [0x153F] = bit.band(abilitiesValue, 0x000000FF)
        -- })
        memory.write_u32_le(0x153C, abilitiesValue)
        console.log("Updated ability value. New value is " .. abilitiesValue)
        abilities = abilitiesValue
    end
    -- missiles
    local missiles = tonumber(status[2])
    if (missiles ~= missileCap) then
        memory.write_u16_le(0x1532, missiles)
        missileCap = missiles
    end
    -- supers
    local supers = tonumber(status[3])
    if (supers ~= superMissileCap) then
        memory.writebyte(0x1534, supers)
        superMissileCap = supers
    end
    -- power bombs
    local pbombs = tonumber(status[4])
    if (pbombs ~= powerBombCap) then
        memory.writebyte(0x1535, pbombs)
        powerBombCap = pbombs
    end
    -- energy
    local energy = tonumber(status[5])
    if (energy ~= healthCap) then
        memory.write_u16_le(0x1530, energy)
        healthCap = energy
    end
end

local function onEveryFrame()
    if shareItems then
        abilityCollected()
        eTankCollected()
        missileTankCollected()
        superMissileTankCollected()
        powerBombTankCollected()
    end
    updateStatus()
end

memory.usememorydomain("IWRAM")

event.onframestart(onEveryFrame)