--- ------------------------------------------------------------------------------
--- feed_simulation.lua
--- --------------------------------------------------------------------------------
local gs = require 'geneos.sampler'
local gsc = require 'geneos.sampler.commands'
local md = require 'geneos.marketdata'
local gh = require 'geneos.helpers'

local base = "Base-Sim"
local other = "Other-Sim"

if not gs.params['lua.script'] then
    gs.params['lua.script'] = "simulation/luaFeed_Sim.lua"
end

local insts = {}
local noiseLevel = 6
local maxBadRows = 10
for k, v in pairs(gs.params) do
    local n = string.match(k, 'inst%.(%w+)')
    if n then
        insts[n] = v
        gs.params[k] = nil
    elseif k == 'noiseLevel' then
        noiseLevel = tonumber(v)
        if not noiseLevel or noiseLevel < 0 then noiseLevel = 0 end
        gs.params[k] = nil
    elseif k == 'maxBadRows' then
        maxBadRows = tonumber(v)
        if not maxBadRows or maxBadRows < 0 or maxBadRows > 99 then maxBadRows = 10 end
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

local vwInfo = gs.createView("FEED-INFO", {"Subscription", "numTicks", "lastTrade", 
    "minSpread", "maxSpread", "maxInterval", "badTicks"})
vwInfo:publish()

local vwBadTicks = gs.createView("BAD-TICKS", {"Tick", "Time", "Bid", "Ask", "Trade"})
vwBadTicks:publish()

local function round2dp(value)
    return value and math.floor(value * 100 + 0.5) / 100
end

local prevTick = {}
local badTicks = {}
local badTickInfo = {}

local function badTick(subscription, tick)
    local badCount = (badTicks[subscription] or 0) + 1
    badTicks[subscription] = badCount

    local info = badTickInfo[subscription]
    if not info then
        info = { keys = {}, count = 0 }
        badTickInfo[subscription] = info
    end

    local formattedTime = gh.formatTime(nil, tick.timeFirst)
    gs.logMessage(gs.logLevel.INFO, 
        "bad tick at ", formattedTime, 
        "; got ", badCount, " so far for ", subscription)

    local rowId = subscription..string.format(":%04d", badCount)
    local data = { Time = formattedTime }
    for i = 3, 5 do
        local col = vwBadTicks.columns[i]
        data[col] = tick.field[col]
    end
    vwBadTicks.row[rowId] = data

    table.insert(info.keys, rowId)
--    gs.logMessage("DEBUG", " added ", rowId)
    if info.count < maxBadRows then
        info.count = info.count + 1
    else
        rowId = table.remove(info.keys, math.floor(maxBadRows / 2) + 1)
        vwBadTicks.row[rowId] = nil
    end
    vwBadTicks:publish()
end

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
        if spread < 0 then
            badTick(rowName, tick)
        end
    end
    local lastTrade = tick.field.Trade
    prevTick[rowName] = tick

    return { numTicks = tickCount, lastTrade = lastTrade,
        minSpread = round2dp(minSpread), maxSpread = round2dp(maxSpread), 
        maxInterval = round2dp(maxInterval), badTicks = badTicks[rowName] }
end

local function postData(feed)
    local totalTicks = 0
    local suffix = ':' .. tostring(feed)
    for instName, _ in pairs(insts) do
        local tick = feed:getTicks(instName)
        local rowName = instName .. suffix
        if tick then
            vwInfo.row[rowName] = evaluate(rowName, tick)
            totalTicks = totalTicks + vwInfo.row[rowName].numTicks
        else
            vwInfo.row[rowName] = { 0 }
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
    vwInfo:publish()
    gs.logMessage(gs.logLevel.INFO, total, " ticks")
end

assert(gs.publishCommand(
    'deleteBadRow',
    function(target, args)
        if target.row then
            local subscription = string.match(target.row, "(.+):%d+")
            gs.logMessage("DEBUG", "Dropping a bad row for ", subscription)
            local info = badTickInfo[subscription]
            for i = 1, #info.keys do
                if info.keys[i] == target.row then
                    table.remove(info.keys, i)
                    info.count = info.count - 1
                    vwBadTicks.row[target.row] = nil
                    break
                end
            end
            vwBadTicks:publish() -- bug fix
        else
            gs.logMessage("WARN", "Unexpected target in deleteBadRow")
        end
    end,
    gsc.newDefinition():setDescription('Delete row'):addRowTarget('BAD-TICKS', "*")
))
