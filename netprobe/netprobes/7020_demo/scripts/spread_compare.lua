-- -------------------------------------------------------------------------------------
-- Spread Compare
-- -------------------------------------------------------------------------------------

local sa = require 'geneos.sampler'
local md = require 'geneos.marketdata'
local sc = require 'geneos.sampler.commands'

local config = require "scripts.config"

-- -------------------------------------------------------------------------------------
-- These are the default values

local baseFeedName = sa.params[ 'baseFeedName' ] or "base"
local altFeedName  = sa.params[ 'altFeedName' ]  or "alt"
local viewName     = sa.params[ 'viewName' ]     or "Spread Compare"

if ( altFeedName == baseFeedName ) then
	altFeedName = baseFeedName .. "A"
end

-- Timezone offset
config.offset = config.offset or 0

-- End of Defaults
-- -------------------------------------------------------------------------------------

-- define columns and publish view

local cols = {  "instrument", "avgbaseBid", "avgbaseAsk", "baseTicks", "baseSpread", "avgaltBid", "avgaltAsk", "altTicks", "altSpread", "BidCompare", "AskCompare" }
local view = assert( sa.createView( viewName, cols ) )

local cols = {  "instrument", "avgbaseBid", "avgbaseAsk", "baseTicks", "baseSpread", "avgaltBid", "avgaltAsk", "altTicks", "altSpread", "BidCompare", "AskCompare" }
local hview = assert( sa.createView( viewName .. " History", cols ) )

-- -------------------------------------------------------------------------------------
-- Load the feed parameters and start the feeds

local sim_config_alt  = config.configure_simulation("f", sa)
local sim_config_base = config.configure_simulation("b", sa)

local baseFeed = md.addFeed( viewName, sim_config_base )
baseFeed:start()

local altFeed = md.addFeed( viewName, sim_config_alt )
altFeed:start()

-- -------------------------------------------------------------------------------------
local instruments = sim_config_base.instruments

local totalTicks = 0

view.headline.totalTicks = totalTicks
view.headline.baseFeed   = baseFeedName
view.headline.altFeed    = altFeedName
view:publish()
hview:publish()
-- -----------------------------------------------------------------------------------------------------------------

-- utility function to round down values
local function roundDown( value, dp )
	dpformat = "%4." .. dp .. "f"
	local mult = 10^( dp or 0 )
	if ( value == 0 ) then
		return string.format( dpformat, 0 )
	end
	return not value or string.format( dpformat, math.ceil( value * mult - 0.5 ) / mult )
end

local function getFeedStats( feed, instrument_name )
	local sumBid, sumAsk, sumSpread, avgBid, avgAsk, avgSpread = 0, 0, 0, 0, 0, 0
	local TickCount = 0

	local values = {}

	local tick = feed:getTicks( instrument_name )				

	if tick then
		local spread = 0
--		local spread   = tick.field.Ask - tick.field.Bid	
-- -----------------------------------------------------------------------------------------------------------------
-- Create Function within function as ticks are local
-- -----------------------------------------------------------------------------------------------------------------
		local getStatsFromTick = function( TicksTable )
			local count = 0
			while TicksTable.next do
               			spread     = TicksTable.field.Ask - TicksTable.field.Bid
                		sumSpread  = sumSpread + spread
                		sumAsk     = sumAsk + TicksTable.field.Ask
                		sumBid     = sumBid + TicksTable.field.Bid

                		count = count + 1
                		TicksTable = TicksTable.next
            		end
		return {
			avgBid       = ( sumBid    / count ),
			avgAsk       = ( sumAsk    / count ),
			avgSpread    = ( sumSpread / count ),
			Ticks        = count
                }
        	end
-- -----------------------------------------------------------------------------------------------------------------

	statsTable = getStatsFromTick( tick )
		
	while tick.next do	
		TickCount = TickCount + 1
		tick = tick.next
	end

	values = {
		avgBid     = statsTable.avgBid,
		avgAsk     = statsTable.avgAsk,
		avgSpread  = statsTable.avgSpread,
		Ticks      = statsTable.Ticks
	}

	end
	return values, TickCount	-- also return the number of ticks observed
