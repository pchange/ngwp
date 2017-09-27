import map from 'lodash/map'
// import pick from 'lodash/pick'
// import filter from 'lodash/filter'
// import forEach from 'lodash/forEach'
// import isEmpty from 'lodash/isEmpty'
// import indexOf from 'lodash/indexOf'
import fs from 'fs-extra'
import path from 'path'
// import colors from 'colors'
import program from 'commander'
import Nginx from './library/nginx'
// import OptionMerger from './library/option_merger'
// import * as utils from './library/utils'
// import * as VARS from './config/variables'

/**
 * node module colors will be changed by karma
 * if you import karma, attribute bold in colors
 * will be change to function and can not use
 * 'string'.bold, it must be write it to 'string'.bold()
 * so that every time after require karma, you can not be
 * use bold for string attribute, it can not return string
 * it will be return a function.
 */

let params = process.argv
// let cwd = path.basename(require.main.filename)
// let pkg = path.join(__dirname, '../package.json')
// let source = fs.readJSONSync(pkg)

/**
 * version setting
 */
program
// .version(source.version)
.option('--quiet')

/**
 * init command
 */
// program
// .command('init <name>')
// .description('Create a new ngwp project')
// .option('--ver <project version>', 'Set project version')
// .option('--description <project description>', 'Set project description')
// .action((name, options) => {
//   let { initialize } = require('./library/initialization')
//   let startTime = Date.now()
//   let folder = path.join(OptionMerger.ROOT_PATH, name)

//   if (fs.exists(folder)) {
//     throw new Error(`${folder} is exists`)
//   }

//   fs.mkdirSync(folder)

//   initialize(name, {
//     dist: folder,
//     version: options.ver || '0.0.1',
//     description: options.description || name
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: installer')
//     utils.trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`)

//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} init myProject`)
//   utils.trace('')
// })

// /**
//  * module command
//  */
// program
// .command('module <name>')
// .description('Create a new module (Every module is entrance of SPA)')
// .option('-d, --dist <filename>', 'Set destination file')
// .option('-b, --base <folder>', 'Set destination base path')
// .action((name, options) => {
//   let { mkModule } = require('./library/builder')
//   let startTime = Date.now()

//   mkModule(name, {
//     basePath: options.base || OptionMerger.ROOT_PATH,
//     distFolder: options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME)
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: module')
//     utils.trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`)

//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} module myModule`)
//   utils.trace('')
// })

// /**
//  * route command
//  */
// program
// .command('route <module> <routes>')
// .description('Create components by route')
// .option('-d, --dist <filename>', 'Set destination file')
// .option('-b, --base <folder>', 'Set destination base path')
// .action((module, routes, options) => {
//   let { mkRoute } = require('./library/builder')
//   let startTime = Date.now()

//   mkRoute(routes, module, {
//     basePath: options.base || OptionMerger.ROOT_PATH,
//     distFolder: options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME)
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: route')
//     utils.trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`)
//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} route myModule route1/route2/route3`)
//   utils.trace('')
// })

/**
 * vhosts command
 */
