README for MDM luaFeed_Sim
--------------------------

These scripts assume that they are in a directory called <probe_dir>/simulation.
Unzipping them elsewhere and making a symlink works; depending on your setup, you may need to 
use an absolute path in the symlink.

The scripts are as follows:

	feedsim.lua - The simulator module. Can be run standalone: luajit feedsim.lua

	luaFeed_Sim.lua - A Lua feed adapter which adapts the simulator to the FLM feed API

	testFeedSim.lua - Works with Netprobe script debug flag (-mdmtest simulation/testFeedSim.lua)

	feed_simulation.lua - An MDM sampler script that inspects the feed data

	latency_simulation.lua - An MDM sampler script that runs the latency algorithm

    fq[1-4]_simulation.lua - A series of steps in displaying 'bad' ticks emitted by the simulator
        fq1 - adds a 'bad tick' count column and a log message
        fq2 - adds a 'BAD-TICKS' view, posts details of first N bad ticks to it (N configurable, default 10)
        fq3 - reserves half the rows for first N/2 bad ticks,  posts recent ticks to second half
        fq4 - adds a 'delete bad row' command

See the self test code in feedsim.lua for examples of simulator configuration.
Essentially: 
* a 'profile' describes the way an instrument will behave - update rate, initial price, etc
* simulated instruments are created as subscriptions are established
* a simulated feed may or may not react when an instrument changes and may do so with a delay
* to the FeedController, there is just one feed; simulated feeds are selected by the instrument code 
* The instrument code 'b.ABC.fast' corresponds to a subscription to an instrument with 'fast'
profile and name 'ABC', observed via simulated feed 'b'

The simulator can generate bad data for instruments on a given profile
* by default, instruments in the 'suspect' profile have a quality of 0.95.
* each update for these instruments has a 5% chance to be erratic, if the feed supports bad ticks
* the 'b' feed ignores erratic updates
* the 'f' feed puts out a bad tick for erratic updates: it scales up prices by 20% and swaps bid and ask
* a debug message is written to the netprobe log file for each bad tick

--------

FLM can use the simulated feed(s). Parameters look like this:
<parameters>
    <data>lua.script=simulation/luaFeed_Sim.lua
lua.seed=42</data>
</parameters>

Instrument codes look like
b.ABC.fast b.XYZ.lumpy b.PQR.slow - feed 'b' (baseline)
f.ABC.fast f.XYZ.lumpy f.PQR.slow - feed 'f' (comparison)

where 'fast', 'lumpy' and 'slow' correspond to instrument profiles

--------

Parameters for the MDM scripts above look like this
(Note that the sampler sets the name of the simulation feed adapter)
    <script>
        <data>simulation/latency_simulation.lua</data>
    </script>
    <parameters>
        <data>lua.seed=42
lua.profile.fast.pause=0.005
inst.ABC=fast
inst.XYZ=lumpy
inst.PQR=slow
inst.SOS=suspect
</data>
    </parameters>

Make sure that all samplers that want to see the same data use _exactly_ the same profile.* and feed.* parameters.
If `grep create_feed $netprobeLog` returns more than one line, you got this wrong.
