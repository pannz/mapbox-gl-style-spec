'use strict';

var ValidationError = require('../validation_error');
var getType = require('../get_type');
var latestStyleSpec = require('../../reference/latest.min');

// Main recursive validation function. Tracks:
//
// - key: string representing location of validation in style tree. Used only
//   for more informative error reporting.
// - value: current value from style being evaluated. May be anything from a
//   high level object that needs to be descended into deeper or a simple
//   scalar value.
// - valueSpec: current spec being evaluated. Tracks value.

module.exports = function validate(options) {

    var validateFunction = require('./validate_function');
    var validateObject = require('./validate_object');
    var VALIDATORS = {
        '*': function() {},
        'array': require('./validate_array'),
        'boolean': require('./validate_boolean'),
        'number': require('./validate_number'),
        'color': require('./validate_color'),
        'constants': require('./validate_constants'),
        'enum': require('./validate_enum'),
        'filter': require('./validate_filter'),
        'function': require('./validate_function'),
        'layer': require('./validate_layer'),
        'object': require('./validate_object'),
        'source': require('./validate_source'),
        'string': require('./validate_string')
    };

    var value = options.value;
    var valueSpec = options.valueSpec;
    var key = options.key;
    var styleSpec = options.styleSpec || latestStyleSpec;
    var style = options.style;

    if (getType(value) === 'string' && value[0] === '@') {
        if (styleSpec.$version > 7) {
            return new ValidationError(key, value, 'constants have been deprecated as of v8');
        }
        if (!(value in style.constants)) {
            return new ValidationError(key, value, 'constant "%s" not found', value);
        }
        value = style.constants[value];
    }

    if (valueSpec.function && getType(value) === 'object') {
        return validateFunction({
            value: value,
            valueSpec: valueSpec,
            key: key,
            style: style,
            styleSpec: styleSpec
        });

    } else if (valueSpec.type && VALIDATORS[valueSpec.type]) {
        return VALIDATORS[valueSpec.type]({
            value: value,
            valueSpec: valueSpec,
            key: key,
            style: style,
            styleSpec: styleSpec
        });

    } else {
        return validateObject({
            value: value,
            valueSpec: valueSpec.type ? styleSpec[valueSpec.type] : valueSpec,
            key: key,
            style: style,
            styleSpec: styleSpec
        });
    }
};