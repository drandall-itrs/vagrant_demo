--- ----------------------------------------------------------------------------------
--- Two Sources - one symbol: relative latency
--- ----------------------------------------------------------------------------------

local sa = require "geneos.sampler"
local lt = require "geneos.latency"
local md = require "geneos.marketdata"

local config = require "config"

-- ----------------------------------------------------------------------------------
-- These are the default values

local baseFeedName = sa.params[ 'baseFeedName' ] or "bloomberg"
local altFeedName  = sa.params[ 'altFeedName'  ] or "bloomberg"

if ( baseFeedName == altFeedName ) then
	altFeedName = baseFeedName .. "A"
end

local viewName = sa.params[ 'viewName' ] or "Relative Latency"

-- sa.logMessage( "INFO", "baseFeedName "..baseFeedName.." altFeedName "..altFeedName )

-- Timezone offset
config.offset = config.offset or 0

-- Base
config[ baseFeedName ].instruments = config[ baseFeedName ].instruments or config.bloominstruments
config[ baseFeedName ].fields      = config[ baseFeedName ].fields      or config.bloomfields

-- Second
config[ altFeedName ].instruments = config[ altFeedName ].instruments or config.bloominstruments
config[ altFeedName ].fields      = config[ altFeedName ].fields      or config.bloomfields

-- End of Defaults

-- Example WriterCallBack function
--local function WriterCallBack( my_event, my_data )
--
--	myEvent could be one of sampleTime, tick, sampleEnd
--
--	if my_event == 'sampleTime' then		-- SampleTime event
--		print "Got sample..."
--	end
--	if my_event == 'tick' then
--		local tick = my_data
--	end
--end

local ctx = lt.newContext()			-- create the context object here
--	ctx:addWriter( WriterCallBack )			-- register the writer WriterCallBack
	ctx:setBase( baseFeedName, config[ baseFeedName ] )	-- Register the base feed
	ctx:addFeed( altFeedName,  config[ altFeedName  ] )	-- add an alt feed
	ctx:start()					-- start the system, will automatically start feed subscriptions

-- creating view
local cols = { "feed", "status", "numTicks", "numMatches", "minLatency", "maxLatency" }
local view = sa.createView( viewName, cols )

--      create history statistics view

local sview = assert( sa.createView( viewName .. " History", cols ) )

view.headline.baselineFeed = baseFeedName
view.headline.altlineFeed  = altFeedName

view:publish()					-- publish view, similar to FLM latency view

sa.doSample = function()

	ctx:sample()						-- instruct the latency context to update its stats
	local Base_metrics = ctx:getMetrics( baseFeedName )	-- grab metrics from base feed
	local Alt_metrics  = ctx:getMetrics( altFeedName  )	-- grab metrics from alt feed

	view.row = {}
	view.row[ baseFeedName ] = {
		ctx.base.feed:getStatus(),		-- status of base feed
		Base_metrics.numTicks,			-- add remaining stats to row
		Base_metrics.matches,
		"",					-- note base feed will have no latency stats
		""
	}

	view:publish()
	
	sview.row = {}
	sview.row[ baseFeedName ] = view.row[ baseFeedName ]

	sview:publish()

	local min = ""
	if( Alt_metrics.latMin ~= nil ) then
		min = string.format( "%0.0f", Alt_metrics.latMin * 1000 )	-- handle formatting in case of nil value
	end
	local max = ""
	if( Alt_metrics.latMax ~= nil ) then
		max = string.format( "%0.0f", Alt_metrics.latMax * 1000 )
	end

	local alt = ctx:getFeedNum( altFeedName )		-- lookup the feed id for the alt-feed
	view.row[ altFeedName ] = {
		ctx.feeds[ alt ].feed:getStatus(),		-- use feed it to lookup feed status
		Alt_metrics.numTicks,				-- add remaining stats to row
		Alt_metrics.matches,
		min,
		max
	}
	local HFeedName = altFeedName .. " Max"
	local LFeedName = altFeedName .. " Min"

	if ( sview.row[ altFeedname ] == nil ) then
		sview.row[ HFeedName ] = view.row[ altFeedName ]
		sview.row[ LFeedName ] = view.row[ altFeedName ]
	else
		if (  min < sview.row[ altFeedName ].minLatency ) then
			sview.row[ LFeedName ] = view.row[ altFeedName ]
		end
		if (  max > sview.row[ altFeedName ].maxLatency ) then
			sview.row[ HFeedName ] = view.row[ altFeedName ]
		end
	end

	view:publish()
	sview:publish()
end
