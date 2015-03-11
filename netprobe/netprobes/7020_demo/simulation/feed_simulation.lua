--- ------------------------------------------------------------------------------
--- feed_simulation.lua
--- --------------------------------------------------------------------------------
local gs = require 'geneos.sampler'
local md = require 'geneos.marketdata'

local base = "Base-Sim"
local other = "Other-Sim"

if not gs.params['lua.script'] then
    gs.params['lua.script'] = "simulation/luaFeed_Sim.lua"
end

local insts = {}
local noiseLevel = 6
for k, v in pairs(gs.params) do
    local n = string.match(k, 'inst%.(%w+)')
    if n then
        insts[n] = v
        gs.params[k] = nil
    elseif k == 'noiseLevel' then
        noiseLevel = tonumber(v)
        if not noiseLevel or noiseLevel < 0 then noiseLevel = 0 end
        gs.params[k] = nil
    end
end

-- This is the Lua equivalent of FLM's Instrument Group
local instMap = function(prefix)
    local map = {}
    for name, profile in pairs(insts) do
        map[name] = string.format("%s.%s.%s", prefix, name, profile)
    end
    return map
end
                                             -- Simulator only supports these three fields
local fieldMap = { Trade = "trade", Ask = "ask", Bid = "bid" }
for i = 1, noiseLevel do
    local fn = 'noise' .. i
    fieldMap[fn] = fn
end

-- The prefix controls which simulated feed the ticks come from
local function makeConfig(prefix) 
    return {
        feed = {
            type = "custom",
            library = { filename = "flm/geneos-feed-lua.so",
                                    skipVersionCheck = true },
        },
        custom = gs.params,
        instruments = instMap(prefix),
        fields = fieldMap,
    }
end

local fBase  = assert(md.addFeed(base,  makeConfig("b")))
local fOther = assert(md.addFeed(other, makeConfig("f")))
fBase:start()
fOther:start()

local view = gs.createView("FEED-INFO", {"Subscription", "numTicks", "lastTrade", 
    "minSpread", "maxSpread", "maxInterval"})
view:publish()

local function round2dp(value)
    return value and math.floor(value * 100 + 0.5) / 100
end

local prevTick = {}

local function evaluate(rowName, newTicks)
    local tick = prevTick[rowName] or { field = {} }
    tick.next = newTicks

    local minSpread, maxSpread, maxInterval, tradePrice
    local prevTime = tick.timeLast
    local tickCount = 0

    while tick.next do
        tick = tick.next
        tickCount = tickCount + 1
        local interval = prevTime and tick.timeFirst - prevTime
        if not maxInterval or interval > maxInterval then maxInterval = interval end
        local spread = tick.field.Ask - tick.field.Bid
        if not minSpread or spread < minSpread then minSpread = spread end
        if not maxSpread or spread > maxSpread then maxSpread = spread end
        prevTime = tick.timeLast
    end
    local lastTrade = tick.field.Trade
    prevTick[rowName] = tick

    return { numTicks = tickCount, lastTrade = lastTrade,
        minSpread = round2dp(minSpread), maxSpread = round2dp(maxSpread), 
        maxInterval = round2dp(maxInterval) }
end

local function postData(feed)
    local totalTicks = 0
    local suffix = ':' .. tostring(feed)
    for instName, _ in pairs(insts) do
        local tick = feed:getTicks(instName)
        local rowName = instName .. suffix
        if tick then
            view.row[rowName] = evaluate(rowName, tick)
            totalTicks = totalTicks + view.row[rowName].numTicks
        else
            view.row[rowName] = { 0 }
        end
    end
    return totalTicks
end

local count = 0
gs.doSample = function()
    count = count + 1
    gs.logMessage(gs.logLevel.INFO, "sample ", count)

    local total = postData(fBase)
    total = total + postData(fOther)
    view:publish()
    gs.logMessage(gs.logLevel.INFO, total, " ticks")
end
