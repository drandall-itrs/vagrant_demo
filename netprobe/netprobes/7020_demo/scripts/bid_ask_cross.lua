-- --------------------------------------------------------------
-- Bid Ask Crossover
-- One Source - detect if ASK is less than BID
-- --------------------------------------------------------------

local sa = require "geneos.sampler"
local md = require "geneos.marketdata"
local lt = require "geneos.latency"
local he = require "geneos.helpers"
local sc = require "geneos.sampler.commands"

--- Common configuration file

local config = require "config"

-- --------------------------------------------------------------
-- Parse the gateway command for parameters
--
-- if not found set a default value

local feedName = sa.params[ 'feedName' ] or "Bloomberg"
local viewName = sa.params[ 'viewName' ] or "Bid Ask CrossOver"
local rowValue = sa.params[ 'rowValue' ] or 0

-- --------------------------------------------------------------
-- Parse the config file for parameters
--
-- offset is timezone offset, default of 0
--
-- instruments and fields are within feed pragma

config[ feedName ].instruments = config[ feedName ].instruments or config.instruments
config[ feedName ].fields      = config[ feedName ].fields      or config.fields

-- End of Defaults
-- ---------------------------------------------------------------

local feedConfiguration = config[ feedName ]

local Feed = md.addFeed( feedName, feedConfiguration )

-- start the feed

Feed:start()

-- create the dataview
--
-- setup the column titles
--
local cols = {	"instrument", "bid", "ask", "bid_ask", "srcTime", "ticks" }
local view = assert( sa.createView( viewName, cols ) )

local cols = {	"instrument", "bid", "ask", "bid_ask", "srcTime" }
local sview = assert( sa.createView( viewName .. " History", cols ) )

-- publish 1st dataview

view.headline.Now = he.formatTime( "%d/%m/%y %H:%M:%S.%6f", he.gettimeofday( ) )
view:publish()

-- ----------------------------------------------------------------
-- function - processTicks
-- ----------------------------------------------------------------
local function processTicks( instrument )

	local tickCount = 0
	local tick      = {}
	local rowValues = {}

--	get ticks

	tick.next = Feed:getTicks( instrument )

	while tick.next do
		tick = tick.next
		local Bid_Ask = string.format( "%5.5f", ( tick.field.Bid - tick.field.Ask ) )
		if ( Bid_Ask >= rowValue ) then
			tickCount = tickCount + 1
			rowValues = {
				bid      = tick.field.Bid,
				ask      = tick.field.Ask,
				srcTime  = tick.field.SrcTime,
				ticks    = tickCount,
				bid_ask  = Bid_Ask
			}
			view.row[ instrument ] = rowValues
		end
	end

-- Return two values; (1) a table of row values, (2) the count of new ticks

	return rowValues, tickCount
end

local rowcount = {}
for name, _ in pairs( feedConfiguration.instruments ) do
	rowcount[ name ] = { count = 1 }
end

sa.doSample = function()

for name, _ in pairs( feedConfiguration.instruments ) do

	local rowResult, tickCount = processTicks( name )

	if ( tickCount ) > 0 then
		view.row[ name ] = rowResult
--
--	History View
--
		if ( rowcount[ name ].count <= 4 ) then
--			local rowName = "   " .. name .. ".." .. rowcount[ name ].count
			local rowName = name .. ".." .. rowcount[ name ].count
			if ( sview.row[ rowName ] == nil ) then
				sview.row[ rowName ] = rowResult
				rowcount[ name ].count = rowcount[ name ].count + 1
				break
			end
		end
	end
end

	view.headline.Now = he.formatTime( "%d/%m/%y %H:%M:%S.%6f",he.gettimeofday() )
--
--	publish to gateway
--
	view:publish()
	sview:publish()
end

-- Command definitions
-- ===================

-- Define a command
local cmdDef = sc.newDefinition()
    cmdDef:addRowTarget( sview )

-- Define a function which implements the command
local resetHistory = function( target, args )
	local RowName = target[ "row" ]
	sview.row[ RowName ] = nil
	assert( sview:publish() )
end

-- Publish the command
assert( sa.publishCommand(
	"Reset History",     -- Name of the command
	resetHistory,        -- Function to execute
	cmdDef               -- The command definition
	)
)
