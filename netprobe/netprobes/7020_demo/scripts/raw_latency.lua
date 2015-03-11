-- --------------------------------------------------------------
-- Raw Latency
-- One Feed   - time difference between last tick timestamp and sample time
-- --------------------------------------------------------------

local sa = require "geneos.sampler"
local md = require "geneos.marketdata"
local lt = require "geneos.latency"
local he = require "geneos.helpers"
local sc = require "geneos.sampler.commands"

--- Common configuration file

local config = require "scripts.config"

-- --------------------------------------------------------------
-- Parse the gateway command for parameters
--
-- if not found set a default value

local feedName = sa.params[ 'feedName' ] or "lua"
local viewName = sa.params[ 'viewName' ] or "Raw Latency"
local offset   = sa.params[ 'offset'   ] or "3"

-- create log entry into netprobe.log

-- sa.logMessage( "INFO","feedName " .. feedName )

-- --------------------------------------------------------------
-- Parse the config file for parameters
--
-- offset is timezone offset, default of 0
--
-- instruments and fields are within feed pragma

config.offset = tonumber( offset )

-- ---------------------------------------------------------------

local feedConfiguration = config.configure_simulation("f", sa)

local Feed = md.addFeed( feedName, feedConfiguration )

-- start the feed

Feed:start()

local offset = config.offset

-- create the dataview
--
-- setup the column titles
--
local cols = {	"instrument", "bid", "ask", "srcTime", "latency", "lastUpdate", "secSinceLastUpdate", "ticksPerSample" }
local view = assert( sa.createView( viewName, cols ) )

--	create history view

local hview = assert( sa.createView( viewName .. " History", cols ) )

--	create feed gape detection view

local fcols = {	"instrument", "bid", "ask", "srcTime", "latency", "lastUpdate", "secSinceLastUpdate" }
local fview = assert( sa.createView( viewName .. " Feed Gap Detection", fcols ) )

local totalTicks = 0

-- A table to map instrument names to the last tick seen for each instrument

local LastTick = {}

-- publish 1st dataview

view.headline.totalTicks = totalTicks
view.headline.Now = he.formatTime( "%d/%m/%y %H:%M:%S.%6f", he.gettimeofday() )
view.headline.samples = 0
view.headline.offset  = config.offset
view:publish()
hview.publish()
--fview.publish()

-- ----------------------------------------------------------------
-- Function - fn_makeTimeStamp
--
-- Format of received timestamp is :
--
--	1,	RFA		hh:mm:ss
--	2,	other	YYYY-MM-DD hh:mm:ss.ffff

-- ----------------------------------------------------------------
function fn_makeTimeStamp( dateString )

	if ( dateString == nil ) then return 0 ; end
--
-- find the number of : occurrences in dateString
--
-- this will determine what type of dateString it is
--
	local dummy, count = string.gsub( dateString, ":", "" )

	if ( count == 2 ) then
		return makeRFATimeStamp( dateString )
	elseif ( count == 4 ) then
		return makeDateTimeStamp( dateString )
	else
		-- Don't know how to parse this date
		return 0
	end
end
-- ----------------------------------------------------------------
-- Function - fn_makeRFATimeStamp
-- ----------------------------------------------------------------
function fn_makeRFATimeStamp( dateString )

    local pattern = "(%d+):(%d+):(%d+)"
    local xhour, xminute, xseconds = dateString:match( pattern )
	
	local now = os.date( "*t", os.time() )

	now.hour = xhour
	now.min  = xminute
	now.sec  = xseconds

    local convertedTimestamp = os.time( now )

    return convertedTimestamp
