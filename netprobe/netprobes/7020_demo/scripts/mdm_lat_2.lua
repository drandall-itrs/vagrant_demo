--- ------------------------------------------------------------------------------
--- latency_calculation.lua
--
--  Example code to demonstrate how to call the latency algorithm
--  and retrieve tick statistics
--  
--- --------------------------------------------------------------------------------
-- Import packages
local gs = require "geneos.sampler"
local lt = require "geneos.latency"
local lf = require "geneos.latency.files"

local config = require 'config'

-- Define fields and instruments
local local_fields       = { Bid = "BID", Ask = "ASK" }
local local_instruments  = { GBP = "IDN_RDF.GBP=", EUR = "IDN_RDF.EUR=", CHF = "IDN_RDF.CHF=" }

local scriptpath = "/home/geneos/packages/netprobe/scripts/rfa_omm.cfg"
local libpath    = "/home/geneos/packages/netprobe/active_001/flm/"

-- Using an RFA base data source

local Feed_0 = config[ rfa ]

for key,value in pairs( Feed_0.rfa ) do
    gs.logMessage( 'INFO', 'Parameter "', key, '"="', value, '"' )
end

--local Feed_0 = 
--{	
--	feed = { type = "rfa", ["library.filename"] = libpath .. "flm-feed-rfa.so"},
--	rfa  = { configFile = scriptpath, session = "sessionrdf_mdi", connectionType = "MDI" },
--	instruments = local_instruments,
--	fields      = local_fields
--}

local Feed_1 = 
{
	feed = { type = "rfa", ["library.filename"] = libpath .. "flm-feed-rfa.so"},
	rfa  = { configFile = scriptpath, session = "sessionrh1_omm", connectionType = "OMM" },
	instruments = local_instruments,
	fields      = local_fields
}
local Feed_2 =
{
	feed = { type = "rfa", ["library.filename"] = libpath .. "flm-feed-rfa.so"},
	rfa  = { configFile = scriptpath, session = "sessionrh2_omm", connectionType = "OMM" },
	instruments = local_instruments,
	fields      = local_fields
}

local Feed_3 =
{
	feed = { type = "rfa", ["library.filename"] = libpath .. "flm-feed-rfa.so"},
	rfa  = { configFile = scriptpath, session = "sessionsol2_omm", connectionType = "OMM" },
	instruments = local_instruments,
	fields      = local_fields
}

local Feed_4 =
{
	feed = { type = "rfa", ["library.filename"] = "flm-feed-rfa.so"},
	rfa  = { configFile = scriptpath, session = "sessionsol3_omm", connectionType = "OMM" },
	instruments = local_instruments,
	fields      = local_fields
}

-- Create and configure the latency context
local ctx = lt.newContext() 			-- Create the context object here
	:setBase( "Feed_0",  Feed_0 )		-- Register the base feed
	:addFeed( "Feed_1",  Feed_1 )		-- Add an alternate feed
	:addFeed( "Feed_2",  Feed_2 )		-- Add an alternate feed
	:addFeed( "Feed_3",  Feed_3 )		-- Add an alternate feed
	:addFeed( "Feed_4",  Feed_4 )		-- Add an alternate feed
	
-- Create tick loggers and start the context
local historyLogger     = lf.newTickHistoryFile( gs.name .. ".%y%m%d.ticks" )
local matchedTickLogger = lf.newMatchedTicksFile( ctx:getConfiguredNames(), gs.name .. ".%y%m%d.csv" )

ctx:addWriter( historyLogger:getWriter() )	  -- Register the history logger's tick writer method
	:addWriter( matchedTickLogger:getWriter() ) -- and the same for the matched tick logger
	:start()								  -- Start the subscriptions

-- Create a view to display the data
local view = gs.createView( "Latency", { "feed", "status", "numTicks", "numMatches", "minLatency", "maxLatency", "avgLatency" } )

view.headline.baselineFeed = "RDF"
view.headline.instruments  = local_instruments

view:publish()							-- Publish a stats view, similar to FLM Latency view

local function formatMillisec(value)    -- Format nil value as blank string
    return value and string.format( "%0.1f", value * 1000 ) or ""
end

local count = 0

gs.doSample = function()
	count = count + 1

	ctx:sample()								-- Process the sample
	local mFeed_0 = ctx:getMetrics( "Feed_0")	-- Grab metrics from the base feed
	local mFeed_1 = ctx:getMetrics( "Feed_1")	-- Grab metrics from the altenate feed
	local mFeed_2 = ctx:getMetrics( "Feed_2")	-- Grab metrics from the altenate feed
	local mFeed_3 = ctx:getMetrics( "Feed_3")	-- Grab metrics from the altenate feed
	local mFeed_4 = ctx:getMetrics( "Feed_4")	-- Grab metrics from the altenate feed
	
	if mFeed_0.numTicks > 1 then

		view.row = {}
	
		view.row[ "Feed_0" ] = {
			ctx:getFeedStatus( "Feed_0" ),		-- Status of the base feed
			mFeed_0.numTicks,					-- Add remaining stats to row
			mFeed_0.matches,
			"",									-- The base feed has no latency stats
			"",
			""
		}
		view.row[ "Feed_1" ]  = {
			ctx:getFeedStatus( "Feed_1" ),
			mFeed_1.numTicks, 							-- Add remaining stats to row
			mFeed_1.matches, 
			formatMillisec( mFeed_1.latMin ), 
			formatMillisec( mFeed_1.latMax ), 
			formatMillisec( math.abs( mFeed_1:getAverage() ) ),
		}
		view.row[ "Feed_2"]  = {
			ctx:getFeedStatus( "Feed_2" ),
			mFeed_2.numTicks, 							-- Add remaining stats to row
			mFeed_2.matches, 
			formatMillisec( mFeed_2.latMin ), 
			formatMillisec( mFeed_2.latMax ), 
			formatMillisec( math.abs( mFeed2:getAverage() ) ),
		}
		view.row[ "Feed_3"]  = {
			ctx:getFeedStatus( "Feed_3" ),
			mFeed_3.numTicks, 							-- Add remaining stats to row
			mFeed_3.matches, 
			formatMillisec( mFeed_3.latMin ), 
			formatMillisec( mFeed_3.latMax ), 
			formatMillisec( math.abs( mFeed3:getAverage() ) ),
		}
		view.row[ "Feed_4"]  = {
			ctx:getFeedStatus( "Feed_4" ),
			mFeed_4.numTicks, 							-- Add remaining stats to row
			mFeed_4.matches, 
			formatMillisec( mFeed_4.latMin ), 
			formatMillisec( mFeed_4.latMax ), 
			formatMillisec( math.abs( mFeed4:getAverage() ) ),
		}
		view:publish()								-- publish the updated view to Geneos
	else
		view.row[ "Feed_0" ] = { "no ticks" }
	end
end

