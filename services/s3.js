const config = require('config');
const AWS = require('aws-sdk');

const options = {
  apiVersion: '2006-03-01',
  accessKeyId: config.services.s3.accessKey,
  secretAccessKey: config.services.s3.secret,
  region: config.services.s3.region
};

if(config.services.vcapServices && config.services.vcapServices['aws-s3-bucket'].length) {
  options.accessKeyId = config.services.vcapServices['aws-s3-bucket'][0].credentials.aws_access_key_id;
  options.secretAccessKey = config.services.vcapServices['aws-s3-bucket'][0].credentials.aws_secret_access_key;
  options.region = config.services.vcapServices['aws-s3-bucket'][0].credentials.aws_region;
}

AWS.config.update({ region: options.region });

module.exports = new AWS.S3(options);
