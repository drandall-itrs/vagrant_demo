
require 'math'
local modf = math.modf
local floor = math.floor

local sim = require 'simulation.feedsim'

--[[
                 Utility Functions
				 =================
--]]

-- Logging constants for the feed.logMessage function
local DEBUG = 50
local INFO  = 40
local WARN  = 30
local ERROR = 20
local FATAL = 10

-- Recursively print contents of a Lua table (useful for debugging)
-- Note, this function does not handle cycles in the object graph.
-- @param var     The variable to print
-- @param indent  Optional indentation prefix-string
-- @usage printr(someTable)
function printr(var, indent)
	indent = indent or ""
	local typ = type(var);
	if (typ == "table") then
		-- Recursively print all table keys (to Netprobe log)
		feed.logMessage(INFO, indent, "\t", typ)
		for k,v in pairs(var) do
			printr(v, indent.."\t["..tostring(k).."]")
		end
	else
		-- Print simple value type (to Netprobe log)
		feed.logMessage(INFO, indent, "\t", typ, "\t", tostring(var))
	end
end

--[[
                 Instrument publishing
				 =====================
--]]

-- The instruments this feed is subscribed to.
-- We update this mapping in response to subscribe/unsubscribe events received from Netprobe.
local subscribed_instruments = {}

local function convertAndPublish(simTick)
	local inst = simTick.feed..simTick.inst
	if subscribed_instruments[inst] then
		local sec, frac = modf(simTick.time)
		local tick = { instrument = inst, time = { sec = sec, usec = floor(frac * 1000000) }, fields = simTick.field }
		
		local srcTime = simTick.time - (math.random() / 5) -- range 0-200 millis
		-- print("srcTime ",srcTime, " simTick.time ", simTick.time, " diff " ,  simTick.time - srcTime)
		tick.fields.srcTime = srcTime
		
		feed.publish(tick)
	end
end

--[[
                 Event processing
				 ================
--]]

-- Controls the main feed loop
-- The feed will continue to run until this variable becomes false
local run = true
local instSeq = 0

-- Event processing handler functions
local handler_map = {
	terminate = function(event)
		feed.logMessage(INFO, "Terminate event received, ending feed script")
		run = false
	end,
	subscribe = function(event)
		-- Create a tick for the requested instrument, used for publishing
		local inst = event
		inst.type = nil
		instSeq = instSeq + 1
		inst.fields.seq = instSeq
		inst.time = { sec=0, usec=0 }
		-- Register the instrument
		subscribed_instruments[event.instrument] = inst
		sim.subscribe(event.instrument)
		feed.logMessage(INFO, "Added subscription for instrument '", event.instrument, "'")
	end,
	unsubscribe = function(event)
		-- Unregister the specified instrument
		subscribed_instruments[event.instrument] = nil
		feed.logMessage(INFO, "Removed subscription for instrument '", event.instrument, "'")
	end
}
-- Checks for events from the FLM plug-in and handles them
local function checkEvents(timeout)
	-- Wait for an event (with optional timeout)
	local event = feed.getEvent(timeout)
	while event do
		local handler_func = handler_map[event.type]
		if handler_func then
			-- Call the handler function, passing the event
			handler_func(event)
		end
		event = feed.getEvent()
	end
end

--[[
                 Main loop
				 =========
--]]

-- The "feed" global object is created by flm-feed-lua.so:
feed.logMessage(INFO, "feed:")
printr(feed.params)
feed.logMessage(INFO, "")

-- Extract parameters for this feed
local delay = tonumber(feed.params["lua.delay"]) or 1.0
local maxSteps = tonumber(feed.params["lua.maxSteps"])
sim.configure(feed.params)

sim.setOnTick(convertAndPublish)

-- The feed event loop
while (run) do
	checkEvents()
	local s = feed.gettimeofday()
	sim.runTo(s - delay, maxSteps)
	feed.sleep(1.0)
end
