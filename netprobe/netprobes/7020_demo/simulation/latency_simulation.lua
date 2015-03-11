--- ------------------------------------------------------------------------------
--- latency_simulation.lua
--- --------------------------------------------------------------------------------
local gh = require "geneos.helpers"
local gs = require "geneos.sampler"
local lt = require "geneos.latency"
local lf = require "geneos.latency.files"
local md = require "geneos.marketdata"

local instNames = { "ABC", "XYZ", }

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

-- Simulator provides reasonable data for trade, bid and ask
-- It also provides up to six noise fields
local fieldNames = { "Trade", "Bid", "Ask", }
local realFields = #fieldNames
for i = 1, noiseLevel do
    local fn = 'Noise' .. i
    fieldNames[realFields+i] = fn
end

local fieldMap = {}
for i = 1, realFields + noiseLevel do
    local fn = fieldNames[i]
    fieldMap[fn] = fn:lower()
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

local function assertOkOrNotFound(ok, err)
    if not ok and not err:find("No such file") then
        error(err, 2)
    end
end

local function getSizeCappedLogger(sizeLimit, keepFiles, interval)
    local runningOnWindows = package.config:sub(1,1) == "\\"
    local sizeCmdTemplate = runningOnWindows and "for %%I in (%s) do @echo %%~zI" 
                                              or "du -b %s | cut -f1"

    local function callback(logger)
        local actualName = logger:getActualFilename()
        if not actualName then return end

        local sizeCmd = string.format(sizeCmdTemplate, actualName)
        local pipe = assert(io.popen(sizeCmd))
        local result = pipe:read('*n')
        pipe:close()

        gs.logMessage("INFO", "Size of ", actualName, " is now ", result)
        if result > sizeLimit then
            local rollTemplate = actualName .. ".%d"
            local rollTo = rollTemplate:format(keepFiles)
            assertOkOrNotFound(os.remove(rollTo))
            for n = keepFiles, 1, -1 do
                local rollFrom = n > 1 and rollTemplate:format(n-1) or actualName
                assertOkOrNotFound(os.rename(rollFrom, rollTo))
                rollTo = rollFrom
            end
        end
    end

    local logger = lf.newTickHistoryFile(gs.name .. ".tick.history")
    return logger:setFileRoll(interval, gh.gettimeofday() + interval, callback)
end

-- Use history writer with size-based file rolling and 20-second interval between checks
local histFile = getSizeCappedLogger(2000000, 3, 20)

local ctx = lt.newContext{ timeDiffMin = -0.2, timeDiffMax = 0.8, tolerances = { Noise6 = 0 } }
    :addWriter(histFile:getWriter())    -- Register the writer callback
    :setBase(base,  makeConfig("b"))    -- Register the base feed
    :addFeed(other, makeConfig("f"))    -- Add an alternate feed
    :start()                            -- Start the system, will automatically start the feed subscriptions

local function formatMillisec(value)    -- Format nil value as blank string
    return value and string.format("%0.1f", value*1000) or ""
end

local vwLat = gs.createView("LATENCY", {"feed", "status", "numTicks", "numMatches", "minLatency", "maxLatency",
    "avgLatency", "stdDevLatency" })
vwLat.headline.baselineFeed = base
vwLat:publish()                          -- Publish a stats view, similar to FLM Latency view

local interval = 1
local function displayLatency()
    vwLat.row = {}

    local mBase = ctx:getMetrics(base)          -- Grab metrics from the base feed
    vwLat.row[base] = {
        ctx:getFeedStatus(base),
        mBase.numTicks,
        mBase.matches,
    }

    local mAlt  = ctx:getMetrics(other)         -- Grab metrics from the altenate feed
    vwLat.row[other]  = {
        ctx:getFeedStatus(other),
        mAlt.numTicks,
        mAlt.matches, 
        formatMillisec(mAlt.latMin), 
        formatMillisec(mAlt.latMax), 
        formatMillisec(mAlt:getAverage()), 
        formatMillisec(mAlt:getStdDev()), 
    }

    local sampleTicks = mBase.numTicks + mAlt.numTicks
    vwLat.headline.rate = sampleTicks / interval
    vwLat:publish()
end

local colNames = { "instr_feed" }
for i = 1, #fieldNames do
    colNames[i+1] = fieldNames[i]
end
local vwValues = gs.createView("VALUES", colNames)

local function setValues(inst, feed)
    local tick = ctx:getLastTick(feed, inst)
    if tick then
        local cols = {}
        for i, fn in ipairs(fieldNames) do
            cols[i] = tick.field[fn]
        end
        vwValues.row[string.format("%s_%s", inst, feed)] = cols
    end
end

local function displayValues()
    for name, _ in pairs(insts) do
        setValues(name, base)
        setValues(name, other)
    end
    vwValues:publish()
end

local lastTime = gh.gettimeofday()
local count = 0
gs.doSample = function()
    local now = gh.gettimeofday()
    interval = now - lastTime
    lastTime = now
    count = count + 1
    gs.logMessage(gs.logLevel.INFO, "sample ", count)

    ctx:sample()
    displayLatency()
    displayValues()
end

gs.finalise = function()
    ctx:writeHistory()
    histFile:close()
end
