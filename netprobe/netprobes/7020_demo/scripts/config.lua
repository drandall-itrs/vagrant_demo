-- Common config file
--
-- defines default parameters
--
-- define connection etc parameters for individual feeds
--

local m = {}

-- general location of feed library files

m.libpath = "/home/geneos/packages/netprobe/active_001/flm/"

-- general location of rfa config files

m.rfapath = "/home/geneos/packages/netprobe/scripts/"

-- Timezone offset (from the feed's timestamp to local timestamp )

m.offset = 0

--- Generic Feed Configurations

m.rfa = {
	feed = {
		type = "rfa",
		[ "library.filename" ]         = m.libpath .. "flm-feed-rfa.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	rfa = {
		configFile     = m.rfapath .. "rfa_omm.cfg",
		session        = "sessionrh1_omm",
		connectionType = "OMM"
	},
	instruments = {
		VOD  = "IDN_RDF.VOD.O",
		GBP  = "IDN_RDF.GBP=",				
		EUR  = "IDN_RDF.EUR="
	},
	fields      = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BIDSIZE",
		AskSize  = "ASKSIZE",
		Trade    = "TRDPRC_1",
		Change   = "NETCHNG_1",
		SrcTime  = "QUOTIM_MS",
		LineTime = "ASK_TIME"
	}
}

m.rfa_001 = {
	feed = {
		type = "rfa",
		[ "library.filename" ]         = m.libpath .. "flm-feed-rfa.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	rfa = {
		configFile     = m.rfapath .. "rfa_omm.cfg",
		session        = "sessionrh2_omm",
		connectionType = "OMM"
	},
	instruments = {
		VOD  = "IDN_RDF.VOD.O",
		GBP  = "IDN_RDF.GBP=",				
		EUR  = "IDN_RDF.EUR="
	},
	fields      = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BIDSIZE",
		AskSize  = "ASKSIZE",
		Trade    = "TRDPRC_1",
		Change   = "NETCHNG_1",
		SrcTime  = "QUOTIM_MS",
		LineTime = "ASK_TIME"
	}
}

m.rfa_002 = {
	feed = {
		type = "rfa",
		[ "library.filename" ]         = m.libpath .. "flm-feed-rfa.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	rfa = {
		configFile     = m.rfapath .. "rfa_omm.cfg",
		session        = "sessionsol2_omm",
		connectionType = "OMM"
	},
	instruments = {
		VOD  = "IDN_RDF.VOD.O",
		GBP  = "IDN_RDF.GBP=",				
		EUR  = "IDN_RDF.EUR="
	},
	fields      = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BIDSIZE",
		AskSize  = "ASKSIZE",
		Trade    = "TRDPRC_1",
		Change   = "NETCHNG_1",
		SrcTime  = "QUOTIM_MS",
		LineTime = "ASK_TIME"
	}
}

m.rfa_003 = {
	feed = {
		type = "rfa",
		[ "library.filename" ]         = m.libpath .. "flm-feed-rfa.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	rfa = {
		configFile     = m.rfapath .. "rfa_omm.cfg",
		session        = "sessionsol3_omm",
		connectionType = "OMM"
	},
	instruments = {
		VOD  = "IDN_RDF.VOD.O",
		GBP  = "IDN_RDF.GBP=",				
		EUR  = "IDN_RDF.EUR="
	},
	fields      = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BIDSIZE",
		AskSize  = "ASKSIZE",
		Trade    = "TRDPRC_1",
		Change   = "NETCHNG_1",
		SrcTime  = "QUOTIM_MS",
		LineTime = "ASK_TIME"
	}
}

-- Simulation

-- This is the Lua equivalent of FLM's Instrument Group
local instMap = function(prefix, insts)
    local map = {}
    for name, profile in pairs(insts) do
        map[name] = string.format("%s.%s.%s", prefix, name, profile)
    end
    return map
end

