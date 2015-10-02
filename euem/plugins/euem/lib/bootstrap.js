phantom.loadGeneos = function() {
    phantom.geneosVersion = {
        major: 0,
        minor: 1,
        patch: 120809,
        ident: 0,
        toString: function() {
            var version = [this.major, this.minor, this.patch].join('.');
            if (this.ident) {
                version = [version, this.ident].join('-');
            }
            return version;
        }
    };
    
    // Patching fs
    var fs = (function(fs) {
        if (!fs.hasOwnProperty('basename')) {
            fs.basename = function(path) {
                return path.replace(/.*\//, '');
            };
        }
        if (!fs.hasOwnProperty('dirname')) {
            fs.dirname = function(path) {
                return path.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
            };
        }
        if (!fs.hasOwnProperty('isWindows')) {
            fs.isWindows = function() {
                var testPath = arguments[0] || this.workingDirectory;
                return (/^[a-z]{1,2}:/i).test(testPath) || testPath.indexOf("\\\\") === 0;
            };
        }
        if (!fs.hasOwnProperty('pathJoin')) {
            fs.pathJoin = function() {
                return Array.prototype.join.call(arguments, this.separator);
            };
        }
        return fs;
    })(require('fs'));
    
    if (!phantom.geneosPath) {
        console.error("[euem][error] Couldn't find not geneosPath, environment not propely set.");
        phantom.exit(1);
    }

    /**
     * To support require or loading of modules for Geneos. Instead of using the word require
     * Geneos will use "import" to prevent conflict with patching of CasperJS on PhantomJS require 
     * function.
     */
    geneos = (function(require, requireDir) {
        var phantomBuiltins = ['fs', 'webpage', 'webserver', 'system'];
        var phantomRequire = phantom.__orig__require = require;
        var requireCache = {};
        
        return function(path) {
            var i, dir, paths = [],
                fileGuesses = [],
                file,
                module = {
                    exports: {}
                };
            if (phantomBuiltins.indexOf(path) !== -1) {
                return phantomRequire(path);
            }
            if (path[0] === '.') {
                paths.push.apply(paths, [
                    fs.absolute(path),
                    fs.absolute(fs.pathJoin(requireDir, path))
                ]);
            } else if (path[0] === '/') {
                paths.push(path);
            } else {
                dir = fs.absolute(requireDir);
                while (dir !== '' && dir.lastIndexOf(':') !== dir.length - 1) {
                    // nodejs compatibility
                    paths.push(fs.pathJoin(dir, 'node_modules', path));
                    dir = fs.dirname(dir);
                }
                paths.push(fs.pathJoin(requireDir, 'lib', path));
                paths.push(fs.pathJoin(requireDir, 'modules', path));
            }
            paths.forEach(function(testPath) {
                fileGuesses.push.apply(fileGuesses, [
                    testPath,
                    testPath + '.js',
                    testPath + '.coffee',
                    fs.pathJoin(testPath, 'index.js'),
                    fs.pathJoin(testPath, 'index.coffee'),
                    fs.pathJoin(testPath, 'lib', fs.basename(testPath) + '.js'),
                    fs.pathJoin(testPath, 'lib', fs.basename(testPath) + '.coffee')
                ]);
            });
            
            file = null;
            for (i = 0; i < fileGuesses.length && !file; ++i) {
                if (fs.isFile(fileGuesses[i])) {
                    file = fileGuesses[i];
                }
            }
            if (!file) {
                throw new Error("[euem][error] Geneos couldn't import module " + path);
            }
            if (file in requireCache) {
                return requireCache[file].exports;
            }
            try {
                var scriptCode = phantom.getScriptCode(file);
                new Function('module', 'exports', scriptCode)(module, module.exports);
            	console.log('[euem][info] loading module: ' + path);
            } catch (e) {
                phantom.processScriptError(e, file);
            }
            requireCache[file] = module;
            return module.exports;
        };
    })(require, phantom.geneosPath);
    
    
    phantom.geneosLoaded = true;
};


if (!phantom.geneosLoaded) {
    try {
        phantom.loadGeneos();
    } catch (e) {
        console.error("[euem][error] Unable to load Geneos EUEM environment: " + e);
        phantom.exit();
    }
}