program
.command('nginx')
.description('Generate nginx vhosts config file with modules')
.option('-c, --config', 'Set module config (Default path/to/config/nginx.json)')
.option('-d, --dist <filename>', 'Set destination file')
.option('-b, --base <folder>', 'Set destination base path')
.option('-p, --port <webpack server port>', 'Set webpack develop server port in development')
.option('--root-path <Root folder>', 'Set variable \'root\' in nginx conf (Default destination folder)')
.option('--logs-path <Logs folder>', 'Set log folder in nginx conf (Default \'base/logs/\')')
.option('--use-https', 'Use https protocol (Default false)')
.option('--cert-path', 'Set root cert path (Default base folder)')
.option('--cert-file', 'Set cert file (Require when --use-https is open)')
.option('--cert-key', 'Set cert key file (Require when --use-https is true)')
.action((options) => {
  let startTime = Date.now()

  if (options.port) {
    options.port = options.port * 1

    _.forEach(OptionMerger.NGINX_PROXY, function (proxy) {
      proxy.proxyPort = options.port
    })

    OptionMerger.updateRC({ port: options.port })
  }

  if (options.useHttps === true) {
    let certPath = options.certPath ||
    process.env.NGWP_CERT_PATH ||
    process.env.ngwp_cert_path ||
    VARS.ROOT_PATH

    _.forEach(OptionMerger.NGINX_PROXY, function (setting) {
      if (setting.useHttps === true) {
        setting.certFile = setting.certFile
        ? utils.resolvePath(setting.certFile, certPath)
        : path.join(certPath, setting.domain + '.pem')

        setting.certKey = setting.certFile
        ? utils.resolvePath(setting.certFile, certPath)
        : path.join(certPath, setting.domain + '.key')

        if (!(fs.existsSync(setting.certFile) && fs.existsSync(setting.certKey))) {
          utils.trace(`[${colors.yellow('warn')}] '${setting.certFile}' or '${setting.certKey}' is not found`)
          setting.useHttps = false
        }
      }
    })
  }

  let modules = map(options.proxy, (proxy) => defaultsDeep({
    type: proxy.type || 'proxy',
    proxy: '127.0.0.1',
    port: options.port,
    reserved: map(proxy.reserved, (path) => (trim(path, '/')))
  }, proxy))

  if (true === options.useHttps) {
    let certPath = options.certPath
    || process.env.CERT_PATH
    || process.env.cert_path
    || process.cwd()

    forEach(modules.proxy, (proxy) => {
      if (proxy.useHttps !== true) {
        return
      }

      if (!path.isAbsolute(proxy.certFile)) {
        proxy.certFile = path.join(certPath, proxy.certFile)
      }

      if (!path.isAbsolute(proxy.certKey)) {
        proxy.certKey = path.join(certPath, proxy.certKey)
      }

      if (isEmpty(proxy.certFile) || isEmpty(proxy.certKey)) {
        throw new Error('Cert file or key file is not provided')
      }

      if (!(fs.existsSync(proxy.certFile) && fs.existsSync(proxy.certKey))) {
        throw new Error('Cert file or key file is not found')
      }
    })
  }

  Nginx(modules, {
    basePath: options.base,
    distFile: options.dist,
    rootPath: options.rootPath,
    logsPath: options.logsPath,
  },
  function (error, stats) {
    /* istanbul ignore if */
    if (error) {
      throw error
    }

    let { file, modules } = stats

    modules = filter(modules, function (module) {
      return !isEmpty(module.domain) && !isEmpty(module.proxy)
    })

    modules = map(modules, function (module) {
      return pick(module, ['domain', 'proxy', 'entry', 'port'])
    })

    Printer.trace(`${colors.blue(colors.bold('Nginx Config Generator'))}`)
    Printer.trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`)

    if (Printer.printStats(modules)) {
      Printer.trace(`[${colors.bold(colors.green('ok'))}] Nginx config file ${colors.bold(colors.green(file))} is generated completed`)
      Printer.trace(`[${colors.bold(colors.blue('info'))}] Remember include it and ${colors.bold(colors.green('reolad/restart'))} your nginx server`)
    }
  })
})
.on('--help', () => {
  utils.trace('  Examples:')
  utils.trace(`    $ ${cwd} vhosts`)
  utils.trace('')
})

// let runCommander = program
// .command('run <mode>')
// .description('Start webpack')
// .action((mode) => {
//   if (indexOf(['dev', 'develop', 'development'], mode) !== -1) {
//     runDevelopTasks()
//   } else if (indexOf(['prod', 'product', 'production'], mode) !== -1) {
//     runReleaseTasks()
//   } else if (indexOf(['test', 'unitest'], mode) !== -1) {
//     runUnitestTasks()
//   } else {
//     runCommander.help()

//     process.exit(0)
//   }
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} run develop`)
//   utils.trace(`    $ ${cwd} run product`)
//   utils.trace(`    $ ${cwd} run unitest`)
//   utils.trace('')
// })

// /**
//  * other return helper
//  */
// program
// .action(function () {
//   program.help()
//   process.exit(0)
// })

!params.slice(2).length
? runDevelopTasks()
: program.parse(params)

// /**
//  * convert and package
//  * run webpack develop server and watch the file changed
//  */
// function runDevelopTasks () {
//   process.env.DEVELOP = 1

//   let { run } = require('./library/webpack')
//   run(path.join(__dirname, './config/webpack.develop.config.babel.js'), { watch: true })
// }

// /**
//  * convert and package
//  * minify all we can compress
//  */
// function runReleaseTasks () {
//   process.env.PRODUCT = 1

//   let { run } = require('./library/webpack')
//   run(path.join(__dirname, './config/webpack.product.config.babel.js'))
// }

// /**
//  * convert and run karma
//  * import all test/*.spec.js files
//  */
// function runUnitestTasks () {
//   process.env.PRODUCT = 1
//   process.env.UNITEST = 1

//   let { run } = require('./library/karma')
//   run(path.join(__dirname, './config/karma.conf.babel.js'))
// }
