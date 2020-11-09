const { expect, sinon } = require('test/unit/util/chai');
const { paths } = require('config');
const flash = require('middleware/flash');
const authentication = require('services/authentication');
const StaticExport = require('models/staticExport');
const s3 = require('services/s3');
const config = require('config');
const jwt = require('services/jwt');
const proxyquire = require('proxyquire');
const tar = require('tar');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const os = require('os');

let StaticExports;
let page = {};
let res = {};
let req = {};
let execStub;

describe('pages/admin/static-exports/StaticExports', () => {
  beforeEach(() => {
    execStub = sinon.stub().callsArg(1);

    StaticExports = proxyquire('pages/admin/static-exports/StaticExports', {
      'child_process': { exec: execStub },
      'uuid': { v4: sinon.stub().returns('some-id') }
    });

    res = { render: sinon.stub(), redirect: sinon.stub() };
    req = { params: {}, flash: sinon.stub() };
    page = new StaticExports('some path', req, res);
    page.req = req;
    page.res = res;

    sinon.stub(authentication, 'protect').returns([]);
    sinon.stub(jwt, 'restoreData').returns();
  });

  afterEach(() => {
    authentication.protect.restore();
    jwt.restoreData.restore();
  });

  describe('#url', () => {
    it('returns correct url', () => {
      expect(page.url).to.eql(paths.admin.staticExports);
    });
  });

  describe('#pathToBind', () => {
    it('adds fileName parameter', () => {
      expect(page.pathToBind).to.eql(`${page.url}/:fileName?`);
    });
  });

  describe('#middleware', () => {
    it('only admins are aloud to access this page', () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(['admin']),
        flash
      ]);

      sinon.assert.calledWith(authentication.protect, ['admin']);
    });
  });

  describe('#isDownloadExport', () => {
    it('returns true if downloading export', () => {
      page.req.params.fileName = true;
      expect(page.isDownloadExport).to.be.ok;
    });

    it('returns false if downloading export', () => {
      expect(page.isDownloadExport).to.not.be.ok;
    });
  });

  describe('#getS3Id', () => {
    it('gets s3 id from url', () => {
      expect(page.getS3Id('some/id')).to.eql('id');
    });
  });

  describe('#downloadFile', () => {
    let getObjectMock = {};
    let resMock = {};
    let reqMock = {};

    beforeEach(() => {
      getObjectMock = {};
      getObjectMock.on = sinon.stub().returns(getObjectMock);
      getObjectMock.createReadStream = sinon.stub().returns(getObjectMock);
      getObjectMock.pipe = sinon.stub().returns(getObjectMock);

      sinon.stub(s3, 'getObject').returns(getObjectMock);

      resMock = {
        set: sinon.stub(),
        flash: sinon.stub(),
        redirect: sinon.stub()
      };
      reqMock = { params: { fileName: 'some-file.file' } };
    });

    afterEach(() => {
      s3.getObject.restore();
    });

    it('successfully pipes file to response', () => {
      const code = 200;
      const headers = {
        'content-type': 'content-type',
        'content-length': 'content-length',
        'last-modified': 'last-modified',
      };
      getObjectMock.on.withArgs(sinon.match('httpHeaders')).callsArgWith(1, code, headers).returns(getObjectMock);

      page.downloadFile(reqMock, resMock);

      sinon.assert.calledWith(s3.getObject, {
        Bucket: config.services.s3.exportStoreBucketName,
        Key: reqMock.params.fileName
      });

      sinon.assert.calledWith(getObjectMock.on, 'httpHeaders');
      sinon.assert.calledWith(resMock.set, headers);
      sinon.assert.calledOnce(getObjectMock.createReadStream);
      sinon.assert.calledOnce(getObjectMock.pipe);
    });

    it('does not set headers if code 300 or more', () => {
      const code = 300;
      getObjectMock.on.withArgs(sinon.match('httpHeaders')).callsArgWith(1, code).returns(getObjectMock);

      page.downloadFile(reqMock, resMock);

      sinon.assert.notCalled(resMock.set);
    });

    it('sets flash on error', () => {
      const error = new Error('some error');
      getObjectMock.on.withArgs(sinon.match('error')).callsArgWith(1, error).returns(getObjectMock);

      page.downloadFile(reqMock, resMock);

      sinon.assert.calledWith(resMock.flash, 'Error downloading file');
      sinon.assert.calledWith(resMock.redirect, page.url);
    });
  });

  describe('#getRequest', () => {
    beforeEach(() => {
      page.downloadFile = sinon.stub();
    });

    it('calls downloadFile if in download mode', async () => {
      page.req.params.fileName = true;

      await page.getRequest(page.req, page.res);

      sinon.assert.calledOnce(page.downloadFile);
    });

    it('calls downloadFile if in download mode', async () => {
      await page.getRequest(page.req, page.res);

      sinon.assert.notCalled(page.downloadFile);
    });
  });

  describe('#getStaticExports', () => {
    it('creates a static export', async () => {
      await page.createStaticExport();
      sinon.assert.calledWith(StaticExport.create, { status: 'in_progress' })
    });
  });

  describe('#generateStaticSiteExport', () => {
    it('executes the static site export script', async () => {
      const exportUid = 'some-uid';

      let error;
      try {
        await page.generateStaticSiteExport(exportUid);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.undefined;

      sinon.assert.calledWith(execStub, `node scripts/staticSiteGenerator.js --url ${config.serviceUrl} --dir ${os.tmpdir()}/${exportUid}/export`);
    });

    it('returns error if statuc site generator failes', async () => {
      const exportUid = 'some-uid';
      const errorToRejectWith = new Error('some error');
      execStub.callsArgWith(1, errorToRejectWith);

      let error;
      try {
        await page.generateStaticSiteExport(exportUid);
      } catch (err) {
        error = err;
      }

      expect(error).to.eql(errorToRejectWith);
    });
  });

  describe('#compressStaticSiteExport', () => {
    beforeEach(() => {
      sinon.stub(tar, 'c');
    });

    afterEach(() => {
      tar.c.restore();
    });

    it('zips up directory', async () => {
      const exportUid = 'some-id';
      const exportLocation = path.resolve(`${os.tmpdir()}/${exportUid}`)

      page.compressStaticSiteExport(exportUid);

      sinon.assert.calledWith(tar.c, {
        gzip: true,
        file: `${exportLocation}/export.tar.gz`,
        cwd: exportLocation,
      }, ['export'])
    });
  });

  describe('#uploadCompressedStaticSiteExportToS3', () => {
    beforeEach(() => {
      sinon.stub(fs, 'readFileSync').returns('some-file');
      sinon.stub(s3, 'upload').callsArgWith(1, undefined, { Location: 'someLocation' });
    });

    afterEach(() => {
      s3.upload.restore();
      fs.readFileSync.restore();
    });

    it('returns location on successfull upload', async () => {
      const exportUid = 'some-id';

      let error;
      let location;
      try {
        location = await page.uploadCompressedStaticSiteExportToS3(exportUid);
      } catch(err) {
        error = err;
      }

      expect(error).to.be.undefined;
      expect(location).to.eql('someLocation');

      sinon.assert.calledWith(fs.readFileSync, `${os.tmpdir()}/${exportUid}/export.tar.gz`);
      sinon.assert.calledWith(s3.upload, {
        Bucket: config.services.s3.exportStoreBucketName,
        Key: `${exportUid}.tar.gz`,
        Body: 'some-file'
      });
    });

    it('rejects with error if upload returns error', async () => {
      const exportUid = 'some-id';
      const someError = new Error('some error');
      s3.upload.callsArgWith(1, someError);

      let error;
      try {
        await page.uploadCompressedStaticSiteExportToS3(exportUid);
      } catch(err) {
        error = err;
      }

      expect(error).to.eql(someError);
    });
  });

  describe('#removeTemporaryDirectory', () => {
    beforeEach(() => {
      sinon.stub(fs, 'rmdir').callsArg(2);
    });

    afterEach(() => {
      fs.rmdir.restore();
    });

    it('successfully removes dir', async () => {
      const exportUid = 'some-id';

      let error;
      try {
        await page.removeTemporaryDirectory(exportUid);
      } catch(err) {
        error = err;
      }

      expect(error).to.be.undefined;
      sinon.assert.calledWith(fs.rmdir, `${os.tmpdir()}/${exportUid}`, { recursive: true });
    });

    it('returns error if not able to remove dir', async () => {
      const exportUid = 'some-id';
      const someError = new Error('some error');
      fs.rmdir.callsArgWith(2, someError);

      let error;
      try {
        await page.removeTemporaryDirectory(exportUid);
      } catch(err) {
        error = err;
      }

      expect(error).to.eql(someError);
    });
  });

  describe('#doStaticExport', () => {
    const url = 'some-url';
    let staticExportModel = {};

    beforeEach(() => {
      staticExportModel = {
        save: sinon.stub()
      };

      sinon.stub(page, 'generateStaticSiteExport');
      sinon.stub(page, 'compressStaticSiteExport');
      sinon.stub(page, 'uploadCompressedStaticSiteExportToS3').returns(url);
      sinon.stub(page, 'removeTemporaryDirectory');
    });

    it('orchastrates creating static export, compressing and uploading to s3', async () => {
      await page.doStaticExport(staticExportModel);

      expect(staticExportModel.url).to.eql(url);
      expect(staticExportModel.status).to.eql('complete');
      sinon.assert.calledOnce(staticExportModel.save);

      sinon.assert.calledWith(page.generateStaticSiteExport, 'some-id');
      sinon.assert.calledWith(page.compressStaticSiteExport, 'some-id');
      sinon.assert.calledWith(page.uploadCompressedStaticSiteExportToS3, 'some-id');
      sinon.assert.calledWith(page.removeTemporaryDirectory, 'some-id');
    });

    it('recoreds error against the static export model', async () => {
      const error = new Error('some error');
      page.generateStaticSiteExport.rejects(error);

      await page.doStaticExport(staticExportModel);

      expect(staticExportModel.error).to.eql(error.message);
      expect(staticExportModel.status).to.eql('error');
      sinon.assert.calledOnce(staticExportModel.save);
    });
  });

  describe('#getCurrentExport', () => {
    let currentExport = {};
    beforeEach(() => {
      currentExport = {
        save: sinon.stub(),
        updated_at: moment().format()
      };
      StaticExport.findOne.returns(currentExport);
    });

    it('gets the current export', async () => {
      const returnedCurrentExport = await page.getCurrentExport();
      expect(returnedCurrentExport).to.eql(currentExport);
    });

    it('sets export to expire if 10 minutes old', async () => {
      currentExport.updated_at = moment().subtract(11, 'minutes').format();

      const returnedCurrentExport = await page.getCurrentExport();

      expect(returnedCurrentExport).to.be.undefined;

      expect(currentExport.status).to.eql('error');
      expect(currentExport.error).to.eql('Timeout');
      sinon.assert.calledOnce(currentExport.save);
    });

    it('returns undefined if no export found', async () => {
      StaticExport.findOne.returns();

      const returnedCurrentExport = await page.getCurrentExport();

      expect(returnedCurrentExport).to.be.undefined;
    });
  });

  describe('#postRequest', () => {
    beforeEach(() => {
      sinon.stub(page, 'getCurrentExport');
      sinon.stub(page, 'createStaticExport');
      sinon.stub(page, 'doStaticExport');
    });

    it('sets error on flash if currentExport in progress', async () => {
      page.getCurrentExport.returns(true);

      await page.postRequest(page.req, page.res);

      sinon.assert.calledWith(page.req.flash, 'Export still in progress');
      sinon.assert.notCalled(page.createStaticExport);
      sinon.assert.notCalled(page.doStaticExport);
    });

    it('starts export', async () => {
      await page.postRequest(page.req, page.res);

      sinon.assert.calledOnce(page.createStaticExport);
      sinon.assert.calledOnce(page.doStaticExport);
    });
  });
});
