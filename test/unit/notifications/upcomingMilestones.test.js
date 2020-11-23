const { sinon, expect } = require('test/unit/util/chai');
const User = require("models/user");
const Department = require("models/department");
const Role = require("models/role");
const proxyquire = require('proxyquire');
const config = require('config');
const moment = require('moment');
const locks = require('helpers/locks');

let sendEmailStub = sinon.stub();
let getAllDataStub = sinon.stub();

const notificationsNodeClientStub = {
  NotifyClient: function() {
    return {
      sendEmail: sendEmailStub
    };
  }
};

const daoStub = function() {
  return {
    getAllData: getAllDataStub
  };
};

const upcomingMilestones = proxyquire('notifications/upcomingMilestones', {
  'notifications-node-client': notificationsNodeClientStub,
  'services/dao': daoStub
});

describe('notifications/upcomingMilestones', () => {
  describe('#getProjectsDueInNextTwoDays', () => {
    it('gets all projects that have milestones due in two days time that are not complete', async () => {
      await upcomingMilestones.upcomingMilestonesNotifications.getProjectsDueInNextTwoDays();

      const search = {
        date: {
          from: moment().add('2', 'days').format('DD/MM/YYYY'),
          to: moment().add('2', 'days').format('DD/MM/YYYY')
        },
        complete: ['No']
      };

      sinon.assert.calledWith(getAllDataStub, null, search);
    })
  });

  describe('#groupProjectsByDepartment', () => {
    it('groups projects into departments', () => {
      const projects = [{
        departmentName: 'Foo'
      },{
        departmentName: 'Foo'
      },{
        departmentName: 'Bar'
      }];

      const departments = upcomingMilestones.upcomingMilestonesNotifications.groupProjectsByDepartment(projects);

      const expected = {
        'Foo': [{
          departmentName: 'Foo'
        },{
          departmentName: 'Foo'
        }],
        'Bar': [{ departmentName: 'Bar' }]
      }

      expect(departments).to.eql(expected);
    });
  });

  describe('#getUsers', () => {
    it('finds users with upload permissions for a given department', async () => {

      const departmentName = 'some-department';
      await upcomingMilestones.upcomingMilestonesNotifications.getUsers(departmentName);

      sinon.assert.calledWith(User.findAll, {
        include: [{
          model: Department,
          where: {
            name: departmentName
          }
        },{
          model: Role,
          required: true,
          where: {
            name: 'uploader'
          }
        }]
      });
    });
  });

  describe('#sendEmails', () => {
    const projectsByDepartment = {
      'department1': [{
        title: 'project title',
        milestones: [{ uid: '123' }]
      }]
    };

    const users = [{
      email: 'email@email.com',
      id: 1
    },{
      email: 'email2@email.com',
      id: 2
    }];

    beforeEach(() => {
      User.findAll.resolves(users);
    });

    it('sends emails to users', async () => {
      const list = [
        `${projectsByDepartment['department1'][0].title} - ${projectsByDepartment['department1'][0].milestones[0].uid}`
      ];

      await upcomingMilestones.upcomingMilestonesNotifications.sendEmails(projectsByDepartment);

      sinon.assert.calledWith(sendEmailStub, config.notify.missedMilestonesKey,
        users[0].email,
        {
          personalisation: {
            email_address: users[0].email,
            list: list.join('; '),
            link: config.serviceUrl
          },
          reference: `${users[0].id}`
        }
      );

      sinon.assert.calledWith(sendEmailStub, config.notify.missedMilestonesKey,
        users[1].email,
        {
          personalisation: {
            email_address: users[1].email,
            list: list.join(', '),
            link: config.serviceUrl
          },
          reference: `${users[1].id}`
        }
      );
    });
  });

  describe('#notifyupcomingMilestones.upcomingMilestonesNotifications', () => {
    const projects = [{ id: 1 }];
    const projectsByDepartment = [{ name: 'dept 1', projects }];
    const summary = 'some summary';

    beforeEach(() => {
      sinon.stub(upcomingMilestones.upcomingMilestonesNotifications, 'getProjectsDueInNextTwoDays').returns(projects);
      sinon.stub(upcomingMilestones.upcomingMilestonesNotifications, 'groupProjectsByDepartment').returns(projectsByDepartment);
      sinon.stub(upcomingMilestones.upcomingMilestonesNotifications, 'sendEmails').returns(summary);
      sinon.stub(upcomingMilestones.upcomingMilestonesNotifications, 'sendSummaryNotification');

      sinon.stub(locks, 'setLock');
      sinon.stub(locks, 'getLock');
      sinon.stub(locks, 'clearLock');
    });

    afterEach(() => {
      upcomingMilestones.upcomingMilestonesNotifications.getProjectsDueInNextTwoDays.restore();
      upcomingMilestones.upcomingMilestonesNotifications.sendSummaryNotification.restore();
      upcomingMilestones.upcomingMilestonesNotifications.groupProjectsByDepartment.restore();
      upcomingMilestones.upcomingMilestonesNotifications.sendEmails.restore();

      locks.setLock.restore();
      locks.getLock.restore();
      locks.clearLock.restore();
    });

    it('orchastrates notify Upcoming Milestones', async () => {
      locks.setLock.returns('some-id');
      locks.getLock.returns(true);

      await upcomingMilestones.notifyUpcomingMilestones();

      sinon.assert.calledWith(locks.setLock, config.locks.upcomingMilestonesNotifications);
      sinon.assert.calledWith(locks.getLock, 'some-id', config.locks.upcomingMilestonesNotifications);
      sinon.assert.calledWith(locks.clearLock, config.locks.upcomingMilestonesNotifications);

      sinon.assert.calledOnce(upcomingMilestones.upcomingMilestonesNotifications.getProjectsDueInNextTwoDays);
      sinon.assert.calledWith(upcomingMilestones.upcomingMilestonesNotifications.groupProjectsByDepartment, projects);
      sinon.assert.calledWith(upcomingMilestones.upcomingMilestonesNotifications.sendEmails, projectsByDepartment);
      sinon.assert.calledWith(upcomingMilestones.upcomingMilestonesNotifications.sendSummaryNotification, summary);
    });

    it('does not run if lock exists', async () => {
      locks.setLock.returns('some-id');
      locks.getLock.returns(false);

      await upcomingMilestones.notifyUpcomingMilestones();

      sinon.assert.calledWith(locks.setLock, config.locks.upcomingMilestonesNotifications);
      sinon.assert.calledWith(locks.getLock, 'some-id', config.locks.upcomingMilestonesNotifications);
      sinon.assert.calledWith(locks.clearLock, config.locks.upcomingMilestonesNotifications);

      sinon.assert.notCalled(upcomingMilestones.upcomingMilestonesNotifications.getProjectsDueInNextTwoDays);
      sinon.assert.notCalled(upcomingMilestones.upcomingMilestonesNotifications.groupProjectsByDepartment);
      sinon.assert.notCalled(upcomingMilestones.upcomingMilestonesNotifications.sendEmails);
      sinon.assert.notCalled(upcomingMilestones.upcomingMilestonesNotifications.sendSummaryNotification);
    });
  });

  describe('#sendSummaryNotification', () => {
    it('should send email summerising notifications', async () => {
      const summary = {
        infos: ['some info', 'some info2'],
        errors: ['errors 1', 'errors 2']
      };

      await upcomingMilestones.upcomingMilestonesNotifications.sendSummaryNotification(summary);

      sinon.assert.calledWith(sendEmailStub,
        config.notify.summaryNotificationKey,
        config.notify.summaryNotificationEmail,
        {
          personalisation: {
            email_address: config.notify.summaryNotificationEmail,
            infos: summary.infos.join(', '),
            errors: summary.errors.join(', ')
          }
        }
      );
    });
  });
});
