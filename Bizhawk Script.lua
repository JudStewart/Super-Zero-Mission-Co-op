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

local health = 99
local missiles = 0
local supers = 0
local powerBombs = 0

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
        console.log("Player obtained a missile tank. New capacity is " .. newCap .. ". (" .. (newCap / 5) .. " missile tanks total, old capacity was " .. missileCap .. ")")
        missileCap = newCap
    end
end

local function superMissileTankCollected()
    local newCap = memory.readbyte(0x1534)
    if superMissileCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/supers", newCap)
        console.log("Player obtained a super missile tank. New capacity is " .. newCap .. ". (" .. (newCap / 2) .. " super missile tanks total)")
        superMissileCap = newCap
    end
end

local function powerBombTankCollected()
    local newCap = memory.readbyte(0x1535)
    if powerBombCap ~= newCap then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/acquired/powerbombs", newCap)
        console.log("Player obtained a power bomb tank. New capacity is " .. newCap .. ". (" .. (newCap / 2) .. " power bomb tanks total)")
        powerBombCap = newCap
    end
end

local function checkHealth()
    local newHealth = memory.read_u16_le(0x1536)
    if health ~= newHealth then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/health", newHealth)
        health = newHealth
    end
end

local function checkAmmo()
    local newMissiles = memory.read_u16_le(0x1538)
    if newMissiles ~= missiles then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/ammo/missiles", newMissiles)
        missiles = newMissiles
    end

    local newSupers = memory.readbyte(0x153A)
    if newSupers ~= supers then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/ammo/supers", newSupers)
        supers = newSupers
    end

    local newPowerBombs = memory.readbyte(0x153B)
    if newPowerBombs ~= powerBombs then
        comm.httpPost(comm.httpGetPostUrl() .. "/mzm/ammo/powerbombs", newPowerBombs)
        powerBombs = newPowerBombs
    end
end

local function updateStatus()
    local statusString = comm.httpGet(comm.httpGetGetUrl() .. '/mzm/status')
    local status = splitString(statusString, " ")

    -- abilities
    if shareItems then
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
        local newMissilesCap = tonumber(status[2])
        if (newMissilesCap ~= missileCap) then
            memory.write_u16_le(0x1532, newMissilesCap)
            missileCap = newMissilesCap
        end
        -- supers
        local newSupersCap = tonumber(status[3])
        if (newSupersCap ~= superMissileCap) then
            memory.writebyte(0x1534, newSupersCap)
            superMissileCap = newSupersCap
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

    if shareHealth then
        local newHealth = tonumber(status[6])
        if health ~= newHealth then 
            memory.write_u16_le(0x1536, newHealth)
            health = newHealth
        end
    end

    if shareAmmo then
        local newMissiles = tonumber(status[7])
        if newMissiles ~= missiles then
            memory.write_u16_le(0x1538, newMissiles)
            missiles = newMissiles
        end

        local newSupers = tonumber(status[8])
        if newSupers ~= supers then 
            memory.writebyte(0x153A, newSupers)
            supers = newSupers
        end

        local newPowerBombs = tonumber(status[9])
        if newPowerBombs ~= powerBombs then 
            memory.writebyte(0x153B, newPowerBombs)
            powerBombs = newPowerBombs
        end
    end
end

-- This runs a little too slowly on a non-local machine.
-- Here's some brainstorming to fix that:
    -- Instead of going through each function on each frame,
    -- create a table of coroutines that do each function.
    -- So table[1] does abilityCollected(), table[2] does eTankCollected(), etc.
    -- And this can be based on the settings as well; if something doesn't need to
    -- be done as per the settings, then just don't add it to the table.
    -- make a count variable, and every frame add one to it and then mod it by the
    -- table length. This will cause it to loop over the table's indices every frame.
    -- On each frame, execute whatever coroutine is present in the table at that index.
    -- Instead of having to do them all each frame, it goes through and does one per frame
    -- changing every time. This may mean that you execute checkHealth 5 frames later than
    -- you would have otherwise, but that's only 1/6th of a second. And instead of having to do
    -- up to 8 reads/writes/gets/posts per frame, it would only do one.

local function onEveryFrame()
    if shareItems then
        abilityCollected()
        eTankCollected()
        missileTankCollected()
        superMissileTankCollected()
        powerBombTankCollected()
    end
    if shareHealth then
        checkHealth()
    end
    if shareAmmo then
        checkAmmo()
    end
    updateStatus()
end

memory.usememorydomain("IWRAM")

event.onframestart(onEveryFrame)