#!/usr/bin/env node
// Generated by CoffeeScript 1.10.0
(function() {
  var args, captureImports, commandToExecute, dirs, exec, execDelay, execHistory, executeCommandFor, fireworm, fs, help, ignore, importHistory, imports, onlyExt, options, path, processFile, regEx, runNow, silent, startExecutionFor, startProcessingFile, startProcessingFileAdded, startTime, yargs;

  options = {
    'd': {
      alias: 'dir',
      describe: 'Specify all dirs to watch for in quotes, separated with commas. Syntax: -d "dirA" "dirB"',
      type: 'array',
      demand: true
    },
    'i': {
      alias: 'ignore',
      describe: 'Specify all globs to ignore in quotes, separated with commas. Syntax: -s "globA" "globB"',
      type: 'array'
    },
    'e': {
      alias: 'extension',
      describe: 'Only watch files that have a specific extension. Syntax: -e "ext1" "ext2"',
      type: 'array'
    },
    'x': {
      alias: 'execute',
      describe: 'Command to execute upon file addition/change',
      type: 'string',
      demand: true
    },
    's': {
      alias: 'silent',
      describe: 'Suppress any output from the executing command',
      type: 'boolean',
      "default": false
    },
    'n': {
      alias: 'now',
      describe: 'Execute the command for all files matched immediatly on startup',
      type: 'boolean',
      "default": false
    },
    't': {
      alias: 'imports',
      describe: 'Optionally compile files that are imported by other files.',
      type: 'boolean',
      "default": false
    },
    'w': {
      alias: 'wait',
      describe: 'Execution delay, i.e. how long should the assetwatcher wait before re-executing the command. If the watched file changes rapidly, the command will execute only once every X ms.',
      type: 'number',
      "default": 1500
    }
  };

  fs = require('fs');

  path = require('path');

  fireworm = require('fireworm');

  exec = require('child_process').exec;

  yargs = require('yargs').usage("Usage: assetwatcher -d <directory globs> -s <globs to skip> -i").options(options).help('h').alias('h', 'help');

  args = yargs.argv;

  regEx = {
    ext: /.+\.(sass|scss|js|coffee)$/i,
    "import": /@import\s*(.+)/ig,
    placeholder: /\#\{(\S+)\}/ig
  };

  importHistory = {};

  execHistory = {};

  dirs = args.d || args.dir;

  ignore = args.i || args.ignore;

  help = args.h || args.help;

  silent = args.s || args.silent;

  imports = args.t || args.imports;

  onlyExt = args.e || args.extension;

  commandToExecute = args.x || args.execute;

  runNow = args.n || args.now;

  execDelay = args.w || args.wait;

  if (help) {
    process.stdout.write(yargs.help());
    process.exit(0);
  }

  startProcessingFileAdded = function(watchedDir) {
    return function(filePath) {
      return processFile(filePath, watchedDir, 'added');
    };
  };

  startProcessingFile = function(watchedDir) {
    return function(filePath) {
      return processFile(filePath, watchedDir);
    };
  };

  processFile = function(filePath, watchedDir, eventType) {
    if (eventType == null) {
      eventType = 'changed';
    }
    if (Date.now() - startTime < 3000 && !runNow) {
      return;
    }
    return fs.stat(filePath, function(err, stats) {
      if (err) {
        console.log(err);
        return;
      }
      if (stats.isFile()) {
        return fs.readFile(filePath, 'utf8', function(err, data) {
          if (err) {
            console.log(err);
            return;
          }
          captureImports(data, filePath);
          return startExecutionFor(filePath, filePath, watchedDir, eventType);
        });
      }
    });
  };

  captureImports = function(fileContent, filePath) {
    var dirPath, extName;
    if (typeof fileContent !== 'string') {
      return fileContent;
    } else {
      extName = path.extname(filePath);
      dirPath = path.dirname(filePath);
      return fileContent.replace(regEx["import"], function(entire, match) {
        var hasExt, matchFileContent, resolvedMatch, stats;
        match = match.replace(/'/g, '');
        hasExt = regEx.ext.test(match);
        if (!hasExt) {
          match += extName;
        }
        resolvedMatch = path.normalize(dirPath + '/' + match);
        if (importHistory[resolvedMatch] == null) {
          importHistory[resolvedMatch] = [filePath];
        } else {
          importHistory[resolvedMatch].push(filePath);
        }
        try {
          stats = fs.statSync(resolvedMatch);
          if (stats.isFile()) {
            matchFileContent = fs.readFileSync(resolvedMatch, 'utf8');
            captureImports(matchFileContent, resolvedMatch);
          }
        } catch (undefined) {}
        return entire;
      });
    }
  };

  startExecutionFor = function(filePath, triggeringFile, watchedDir, eventType) {
    var importingFiles;
    if (importHistory[filePath] != null) {
      importingFiles = importHistory[filePath];
      return importingFiles.forEach(function(file) {
        return startExecutionFor(file, filePath, watchedDir, eventType);
      });
    } else {
      return executeCommandFor(filePath, triggeringFile || filePath, watchedDir, eventType);
    }
  };

  executeCommandFor = function(filePath, triggeringFile, watchedDir, eventType) {
    var command, pathParams;
    if ((execHistory[filePath] != null) && Date.now() - execHistory[filePath] < execDelay) {
      return;
    }
    pathParams = path.parse(filePath);
    pathParams.reldir = pathParams.dir.replace(watchedDir, '').slice(1);
    execHistory[filePath] = Date.now();
    if (!silent) {
      console.log("File " + eventType + ": " + triggeringFile);
    }
    command = commandToExecute.replace(regEx.placeholder, function(entire, placeholder) {
      if (placeholder === 'path') {
        return filePath;
      } else if (pathParams[placeholder] != null) {
        return pathParams[placeholder];
      } else {
        return entire;
      }
    });
    return exec(command, function(err, stdout, stderr) {
      if (!silent) {
        if (err) {
          console.log(err);
        }
        if (stdout) {
          console.log(stdout);
        }
        if (stderr) {
          console.log(stderr);
        }
        return console.log("Finished executing command for \x1b[32m" + pathParams.base + "\x1b[0m\n");
      }
    });
  };

  startTime = Date.now();

  dirs.forEach(function(dir) {
    var dirName, fw;
    fw = fireworm(dir);
    if (onlyExt) {
      onlyExt.forEach(function(ext) {
        return fw.add("**/*." + ext);
      });
    } else {
      fw.add("**/*");
    }
    if (ignore && ignore.length) {
      ignore.forEach(function(globToIgnore) {
        return fw.ignore(globToIgnore);
      });
    }
    dirName = dir.charAt(dir.length - 1) === '/' ? dir.slice(0, dir.length - 1) : dir;
    if (dirName.charAt(0) === '.') {
      dirName = dirName.slice(2);
    } else if (dirName.charAt(0) === '/') {
      dirName = dirName.slice(1);
    }
    fw.on('add', startProcessingFileAdded(dirName));
    fw.on('change', startProcessingFile(dirName));
    return console.log("Started watching \x1b[36m" + dir + "\x1b[0m");
  });

}).call(this);
