/*
 * Copyright 2012 ITRS Group Plc
 *
 * Messages/Resource Module
 * --------------------------------------------------------------
 * Requires: 
 * --------------------------------------------------------------
 */
exports.create = function create() {
    return new Messages();
};

/**
 * Collection of each to use functions
 */
var Messages = function() {

    /**
     * %1 - first argument %2 - second argument %n - nth argument
     */
    this.message_resources = {
        // COMMON / GENERAL ERRORS
        'ERROR_GEN_LOCATOR_NOT_FOUND'       : 'Element "%1" not found.',
        'ERROR_GEN_SCENARIO_TIMEOUT'        : 'Scenario exceeds %1 timeout.',

        // COMMON / GENERAL ERRORS
        'ERROR_MOUSE_MOVE_FAILED'           : 'Failed to move mouse pointer to target element.',
        'ERROR_MOUSE_OVER_FAILED'           : 'Failed to move mouse pointer over to target element.',
        'ERROR_SAVE_AS_MHT_FAILED'          : 'Failed to save page as MHT.',
        'ERROR_FILE_DOWNLOAD_FAILED'        : 'Failed downloading the file.',
        'ERROR_STEP_TIMED_OUT'              : 'Step exceeds %1 timeout.',
        'ERROR_LOGIN_TIMED_OUT'             : 'Login timed out. Invalid authentication details.',
        'ERROR_TYPE_FAILED'                 : 'Failed to send characters to page element.',
        'ERROR_CHECK_FAILED'                : 'Failed to tick checkbox or radio button.',
        'ERROR_UNCHECK_FAILED'              : 'Failed to untick checkbox or radio button.',
        'ERROR_CLICK_FAILED'                : 'Failed to perform mouse click.',
        'ERROR_CAPTURE_FAILED'              : 'Failed to capture screen shot.',
        'ERROR_ITEM_SELECTION_FAILED'       : 'Failed to locate item to select/deselect.',
        'ERROR_INVALID_FORM'                : 'Form element is invalid.',
        'ERROR_FOCUS_FAILED'                : 'Failed to set focus on element.',
        'ERROR_SET_TIMEOUT_FAILED'          : 'Failed to set new timeout.',
        
        // ASSERT ERRORS
        'ERROR_ASSERT_ALERT'                : 'Alert message is not equal. Expected: "%1". Actual: "%2".',
        'ERROR_ASSERT_ALERT_PRESENT'        : 'Alert message does not occurred.',
        'ERROR_ASSERT_ALERT_NOT_PRESENT'    : 'Alert message occurred.',
        'ERROR_ASSERT_VALUE'                : 'Element value is not equal as expected. Expected: "%1". Actual: "%2".',
        'ERROR_ASSERT_TEXT'                 : 'Element text is not equal as expected. Expected: "%1". Actual: "%2".',
        'ERROR_ASSERT_TEXT_PRESENT'         : 'Text is present in the page content.',
        'ERROR_ASSERT_TEXT_NOT_PRESENT'     : 'Text is not present in the page content.',
        'ERROR_ASSERT_LOCATION'             : 'Location expected does not match the current location. Expected: "%1". Actual "%2".',
        'ERROR_DIFFERENT_PAGE_TITLE'        : 'Page title expected does not match the current page title. Expected: "%1". Actual: "%2".',
        'ERROR_SAME_PAGE_TITLE'             : 'Expected title is the current page title.',
        'ERROR_ASSERT_ELEMENT_PRESENT'      : 'Element is present in the page.',
        'ERROR_ASSERT_NOT_CHECKED'          : 'Checkbox or Radio element is not marked as checked.',
        'ERROR_ASSERT_NOT_VISIBLE'          : 'Element is not visible.',
        'ERROR_ASSERT_DIFFERENT_BODY_TEXT'  : 'Body text is not the same as expected.',
        'ERROR_ASSERT_ATTRIBUTE_NOT_EXISTS' : 'Element attribute does not exists.',
        'ERROR_INVALID_EVAL_CODE'           : 'Invalid Eval Code.',
        'ERROR_INVALID_EXPRESSION'          : 'Invalid Expression.',
        'ERROR_NOT_CHECKBOX_RADIO'          : 'Element is not a checkbox or radio button.',
        'ERROR_TEXT_IS_NULL'                : 'No text could be retireve from element.',
        'ERROR_NO_SELECTION_IN_DROPDOWN'    : 'Nothing has been selected in dropdown element.',
        'ERROR_SELECTED_NOT_MATCH'          : 'Selected "%1" did not match "%2"',
        'ERROR_SELECTED_IS_MORE_THAN_ONE'   : 'More than one selected option.',
        'ERROR_NOT_SELECT_ELEMENT'          : 'Invalid use of command on non-Select element'
    };
    
    this.http_errors = {
        400: 'Bad Server Request',
        401: 'Unauthorized. Authentication is needed to get requested response.',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found. Server can not find requested resource.',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone. Requested content has been deleted from server.',
        411: 'Length Required. Server rejected the request because the Content-Length header field is not defined.',
        412: 'Precondition Failed. The client has indicated preconditions in its headers which the server does not meet.',
        413: 'Request Entity Too Large',
        414: 'Request-URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Requested Range Not Satisfiable',
        417: 'Expectation Failed',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported'
    };

    /**
     * Retrieve Resource Bundle
     * 
     * @returns
     */
    this.getMessage = function getMessage() {
        if( arguments.length === 0 ) {
            return '';
        } 
        
        var args = [];
        var key = arguments[0];
        if( (Object.prototype.toString.call( arguments[0] ) === '[object Array]') ||
            (Object.prototype.toString.call( arguments[0] ) === '[object RuntimeArray]')) {
            if( arguments[0].length === 0 ){
                return '';
            }
            
            key = arguments[0][0];
            args = arguments[0].slice(1);
        } else {
            if( arguments.length > 1) {
                for(var i = 1; i < arguments.length; i++ ){
                    args.push(arguments[i]);
                }
            } else {
                args = [];
            }
        }
        
        if( key in this.message_resources ) {
            var message = this.message_resources[key];
            
            if (args.length > 0) {
                for ( var i = 0; i < args.length; i++) {
                    var re = new RegExp("%" + (i + 1), "g");
                    message = message.replace(re, args[i]);
                }
            }

            return message;
        }
        
        return key;
    };
    
    /**
     * Retrieve Resource Bundle
     * 
     * @returns
     */
    this.getHTTPErrorMessage = function getHTTPErrorMessage(error_code) {
        var message = 'Unknown HTTP Error';
        if(error_code in this.http_errors) {
            message = this.http_errors[error_code];
        }
        
        return message;
    };

};
exports.Messages = Messages;
