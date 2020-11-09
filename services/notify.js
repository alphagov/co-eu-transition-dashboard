const NotifyClient = require('notifications-node-client').NotifyClient;
const logger = require('services/logger');
const { notify, serviceUrl } = require('config');
const get = require('lodash/get');
const uuid = require('uuid');


const ERROR_SENDING_EMAIL_MESSAGE="ERROR_SENDING_EMAIL";
const API_KEY_NOT_SET_MESSAGE = "No notify API key set";

const assertNotifyApiKeyPresent = () =>{
  if (!notify.apiKey) {
    logger.error(API_KEY_NOT_SET_MESSAGE)
    throw new Error(ERROR_SENDING_EMAIL_MESSAGE);
  }
}

const sendEmailWithTempPassword = async ({ email, userId, password }) => {
  assertNotifyApiKeyPresent();

  try {
    const notifyClient = new NotifyClient(notify.apiKey);

    await notifyClient.sendEmail(
      notify.createTemplateKey,
      email,
      {
        personalisation: {
          password,
          email,
          link: serviceUrl,
          privacy_link: serviceUrl + "privacy-notice"
        },
        reference: `${userId}`
      },
    );
  } catch (error) {
    logger.error(`${ERROR_SENDING_EMAIL_MESSAGE} error: ${error}`);
    throw get(error, 'error.errors[0]') || { message: ERROR_SENDING_EMAIL_MESSAGE };
  }

  logger.info(`Email sent to ${email} with temporary password`);
}

const sendDailyUpdatesEmail = async({ emails, measures, projects, milestones }) => {
  assertNotifyApiKeyPresent();

  const notifyClient = new NotifyClient(notify.apiKey);

  for(const email of emails) {
    const reference = uuid.v4();
    try {
      await notifyClient.sendEmail(
        notify.dailyUpdatesNotifcationKey,
        email,
        {
          personalisation: {
            measures,
            projects,
            milestones
          },
          reference
        }
      );
      logger.info(`Sent measures updated today email to ${email}`);
    } catch(error) {
      logger.error(`Error sending measures updated today email to ${email}, reference: ${reference},  Err: ${error}`);
    }
  }
}

module.exports = {
  sendEmailWithTempPassword,
  sendDailyUpdatesEmail
}