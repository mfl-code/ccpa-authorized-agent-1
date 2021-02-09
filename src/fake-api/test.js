'use strict';

const {Builder, By} = require('selenium-webdriver');
const assert = require('assert');
const { getLatestEmail, verificationSmsSent, verificationSmsApproved } = require('./index');

const setupTimeout = 5 * 1000;

suite('integration', () => {
  let driver;

  suiteSetup(async function() {
    this.timeout(setupTimeout);

    driver = await new Builder()
      .forBrowser('firefox')
      .usingServer(`http://${process.env.WEBDRIVER_DOMAIN}/wd/hub`)
      .build();
  });

  suiteTeardown(async () => {
    driver && await driver.quit();
  });

  test('completes signup flow', async function () {
    this.timeout(15000);

    // Complete form
    await driver.get(process.env.APP_DOMAIN);
    await driver.findElement(By.css('#first-name')).sendKeys('Tessa');
    await driver.findElement(By.css('#last-name')).sendKeys('Tester');
    await driver.findElement(By.css('#address-street')).sendKeys('555 Main St.');
    await driver.findElement(By.css('#address-city')).sendKeys('Santa Monica');
    await driver.findElement(By.css('#address-zipcode')).sendKeys('90410');
    await driver.findElement(By.css('#email')).sendKeys('tessa.tester@example.com');
    await driver.findElement(By.css('#phone')).sendKeys('206-643-7362');
    // await driver.findElement(By.css('#phone')).sendKeys('555-555-5555');
    await driver.findElement(By.css('#consent-text')).click();
    await driver.findElement(By.css('#consent-agent')).click();
    await driver.findElement(By.css('#consent-response')).click();
    await driver.findElement(By.css('#consent-email')).click();
    await driver.findElement(By.css('#consent-policies')).click();
    await driver.findElement(By.css('#volunteer')).click();
    const successText = await driver.findElement(By.css('#success h2')).getText();
    assert.strictEqual(successText, 'Thanks for signing up! You have a few more steps to enroll');
    
    // Click link to verify email
    let email = getLatestEmail();
    const emailLink = email.match(/To confirm your email, click <a href="([^"])">/)[1];
    
    // Enter code to verify phone
    await driver.get(emailLink);
    assert.strictEqual(verificationSmsSent(), true);
    await driver.findElement(By.css('#code')).sendKeys('99999');
    await driver.findElement(By.css('#verify-code')).click();
    
    // Receive link to authorization form
    await driver.wait(driver.findElement(By.css('#part-2 h1')).isVisible());
    assert.strictEqual(verificationSmsApproved(), true);
    email = getLatestEmail();
    assert.match(email, /Thank you for enrolling in the Consumer Reports Authorized Agent study/);
    assert.match(email, /<a href="https:\/\/na4\.docusign\.net\/Member\/PowerFormSigning\.aspx/);
  });
});
