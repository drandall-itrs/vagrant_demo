-- ###################################################################################
-- #                                   tutorial.lua                                  #
-- ###################################################################################
-- # This tutorial script can be starting point for scripting an MDM sampler.        #
-- # It shows how to subscribe to, analyse and publish data, using the example feed. #
-- # It also gives examples of using configuration parameters and a user command.    #
-- ###################################################################################

-- Load the API modules used by the script
local gs  = require 'geneos.sampler'
local md  = require 'geneos.marketdata'
local cmd = require 'geneos.sampler.commands'

local config = require 'config'

-- gs.logMessage('INFO', "Starting")

-- Process configuration parameters
-- ================================

-- Report the sampler managed entity and name
local fullName =  gs.entityName .. '.' .. gs.name

-- Log all configuration parameters (if any)
-- gs.logMessage( 'INFO', "Sampler is ", fullName )
-- for key,value in pairs( gs.params ) do
--    gs.logMessage( 'INFO', 'Parameter "', key, '"="', value, '"' )
-- end

-- Get the 'publishingPeriod' parameter passed to the example feed
-- The parameter is passed as a string, which we must convert to a number.
-- If conversion fails or the parameter is not specified, this will default to 200.
local periodParam = tonumber( gs.params[ 'publishingPeriod' ] ) or 200

local feedName = gs.params[ 'feedName' ] or "tutorial"

-- Get instrument names or default to "GOOG,IBM"
local instrumentsParam = gs.params[ 'instruments' ] or "GOOG,IBM"
local instrumentMap = {}

for inst in string.gmatch( instrumentsParam, "[^,]+" ) do
    instrumentMap[ inst ] = string.format( "DATA_SERVICE.%s", inst )
end

-- Configure and connect to market data sources
-- ============================================

-- Feed configuration is stored in a Lua table
local feedConfiguration = config[ feedName ]

-- populate the instrument table within the feed configuration
--
config[ feedName ].instruments = instrumentMap

-- Create and start a feed using the above config
local tutorialFeed = assert( md.addFeed( "Tutorial-Feed", feedConfiguration ) )
tutorialFeed:start()

-- Define functions to analyse the data
-- ====================================

-- Utility function to round non-nil (positive) values to two decimal places
local function round2dp( value )
    return value and math.floor( value * 100 + 0.5 ) / 100
end

-- A table to map instrument names to the last tick seen for each instrument
local prevTick = {}

-- A function to process the sample data for a specific instrument.
-- Takes a single string argument; the instrument name.

local function processTicks( instName )

--	create empty tick or populate tick with previous tick
--
	local tick = prevTick[ instName ] or { field = {} }

--	get the ticks from the feed

    	tick.next = tutorialFeed:getTicks( instName )
    -- Extract required values from 'tick'
    	local prevTime = tick.timeLast

    -- Metrics we will compute from the tick data
    local tickCount, maxInterval, minSpread, maxSpread, maxAsk, maxBid
    tickCount = 0

    -- Iterate over the ticks
    while tick.next do
        tick = tick.next

        -- Use tick data to calculate metrics
        tickCount = tickCount + 1

        interval = 0
		interval = prevTime and tick.timeFirst - prevTime
        if not maxInterval or interval > maxInterval then maxInterval = interval end
        prevTime = tick.timeLast

        local spread = tick.field.Ask - tick.field.Bid
        if not minSpread or spread < minSpread then minSpread = spread end
        if not maxSpread or spread > maxSpread then maxSpread = spread end
        if not maxAsk or maxAsk < tick.field.Ask then maxAsk = tick.field.Ask end
        if not maxBid or maxBid < tick.field.Bid then maxBid = tick.field.Bid end
    end
    prevTick[ instName ] = tick

    -- Create a table of row values.
    -- We will place this result directly into a view, so the field names must match the column names.
    local rowValues = {
        ticksPerSample = tickCount,
        maxInterval    = round2dp( maxInterval ),
        minSpread      = round2dp( minSpread ),
        maxSpread      = round2dp( maxSpread ),
        tradePrice     = tick.field.Trade,
        feedgap        = string.format( "%1.5f", interval ),
    	maxAsk         = round2dp( maxAsk ),
	    maxBid         = round2dp( maxBid )
}
    -- Return two values; (1) a table of row values and (2) the count of new ticks
    return rowValues, tickCount
end

-- Create data view(s)
-- ===================

-- Define columns and create view
local cols = { "instrument", "minSpread", "maxSpread", "ticksPerSample", "maxInterval", "maxAsk", "maxBid", "tradePrice", "feedgap" }
local view = assert(gs.createView("spreads", cols))

-- Publish initial view data
view.headline.totalTicks = 0
view.headline.period = periodParam

assert(view:publish())

-- Define the doSample function which will be called every sample
-- ==============================================================

local totalTicks = 0

gs.doSample = function()

    for name, _ in pairs( feedConfiguration.instruments ) do  -- Loop over each subscribed instrument
        local rowResult, tickCount = processTicks( name )     -- processTicks() returns 2 values
        view.row[ name ] = rowResult                          -- update view row for this instrument with new metrics
        totalTicks = totalTicks + tickCount                   -- update tally of total ticks observed
    end
    view.headline.totalTicks = totalTicks
    assert(view:publish())
end

-- Command definitions
-- ===================

-- Define a command
-- The target specifies the command will appear on the 'totalTicks' headline variable
local cmdDef = cmd.newDefinition()
    :addHeadlineTarget( view, "totalTicks" )

-- Define a function which implements the command
local resetTotalTicks = function( target,args )
    totalTicks = 0
    view.headline.totalTicks = totalTicks
    assert( view:publish() )
end

-- Publish the command
assert( gs.publishCommand(
    "Reset Tick Count",  -- Name of the command
    resetTotalTicks,     -- Function to execute
    cmdDef               -- The command definition
) )

--gs.logMessage('INFO', "Started OK")
-- End of script

