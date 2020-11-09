const Page = require('core/pages/page');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const StaticExport = require('models/staticExport');
const { exec } = require('child_process');
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
    return new Promise((resolve, reject) => {
      const location = `${os.tmpdir()}/${exportUid}/export`;
      exec(`node scripts/staticSiteGenerator.js --url ${config.serviceUrl} --dir ${location}`, async (error) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  compressStaticSiteExport(exportUid) {
    const exportLocation = path.resolve(`${os.tmpdir()}/${exportUid}`);
    return tar.c({
      gzip: true,
      file: `${exportLocation}/export.tar.gz`,
      cwd: exportLocation,
    }, ['export']);
  }

  async uploadCompressedStaticSiteExportToS3(exportUid) {
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
        resolve(data.Location);
      });
    });
  }

  async removeTemporaryDirectory(exportUid) {
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
      await this.generateStaticSiteExport(exportUid);
      await this.compressStaticSiteExport(exportUid);
      const url = await this.uploadCompressedStaticSiteExportToS3(exportUid);

      staticExport.status = 'complete';
      staticExport.url = url;
      await staticExport.save();
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