end
-- ----------------------------------------------------------------
-- Function fn_makeDateTimeStamp
-- ----------------------------------------------------------------
function fn_makeDateTimeStamp( dateString )

	local pattern = "(%d+)%-(%d+)%-(%d+) (%d+):(%d+):(%d+).(%d+)"
	local xyear, xmonth, xday, xhour, xminute, xseconds, xmicro = dateString:match( pattern )

	local now = os.date("*t", os.time())

	if ( xyear )        then now.year   = xyear   end
	if ( xmonth )       then now.month  = xmonth  end
	if ( xday )         then now.day    = xday    end
	if ( xhour )        then now.hour   = xhour   end
	if ( xminute )      then now.minute = xminute end
	if ( xsecond )      then now.second = xsecond end
	if ( xmicro == nil) then xmicro     = 0       end
	
	local convertedTimestamp = os.time( now )

	if ( xmicro ~= 0 ) then xmicro = xmicro / 1000000 end

	return convertedTimestamp + xmicro
end
-- ----------------------------------------------------------------
-- function fn_makeTimeStamp
-- ----------------------------------------------------------------
-- timeString should be in HH:MM:SS.FF format
--
-- returns fractional seconds, 99.99999
--
-- ----------------------------------------------------------------
function fn_makeTimeStamp( timeString )

    local pattern = "(%d+):(%d+):(%d+).(%d+)"
    local xhour, xminute, xseconds, xmicro = dateString:match( pattern )
--
-- get the seconds from the epoch
--
	local now = os.date("*t", os.time())

	now.year  = 0
	now.month = 0
	now.day   = 0
	if ( xhour )        then now.hour   = xhour   end
	if ( xminute )      then now.minute = xminute end
	if ( xsecond )      then now.second = xsecond end
	if ( xmicro == nil) then xmicro     = 0       end
	
	local convertedTimestamp = os.time( now )

--    local convertedTimestamp = os.time( { year = xyear, month = xmonth, day = xday, hour = xhour, minute = xminute, sec = xseconds } )

	if ( xmicro ~= 0 ) then xmicro = xmicro / 1000000 end

    return convertedTimestamp + xmicro
end
-- ----------------------------------------------------------------
-- function - fn_getMilis
-- ----------------------------------------------------------------
function fn_getMilis( timestamp )

-- Round the number to milliseconds
	local milis = math.floor( ( timestamp * 1000 ) + 0.5 )

-- Since midnight
	local today = milis % ( 24 * 60 * 60 * 1000 )

	return today
end
-- ----------------------------------------------------------------
-- function fn_calcLatency
-- ----------------------------------------------------------------
-- convert timestamp into 99.9999999 format
--
-- offset = time zone offset from config.lua
--
-- calculate the difference between timestamp and today time values
--
-- ----------------------------------------------------------------
function fn_calcLatency( timestamp, today )

	local ts = 0

-- 	sa.logMessage( "INFO","calcLatency" )

	if ( timestamp == nil ) then
		return 0
	elseif ( string.find( timestamp, ":" ) ) then
		ts = fn_getMilis( fn_makeDateTimeStamp( timestamp ) + offset * ( 60 * 60 ) )
	else
		if ( type( timestamp ) == "number") then
			ts = math.log10( timestamp ) > 8 and fn_getMilis( timestamp ) or timestamp
		else

-- We don't recognize this format

			sa.logMessage( "INFO","calcLatency: time format not recognized " .. timestamp )
			return 0
		end
	end

--	sa.logMessage("INFO","calc today "..today.." ts "..ts)
	return ( today - ts ) / 1000
end
-- ----------------------------------------------------------------
-- function - fn_processTicks
-- ----------------------------------------------------------------
local function fn_processTicks( instrument )

--	first time through tick will be null
--
--	so create row and populate lastUpdate and generate latency column

		local tick = LastTick[ instrument ] or { field = { lastUpdate = "Never" }, latency = 0 }

--	get ticks

		tick.next = Feed:getTicks( instrument )

		local tickCount = 0

--	Count the number of ticks and populate tick with last tick

		while tick.next do
			tick = tick.next
			tickCount = tickCount + 1
		end

--	last tick

		LastTick[ instrument ] = tick
		local latency = LastTick[ instrument ].latency

