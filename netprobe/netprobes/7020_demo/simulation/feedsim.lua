local rand = math.random
local ceil = math.ceil
local abs  = math.abs

local debug = print
if feed then
    debug = function(...) feed.logMessage(50 --[[DEBUG]], ...) end
end

local Instrument = {
    new = function(self, cfg, name, startAt)
        local o = { name = name }
        setmetatable(o, self)
        self.__index = self
        -- apart from the initial values, bid, ask and trade are all driven by 'sought'
        -- the idea of this is that 'street' has an idea of perceived value
        -- 'market' can only get an idea of this when a trade is done
        o.trade = tonumber(cfg.trade) or 1000
        o.sought = o.trade
        o.move = tonumber(cfg.move) or o.trade * 0.01
        bid = tonumber(cfg.bid)
        o.bid = (bid and bid < o.trade and bid) or o.trade - o.move
        ask = tonumber(cfg.ask)
        o.ask = (ask and ask > o.trade and ask) or o.trade + o.move
        o.pause = tonumber(cfg.pause) or 0.5
        o.dodginess = 1 - tonumber(cfg.quality or 1)
        o.dueAt = startAt + (cfg.delay or rand() * o.pause)
        return o
    end,

    step = function(self)
        local changed = {}
        local spread = self.ask - self.bid
        -- triangular distribution for move of 'sought'
        local moveBy = self.move * (rand() + rand() - 1.0)
        self.sought = self.sought + moveBy
        if self.sought < self.move then -- average move is also minimum price
            self.sought = self.move
        end
        local r = rand()
        if self.sought >= self.ask then
            -- trade at ask and widen spread
            self.trade = self.ask
            self.ask = self.ask + spread * 0.4
            changed = { trade = 1, ask = 1 }
        elseif self.sought <= self.bid then
            -- trade at bid and widen spread
            self.trade = self.bid
            self.bid = self.bid - spread * 0.4
            changed = { trade = 1, bid = 1 }
        else 
            if r <= (self.sought - self.bid) / (spread * 2) then
                -- trade near ask, more likely if sought is at that end of range
                self.trade = self.sought + rand() * (self.ask - self.sought)
                changed = { trade = 1 }
            elseif (1.0-r) <= (self.ask - self.sought) / (spread * 2) then
                -- trade near bid, more likely if sought is at that end of range
                self.trade = self.sought + rand() * (self.bid - self.sought)
                changed = { trade = 1 }
            elseif r < 0.4 or r >= 0.6 then
                -- no trade, narrow the spread
                self.ask = self.ask - (self.ask - self.trade) * 0.4
                self.bid = self.bid - (self.bid - self.trade) * 0.4
            changed = { bid = 1, ask = 1 }
            end
        end
        self.badTick = abs(r - 0.5) * 2 < self.dodginess
        -- uniform distribution for pause; exponential might be better
        self.dueAt = self.dueAt + self.pause * (0.5 + rand())
        return changed
    end,
}

local function round2dp(value)
    return ceil(value * 100 - 0.5) / 100
end

local Feed = {
    new = function(self, o)
        o = o or {}
        setmetatable(o, self)
        self.__index = self
        o.name = o.name or "feed" .. #feeds
        o.triggers = o.triggers or { 'trade' }
        o.delay = tonumber(o.delay) or 0.02
        o.lastTick = 0
        return o
    end,
    
    makeTick = function(self, time, inst)
        local delayed = time + self.delay * (0.7 + 0.6 * rand())
        -- reported tick arrival time only goes forward, never backward
        if self.lastTick < delayed then
            self.lastTick = delayed
        end
        return { time = self.lastTick, inst = inst.name, feed = self.name,
                field = { trade = round2dp(inst.trade), bid = round2dp(inst.bid), ask = round2dp(inst.ask),
                            noise1 = inst.ask - inst.bid, noise2 = inst.sought - inst.trade, noise3 = inst.sought, 
                            noise4 = inst.pause, noise5 = inst.move, noise6 = 'guff', } }
    end,

    react = function(self, time, inst, changed)
        if self.dodgeFactor and inst.badTick then
            local reported = self:makeTick(time, inst)
            debug('bad tick ', self.name, inst.name)
            reported.field.trade = round2dp(inst.trade * self.dodgeFactor)
            reported.field.bid   = round2dp(inst.ask * self.dodgeFactor)
            reported.field.ask   = round2dp(inst.bid * self.dodgeFactor)
            reported.field.noise6 = 'suspect!'
            return reported
        end
		local numTriggers = #self.triggers
        for i = 1, numTriggers do
            if changed[self.triggers[i]] then
                return self:makeTick(time, inst)
            end
        end
        return nil
    end,
}

local insts = {}
local feeds = {}
local defaultParams = {
    ['profile.fast.pause']    = 0.015,
    ['profile.fast.trade']    = 400,
    ['profile.lumpy.pause']   = 0.125,
    ['profile.lumpy.move']    = 20,
    ['profile.slow.pause']    = 0.45,
    ['profile.suspect.quality'] = 0.95,
    ['feed.b.trigger']     = 'trade',
    ['feed.f.trigger1']    = 'bid',
    ['feed.f.trigger2']    = 'ask',
    ['feed.f.delay']       = 0.04,
    ['feed.f.dodgeFactor'] = 1.2,
}

