const { expect, sinon } = require('test/unit/util/chai');
const proxyquire = require('proxyquire');
const config = require('config');

let s3 = {};
let s3Stub = {};
let s3Instance = { some: 'instance' };

describe('services/s3', () => {
  beforeEach(() => {
    s3Stub = sinon.stub().returns(s3Instance);

    s3 = proxyquire('services/s3', {
      'aws-sdk': { S3: s3Stub }
    });
  });

  it('should create an s3 instance', () => {
    const options = {
      apiVersion: '2006-03-01',
      accessKeyId: config.services.s3.accessKey,
      secretAccessKey: config.services.s3.secret,
      region: config.services.s3.region
    };
    sinon.assert.calledWith(s3Stub, options);

    expect(s3).to.eql(s3Instance);
  });
});