end

local function calculateRowStats( instrument_name, err )
	local rowValues = {} 
	local c1, c2

	local baseStats, c1 = getFeedStats( baseFeed, instrument_name )
	--local altStats,  c2 = getFeedStats( altFeed,  instrument_name )
	local altStats = {}
	for n,v in pairs (baseStats) do
		altStats[n] = v
	end
	
	local TickCount = c1 + c1

	local BidCompare, AskCompare = 0, 0

	-- generate some random error into the data
	if err then 
		altStats.avgBid = altStats.avgBid - math.random()
	end
	
	if not baseStats.avgBid or not altStats.avgBid then 
		BidCompare = 0 
	else
		BidCompare = baseStats.avgBid - altStats.avgBid
	end
	if not baseStats.avgAsk or not altStats.avgAsk then 
		AskCompare = 0 
	else
		AskCompare = baseStats.avgAsk - altStats.avgAsk
	end

	
	rowValues = {
		avgbaseBid = roundDown( baseStats.avgBid, 4 ),
		avgbaseAsk = roundDown( baseStats.avgAsk, 4 ),
		baseTicks  = baseStats.Ticks,
		avgaltBid  = roundDown( altStats.avgBid, 4 ),
		avgaltAsk  = roundDown( altStats.avgAsk, 4 ),
		altTicks   = altStats.Ticks,
		baseSpread = roundDown( baseStats.avgSpread, 4 ),
		altSpread  = roundDown( altStats.avgSpread, 4 ),
		BidCompare = BidCompare,
		AskCompare = AskCompare
        }
	return rowValues, TickCount
end

local rowcount = {}
for name, _ in pairs( instruments ) do
        rowcount[ name ] = { count = 1 }
end

local randErr = function(name)
	local err = false
	
	local ran = ((math.random(1,3) % 3) == 0)
	if (name == "AAL" or name == "MKS") and ran then
		err = true
	end
	return err
end

local history = {}

sa.doSample = function()

	for name, i in pairs( instruments ) do
		
		local rowResult, TickCount = calculateRowStats( name, randErr(name) )
		view.row[ name ] = rowResult
		totalTicks = totalTicks + TickCount
		if ( rowResult.BidCompare > 0 ) then
			local hist = history[name]
			if not hist then
				hist = {}
				history[name] = hist
			end
			
			local copy = {}
			for n,v in pairs (rowResult) do
				copy[n] = v 
			end
			copy["instrument"] = name .. ".." .. string.format( "%03i", rowcount[ name ].count )
			rowcount[ name ].count = rowcount[ name ].count + 1
			
			local max = 5
			if #hist >= max then
				for n=1,max-1 do
					hist[n] = hist[n+1]
				end
				hist[max] = copy
			else
				hist[#hist+1] = copy
			end
			
        end

	end
	
	hview.row = {}
	for name,hist in pairs (history) do
		hview.row[name] = {}
		for n=1,#hist do
			hview.row[name.."#"..hist[n].instrument] = hist[n]
		end
	end
	
	view.headline.totalTicks = totalTicks					-- update headline with latest tally
	assert( view:publish() )						-- publish the new view content
	assert( hview:publish() )						-- publish the new view content
end

-- create the command and add to the headline
local Reset = sc.newDefinition()
	:addHeadlineTarget( view, "totalTicks" )		-- added to headline that matches the name 'totalTicks'

local Clear = sc.newDefinition()
	:addRowTarget( hview )		-- added to headline that matches the name 'totalTicks'

local resetTotalTicks = function( target, args )
	totalTicks = 0						-- reset counter
	view.headline.totalTicks = totalTicks 			-- update the view
	assert(view:publish())					-- publish out updated view
end

local clearlines = function( target, args )
        local RowName = target[ "row" ]
        hview.row[ RowName ] = nil
        assert( fview:publish() )
end

sa.publishCommand( "Reset Tick Count", resetTotalTicks,	Reset )

sa.publishCommand( "Clear Lines", clearlines, Clear )

