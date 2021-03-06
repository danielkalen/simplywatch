chokidar = require '@danielkalen/chokidar'
chalk = require 'chalk'

watchedFiles = []
watcher = chokidar.watch [],
	'cwd':process.cwd()
	'ignoreInitial': true
	'ignored': /(?:\.git|node_modules|.+\.log)/
	'bypassIgnore': watchedFiles

watcher.ready = new Promise (resolve)->
	watcher.on 'ready', resolve
	setTimeout resolve, 1000


watcherAdd = watcher.add.bind(watcher)
watcher.add = (path)-> unless watchedFiles.includes(path)
	watchedFiles.push(path)
	watcherAdd(path)


if process.platform is 'darwin' and not watcher.options.useFsEvents
	console.error chalk.bgRed.white.bold("Error")+" FSEvents is not being used! Falling back to unefficient manual polling method - expect high CPU Usage for large directories. Run 'npm install fsevents' and re-run SimplyWatch"

	
module.exports = watcher
