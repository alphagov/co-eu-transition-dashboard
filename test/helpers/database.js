const tmp = require('tmp');
const which = require('npm-which')(process.cwd())
const { exec, execSync } = require("child_process");
const fs = require('fs')
const { services } = require('config');
const sleep = require("sleep");
const isRunning = require('is-running');
const rimraf = require("rimraf");

class TestDatabase {
  autoStart;
  baseDir;
  myCnf;
  mysqld;
  useMysqldInitialize;
  mysqlInstallDb;
  pid;
  copyDataFrom;
  ownerPid;
  tmpDirObj;

  constructor(options = {}) {
    Object.assign(this,{
      autoStart: 2,
      myCnf: {},
      baseDir: null,
      useMysqldInitialize: null,
      mysqlInstallDb: null,
      copyDataFrom: null
    },options);

    const tmpDirObj = tmp.dirSync();
    this.tmpDirObj = tmpDirObj;
    const baseDir = this.tmpDirObj.name;;
    this.baseDir = baseDir;

    this.myCnf["socket"] = this._socketFile();
    this.myCnf["datadir"] = this._childFile("var");
    this.myCnf["pid-file"] = this._childFile("tmp","mysql.pid");
    this.myCnf["tmpdir"] = this._childFile("tmp");

    this.mysqld = which.sync("mysqld");

		this.useMysqldInitialize = this._detectUseMysqldInitialize();

    if (this.autoStart) {
      if (fs.existsSync(this.myCnf["pid-file"])) {
        throw "mysqld is already running";
      }
    }

    this._setup();
    this._start();
    
    while (!fs.existsSync(this._pidFile())) {
      console.log(`Waiting for ${this._pidFile()}`);
      sleep.msleep(1000);
    }

    const mysqlPid = fs.readFileSync(this._pidFile());
    this.pid = mysqlPid;

    console.log(`Mysql started with pid ${this.pid}`);

    process.env["DATABASE_SOCKET"] = this._socketFile();
    services.mysql.socket = this._socketFile();
    process.env["DATABASE_USER"] = "root";
    services.mysql.user = "root";
    process.env["DATABASE_DBNAME"] = "test";
    services.mysql.database = "test";
    process.on("exit",function() {
      process.kill(mysqlPid);
      rimraf.sync(baseDir);
      tmpDirObj.removeCallback();
    });
  }

  _childFile(...options) {
    let filename = this.baseDir;
    for (const file of options) {
      filename = filename.concat("/",file);
    }

    return filename;
  }

  _socketFile() {
    return this._childFile("tmp","mysql.sock");
  }

  _configFile() {
    return this._childFile("etc","my.cnf");
  }

  _pidFile() {
    return this._childFile("tmp","mysql.pid");
  }

  _initFile() {
    return this._childFile("etc","setup.sql")
  }

  _initCommand() {
    let parts = [
      this.mysqld,
      "--defaults-file="+this._configFile(),
      "--skip-networking",
      "--pid-file="+this._pidFile(),
      "--skip-mysqlx"
    ];

    if (this.useMysqldInitialize) {
      parts.push("--initialize-insecure");
    }

    parts.push("2>&1");

    return parts.join(" ");
  }

  _startCommand() {
    return [
      this.mysqld,
      "--defaults-file="+this._configFile(),
      "--user=root",
      "--skip-networking",
      "--pid-file="+this._pidFile(),
      "--init-file="+this._initFile(),
      "--daemonize",
      "--skip-mysqlx",
      "2>&1"
    ].join(" ");
  }

	_detectUseMysqldInitialize() {
    const help = this._verboseHelp();
    const regex = RegExp('--initialize-insecure','ms');
    return regex.test(help);
	}

  _start() {
    console.log(`Forking ${this._startCommand()}`);
    const forked = execSync(this._startCommand(),{ detach: true, stdio: "ignore", encoding: "utf8" });
  }

  _setup() {
    for (const dir of ["etc","var","tmp"]) {
      fs.mkdirSync(this._childFile(dir));
    }

    let config = [];
    config.push("[mysqld]");
    for (const key in this.myCnf) {
      if (this.myCnf[key]) {
        config.push(`${key}=${this.myCnf[key]}`);
      } else {
        config.push(key);
      }
    }

    fs.writeFileSync(this._childFile("etc","my.cnf"),config.join("\n"));
    fs.writeFileSync(this._initFile(),"CREATE DATABASE test;");

    console.log(this._initCommand());
    let result = execSync(this._initCommand(), { encoding: 'utf8' });
  }

	_verboseHelp() {
    return execSync(`${this.mysqld} --verbose --help 2>/dev/null`, { encoding: 'utf8' } );
	}

  async setup() {
  }

  async teardown() {
  }
}

module.exports = TestDatabase;
