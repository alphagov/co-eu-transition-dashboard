const { expect, sinon } = require("test/unit/util/chai");
const config = require("config");
const entityUserPermissions = require("middleware/entityUserPermissions");
const flash = require("middleware/flash");
const RaygValues = require("pages/admin/rayg-values/RaygValues");
const authentication = require("services/authentication");
const Entity = require("models/entity");
const Category = require("models/category");
const sequelize = require("services/sequelize");

let page = {};
let res = {};
let req = {};

describe("pages/admin/rayg-values/RaygValues", () => {
  beforeEach(() => {
    res = {
      cookies: sinon.stub(),
      redirect: sinon.stub(),
      sendStatus: sinon.stub(),
      send: sinon.stub(),
      status: sinon.stub(),
      locals: {}
    };
    req = { cookies: [], user: { roles: [], flash: sinon.stub() } };
    res.status.returns(res);

    page = new RaygValues("some path", req, res);

    sinon.stub(authentication, "protect").returns([]);
  });

  afterEach(() => {
    authentication.protect.restore();
  });

  describe("#url", () => {
    it("returns correct url", () => {
      expect(page.url).to.eql(config.paths.admin.raygValues);
    });
  });

  describe("#successfulMode", () => {
    it("returns true when in successful mode", () => {
      page.req.params = { successful: "successful" };
      expect(page.successfulMode).to.be.ok;
    });

    it("returns false when not in successful mode", () => {
      expect(page.successfulMode).to.be.not.ok;
    });
  });

  describe("#middleware", () => {
    it("only uploaders are allowed to access this page", () => {
      expect(page.middleware).to.eql([
        ...authentication.protect(["admin"]),
        entityUserPermissions.assignEntityIdsUserCanAccessToLocals,
        flash
      ]);
    });
  });

  describe("#isValid", () => {
    const body = { "123": "red", "234": "green" };

    it("should return array of errors when ids are not valid", async () => {
      const validIds = ["123"];
      const response = await page.isValid(body, validIds);
      expect(response).to.eql(["Invalid Entity ID"]);
    });

    it("should return empty when all Ids are valid", async () => {
      const validIds = ["123", "234"];
      const response = await page.isValid(body, validIds);
      expect(response).to.eql([]);
    });
  });

  describe("#buildEntitiesToBeSaved", () => {
    it("should return correctly formated entity data", async () => {
      const body = { "123": "red", "234": "green" };
      const entities = {
        "123": { publicId: 123, categoryId: 2 },
        "234": { publicId: 234, categoryId: 2 }
      };
      const response = await page.buildEntitiesToBeSaved(body, entities);
      expect(response).to.eql([
        { publicId: 123, categoryId: 2, raygStatus: "red" },
        { publicId: 234, categoryId: 2, raygStatus: "green" }
      ]);
    });
  });

  describe("#flatternEntityData", () => {
    it("should return a flattern entity data", async () => {
      const entities = [
        {
          id: 123,
          categoryId: 2,
          children: [
            { id: 234, categoryId: 2 },
            { id: 345, categoryId: 3 }
          ]
        }
      ];
      const response = await page.flatternEntityData(entities);
      expect(response).to.eql({
        123: { id: 123, categoryId: 2 },
        234: { id: 234, categoryId: 2 },
        345: { id: 345, categoryId: 3 }
      });
    });
  });

  describe("#postRequest", () => {
    beforeEach(() => {
      sinon.stub(page, "getThemesAndTopLevelStatements").returns([
        {
          id: 123,
          publicId: "theme-1",
          categoryId: 2,
          children: [
            { id: 234, publicId: "state-1", categoryId: 2 },
            { id: 345, publicId: "state-2", categoryId: 3 }
          ]
        }
      ]);
      sinon.stub(page, "saveData");
    });

    afterEach(() => {
      page.getThemesAndTopLevelStatements.restore();
      page.saveData.restore();
    });

    it("should call flash and redirect on error ", async () => {
      req = {
        body: { 678: "red" },
        originalUrl: "someurl",
        flash: sinon.stub()
      };

      await page.postRequest(req, res);
      sinon.assert.calledWith(req.flash, ["Invalid Entity ID"]);
      sinon.assert.calledWith(res.redirect, req.originalUrl);
    });

    it("should call saveData when no errors returned", async () => {
      req = {
        body: { 123: "red" },
        originalUrl: "someurl",
        flash: sinon.stub()
      };
      await page.postRequest(req, res);
      sinon.assert.calledWith(page.saveData, [
        { publicId: "theme-1", categoryId: 2, raygStatus: "red" }
      ]);
    });
  });

  describe("#saveData", () => {
    const categoryFields = [{ name: "publicId" }, { name: "raygStatus" }];
    const themeCategory = { id: 1, name: "Theme" };
    const statementCategory = { id: 2, name: "Statement" };
    const dataToSave = [
      { publicId: "B", categoryId: 1, raygStatus: "red", id: 123 }
    ];

    beforeEach(() => {
      sinon.stub(Category, "fieldDefinitions").returns(categoryFields);
      Category.findAll.returns([themeCategory, statementCategory]);
      sinon.stub(Entity, "import");
    });

    afterEach(() => {
      Entity.import.restore();
      Category.fieldDefinitions.restore();
    });

    it("should call entity import and redirect", async () => {
      page.req = {
        body: { 678: "red" },
        originalUrl: "someurl",
        flash: sinon.stub()
      };

      const transaction = sequelize.transaction();
      transaction.commit.reset();
      transaction.rollback.reset();

      await page.saveData(dataToSave);

      sinon.assert.calledWith(Entity.import, dataToSave[0], themeCategory, categoryFields, { transaction, ignoreParents: true } );
      sinon.assert.calledOnce(transaction.commit);
      sinon.assert.calledWith(page.res.redirect, `${page.req.originalUrl}/successful`);
    });

    it("should call entity import and redirect", async () => {
      page.req = {
        body: { 678: "red" },
        originalUrl: "someurl",
        flash: sinon.stub()
      };

      const transaction = sequelize.transaction();
      transaction.commit.reset();
      transaction.rollback.reset();

      Entity.import.throws(new Error("error"));

      await page.saveData(dataToSave);

      sinon.assert.calledOnce(transaction.rollback);
      sinon.assert.calledWith(page.res.redirect, page.req.originalUrl);
    });
  });
});