--	If there were no ticks don't update the latency

		if ( tickCount > 0 ) then

-- tick.field.SrcTime is of format HH:MM:SS.fff ie. 13:17:50.704
-- tickFirst          is of format 99999999.999 ie. 1414676024.4659

			latency = fn_calcLatency( tick.field.srcTime, fn_getMilis( tick.timeFirst ) )
			LastTick[ instrument ].latency = latency
		end

		local secSinceLastUpdate = 0

		if ( tick.timeLast ) then
			tick.field.lastUpdate = he.formatTime( "%H:%M:%S.%6f", tick.timeLast )

--			sa.logMessage( "INFO"," timeLast "..tick.timeLast.." now "..he.gettimeofday() )

			secSinceLastUpdate = fn_calcLatency( tick.timeLast, fn_getMilis( he.gettimeofday() ) )
		end

		local rowValues = {
			bid                = tick.field.Bid,
			ask                = tick.field.Ask,
			srcTime            = tick.field.srcTime,
			latency            = latency,
			lastUpdate         = tick.field.lastUpdate,
			secSinceLastUpdate = secSinceLastUpdate,
			ticksPerSample     = tickCount
		}

-- Return two values; (1) a table of row values and (2) the count of new ticks

	return rowValues, tickCount
end

local samples  = 1
local rowcount = {}
for name, _ in pairs( feedConfiguration.instruments ) do
        rowcount[ name ] = { count = 1 }
end

sa.doSample = function()

	for name, _ in pairs( feedConfiguration.instruments ) do

		local highname = name .. " Positive"
		local lowname  = name .. " Negative"

		local rowResult, tickCount = fn_processTicks( name )
--
--	Raw Latency View
--
		view.row[ name ] = rowResult

		totalTicks = totalTicks + tickCount

--	Feed Gap Detection ( i.e. Tick count = 0 for sample )

			if ( tickCount == 0 ) then
				fview.row[ name .. ".." .. string.format( "%03i", rowcount[ name ].count ) ] = rowResult
				rowcount[ name ].count = rowcount[ name ].count + 1
				fview.row[ name .. "..001" ] = nil
			end
--
--	History View
--
		if ( hview.row[ highname ] == nil ) then
			if ( math.abs( rowResult.latency ) > 0 ) then
				hview.row[ highname ] = rowResult
				hview.row[ lowname ]  = rowResult
			end
		else
			if ( view.row[ name ].latency > hview.row[ highname ].latency ) then
				hview.row[ highname ] = rowResult
			end
			if ( view.row[ name ].latency < hview.row[ lowname ].latency ) then
				hview.row[ lowname ]  = rowResult
			end
		end
	end

	view.headline.totalTicks = totalTicks
	view.headline.Now = he.formatTime( "%d/%m/%y %H:%M:%S.%6f", he.gettimeofday() )
	view.headline.samples  = samples
	fview.headline.samples = samples
--
--	publish to gateway
--
	view:publish()
	hview:publish()
	fview:publish()

	samples = samples + 1

end

-- Command definitions

-- Define a command
local Reset = sc.newDefinition()
    Reset:addRowTarget( hview )

local Clear = sc.newDefinition()
    Clear:addRowTarget( fview )

-- Define a function which implements the command
local resetlatency = function( target, args )
	local RowName = target[ "row" ]
	hview.row[ RowName ].latency = 0
	assert( hview:publish() )
end

local clearlines = function( target, args )
	local RowName = target[ "row" ]
	fview.row[ RowName ] = nil
	assert( fview:publish() )
end
-- Publish the command
assert( sa.publishCommand(
				"Reset Latency",     -- Name of the command
				resetlatency,        -- Function to execute
				Reset                -- The command definition
			)
	)

assert( sa.publishCommand(
				"Clear Lines",     -- Name of the command
				clearlines,        -- Function to execute
				Clear              -- The command definition
			)
	)

