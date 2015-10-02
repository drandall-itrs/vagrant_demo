/*
 * Copyright 2012 ITRS Group Plc
 *
 * CommandsJS Object
 * Commands Module for Geneos EUEM
 * Contains all executable commands supported.
 * --------------------------------------------------------------
 * Requires: CasperJS
 * --------------------------------------------------------------
 */

var utils = require('utils');

exports.create = function create() {
    return new CommandsJS();
};

/**
 * CommandsJS constructor
 */
var CommandsJS = function() {
    this.commands = {
        open : "this.web.open(command.target, hook);",
        click : "this.web.click(command.target, hook);",
        clickAndWait : "this.web.clickAndWait(command.target, hook);",
        type : "this.web.type(command.target, command.value, hook);",
        typeAndWait : "this.web.typeAndWait(command.target, command.value, hook);",
        check : "this.web.check(command.target, hook);",
        checkAndWait : "this.web.checkAndWait(command.target, hook);",
        uncheck : "this.web.uncheck(command.target, hook);",
        uncheckAndWait : "this.web.uncheckAndWait(command.target, hook);",
        select : "this.web.toggleSelection(command.target, command.value, true, hook);",
        selectAndWait : "this.web.toggleSelectionAndWait(command.target, command.value, true, hook);",
        addSelection : "this.web.toggleSelection(command.target, command.value, true, hook);",
        removeSelection : "this.web.toggleSelection(command.target, command.value, false, hook);",
        addSelectionAndWait : "this.web.toggleSelectionAndWait(command.target, command.value, true, hook);",
        removeSelectionAndWait : "this.web.toggleSelectionAndWait(command.target, command.value, false, hook);",
        captureEntirePageScreenshot : "this.web.captureEntirePageScreenshot(command.target, hook);",
        captureEntirePageScreenshotAndWait : "this.web.captureEntirePageScreenshotAndWait(command.target, hook);",
        focus : "this.web.focus(command.target, hook);",
        focusAndWait : "this.web.focusAndWait(command.target, hook);",
        submit : "this.web.submit(command.target, hook);",
        clickAt : "this.web.clickAt(command.target, command.value, hook);",
        clickAtAndWait : "this.web.clickAtAndWait(command.target, command.value, hook);",
        removeAllSelections : "this.web.removeAllSelections(command.target, hook);",
        setCursorPosition : "this.web.setCursorPosition(command.target, command.value, hook);",
        setCursorPositionAndWait : "this.web.setCursorPositionAndWait(command.target, command.value, hook);",
        setTimeout : "this.web.setTimeout(command.target, hook);",
        loginWithBasicAuthentication : "this.web.openWithAuthentication(command.target, command.value, hook);",
        createCookie : "this.web.createCookie(command.target, command.value, hook);",
        createCookieAndWait : "this.web.createCookieAndWait(command.target, command.value, hook);",
        deleteCookie : "this.web.deleteCookie(command.target, hook);",
        pause : "this.web.pause(command.target, hook);",
        refresh : "this.web.refresh(hook);",
        goBack : "this.web.goBack(hook);",
        goBackAndWait : "this.web.goBackAndWait(hook);",
        downloadFile : "this.web.downloadFile(command.target, command.value, hook);",
        setViewport : "this.web.setViewport(command.target, hook);",
        echo : "this.web.echo(command.target, hook);",
        sendKeys : "this.web.sendKeys(command.target, command.value);",
        sendKeysAndWait : "this.web.sendKeysAndWait(command.target, command.value);",
        typeKeys : "this.web.sendKeys(command.target, command.value);",
        typeKeysAndWait : "this.web.sendKeysAndWait(command.target, command.value);",
        saveAsMHT : "this.web.saveAsMHT(command.target);",

        waitForPageToLoad : "this.web.waitForPageToLoad(command.target, hook);",
        waitForFrameToLoad : "this.web.waitForFrameToLoad(command.target, command.value, hook);",
        waitForEval : "this.web.waitForEval(command.target, command.value, hook);",
        waitForChecked : "this.web.waitForChecked(command.target, hook);",
        waitForElementPresent : "this.web.waitForElementPresent(command.target, hook);",
        waitForCondition : "this.web.waitForCondition(command.target, command.value, hook);",
        waitForText : "this.web.waitForText(command.target, command.value, hook);",
        waitForValue : "this.web.waitForValue(command.target, command.value, hook);",
        waitForVisible : "this.web.waitForVisible(command.target, hook);",
        waitForTitle : "this.web.waitForTitle(command.target, hook);",
        waitForBodyText : "this.web.waitForBodyText(command.target, hook);",
        waitForTextNotPresent : "this.web.waitForTextNotPresent(command.target, hook);",
        waitForPopUp : "this.web.waitForPopUp(command.target, command.value, hook);",
        
        // accessors
        store : "this.accessors.store(command.value, command.target, hook);",
        storeLocation : "this.accessors.storeLocation(command.value, hook);",
        storeTitle : "this.accessors.storeTitle(command.value, hook);",
        storeBodyText : "this.accessors.storeBodyText(command.value, hook);",
        storeAllLinks : "this.accessors.storeAllLinks(command.value, hook);",
        storeAllFields : "this.accessors.storeAllFields(command.value, hook);",
        storeAllButtons : "this.accessors.storeAllButtons(command.value, hook);",
        storeHtmlSource : "this.accessors.storeHtmlSource(command.value, hook);",
        storeValue : "this.accessors.storeValue(command.target, command.value, hook);",
        storeAttribute : "this.accessors.storeAttribute(command.target, command.value, hook);",
        storeExpression : "this.accessors.storeExpression(command.target, command.value, hook);",
        storeEval : "this.accessors.storeEval(command.target, command.value, hook);",
        storeElementPresent : "this.accessors.storeElementPresent(command.target, command.value, hook);",
        storeChecked : "this.accessors.storeChecked(command.target, command.value, hook);",
        storeSomethingSelected : "this.accessors.storeSomethingSelected(command.target, command.value, hook);",
        storeTable : "this.accessors.storeTable(command.target, command.value, hook);",
        storeText : "this.accessors.storeText(command.target, command.value, hook);",
        storeTextPresent : "this.accessors.storeTextPresent(command.value, command.target, hook);",

        // verify
        verifyEval : "this.assert.verifyEval(command.target, command.value, hook);",
        verifyText : "this.assert.verifyText(command.target, command.value, hook);",
        verifyVisible : "this.assert.verifyVisible(command.target, hook);",
        verifyValue : "this.assert.verifyValue(command.target, command.value, hook);",
        verifyExpression : "this.assert.verifyExpression(command.target, command.value, hook);",
        verifyElementPresent : "this.assert.verifyElementPresent(command.target, hook);",
        verifyTextPresent : "this.assert.verifyTextPresent(command.target, hook);",
        verifyTextNotPresent : "this.assert.verifyTextNotPresent(command.target, hook);",
        verifyTitle : "this.assert.verifyTitle(command.target, hook);",
        verifyNotTitle : "this.assert.verifyNotTitle(command.target, hook);",
        verifySelectedValue : "this.assert.verifySelection('value', false, false, command.target, command.value, hook);",
        verifySelectedValues : "this.assert.verifySelection('value', false, true, command.target, command.value, hook);",
        verifySelectedLabel : "this.assert.verifySelection('text', false, false, command.target, command.value, hook);",
        verifySelectedLabels : "this.assert.verifySelection('text', false, true, command.target, command.value, hook);",
        verifySelectedIndex : "this.assert.verifySelection('index', false, false, command.target, command.value, hook);",
        verifySelectedIndexes : "this.assert.verifySelection('index', false, true, command.target, command.value, hook);",
        verifySelectedId : "this.assert.verifySelection('id', false, false, command.target, command.value, hook);",
        verifySelectedIds : "this.assert.verifySelection('id', false, true, command.target, command.value, hook);",
        
        // asserts
        assertAlert : "this.assert.assertAlert(command.target, hook);",
        assertAlertPresent : "this.assert.assertAlertPresent(command.target, hook);",
        assertAlertNotPresent : "this.assert.assertAlertNotPresent(command.target, hook);",
        assertElementPresent : "this.assert.assertElementPresent(command.target, hook);",
        assertElementNotPresent : "this.assert.assertElementNotPresent(command.target, hook);",
        assertChecked : "this.assert.assertChecked(command.target, hook);",
        assertVisible : "this.assert.assertVisible(command.target, hook);",
        assertValue : "this.assert.assertValue(command.target, command.value, hook);",
        assertText : "this.assert.assertText(command.target, command.value, hook);",
        assertBodyText : "this.assert.assertBodyText(command.target, hook);",
        assertTextPresent : "this.assert.assertTextPresent(command.target);",
        assertTextNotPresent : "this.assert.assertTextNotPresent(command.target);",
        assertTitle : "this.assert.assertTitle(command.target);",
        assertLocation : "this.assert.assertLocation(command.target);",
        assertSelectedValue : "this.assert.verifySelection('value', true, false, command.target, command.value, hook);",
        assertSelectedValues : "this.assert.verifySelection('value', true, true, command.target, command.value, hook);",
        assertSelectedLabel : "this.assert.verifySelection('text', true, false, command.target, command.value, hook);",
        assertSelectedLabels : "this.assert.verifySelection('text', true, true, command.target, command.value, hook);",
        assertSelectedIndex : "this.assert.verifySelection('index', true, false, command.target, command.value, hook);",
        assertSelectedIndexes : "this.assert.verifySelection('index', true, true, command.target, command.value, hook);",
        assertSelectedId : "this.assert.verifySelection('id', true, false, command.target, command.value, hook);",
        assertSelectedIds : "this.assert.verifySelection('id', true, true, command.target, command.value, hook);",

    };
};

CommandsJS.prototype.get = function(command) {
    return this.commands[command];
};

exports.CommandsJS = CommandsJS;
