import { UserSDK } from './UserSDK';
import { expect } from 'chai';
import * as fse from 'fs-extra';
import * as path from "path";
import {
  userCreateWithDefaultName, userCreateWithName1, userCreateWithName2,
  createError, readError, DEFAULT_USER } from './UserSDK.spec.data';

describe('UserSDK', async () => {
  let userSDK;
  before(async () => {
    userSDK = new UserSDK();
    process.env.DATABASE_PATH = __dirname;
  });
  it('should create user with "guest" as name and formatedName if name is not passed', async () => {
    const timeBefore = Date.now();
    const createResponse = await userSDK.create(userCreateWithDefaultName);
    const readResponse = await userSDK.read();
    expect(createResponse._id).to.be.exist;
    expect(readResponse._id).to.be.exist;
    expect(readResponse.name).to.be.equal(DEFAULT_USER);
    expect(readResponse.formatedName).to.be.equal(DEFAULT_USER);
    expect(readResponse.framework).to.deep.equal(userCreateWithDefaultName.framework);
    expect(readResponse.createdOn).to.be.lte(Date.now()).gte(timeBefore);
    expect(readResponse.updatedOn).to.be.lte(Date.now()).gte(timeBefore);
  });
  it('should fetch default "guest" user if name is not passed', async () => {
    const readResponse = await userSDK.read();
    expect(readResponse.name).to.be.equal(DEFAULT_USER);
    expect(readResponse.formatedName).to.be.equal(DEFAULT_USER);
  });
  it('should create user with passed name as name and lowercase of name as formatedName', async () => {
    const createResponse = await userSDK.create(userCreateWithName1.data);
    const readResponse = await userSDK.read(userCreateWithName1.name);
    expect(createResponse._id).to.be.exist;
    expect(readResponse.formatedName).to.be.equal(userCreateWithName1.data.formatedName);
    expect(readResponse.name).to.be.equal(userCreateWithName1.name);
  });
  it('should create user with passed name as name and lowercase of name as formatedName with including space', async () => {
    const createResponse = await userSDK.create(userCreateWithName2.data);
    const readResponse = await userSDK.read(userCreateWithName2.name);
    expect(createResponse._id).to.be.exist;
    expect(readResponse.formatedName).to.be.equal(userCreateWithName2.data.formatedName);
    expect(readResponse.name).to.be.equal(userCreateWithName2.name);
  });
  it('should throw error if tried to create record without name for the second time', async () => {
    await userSDK.create(userCreateWithDefaultName).catch(error => {
      expect(error.code).to.be.equal(createError.code);
      expect(error.status).to.be.equal(createError.status);
      expect(error.message).to.be.includes(createError.message);
    });
  });
  it('should throw error if tried to create record with name that has been used already', async () => {
    await userSDK.create(userCreateWithName1).catch(error => {
      expect(error.code).to.be.equal(createError.code);
      expect(error.status).to.be.equal(createError.status);
      expect(error.message).to.be.includes(createError.message);
    });
  });

  it('should throw error if tried to read user document which is not created', async () => {
    await userSDK.read('not_create_doc').catch(error => {
      expect(error.code).to.be.equal(readError.code);
      expect(error.status).to.be.equal(readError.status);
      expect(error.message).to.be.includes(readError.message);
    });
  });

  after(async () => {
    await fse.remove(path.join(__dirname, 'users'))
  })
})