local cbChange, cbTick, instC, instN

local profiles = {}
local targetTicks

local function parseParam(feedCfg, param, value)
    if param:sub(1,4) == 'lua.' then
        param = param:sub(5)
    end
    local t, n, p = string.match(param, '(%a+)%.(%w+)%.(%a+)')
    if t == 'profile' then
        profiles[n] = profiles[n] or {}
        profiles[n][p] = value
    elseif t == 'feed' then
        cfg = feedCfg[n] or { name = n .. '.', triggers = {} }
        if p:match('^trigger') then
            cfg.triggers[#cfg.triggers+1] = value
        else
            cfg[p] = value
        end
        feedCfg[n] = cfg
    end
end

local function configure(params)
    local startAt = startAt or 0
    targetTicks = tonumber(params['targetTicks'] or params['lua.targetTicks'])
    local seed = tonumber(params['seed'] or params['lua.seed']) or 42
    debug('seed=', seed)
    math.randomseed(seed)
    local feedCfg = {}
    for k, v in pairs(defaultParams) do
        parseParam(feedCfg, k, v)
    end
    for k, v in pairs(params) do
        parseParam(feedCfg, k, v)
    end
    for _, cfg in pairs(feedCfg) do
        feeds[#feeds+1] = Feed:new(cfg)
        feeds[cfg.name] = true
    end
end

local function subscribe(code, startAt)
    local f, n, p = string.match(code, '(%a+%.)(%w+)%.(%a+)')
    -- ignore non-existent feeds and already configured instruments
    if feeds[f] and profiles[p] and not insts[n] then
        debug('subs ', code)
        local cfg = profiles[p]
        local name = string.format("%s.%s", n, p)
        local inst = Instrument:new(cfg, name, startAt or os.time())
        insts[#insts+1] = inst
        insts[n] = true
        -- find current and next instruments
        if instC then
            if inst.dueAt < instC.dueAt then
                inst, instC = instC, inst
            end
            if not instN or (inst.dueAt < instN.dueAt) then
                instN = inst
            end
        else
            instC = inst
        end
    end
end

local totalTicks = 0
local function doStep(time, inst)
    local changed = inst:step()
    if cbChange then cbChange(time, inst, changed) end
	local numFeeds = #feeds
    for i = 1, numFeeds do
        local tick = feeds[i]:react(time, inst, changed)
        if tick and cbTick then
            cbTick(tick)
            totalTicks = totalTicks + 1
        end
    end
end

local function runTo(endAt, lim)
    if not instC then 
        return
    end

    lim = lim or 25000
    local c = 1
--    debug(endAt, ' ', instC.dueAt)
    while instC.dueAt < endAt and c <= lim do
        local time = instC.dueAt
        doStep(time, instC)
        if instN and instC.dueAt > instN.dueAt then
            instC, instN = instN, instC
            for i = 1, #insts do
                local inst = insts[i]
                if inst ~= instC and inst.dueAt < instN.dueAt then
                    instN = inst
                end
            end
        end
        c = c + 1
    end
    if targetTicks and feed and totalTicks >= targetTicks then
        feed.logMessage(40, 'Total ticks: ', totalTicks, ' (reached target)')
        targetTicks = nil
    else 
        debug('Total simulated ticks: ', totalTicks)
    end
end

-- Functions to be exported
local Simulation = {
    configure = configure,

    subscribe = subscribe,

    runTo = runTo,

    setOnChange = function(onChange) cbChange = onChange end,

    setOnTick = function(onTick) cbTick = onTick end,
}

-- Self test
local testSubs = {
--    'b.ABC.fast', 'f.ABC.fast', 'b.XYZ.suspect', 'f.XYZ.suspect', 'b.PQR.slow', 'f.PQR.slow'    
    'b.XYZ.suspect', 'f.XYZ.suspect', 'b.PQR.slow', 'f.PQR.slow'    
}

if arg then
    local now = os.time()
    Simulation.configure{}

    for i = 1, #testSubs do
        Simulation.subscribe(testSubs[i], now)
    end

    local fields = { 'trade', 'bid', 'ask' }
	local numFields = #fields
    Simulation.setOnChange(function (time, inst, changed)
        local report = { string.format("%.3f %s", time, inst.name) }
        for i = 1, numFields do
            local c = fields[i]
            if changed[c] then
                report[#report + 1] = string.format("%s=%.2f", c, inst[c])
            end
        end
        if inst.badTick then
            report[#report + 1] = "--SUSPECT--"
        end
        print(table.concat(report, "|"))
    end)
    Simulation.setOnTick(function (tick)
        local report = { string.format("%.3f %s%s", tick.time, tick.feed, tick.inst) }
        for i = 1, numFields do
            local c = fields[i]
            report[#report + 1] = string.format("%s=%f", c, tick.field[c])
        end
        print(table.concat(report, "|"))
    end)

    Simulation.runTo(now + 5, 50)
end

return Simulation
