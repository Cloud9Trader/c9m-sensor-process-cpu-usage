const c9m = require('c9m');
const os = require('os');
const childProcess = require('child_process');


class Sensor extends c9m.Sensor {

  constructor () {
    super();
    this.name = 'cpu-usage';

    if (os.platform() === 'darwin') {
      this.readTop = this.readDarwinTop;
    } else {
      this.readTop = this.readLinuxTop;
    }
  }

  measure () {
    Promise.all([this.readTop(), this.readPs()])
      .catch((error) => {
        console.error('[ERROR] Cloud9Metrics could not read CPU usage', error);
      })
      .then((result) => {
        const [ current, lifetime ] = result;
        this.emit('value', { current, lifetime });
      });
  }

  readLinuxTop () {
    return new Promise((resolve, reject) => {
      childProcess.exec(`top -b -p ${process.pid} -n 1 | tail -n +8`, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(parseFloat(stdout.trim().split(/\s+/)[8]));
      });
    });
  }

  readDarwinTop (callback) {
    return new Promise((resolve, reject) => {
      childProcess.exec(`top -pid ${process.pid} -l 1 | tail -n +13`, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(parseFloat(stdout.split(/\s+/)[2]));
      });
    });
  }

  readPs () {
    return new Promise((resolve, reject) => {
      childProcess.exec(`ps -p ${process.pid} -o %cpu | tail -n +2`, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(parseFloat(stdout));
      });
    });
  }
}

module.exports = Sensor;
