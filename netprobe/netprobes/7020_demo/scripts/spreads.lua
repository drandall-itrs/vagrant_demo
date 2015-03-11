-- ----------------------------------------------------------------------------------------
-- Spreads
-- ----------------------------------------------------------------------------------------

local sa = require 'geneos.sampler'
local md = require 'geneos.marketdata'
local sc = require 'geneos.sampler.commands'

local config = require "scripts.config"

-- ----------------------------------------------------------------------------------------
-- These are the default values

local feedName = sa.params[ 'feedName' ] or "simulation"
local viewName = sa.params[ 'viewName' ] or "Spreads"

-- Timezone offset
config.offset = config.offset or 0

-- End of Defaults
-- ----------------------------------------------------------------------------------------

-- define columns and publish view

local cols = {	"instrument", "avgAsk", "avgBid", "minSpread", "maxSpread", "Ticks", "avgSpread", "maxInterval", "geoAvgSpread", "stdDevBid", "stdDevAsk", "stdDevSpread", "skewSpread", "kurtosisSpread", "tradePrice" }
local view = assert( sa.createView( viewName, cols ) )

-- ----------------------------------------------------------------------------------------
-- Load the feed parameters and start the feeds

local sim_config = config.configure_simulation("f", sa)

local Feed_0 = md.addFeed( viewName, sim_config)
Feed_0:start()

-- ----------------------------------------------------------------------------------------
local instruments       = sim_config.instruments

local totalTicks = 0

-- ----------------------------------------------------------------------------------------
-- Publish the headlines

view.headline.totalTicks = totalTicks
view.headline.Feed       = feedName
view:publish()
-- ----------------------------------------------------------------------------------------

-- utility function to round down values
local function roundDown( value, dp )
	if ( type( value ) ~= number ) then
		value = value or 0
	end
	local dpformat = "%4." .. dp .. "f"
	local mult = 10^( dp or 0 )
	if ( value == 0 ) then
		return string.format( dpformat, 0 )
	end
	return not value or string.format( dpformat, math.ceil( value * mult - 0.5 ) / mult )
end

calculateRowStats = function( instrument_name )
	local minSpread, maxSpread, maxInterval, tradePrice
	local sumBid, sumAsk, sumSpread, avgBid, avgAsk, avgSpread, geoAvgSpread = 0, 0, 0, 0, 0, 0, 0
	local tickCount, sumBidSq, sumAskSq, sumSpreadSq, sumSpread3, sumSpread4 = 0, 0, 0, 0, 0, 0
	local stdDevBid, stdDevAsk, stdDevSpread, skewSpread, kurtosisSpread = 0, 0, 0, 0, 0
	local multSpread = 1

	local tick = Feed_0:getTicks( instrument_name )

	if tick then
		local spread = 0
		local lastTime = tick.timeLast
-- ----------------------------------------------------------------------------------------
-- Create function within function as ticks are local
-- ----------------------------------------------------------------------------------------
	local getStatsFromTick = function ( TicksTable )
		local count = 0
		while TicksTable.next do
			spread    = TicksTable.field.Ask - TicksTable.field.Bid
			sumSpread = sumSpread + spread
			sumAsk    = sumAsk + TicksTable.field.Ask
			sumBid    = sumBid + TicksTable.field.Bid

			multSpread = spread * multSpread

			if not minSpread or spread < minSpread then minSpread = spread end
			if not maxSpread or spread > maxSpread then maxSpread = spread end

			count = count + 1

			TicksTable = TicksTable.next
		end
		return {
			avgBid       = ( sumBid / count ),
			avgAsk       = ( sumAsk / count ),
			avgSpread    = ( sumSpread / count ),
			geoAvgSpread = multSpread^( 1 / count ),
			minSpread,
			maxSpread
		}
	end
	
	
		local statsTable = getStatsFromTick( tick )
		
		while tick.next do
			local interval = tick.timeFirst - lastTime
			spread  = tick.field.Ask - tick.field.Bid
			if not maxInterval or interval > maxInterval then maxInterval = interval end
			lastTime = tick.timeLast

			tickCount = tickCount + 1 -- count ticks

			-- getting variance here
			sumBidSq = ( tick.field.Bid - statsTable.avgBid ) ^2 + sumBidSq
			sumAskSq = ( tick.field.Ask - statsTable.avgAsk ) ^2 + sumAskSq
			sumSpreadSq = ( spread - statsTable.avgSpread ) ^2 + sumSpreadSq

			-- to calculate skewness and kurtosis
			sumSpread3 = ( spread - statsTable.avgSpread ) ^3 + sumSpread3
			sumSpread4 = ( spread - statsTable.avgSpread ) ^4 + sumSpread4

			tick = tick.next
		end
		tradePrice = tick.field.Trade 						-- Trade price stored from the last tick

		return {
			minSpread      = roundDown( minSpread, 4 ),
			maxSpread      = roundDown( maxSpread, 4 ),
			Ticks          = tickCount,
			maxInterval    = roundDown( maxInterval, 4 ),
			avgBid         = roundDown( statsTable.avgBid, 2 ),
			avgAsk         = roundDown( statsTable.avgAsk, 2 ),
			avgSpread      = roundDown( statsTable.avgSpread, 4 ),
			geoAvgSpread   = roundDown( statsTable.geoAvgSpread, 4 ),
			stdDevBid      = roundDown( math.sqrt( sumBidSq / tickCount), 8 ),
			stdDevAsk      = roundDown( math.sqrt( sumAskSq / tickCount ), 8),
			stdDevSpread   = roundDown( math.sqrt( sumSpreadSq / tickCount ), 8 ),
			skewSpread     = roundDown( ( sumSpread3 / tickCount ) / ( ( sumSpreadSq / tickCount )^( 3 / 2 ) ), 8 ),
			kurtosisSpread = roundDown( ( sumSpread4 / tickCount ) / ( ( sumSpreadSq / tickCount ) ^2 ), 8 ),
			tradePrice     = tradePrice
		}, tickCount
	else
		return {}, 0
	end
end

sa.doSample = function()
	for name,_ in pairs ( instruments ) do 
		local rowResult, additionalTicks = calculateRowStats( name )
		view.row[ name ] = rowResult				
		totalTicks = totalTicks + additionalTicks	
	end
	view.headline.totalTicks = totalTicks
	view:publish()
end

-- create the command and add to the headline
local Reset = sc.newDefinition()
	:addHeadlineTarget( view, "totalTicks" )					-- added to headline that matches the name 'totalTicks'

local resetTotalTicks = function( target, args )
	totalTicks = 0											-- reset counter
	view.headline.totalTicks = totalTicks 					-- update the view
	view:publish()											-- publish out updated view
end

assert( sa.publishCommand( "Reset Tick Count", resetTotalTicks, Reset ) )
