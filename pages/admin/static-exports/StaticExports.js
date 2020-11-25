const Page = require('core/pages/page');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const StaticExport = require('models/staticExport');
const tar = require('tar');
const { v4: uuidv4 } = require("uuid");
const config = require('config');
const s3 = require('services/s3');
const fs = require('fs');
const pick = require('lodash/pick');
const logger = require('services/logger');
const moment = require('moment');
const path = require('path');
const os = require('os');
const { fork } = require('child_process');

let s3Bucket = config.services.s3.exportStoreBucketName;
if(config.services.vcapServices && config.services.vcapServices['aws-s3-bucket'].length) {
  s3Bucket = config.services.vcapServices['aws-s3-bucket'][0].credentials.bucket_name;
}

class StaticExports extends Page {
  get url() {
    return config.paths.admin.staticExports;
  }

  get pathToBind() {
    return `${this.url}/:fileName?`;
  }

  get middleware() {
    return [
      ...authentication.protect(['admin']),
      flash
    ];
  }

  get isDownloadExport() {
    return this.req.params && this.req.params.fileName;
  }

  getS3Id(url) {
    return url.split('/').pop();
  }

  downloadFile(req, res) {
    s3.getObject({
      Bucket: s3Bucket,
      Key: req.params.fileName
    })
      .on('httpHeaders', (code, headers) => {
        if (code < 300) {
          // if not error set headers on response so browser knows its a file
          res.set(pick(headers, 'content-type', 'content-length', 'last-modified'));
        }
      })
      .createReadStream()
      .on('error', error => {
        logger.error(error);
        res.flash('Error downloading file');
        res.redirect(this.url);
      })
      .pipe(res);
  }

  async getRequest(req, res) {
    if (this.isDownloadExport) {
      return this.downloadFile(req, res);
    }

    super.getRequest(req, res);
  }

  async getStaticExports() {
    return await StaticExport.findAll({
      order: [['updated_at', 'DESC']]
    });
  }

  async createStaticExport() {
    return await StaticExport.create({ status: 'in_progress' });
  }

  generateStaticSiteExport(exportUid) {
    const forked = fork('scripts/staticSiteGenerator');

    return new Promise((resolve, reject) => {
      forked.on('message', (options = {}) => {
        if(options.error) {
          return reject(new Error(options.error));
        }
        resolve();
      });

      forked.send({
        url: config.serviceUrl,
        loginUrl: `${config.serviceUrl}login`,
        dir: path.resolve(`${os.tmpdir()}/${exportUid}/export`)
      });
    });
  }

  compressStaticSiteExport(exportUid) {
    logger.info('Compressing export');
    const exportLocation = path.resolve(`${os.tmpdir()}/${exportUid}`);
    return tar.c({
      gzip: true,
      file: `${exportLocation}/export.tar.gz`,
      cwd: exportLocation,
    }, ['export']);
  }

  async uploadCompressedStaticSiteExportToS3(exportUid) {
    logger.info('Uploading export to s3');
    const fileName = `${exportUid}.tar.gz`;
    const file = fs.readFileSync(`${os.tmpdir()}/${exportUid}/export.tar.gz`);

    const params = {
      Bucket: s3Bucket,
      Key: fileName,
      Body: file
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          return reject(err);
        }
        logger.info('Uploaded export to s3 successfully');
        resolve(data.Location);
      });
    });
  }

  async removeTemporaryDirectory(exportUid) {
    logger.info('Removing demporary directory');
    return new Promise((resolve, reject) => {
      fs.rmdir(`${os.tmpdir()}/${exportUid}`, { recursive: true }, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  async doStaticExport(staticExport) {
    const exportUid = uuidv4();

    try {
      logger.info('Starting export');
      await this.generateStaticSiteExport(exportUid);
      await this.compressStaticSiteExport(exportUid);
      const url = await this.uploadCompressedStaticSiteExportToS3(exportUid);

      staticExport.status = 'complete';
      staticExport.url = url;
      await staticExport.save();
      logger.info('Export complete');
    } catch (error) {
      logger.error(error);
      staticExport.status = 'error';
      staticExport.error = error.message;
      await staticExport.save();
    } finally {
      await this.removeTemporaryDirectory(exportUid);
    }
  }

  async getCurrentExport() {
    const currentExport = await StaticExport.findOne({
      where: { status: 'in_progress' }
    });

    if(!currentExport) {
      return;
    }

    const tenMinutesAgo = moment().subtract(10, 'minutes');
    const isStale = moment(currentExport.updated_at).isBefore(tenMinutesAgo);
    if(isStale) {
      currentExport.status = 'error';
      currentExport.error = 'Timeout';
      await currentExport.save();
      return;
    }

    return currentExport;
  }

  async postRequest(req) {
    const currentExport = await this.getCurrentExport();

    if (currentExport) {
      req.flash('Export still in progress');
    } else {
      const staticExport = await this.createStaticExport();
      // dont wait for this, allow to run after responding to client
      this.doStaticExport(staticExport);
    }

    this.next();
  }
}

module.exports = StaticExports;