m.configure_simulation = function(prefix, gs)

	if not gs.params['lua.script'] then
		gs.params['lua.script'] = "simulation/luaFeed_Sim.lua"
	end

	local insts = {}
	local noiseLevel = 6
	for k, v in pairs(gs.params) do
		print (prefix.."->"..k.." "..v)
		local n = string.match(k, 'inst%.(%w+)')
		if n then
			insts[n] = v
			--gs.params[k] = nil
		elseif k == 'noiseLevel' then
			noiseLevel = tonumber(v)
			if not noiseLevel or noiseLevel < 0 then noiseLevel = 0 end
			--gs.params[k] = nil
		end
	end
	
	local simulation = {
		feed = {
			type = "custom",
			[ "library.filename" ]         = "flm/geneos-feed-lua.so",
			[ "library.skipVersionCheck" ] = "true",
			[ "library.debug.load" ]       = "false",
			verbose                        = "false"
		},
		custom = gs.params,
		instruments =  instMap(prefix, insts),
		fields      = { Trade = "trade", Ask = "ask", Bid = "bid", srcTime = "srcTime" }
	}
	return simulation
end





-- Tutorial

m.tutorial = {
	feed = {
		type = "example",
		[ "library.filename" ]         = m.libpath .. "flm-feed-example.so",
		[ "library.skipVersionCheck" ] = "true",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
    example = {},
    instruments = {
		GOOG = "DATA_SERVICE.GOOG",
		IBM  = "DATA_SERVICE.IBM"
	},
    fields      = {
	        Bid   = "01_BID",
        	Trade = "02_TRADE_PRICE",
        	Ask   = "03_ASK"
	}
}

-- Bloomberg

m.bloomberg = {
	feed = {
		type = "bloomberg",
		[ "library.filename" ]         = m.libpath .. "geneos-feed-bloomberg.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	bloomberg = {
--       	serverHost      = "bpipe.ldn.itrs",
		serverHost      = "192.168.10.173",
		serverPort      = "8194",
		applicationName = "ITRS:market-data-monitor"
	},
	instruments = {
                VOD = "//blp/mktdata/VOD LN Equity",
                GBP = "//blp/mktdata/GBPUSD Curncy",
                EUR = "//blp/mktdata/EURUSD Curncy"
	},
	fields = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BID_SIZE",
		AskSize  = "ASK_SIZE",
		Trade    = "LAST_PRICE",
		Change   = "LAST_TRADE",
		SrcTime  = "LAST_PRICE_TIME_TODAY_REALTIME",
		LineTime = "BID_ASK_TIME"
	}
}

m.bloombergA = {
	feed = {
		type = "bloomberg",
		[ "library.filename" ] = m.libpath .. "geneos-feed-bloomberg.so",
		[ "library.skipVersionCheck" ] = "false",
		[ "library.debug.load" ]       = "false",
		verbose                        = "false"
	},
	bloomberg = {
--       	serverHost      = "bpipe.ldn.itrs",
		serverHost      = "192.168.10.173",
		serverPort      = "8194",
		applicationName = "ITRS:market-data-monitor"
	},
	instruments = {
                VOD = "//blp/mktdata/VOD LN Equity",
                GBP = "//blp/mktdata/GBPUSD Curncy",
                EUR = "//blp/mktdata/EURUSD Curncy"
	},
	fields = {
		Bid      = "BID",
		Ask      = "ASK",
		BidVo    = "BID_SIZE",
		AskSize  = "ASK_SIZE",
		Trade    = "LAST_PRICE",
		Change   = "LAST_TRADE",
		SrcTime  = "LAST_PRICE_TIME_TODAY_REALTIME",
		LineTime = "BID_ASK_TIME"
	}
}

m.quant = {
	feed = {
		type = "quantFeed",
		[ "library.filename" ] = m.libpath .. "quantfeed-adapter.so",
		[ "library.skipVersionCheck" ] = "trye",
		[ "library.debug.load" ]       = "false",
		verbose = "true"
	},
	quantFeed = {
		serverHost      = "84.233.192.228",
		serverPort      = "6041",
		username        = "itrs_demo",
		password        = "bLZkjZoT",
		applicationName = "ITRS:market-data-monitor"
  	},
  	example = {
		setting1 = "v1",
		setting2 = "v2"
	},
	instruments = {
		Inst1 = "XPAR@FR0010344960"
	},
	fields = {
		Ask = "ASK",
		Bid = "BID"
	}
}

return m
