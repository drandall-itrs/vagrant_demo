
require("math")
require("os")
local gs = require 'geneos.sampler'
local md = require 'geneos.marketdata'

--- Formats a timestamp as human readable string, interpreted using the local timezone
-- @param tm The timestamp to format.
-- @return A string representation of the timestamp.
local function formatTime(tm)
	local s, us = math.modf(tm)
	return os.date("%Y%m%d-%H:%M:%S.", s) .. string.format("%06d", us * 1000000)
end

--- Formats a single tick as a string, displaying all fields and values.
-- @param tick The tick to format.
-- @return A string representation of the tick.
local function formatTick(tick)
	local t = {}
	local time = string.format("time=%s", formatTime(tick.timeFirst))
	if tick.timeFirst ~= tick.timeLast then
		time = time .. "->" .. formatTime(tick.timeLast)
	end
	t[1] = time
	for k,v in pairs(tick.field) do
		t[#t + 1] = k.."="..v
	end
	return table.concat(t, ", ")
end

--- Prints all ticks for a given instrument on a feed.
-- @param feed Feed on which the instrument is subscribed.
-- @param inst Name of the instrument to output ticks for.
local function printTicks(feed, inst)
	local tick = feed:getTicks(inst)
	while tick do
		print(feed, inst, formatTick(tick))
		tick = tick.next
	end
end

local simulationParams = {
	script = "simulation/luaFeed_Sim.lua",
	profile = {
		fast   = { pause = 0.15, trade = 400 },
		lumpy  = { pause = 0.25, move = 20 },
		slow   = { pause = 0.45 },
	},
	feed = {
		b = { trigger = 'trade' }, 
		f = { trigger1 = 'bid', trigger2 = 'ask', delay = 0.04, },	
	},
	seed = 42,
}

local fieldMap = { Trade = "trade", Ask = "ask", Bid = "bid" }

local insts = { ABC = "fast", XYZ = "dodgy", PQR = "slow" }

-- This is the Lua equivalent of FLM's Instrument Group
local instMap = function(prefix)
	local map = {}
	for name, profile in pairs(insts) do
		map[name] = string.format("%s.%s.%s", prefix, name, profile)
	end
	return map
end

-- Base line and comparison feed have alsmost identical configuration
-- the prefix controls which simulated feed the ticks come from.
local lb = md.addFeed("LuaBase", {
	feed = {
		type = "lua",
		verbose = "true",
		library = { filename = "geneos-feed-lua.so" },
	},
	lua = simulationParams,
	instruments = instMap("b"),
	fields = fieldMap,
})
lb:start()

local lf = md.addFeed("LuaFeed", {
	feed = {
		type = "lua",
		verbose = "true",
		library = { filename = "geneos-feed-lua.so" },
	},
	lua = simulationParams,
	instruments = instMap("f"),
	fields = fieldMap,
})
lf:start()

-- Our sample method, called every second
local count = 0
gs.doSample = function()
	count = count + 1
	print("Sample "..count, "Status "..lf:getStatus())
	for name, _ in pairs(insts) do
		printTicks(lb, name)
		printTicks(lf, name)
	end
	if count == 10 then
		-- End the test
		return false
	end
end
