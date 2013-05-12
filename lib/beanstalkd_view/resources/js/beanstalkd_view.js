/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

/*!
 * jQuery JavaScript Library v1.8.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)
 */
(function( window, undefined ) {
var
        // A central reference to the root jQuery(document)
        rootjQuery,

        // The deferred used on DOM ready
        readyList,

        // Use the correct document accordingly with window argument (sandbox)
        document = window.document,
        location = window.location,
        navigator = window.navigator,

        // Map over jQuery in case of overwrite
        _jQuery = window.jQuery,

        // Map over the $ in case of overwrite
        _$ = window.$,

        // Save a reference to some core methods
        core_push = Array.prototype.push,
        core_slice = Array.prototype.slice,
        core_indexOf = Array.prototype.indexOf,
        core_toString = Object.prototype.toString,
        core_hasOwn = Object.prototype.hasOwnProperty,
        core_trim = String.prototype.trim,

        // Define a local copy of jQuery
        jQuery = function( selector, context ) {
                // The jQuery object is actually just the init constructor 'enhanced'
                return new jQuery.fn.init( selector, context, rootjQuery );
        },

        // Used for matching numbers
        core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,

        // Used for detecting and trimming whitespace
        core_rnotwhite = /\S/,
        core_rspace = /\s+/,

        // Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
        rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

        // A simple way to check for HTML strings
        // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
        rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

        // Match a standalone tag
        rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,
        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
        rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
        rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,

        // Matches dashed string for camelizing
        rmsPrefix = /^-ms-/,
        rdashAlpha = /-([\da-z])/gi,

        // Used by jQuery.camelCase as callback to replace()
        fcamelCase = function( all, letter ) {
                return ( letter + "" ).toUpperCase();
        },

        // The ready event handler and self cleanup method
        DOMContentLoaded = function() {
                if ( document.addEventListener ) {
                        document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
                        jQuery.ready();
                } else if ( document.readyState === "complete" ) {
                        // we're here because readyState === "complete" in oldIE
                        // which is good enough for us to call the dom ready!
                        document.detachEvent( "onreadystatechange", DOMContentLoaded );
                        jQuery.ready();
                }
        },

        // [[Class]] -> type pairs
        class2type = {};

jQuery.fn = jQuery.prototype = {
        constructor: jQuery,
        init: function( selector, context, rootjQuery ) {
                var match, elem, ret, doc;

                // Handle $(""), $(null), $(undefined), $(false)
                if ( !selector ) {
                        return this;
                }

                // Handle $(DOMElement)
                if ( selector.nodeType ) {
                        this.context = this[0] = selector;
                        this.length = 1;
                        return this;
                }

                // Handle HTML strings
                if ( typeof selector === "string" ) {
                        if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
                                // Assume that strings that start and end with <> are HTML and skip the regex check
                                match = [ null, selector, null ];

                        } else {
                                match = rquickExpr.exec( selector );
                        }

                        // Match html or make sure no context is specified for #id
                        if ( match && (match[1] || !context) ) {

                                // HANDLE: $(html) -> $(array)
                                if ( match[1] ) {
                                        context = context instanceof jQuery ? context[0] : context;
                                        doc = ( context && context.nodeType ? context.ownerDocument || context : document );

                                        // scripts is true for back-compat
                                        selector = jQuery.parseHTML( match[1], doc, true );
                                        if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
                                                this.attr.call( selector, context, true );
                                        }

                                        return jQuery.merge( this, selector );

                                // HANDLE: $(#id)
                                } else {
                                        elem = document.getElementById( match[2] );

                                        // Check parentNode to catch when Blackberry 4.6 returns
                                        // nodes that are no longer in the document #6963
                                        if ( elem && elem.parentNode ) {
                                                // Handle the case where IE and Opera return items
                                                // by name instead of ID
                                                if ( elem.id !== match[2] ) {
                                                        return rootjQuery.find( selector );
                                                }

                                                // Otherwise, we inject the element directly into the jQuery object
                                                this.length = 1;
                                                this[0] = elem;
                                        }

                                        this.context = document;
                                        this.selector = selector;
                                        return this;
                                }

                        // HANDLE: $(expr, $(...))
                        } else if ( !context || context.jquery ) {
                                return ( context || rootjQuery ).find( selector );

                        // HANDLE: $(expr, context)
                        // (which is just equivalent to: $(context).find(expr)
                        } else {
                                return this.constructor( context ).find( selector );
                        }

                // HANDLE: $(function)
                // Shortcut for document ready
                } else if ( jQuery.isFunction( selector ) ) {
                        return rootjQuery.ready( selector );
                }

                if ( selector.selector !== undefined ) {
                        this.selector = selector.selector;
                        this.context = selector.context;
                }

                return jQuery.makeArray( selector, this );
        },

        // Start with an empty selector
        selector: "",

        // The current version of jQuery being used
        jquery: "1.8.3",

        // The default length of a jQuery object is 0
        length: 0,

        // The number of elements contained in the matched element set
        size: function() {
                return this.length;
        },

        toArray: function() {
                return core_slice.call( this );
        },

        // Get the Nth element in the matched element set OR
        // Get the whole matched element set as a clean array
        get: function( num ) {
                return num == null ?

                        // Return a 'clean' array
                        this.toArray() :

                        // Return just the object
                        ( num < 0 ? this[ this.length + num ] : this[ num ] );
        },

        // Take an array of elements and push it onto the stack
        // (returning the new matched element set)
        pushStack: function( elems, name, selector ) {

                // Build a new jQuery matched element set
                var ret = jQuery.merge( this.constructor(), elems );

                // Add the old object onto the stack (as a reference)
                ret.prevObject = this;

                ret.context = this.context;

                if ( name === "find" ) {
                        ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
                } else if ( name ) {
                        ret.selector = this.selector + "." + name + "(" + selector + ")";
                }

                // Return the newly-formed element set
                return ret;
        },

        // Execute a callback for every element in the matched set.
        // (You can seed the arguments with an array of args, but this is
        // only used internally.)
        each: function( callback, args ) {
                return jQuery.each( this, callback, args );
        },

        ready: function( fn ) {
                // Add the callback
                jQuery.ready.promise().done( fn );

                return this;
        },

        eq: function( i ) {
                i = +i;
                return i === -1 ?
                        this.slice( i ) :
                        this.slice( i, i + 1 );
        },

        first: function() {
                return this.eq( 0 );
        },

        last: function() {
                return this.eq( -1 );
        },

        slice: function() {
                return this.pushStack( core_slice.apply( this, arguments ),
                        "slice", core_slice.call(arguments).join(",") );
        },

        map: function( callback ) {
                return this.pushStack( jQuery.map(this, function( elem, i ) {
                        return callback.call( elem, i, elem );
                }));
        },

        end: function() {
                return this.prevObject || this.constructor(null);
        },

        // For internal use only.
        // Behaves like an Array's method, not like a jQuery method.
        push: core_push,
        sort: [].sort,
        splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

        // Handle a deep copy situation
        if ( typeof target === "boolean" ) {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
                target = {};
        }

        // extend jQuery itself if only one argument is passed
        if ( length === i ) {
                target = this;
                --i;
        }

        for ( ; i < length; i++ ) {
                // Only deal with non-null/undefined values
                if ( (options = arguments[ i ]) != null ) {
                        // Extend the base object
                        for ( name in options ) {
                                src = target[ name ];
                                copy = options[ name ];

                                // Prevent never-ending loop
                                if ( target === copy ) {
                                        continue;
                                }

                                // Recurse if we're merging plain objects or arrays
                                if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
                                        if ( copyIsArray ) {
                                                copyIsArray = false;
                                                clone = src && jQuery.isArray(src) ? src : [];

                                        } else {
                                                clone = src && jQuery.isPlainObject(src) ? src : {};
                                        }

                                        // Never move original objects, clone them
                                        target[ name ] = jQuery.extend( deep, clone, copy );

                                // Don't bring in undefined values
                                } else if ( copy !== undefined ) {
                                        target[ name ] = copy;
                                }
                        }
                }
        }

        // Return the modified object
        return target;
};

jQuery.extend({
        noConflict: function( deep ) {
                if ( window.$ === jQuery ) {
                        window.$ = _$;
                }

                if ( deep && window.jQuery === jQuery ) {
                        window.jQuery = _jQuery;
                }

                return jQuery;
        },

        // Is the DOM ready to be used? Set to true once it occurs.
        isReady: false,

        // A counter to track how many items to wait for before
        // the ready event fires. See #6781
        readyWait: 1,

        // Hold (or release) the ready event
        holdReady: function( hold ) {
                if ( hold ) {
                        jQuery.readyWait++;
                } else {
                        jQuery.ready( true );
                }
        },

        // Handle when the DOM is ready
        ready: function( wait ) {

                // Abort if there are pending holds or we're already ready
                if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
                        return;
                }

                // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
                if ( !document.body ) {
                        return setTimeout( jQuery.ready, 1 );
                }

                // Remember that the DOM is ready
                jQuery.isReady = true;

                // If a normal DOM Ready event fired, decrement, and wait if need be
                if ( wait !== true && --jQuery.readyWait > 0 ) {
                        return;
                }

                // If there are functions bound, to execute
                readyList.resolveWith( document, [ jQuery ] );

                // Trigger any bound ready events
                if ( jQuery.fn.trigger ) {
                        jQuery( document ).trigger("ready").off("ready");
                }
        },

        // See test/unit/core.js for details concerning isFunction.
        // Since version 1.3, DOM methods and functions like alert
        // aren't supported. They return false on IE (#2968).
        isFunction: function( obj ) {
                return jQuery.type(obj) === "function";
        },

        isArray: Array.isArray || function( obj ) {
                return jQuery.type(obj) === "array";
        },

        isWindow: function( obj ) {
                return obj != null && obj == obj.window;
        },

        isNumeric: function( obj ) {
                return !isNaN( parseFloat(obj) ) && isFinite( obj );
        },

        type: function( obj ) {
                return obj == null ?
                        String( obj ) :
                        class2type[ core_toString.call(obj) ] || "object";
        },

        isPlainObject: function( obj ) {
                // Must be an Object.
                // Because of IE, we also have to check the presence of the constructor property.
                // Make sure that DOM nodes and window objects don't pass through, as well
                if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
                        return false;
                }

                try {
                        // Not own constructor property must be Object
                        if ( obj.constructor &&
                                !core_hasOwn.call(obj, "constructor") &&
                                !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                                return false;
                        }
                } catch ( e ) {
                        // IE8,9 Will throw exceptions on certain host objects #9897
                        return false;
                }

                // Own properties are enumerated firstly, so to speed up,
                // if last one is own, then all properties are own.

                var key;
                for ( key in obj ) {}

                return key === undefined || core_hasOwn.call( obj, key );
        },

        isEmptyObject: function( obj ) {
                var name;
                for ( name in obj ) {
                        return false;
                }
                return true;
        },

        error: function( msg ) {
                throw new Error( msg );
        },

        // data: string of html
        // context (optional): If specified, the fragment will be created in this context, defaults to document
        // scripts (optional): If true, will include scripts passed in the html string
        parseHTML: function( data, context, scripts ) {
                var parsed;
                if ( !data || typeof data !== "string" ) {
                        return null;
                }
                if ( typeof context === "boolean" ) {
                        scripts = context;
                        context = 0;
                }
                context = context || document;

                // Single tag
                if ( (parsed = rsingleTag.exec( data )) ) {
                        return [ context.createElement( parsed[1] ) ];
                }

                parsed = jQuery.buildFragment( [ data ], context, scripts ? null : [] );
                return jQuery.merge( [],
                        (parsed.cacheable ? jQuery.clone( parsed.fragment ) : parsed.fragment).childNodes );
        },

        parseJSON: function( data ) {
                if ( !data || typeof data !== "string") {
                        return null;
                }

                // Make sure leading/trailing whitespace is removed (IE can't handle it)
                data = jQuery.trim( data );

                // Attempt to parse using the native JSON parser first
                if ( window.JSON && window.JSON.parse ) {
                        return window.JSON.parse( data );
                }

                // Make sure the incoming data is actual JSON
                // Logic borrowed from http://json.org/json2.js
                if ( rvalidchars.test( data.replace( rvalidescape, "@" )
                        .replace( rvalidtokens, "]" )
                        .replace( rvalidbraces, "")) ) {

                        return ( new Function( "return " + data ) )();

                }
                jQuery.error( "Invalid JSON: " + data );
        },

        // Cross-browser xml parsing
        parseXML: function( data ) {
                var xml, tmp;
                if ( !data || typeof data !== "string" ) {
                        return null;
                }
                try {
                        if ( window.DOMParser ) { // Standard
                                tmp = new DOMParser();
                                xml = tmp.parseFromString( data , "text/xml" );
                        } else { // IE
                                xml = new ActiveXObject( "Microsoft.XMLDOM" );
                                xml.async = "false";
                                xml.loadXML( data );
                        }
                } catch( e ) {
                        xml = undefined;
                }
                if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                        jQuery.error( "Invalid XML: " + data );
                }
                return xml;
        },

        noop: function() {},

        // Evaluates a script in a global context
        // Workarounds based on findings by Jim Driscoll
        // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
        globalEval: function( data ) {
                if ( data && core_rnotwhite.test( data ) ) {
                        // We use execScript on Internet Explorer
                        // We use an anonymous function so that context is window
                        // rather than jQuery in Firefox
                        ( window.execScript || function( data ) {
                                window[ "eval" ].call( window, data );
                        } )( data );
                }
        },

        // Convert dashed to camelCase; used by the css and data modules
        // Microsoft forgot to hump their vendor prefix (#9572)
        camelCase: function( string ) {
                return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
        },

        nodeName: function( elem, name ) {
                return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },

        // args is for internal usage only
        each: function( obj, callback, args ) {
                var name,
                        i = 0,
                        length = obj.length,
                        isObj = length === undefined || jQuery.isFunction( obj );

                if ( args ) {
                        if ( isObj ) {
                                for ( name in obj ) {
                                        if ( callback.apply( obj[ name ], args ) === false ) {
                                                break;
                                        }
                                }
                        } else {
                                for ( ; i < length; ) {
                                        if ( callback.apply( obj[ i++ ], args ) === false ) {
                                                break;
                                        }
                                }
                        }

                // A special, fast, case for the most common use of each
                } else {
                        if ( isObj ) {
                                for ( name in obj ) {
                                        if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
                                                break;
                                        }
                                }
                        } else {
                                for ( ; i < length; ) {
                                        if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
                                                break;
                                        }
                                }
                        }
                }

                return obj;
        },

        // Use native String.trim function wherever possible
        trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
                function( text ) {
                        return text == null ?
                                "" :
                                core_trim.call( text );
                } :

                // Otherwise use our own trimming functionality
                function( text ) {
                        return text == null ?
                                "" :
                                ( text + "" ).replace( rtrim, "" );
                },

        // results is for internal usage only
        makeArray: function( arr, results ) {
                var type,
                        ret = results || [];

                if ( arr != null ) {
                        // The window, strings (and functions) also have 'length'
                        // Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
                        type = jQuery.type( arr );

                        if ( arr.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( arr ) ) {
                                core_push.call( ret, arr );
                        } else {
                                jQuery.merge( ret, arr );
                        }
                }

                return ret;
        },

        inArray: function( elem, arr, i ) {
                var len;

                if ( arr ) {
                        if ( core_indexOf ) {
                                return core_indexOf.call( arr, elem, i );
                        }

                        len = arr.length;
                        i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

                        for ( ; i < len; i++ ) {
                                // Skip accessing in sparse arrays
                                if ( i in arr && arr[ i ] === elem ) {
                                        return i;
                                }
                        }
                }

                return -1;
        },

        merge: function( first, second ) {
                var l = second.length,
                        i = first.length,
                        j = 0;

                if ( typeof l === "number" ) {
                        for ( ; j < l; j++ ) {
                                first[ i++ ] = second[ j ];
                        }

                } else {
                        while ( second[j] !== undefined ) {
                                first[ i++ ] = second[ j++ ];
                        }
                }

                first.length = i;

                return first;
        },

        grep: function( elems, callback, inv ) {
                var retVal,
                        ret = [],
                        i = 0,
                        length = elems.length;
                inv = !!inv;

                // Go through the array, only saving the items
                // that pass the validator function
                for ( ; i < length; i++ ) {
                        retVal = !!callback( elems[ i ], i );
                        if ( inv !== retVal ) {
                                ret.push( elems[ i ] );
                        }
                }

                return ret;
        },

        // arg is for internal usage only
        map: function( elems, callback, arg ) {
                var value, key,
                        ret = [],
                        i = 0,
                        length = elems.length,
                        // jquery objects are treated as arrays
                        isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

                // Go through the array, translating each of the items to their
                if ( isArray ) {
                        for ( ; i < length; i++ ) {
                                value = callback( elems[ i ], i, arg );

                                if ( value != null ) {
                                        ret[ ret.length ] = value;
                                }
                        }

                // Go through every key on the object,
                } else {
                        for ( key in elems ) {
                                value = callback( elems[ key ], key, arg );

                                if ( value != null ) {
                                        ret[ ret.length ] = value;
                                }
                        }
                }

                // Flatten any nested arrays
                return ret.concat.apply( [], ret );
        },

        // A global GUID counter for objects
        guid: 1,

        // Bind a function to a context, optionally partially applying any
        // arguments.
        proxy: function( fn, context ) {
                var tmp, args, proxy;

                if ( typeof context === "string" ) {
                        tmp = fn[ context ];
                        context = fn;
                        fn = tmp;
                }

                // Quick check to determine if target is callable, in the spec
                // this throws a TypeError, but we will just return undefined.
                if ( !jQuery.isFunction( fn ) ) {
                        return undefined;
                }

                // Simulated bind
                args = core_slice.call( arguments, 2 );
                proxy = function() {
                        return fn.apply( context, args.concat( core_slice.call( arguments ) ) );
                };

                // Set the guid of unique handler to the same of original handler, so it can be removed
                proxy.guid = fn.guid = fn.guid || jQuery.guid++;

                return proxy;
        },

        // Multifunctional method to get and set values of a collection
        // The value/s can optionally be executed if it's a function
        access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
                var exec,
                        bulk = key == null,
                        i = 0,
                        length = elems.length;

                // Sets many values
                if ( key && typeof key === "object" ) {
                        for ( i in key ) {
                                jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
                        }
                        chainable = 1;

                // Sets one value
                } else if ( value !== undefined ) {
                        // Optionally, function values get executed if exec is true
                        exec = pass === undefined && jQuery.isFunction( value );

                        if ( bulk ) {
                                // Bulk operations only iterate when executing function values
                                if ( exec ) {
                                        exec = fn;
                                        fn = function( elem, key, value ) {
                                                return exec.call( jQuery( elem ), value );
                                        };

                                // Otherwise they run against the entire set
                                } else {
                                        fn.call( elems, value );
                                        fn = null;
                                }
                        }

                        if ( fn ) {
                                for (; i < length; i++ ) {
                                        fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
                                }
                        }

                        chainable = 1;
                }

                return chainable ?
                        elems :

                        // Gets
                        bulk ?
                                fn.call( elems ) :
                                length ? fn( elems[0], key ) : emptyGet;
        },

        now: function() {
                return ( new Date() ).getTime();
        }
});

jQuery.ready.promise = function( obj ) {
        if ( !readyList ) {

                readyList = jQuery.Deferred();

                // Catch cases where $(document).ready() is called after the browser event has already occurred.
                // we once tried to use readyState "interactive" here, but it caused issues like the one
                // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
                if ( document.readyState === "complete" ) {
                        // Handle it asynchronously to allow scripts the opportunity to delay ready
                        setTimeout( jQuery.ready, 1 );

                // Standards-based browsers support DOMContentLoaded
                } else if ( document.addEventListener ) {
                        // Use the handy event callback
                        document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

                        // A fallback to window.onload, that will always work
                        window.addEventListener( "load", jQuery.ready, false );

                // If IE event model is used
                } else {
                        // Ensure firing before onload, maybe late but safe also for iframes
                        document.attachEvent( "onreadystatechange", DOMContentLoaded );

                        // A fallback to window.onload, that will always work
                        window.attachEvent( "onload", jQuery.ready );

                        // If IE and not a frame
                        // continually check to see if the document is ready
                        var top = false;

                        try {
                                top = window.frameElement == null && document.documentElement;
                        } catch(e) {}

                        if ( top && top.doScroll ) {
                                (function doScrollCheck() {
                                        if ( !jQuery.isReady ) {

                                                try {
                                                        // Use the trick by Diego Perini
                                                        // http://javascript.nwbox.com/IEContentLoaded/
                                                        top.doScroll("left");
                                                } catch(e) {
                                                        return setTimeout( doScrollCheck, 50 );
                                                }

                                                // and execute any waiting functions
                                                jQuery.ready();
                                        }
                                })();
                        }
                }
        }
        return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
        class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
        var object = optionsCache[ options ] = {};
        jQuery.each( options.split( core_rspace ), function( _, flag ) {
                object[ flag ] = true;
        });
        return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *      options: an optional list of space-separated options that will change how
 *                      the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *      once:                   will ensure the callback list can only be fired once (like a Deferred)
 *
 *      memory:                 will keep track of previous values and will call any callback added
 *                                      after the list has been fired right away with the latest "memorized"
 *                                      values (like a Deferred)
 *
 *      unique:                 will ensure a callback can only be added once (no duplicate in the list)
 *
 *      stopOnFalse:    interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

        // Convert options from String-formatted to Object-formatted if needed
        // (we check in cache first)
        options = typeof options === "string" ?
                ( optionsCache[ options ] || createOptions( options ) ) :
                jQuery.extend( {}, options );

        var // Last fire value (for non-forgettable lists)
                memory,
                // Flag to know if list was already fired
                fired,
                // Flag to know if list is currently firing
                firing,
                // First callback to fire (used internally by add and fireWith)
                firingStart,
                // End of the loop when firing
                firingLength,
                // Index of currently firing callback (modified by remove if needed)
                firingIndex,
                // Actual callback list
                list = [],
                // Stack of fire calls for repeatable lists
                stack = !options.once && [],
                // Fire callbacks
                fire = function( data ) {
                        memory = options.memory && data;
                        fired = true;
                        firingIndex = firingStart || 0;
                        firingStart = 0;
                        firingLength = list.length;
                        firing = true;
                        for ( ; list && firingIndex < firingLength; firingIndex++ ) {
                                if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
                                        memory = false; // To prevent further calls using add
                                        break;
                                }
                        }
                        firing = false;
                        if ( list ) {
                                if ( stack ) {
                                        if ( stack.length ) {
                                                fire( stack.shift() );
                                        }
                                } else if ( memory ) {
                                        list = [];
                                } else {
                                        self.disable();
                                }
                        }
                },
                // Actual Callbacks object
                self = {
                        // Add a callback or a collection of callbacks to the list
                        add: function() {
                                if ( list ) {
                                        // First, we save the current length
                                        var start = list.length;
                                        (function add( args ) {
                                                jQuery.each( args, function( _, arg ) {
                                                        var type = jQuery.type( arg );
                                                        if ( type === "function" ) {
                                                                if ( !options.unique || !self.has( arg ) ) {
                                                                        list.push( arg );
                                                                }
                                                        } else if ( arg && arg.length && type !== "string" ) {
                                                                // Inspect recursively
                                                                add( arg );
                                                        }
                                                });
                                        })( arguments );
                                        // Do we need to add the callbacks to the
                                        // current firing batch?
                                        if ( firing ) {
                                                firingLength = list.length;
                                        // With memory, if we're not firing then
                                        // we should call right away
                                        } else if ( memory ) {
                                                firingStart = start;
                                                fire( memory );
                                        }
                                }
                                return this;
                        },
                        // Remove a callback from the list
                        remove: function() {
                                if ( list ) {
                                        jQuery.each( arguments, function( _, arg ) {
                                                var index;
                                                while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
                                                        list.splice( index, 1 );
                                                        // Handle firing indexes
                                                        if ( firing ) {
                                                                if ( index <= firingLength ) {
                                                                        firingLength--;
                                                                }
                                                                if ( index <= firingIndex ) {
                                                                        firingIndex--;
                                                                }
                                                        }
                                                }
                                        });
                                }
                                return this;
                        },
                        // Control if a given callback is in the list
                        has: function( fn ) {
                                return jQuery.inArray( fn, list ) > -1;
                        },
                        // Remove all callbacks from the list
                        empty: function() {
                                list = [];
                                return this;
                        },
                        // Have the list do nothing anymore
                        disable: function() {
                                list = stack = memory = undefined;
                                return this;
                        },
                        // Is it disabled?
                        disabled: function() {
                                return !list;
                        },
                        // Lock the list in its current state
                        lock: function() {
                                stack = undefined;
                                if ( !memory ) {
                                        self.disable();
                                }
                                return this;
                        },
                        // Is it locked?
                        locked: function() {
                                return !stack;
                        },
                        // Call all callbacks with the given context and arguments
                        fireWith: function( context, args ) {
                                args = args || [];
                                args = [ context, args.slice ? args.slice() : args ];
                                if ( list && ( !fired || stack ) ) {
                                        if ( firing ) {
                                                stack.push( args );
                                        } else {
                                                fire( args );
                                        }
                                }
                                return this;
                        },
                        // Call all the callbacks with the given arguments
                        fire: function() {
                                self.fireWith( this, arguments );
                                return this;
                        },
                        // To know if the callbacks have already been called at least once
                        fired: function() {
                                return !!fired;
                        }
                };

        return self;
};
jQuery.extend({

        Deferred: function( func ) {
                var tuples = [
                                // action, add listener, listener list, final state
                                [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
                                [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
                                [ "notify", "progress", jQuery.Callbacks("memory") ]
                        ],
                        state = "pending",
                        promise = {
                                state: function() {
                                        return state;
                                },
                                always: function() {
                                        deferred.done( arguments ).fail( arguments );
                                        return this;
                                },
                                then: function( /* fnDone, fnFail, fnProgress */ ) {
                                        var fns = arguments;
                                        return jQuery.Deferred(function( newDefer ) {
                                                jQuery.each( tuples, function( i, tuple ) {
                                                        var action = tuple[ 0 ],
                                                                fn = fns[ i ];
                                                        // deferred[ done | fail | progress ] for forwarding actions to newDefer
                                                        deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
                                                                function() {
                                                                        var returned = fn.apply( this, arguments );
                                                                        if ( returned && jQuery.isFunction( returned.promise ) ) {
                                                                                returned.promise()
                                                                                        .done( newDefer.resolve )
                                                                                        .fail( newDefer.reject )
                                                                                        .progress( newDefer.notify );
                                                                        } else {
                                                                                newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
                                                                        }
                                                                } :
                                                                newDefer[ action ]
                                                        );
                                                });
                                                fns = null;
                                        }).promise();
                                },
                                // Get a promise for this deferred
                                // If obj is provided, the promise aspect is added to the object
                                promise: function( obj ) {
                                        return obj != null ? jQuery.extend( obj, promise ) : promise;
                                }
                        },
                        deferred = {};

                // Keep pipe for back-compat
                promise.pipe = promise.then;

                // Add list-specific methods
                jQuery.each( tuples, function( i, tuple ) {
                        var list = tuple[ 2 ],
                                stateString = tuple[ 3 ];

                        // promise[ done | fail | progress ] = list.add
                        promise[ tuple[1] ] = list.add;

                        // Handle state
                        if ( stateString ) {
                                list.add(function() {
                                        // state = [ resolved | rejected ]
                                        state = stateString;

                                // [ reject_list | resolve_list ].disable; progress_list.lock
                                }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
                        }

                        // deferred[ resolve | reject | notify ] = list.fire
                        deferred[ tuple[0] ] = list.fire;
                        deferred[ tuple[0] + "With" ] = list.fireWith;
                });

                // Make the deferred a promise
                promise.promise( deferred );

                // Call given func if any
                if ( func ) {
                        func.call( deferred, deferred );
                }

                // All done!
                return deferred;
        },

        // Deferred helper
        when: function( subordinate /* , ..., subordinateN */ ) {
                var i = 0,
                        resolveValues = core_slice.call( arguments ),
                        length = resolveValues.length,

                        // the count of uncompleted subordinates
                        remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

                        // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
                        deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

                        // Update function for both resolve and progress values
                        updateFunc = function( i, contexts, values ) {
                                return function( value ) {
                                        contexts[ i ] = this;
                                        values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
                                        if( values === progressValues ) {
                                                deferred.notifyWith( contexts, values );
                                        } else if ( !( --remaining ) ) {
                                                deferred.resolveWith( contexts, values );
                                        }
                                };
                        },

                        progressValues, progressContexts, resolveContexts;

                // add listeners to Deferred subordinates; treat others as resolved
                if ( length > 1 ) {
                        progressValues = new Array( length );
                        progressContexts = new Array( length );
                        resolveContexts = new Array( length );
                        for ( ; i < length; i++ ) {
                                if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
                                        resolveValues[ i ].promise()
                                                .done( updateFunc( i, resolveContexts, resolveValues ) )
                                                .fail( deferred.reject )
                                                .progress( updateFunc( i, progressContexts, progressValues ) );
                                } else {
                                        --remaining;
                                }
                        }
                }

                // if we're not waiting on anything, resolve the master
                if ( !remaining ) {
                        deferred.resolveWith( resolveContexts, resolveValues );
                }

                return deferred.promise();
        }
});
jQuery.support = (function() {

        var support,
                all,
                a,
                select,
                opt,
                input,
                fragment,
                eventName,
                i,
                isSupported,
                clickFn,
                div = document.createElement("div");

        // Setup
        div.setAttribute( "className", "t" );
        div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

        // Support tests won't run in some limited or non-browser environments
        all = div.getElementsByTagName("*");
        a = div.getElementsByTagName("a")[ 0 ];
        if ( !all || !a || !all.length ) {
                return {};
        }

        // First batch of tests
        select = document.createElement("select");
        opt = select.appendChild( document.createElement("option") );
        input = div.getElementsByTagName("input")[ 0 ];

        a.style.cssText = "top:1px;float:left;opacity:.5";
        support = {
                // IE strips leading whitespace when .innerHTML is used
                leadingWhitespace: ( div.firstChild.nodeType === 3 ),

                // Make sure that tbody elements aren't automatically inserted
                // IE will insert them into empty tables
                tbody: !div.getElementsByTagName("tbody").length,

                // Make sure that link elements get serialized correctly by innerHTML
                // This requires a wrapper element in IE
                htmlSerialize: !!div.getElementsByTagName("link").length,

                // Get the style information from getAttribute
                // (IE uses .cssText instead)
                style: /top/.test( a.getAttribute("style") ),

                // Make sure that URLs aren't manipulated
                // (IE normalizes it by default)
                hrefNormalized: ( a.getAttribute("href") === "/a" ),

                // Make sure that element opacity exists
                // (IE uses filter instead)
                // Use a regex to work around a WebKit issue. See #5145
                opacity: /^0.5/.test( a.style.opacity ),

                // Verify style float existence
                // (IE uses styleFloat instead of cssFloat)
                cssFloat: !!a.style.cssFloat,

                // Make sure that if no value is specified for a checkbox
                // that it defaults to "on".
                // (WebKit defaults to "" instead)
                checkOn: ( input.value === "on" ),

                // Make sure that a selected-by-default option has a working selected property.
                // (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
                optSelected: opt.selected,

                // Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
                getSetAttribute: div.className !== "t",

                // Tests for enctype support on a form (#6743)
                enctype: !!document.createElement("form").enctype,

                // Makes sure cloning an html5 element does not cause problems
                // Where outerHTML is undefined, this still works
                html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

                // jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
                boxModel: ( document.compatMode === "CSS1Compat" ),

                // Will be defined later
                submitBubbles: true,
                changeBubbles: true,
                focusinBubbles: false,
                deleteExpando: true,
                noCloneEvent: true,
                inlineBlockNeedsLayout: false,
                shrinkWrapBlocks: false,
                reliableMarginRight: true,
                boxSizingReliable: true,
                pixelPosition: false
        };

        // Make sure checked status is properly cloned
        input.checked = true;
        support.noCloneChecked = input.cloneNode( true ).checked;

        // Make sure that the options inside disabled selects aren't marked as disabled
        // (WebKit marks them as disabled)
        select.disabled = true;
        support.optDisabled = !opt.disabled;

        // Test to see if it's possible to delete an expando from an element
        // Fails in Internet Explorer
        try {
                delete div.test;
        } catch( e ) {
                support.deleteExpando = false;
        }

        if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
                div.attachEvent( "onclick", clickFn = function() {
                        // Cloning a node shouldn't copy over any
                        // bound event handlers (IE does this)
                        support.noCloneEvent = false;
                });
                div.cloneNode( true ).fireEvent("onclick");
                div.detachEvent( "onclick", clickFn );
        }

        // Check if a radio maintains its value
        // after being appended to the DOM
        input = document.createElement("input");
        input.value = "t";
        input.setAttribute( "type", "radio" );
        support.radioValue = input.value === "t";

        input.setAttribute( "checked", "checked" );

        // #11217 - WebKit loses check when the name is after the checked attribute
        input.setAttribute( "name", "t" );

        div.appendChild( input );
        fragment = document.createDocumentFragment();
        fragment.appendChild( div.lastChild );

        // WebKit doesn't clone checked state correctly in fragments
        support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

        // Check if a disconnected checkbox will retain its checked
        // value of true after appended to the DOM (IE6/7)
        support.appendChecked = input.checked;

        fragment.removeChild( input );
        fragment.appendChild( div );

        // Technique from Juriy Zaytsev
        // http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
        // We only care about the case where non-standard event systems
        // are used, namely in IE. Short-circuiting here helps us to
        // avoid an eval call (in setAttribute) which can cause CSP
        // to go haywire. See: https://developer.mozilla.org/en/Security/CSP
        if ( div.attachEvent ) {
                for ( i in {
                        submit: true,
                        change: true,
                        focusin: true
                }) {
                        eventName = "on" + i;
                        isSupported = ( eventName in div );
                        if ( !isSupported ) {
                                div.setAttribute( eventName, "return;" );
                                isSupported = ( typeof div[ eventName ] === "function" );
                        }
                        support[ i + "Bubbles" ] = isSupported;
                }
        }

        // Run tests that need a body at doc ready
        jQuery(function() {
                var container, div, tds, marginDiv,
                        divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;",
                        body = document.getElementsByTagName("body")[0];

                if ( !body ) {
                        // Return for frameset docs that don't have a body
                        return;
                }

                container = document.createElement("div");
                container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px";
                body.insertBefore( container, body.firstChild );

                // Construct the test element
                div = document.createElement("div");
                container.appendChild( div );

                // Check if table cells still have offsetWidth/Height when they are set
                // to display:none and there are still other visible table cells in a
                // table row; if so, offsetWidth/Height are not reliable for use when
                // determining if an element has been hidden directly using
                // display:none (it is still safe to use offsets if a parent element is
                // hidden; don safety goggles and see bug #4512 for more information).
                // (only IE 8 fails this test)
                div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
                tds = div.getElementsByTagName("td");
                tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
                isSupported = ( tds[ 0 ].offsetHeight === 0 );

                tds[ 0 ].style.display = "";
                tds[ 1 ].style.display = "none";

                // Check if empty table cells still have offsetWidth/Height
                // (IE <= 8 fail this test)
                support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

                // Check box-sizing and margin behavior
                div.innerHTML = "";
                div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
                support.boxSizing = ( div.offsetWidth === 4 );
                support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );

                // NOTE: To any future maintainer, we've window.getComputedStyle
                // because jsdom on node.js will break without it.
                if ( window.getComputedStyle ) {
                        support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
                        support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

                        // Check if div with explicit width and no margin-right incorrectly
                        // gets computed margin-right based on width of container. For more
                        // info see bug #3333
                        // Fails in WebKit before Feb 2011 nightlies
                        // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                        marginDiv = document.createElement("div");
                        marginDiv.style.cssText = div.style.cssText = divReset;
                        marginDiv.style.marginRight = marginDiv.style.width = "0";
                        div.style.width = "1px";
                        div.appendChild( marginDiv );
                        support.reliableMarginRight =
                                !parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
                }

                if ( typeof div.style.zoom !== "undefined" ) {
                        // Check if natively block-level elements act like inline-block
                        // elements when setting their display to 'inline' and giving
                        // them layout
                        // (IE < 8 does this)
                        div.innerHTML = "";
                        div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
                        support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

                        // Check if elements with layout shrink-wrap their children
                        // (IE 6 does this)
                        div.style.display = "block";
                        div.style.overflow = "visible";
                        div.innerHTML = "<div></div>";
                        div.firstChild.style.width = "5px";
                        support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

                        container.style.zoom = 1;
                }

                // Null elements to avoid leaks in IE
                body.removeChild( container );
                container = div = tds = marginDiv = null;
        });

        // Null elements to avoid leaks in IE
        fragment.removeChild( div );
        all = a = select = opt = input = fragment = div = null;

        return support;
})();
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
        rmultiDash = /([A-Z])/g;

jQuery.extend({
        cache: {},

        deletedIds: [],

        // Remove at next major release (1.9/2.0)
        uuid: 0,

        // Unique for each copy of jQuery on the page
        // Non-digits removed to match rinlinejQuery
        expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),

        // The following elements throw uncatchable exceptions if you
        // attempt to add expando properties to them.
        noData: {
                "embed": true,
                // Ban all objects except for Flash (which handle expandos)
                "object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
                "applet": true
        },

        hasData: function( elem ) {
                elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
                return !!elem && !isEmptyDataObject( elem );
        },

        data: function( elem, name, data, pvt /* Internal Use Only */ ) {
                if ( !jQuery.acceptData( elem ) ) {
                        return;
                }

                var thisCache, ret,
                        internalKey = jQuery.expando,
                        getByName = typeof name === "string",

                        // We have to handle DOM nodes and JS objects differently because IE6-7
                        // can't GC object references properly across the DOM-JS boundary
                        isNode = elem.nodeType,

                        // Only DOM nodes need the global jQuery cache; JS object data is
                        // attached directly to the object so GC can occur automatically
                        cache = isNode ? jQuery.cache : elem,

                        // Only defining an ID for JS objects if its cache already exists allows
                        // the code to shortcut on the same path as a DOM node with no cache
                        id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

                // Avoid doing any more work than we need to when trying to get data on an
                // object that has no data at all
                if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
                        return;
                }

                if ( !id ) {
                        // Only DOM nodes need a new unique ID for each element since their data
                        // ends up in the global cache
                        if ( isNode ) {
                                elem[ internalKey ] = id = jQuery.deletedIds.pop() || jQuery.guid++;
                        } else {
                                id = internalKey;
                        }
                }

                if ( !cache[ id ] ) {
                        cache[ id ] = {};

                        // Avoids exposing jQuery metadata on plain JS objects when the object
                        // is serialized using JSON.stringify
                        if ( !isNode ) {
                                cache[ id ].toJSON = jQuery.noop;
                        }
                }

                // An object can be passed to jQuery.data instead of a key/value pair; this gets
                // shallow copied over onto the existing cache
                if ( typeof name === "object" || typeof name === "function" ) {
                        if ( pvt ) {
                                cache[ id ] = jQuery.extend( cache[ id ], name );
                        } else {
                                cache[ id ].data = jQuery.extend( cache[ id ].data, name );
                        }
                }

                thisCache = cache[ id ];

                // jQuery data() is stored in a separate object inside the object's internal data
                // cache in order to avoid key collisions between internal data and user-defined
                // data.
                if ( !pvt ) {
                        if ( !thisCache.data ) {
                                thisCache.data = {};
                        }

                        thisCache = thisCache.data;
                }

                if ( data !== undefined ) {
                        thisCache[ jQuery.camelCase( name ) ] = data;
                }

                // Check for both converted-to-camel and non-converted data property names
                // If a data property was specified
                if ( getByName ) {

                        // First Try to find as-is property data
                        ret = thisCache[ name ];

                        // Test for null|undefined property data
                        if ( ret == null ) {

                                // Try to find the camelCased property
                                ret = thisCache[ jQuery.camelCase( name ) ];
                        }
                } else {
                        ret = thisCache;
                }

                return ret;
        },

        removeData: function( elem, name, pvt /* Internal Use Only */ ) {
                if ( !jQuery.acceptData( elem ) ) {
                        return;
                }

                var thisCache, i, l,

                        isNode = elem.nodeType,

                        // See jQuery.data for more information
                        cache = isNode ? jQuery.cache : elem,
                        id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

                // If there is already no cache entry for this object, there is no
                // purpose in continuing
                if ( !cache[ id ] ) {
                        return;
                }

                if ( name ) {

                        thisCache = pvt ? cache[ id ] : cache[ id ].data;

                        if ( thisCache ) {

                                // Support array or space separated string names for data keys
                                if ( !jQuery.isArray( name ) ) {

                                        // try the string as a key before any manipulation
                                        if ( name in thisCache ) {
                                                name = [ name ];
                                        } else {

                                                // split the camel cased version by spaces unless a key with the spaces exists
                                                name = jQuery.camelCase( name );
                                                if ( name in thisCache ) {
                                                        name = [ name ];
                                                } else {
                                                        name = name.split(" ");
                                                }
                                        }
                                }

                                for ( i = 0, l = name.length; i < l; i++ ) {
                                        delete thisCache[ name[i] ];
                                }

                                // If there is no data left in the cache, we want to continue
                                // and let the cache object itself get destroyed
                                if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
                                        return;
                                }
                        }
                }

                // See jQuery.data for more information
                if ( !pvt ) {
                        delete cache[ id ].data;

                        // Don't destroy the parent cache unless the internal data object
                        // had been the only thing left in it
                        if ( !isEmptyDataObject( cache[ id ] ) ) {
                                return;
                        }
                }

                // Destroy the cache
                if ( isNode ) {
                        jQuery.cleanData( [ elem ], true );

                // Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
                } else if ( jQuery.support.deleteExpando || cache != cache.window ) {
                        delete cache[ id ];

                // When all else fails, null
                } else {
                        cache[ id ] = null;
                }
        },

        // For internal use only.
        _data: function( elem, name, data ) {
                return jQuery.data( elem, name, data, true );
        },

        // A method for determining if a DOM node can handle the data expando
        acceptData: function( elem ) {
                var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

                // nodes accept data unless otherwise specified; rejection can be conditional
                return !noData || noData !== true && elem.getAttribute("classid") === noData;
        }
});

jQuery.fn.extend({
        data: function( key, value ) {
                var parts, part, attr, name, l,
                        elem = this[0],
                        i = 0,
                        data = null;

                // Gets all values
                if ( key === undefined ) {
                        if ( this.length ) {
                                data = jQuery.data( elem );

                                if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
                                        attr = elem.attributes;
                                        for ( l = attr.length; i < l; i++ ) {
                                                name = attr[i].name;

                                                if ( !name.indexOf( "data-" ) ) {
                                                        name = jQuery.camelCase( name.substring(5) );

                                                        dataAttr( elem, name, data[ name ] );
                                                }
                                        }
                                        jQuery._data( elem, "parsedAttrs", true );
                                }
                        }

                        return data;
                }

                // Sets multiple values
                if ( typeof key === "object" ) {
                        return this.each(function() {
                                jQuery.data( this, key );
                        });
                }

                parts = key.split( ".", 2 );
                parts[1] = parts[1] ? "." + parts[1] : "";
                part = parts[1] + "!";

                return jQuery.access( this, function( value ) {

                        if ( value === undefined ) {
                                data = this.triggerHandler( "getData" + part, [ parts[0] ] );

                                // Try to fetch any internally stored data first
                                if ( data === undefined && elem ) {
                                        data = jQuery.data( elem, key );
                                        data = dataAttr( elem, key, data );
                                }

                                return data === undefined && parts[1] ?
                                        this.data( parts[0] ) :
                                        data;
                        }

                        parts[1] = value;
                        this.each(function() {
                                var self = jQuery( this );

                                self.triggerHandler( "setData" + part, parts );
                                jQuery.data( this, key, value );
                                self.triggerHandler( "changeData" + part, parts );
                        });
                }, null, value, arguments.length > 1, null, false );
        },

        removeData: function( key ) {
                return this.each(function() {
                        jQuery.removeData( this, key );
                });
        }
});

function dataAttr( elem, key, data ) {
        // If nothing was found internally, try to fetch any
        // data from the HTML5 data-* attribute
        if ( data === undefined && elem.nodeType === 1 ) {

                var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

                data = elem.getAttribute( name );

                if ( typeof data === "string" ) {
                        try {
                                data = data === "true" ? true :
                                data === "false" ? false :
                                data === "null" ? null :
                                // Only convert to a number if it doesn't change the string
                                +data + "" === data ? +data :
                                rbrace.test( data ) ? jQuery.parseJSON( data ) :
                                        data;
                        } catch( e ) {}

                        // Make sure we set the data so it isn't changed later
                        jQuery.data( elem, key, data );

                } else {
                        data = undefined;
                }
        }

        return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
        var name;
        for ( name in obj ) {

                // if the public data object is empty, the private is still empty
                if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
                        continue;
                }
                if ( name !== "toJSON" ) {
                        return false;
                }
        }

        return true;
}
jQuery.extend({
        queue: function( elem, type, data ) {
                var queue;

                if ( elem ) {
                        type = ( type || "fx" ) + "queue";
                        queue = jQuery._data( elem, type );

                        // Speed up dequeue by getting out quickly if this is just a lookup
                        if ( data ) {
                                if ( !queue || jQuery.isArray(data) ) {
                                        queue = jQuery._data( elem, type, jQuery.makeArray(data) );
                                } else {
                                        queue.push( data );
                                }
                        }
                        return queue || [];
                }
        },

        dequeue: function( elem, type ) {
                type = type || "fx";

                var queue = jQuery.queue( elem, type ),
                        startLength = queue.length,
                        fn = queue.shift(),
                        hooks = jQuery._queueHooks( elem, type ),
                        next = function() {
                                jQuery.dequeue( elem, type );
                        };

                // If the fx queue is dequeued, always remove the progress sentinel
                if ( fn === "inprogress" ) {
                        fn = queue.shift();
                        startLength--;
                }

                if ( fn ) {

                        // Add a progress sentinel to prevent the fx queue from being
                        // automatically dequeued
                        if ( type === "fx" ) {
                                queue.unshift( "inprogress" );
                        }

                        // clear up the last queue stop function
                        delete hooks.stop;
                        fn.call( elem, next, hooks );
                }

                if ( !startLength && hooks ) {
                        hooks.empty.fire();
                }
        },

        // not intended for public consumption - generates a queueHooks object, or returns the current one
        _queueHooks: function( elem, type ) {
                var key = type + "queueHooks";
                return jQuery._data( elem, key ) || jQuery._data( elem, key, {
                        empty: jQuery.Callbacks("once memory").add(function() {
                                jQuery.removeData( elem, type + "queue", true );
                                jQuery.removeData( elem, key, true );
                        })
                });
        }
});

jQuery.fn.extend({
        queue: function( type, data ) {
                var setter = 2;

                if ( typeof type !== "string" ) {
                        data = type;
                        type = "fx";
                        setter--;
                }

                if ( arguments.length < setter ) {
                        return jQuery.queue( this[0], type );
                }

                return data === undefined ?
                        this :
                        this.each(function() {
                                var queue = jQuery.queue( this, type, data );

                                // ensure a hooks for this queue
                                jQuery._queueHooks( this, type );

                                if ( type === "fx" && queue[0] !== "inprogress" ) {
                                        jQuery.dequeue( this, type );
                                }
                        });
        },
        dequeue: function( type ) {
                return this.each(function() {
                        jQuery.dequeue( this, type );
                });
        },
        // Based off of the plugin by Clint Helfers, with permission.
        // http://blindsignals.com/index.php/2009/07/jquery-delay/
        delay: function( time, type ) {
                time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
                type = type || "fx";

                return this.queue( type, function( next, hooks ) {
                        var timeout = setTimeout( next, time );
                        hooks.stop = function() {
                                clearTimeout( timeout );
                        };
                });
        },
        clearQueue: function( type ) {
                return this.queue( type || "fx", [] );
        },
        // Get a promise resolved when queues of a certain type
        // are emptied (fx is the type by default)
        promise: function( type, obj ) {
                var tmp,
                        count = 1,
                        defer = jQuery.Deferred(),
                        elements = this,
                        i = this.length,
                        resolve = function() {
                                if ( !( --count ) ) {
                                        defer.resolveWith( elements, [ elements ] );
                                }
                        };

                if ( typeof type !== "string" ) {
                        obj = type;
                        type = undefined;
                }
                type = type || "fx";

                while( i-- ) {
                        tmp = jQuery._data( elements[ i ], type + "queueHooks" );
                        if ( tmp && tmp.empty ) {
                                count++;
                                tmp.empty.add( resolve );
                        }
                }
                resolve();
                return defer.promise( obj );
        }
});
var nodeHook, boolHook, fixSpecified,
        rclass = /[\t\r\n]/g,
        rreturn = /\r/g,
        rtype = /^(?:button|input)$/i,
        rfocusable = /^(?:button|input|object|select|textarea)$/i,
        rclickable = /^a(?:rea|)$/i,
        rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
        getSetAttribute = jQuery.support.getSetAttribute;

jQuery.fn.extend({
        attr: function( name, value ) {
                return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
        },

        removeAttr: function( name ) {
                return this.each(function() {
                        jQuery.removeAttr( this, name );
                });
        },

        prop: function( name, value ) {
                return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
        },

        removeProp: function( name ) {
                name = jQuery.propFix[ name ] || name;
                return this.each(function() {
                        // try/catch handles cases where IE balks (such as removing a property on window)
                        try {
                                this[ name ] = undefined;
                                delete this[ name ];
                        } catch( e ) {}
                });
        },

        addClass: function( value ) {
                var classNames, i, l, elem,
                        setClass, c, cl;

                if ( jQuery.isFunction( value ) ) {
                        return this.each(function( j ) {
                                jQuery( this ).addClass( value.call(this, j, this.className) );
                        });
                }

                if ( value && typeof value === "string" ) {
                        classNames = value.split( core_rspace );

                        for ( i = 0, l = this.length; i < l; i++ ) {
                                elem = this[ i ];

                                if ( elem.nodeType === 1 ) {
                                        if ( !elem.className && classNames.length === 1 ) {
                                                elem.className = value;

                                        } else {
                                                setClass = " " + elem.className + " ";

                                                for ( c = 0, cl = classNames.length; c < cl; c++ ) {
                                                        if ( setClass.indexOf( " " + classNames[ c ] + " " ) < 0 ) {
                                                                setClass += classNames[ c ] + " ";
                                                        }
                                                }
                                                elem.className = jQuery.trim( setClass );
                                        }
                                }
                        }
                }

                return this;
        },

        removeClass: function( value ) {
                var removes, className, elem, c, cl, i, l;

                if ( jQuery.isFunction( value ) ) {
                        return this.each(function( j ) {
                                jQuery( this ).removeClass( value.call(this, j, this.className) );
                        });
                }
                if ( (value && typeof value === "string") || value === undefined ) {
                        removes = ( value || "" ).split( core_rspace );

                        for ( i = 0, l = this.length; i < l; i++ ) {
                                elem = this[ i ];
                                if ( elem.nodeType === 1 && elem.className ) {

                                        className = (" " + elem.className + " ").replace( rclass, " " );

                                        // loop over each item in the removal list
                                        for ( c = 0, cl = removes.length; c < cl; c++ ) {
                                                // Remove until there is nothing to remove,
                                                while ( className.indexOf(" " + removes[ c ] + " ") >= 0 ) {
                                                        className = className.replace( " " + removes[ c ] + " " , " " );
                                                }
                                        }
                                        elem.className = value ? jQuery.trim( className ) : "";
                                }
                        }
                }

                return this;
        },

        toggleClass: function( value, stateVal ) {
                var type = typeof value,
                        isBool = typeof stateVal === "boolean";

                if ( jQuery.isFunction( value ) ) {
                        return this.each(function( i ) {
                                jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
                        });
                }

                return this.each(function() {
                        if ( type === "string" ) {
                                // toggle individual class names
                                var className,
                                        i = 0,
                                        self = jQuery( this ),
                                        state = stateVal,
                                        classNames = value.split( core_rspace );

                                while ( (className = classNames[ i++ ]) ) {
                                        // check each className given, space separated list
                                        state = isBool ? state : !self.hasClass( className );
                                        self[ state ? "addClass" : "removeClass" ]( className );
                                }

                        } else if ( type === "undefined" || type === "boolean" ) {
                                if ( this.className ) {
                                        // store className if set
                                        jQuery._data( this, "__className__", this.className );
                                }

                                // toggle whole className
                                this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
                        }
                });
        },

        hasClass: function( selector ) {
                var className = " " + selector + " ",
                        i = 0,
                        l = this.length;
                for ( ; i < l; i++ ) {
                        if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
                                return true;
                        }
                }

                return false;
        },

        val: function( value ) {
                var hooks, ret, isFunction,
                        elem = this[0];

                if ( !arguments.length ) {
                        if ( elem ) {
                                hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

                                if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
                                        return ret;
                                }

                                ret = elem.value;

                                return typeof ret === "string" ?
                                        // handle most common string cases
                                        ret.replace(rreturn, "") :
                                        // handle cases where value is null/undef or number
                                        ret == null ? "" : ret;
                        }

                        return;
                }

                isFunction = jQuery.isFunction( value );

                return this.each(function( i ) {
                        var val,
                                self = jQuery(this);

                        if ( this.nodeType !== 1 ) {
                                return;
                        }

                        if ( isFunction ) {
                                val = value.call( this, i, self.val() );
                        } else {
                                val = value;
                        }

                        // Treat null/undefined as ""; convert numbers to string
                        if ( val == null ) {
                                val = "";
                        } else if ( typeof val === "number" ) {
                                val += "";
                        } else if ( jQuery.isArray( val ) ) {
                                val = jQuery.map(val, function ( value ) {
                                        return value == null ? "" : value + "";
                                });
                        }

                        hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

                        // If set returns undefined, fall back to normal setting
                        if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
                                this.value = val;
                        }
                });
        }
});

jQuery.extend({
        valHooks: {
                option: {
                        get: function( elem ) {
                                // attributes.value is undefined in Blackberry 4.7 but
                                // uses .value. See #6932
                                var val = elem.attributes.value;
                                return !val || val.specified ? elem.value : elem.text;
                        }
                },
                select: {
                        get: function( elem ) {
                                var value, option,
                                        options = elem.options,
                                        index = elem.selectedIndex,
                                        one = elem.type === "select-one" || index < 0,
                                        values = one ? null : [],
                                        max = one ? index + 1 : options.length,
                                        i = index < 0 ?
                                                max :
                                                one ? index : 0;

                                // Loop through all the selected options
                                for ( ; i < max; i++ ) {
                                        option = options[ i ];

                                        // oldIE doesn't update selected after form reset (#2551)
                                        if ( ( option.selected || i === index ) &&
                                                        // Don't return options that are disabled or in a disabled optgroup
                                                        ( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
                                                        ( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

                                                // Get the specific value for the option
                                                value = jQuery( option ).val();

                                                // We don't need an array for one selects
                                                if ( one ) {
                                                        return value;
                                                }

                                                // Multi-Selects return an array
                                                values.push( value );
                                        }
                                }

                                return values;
                        },

                        set: function( elem, value ) {
                                var values = jQuery.makeArray( value );

                                jQuery(elem).find("option").each(function() {
                                        this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
                                });

                                if ( !values.length ) {
                                        elem.selectedIndex = -1;
                                }
                                return values;
                        }
                }
        },

        // Unused in 1.8, left in so attrFn-stabbers won't die; remove in 1.9
        attrFn: {},

        attr: function( elem, name, value, pass ) {
                var ret, hooks, notxml,
                        nType = elem.nodeType;

                // don't get/set attributes on text, comment and attribute nodes
                if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
                        return;
                }

                if ( pass && jQuery.isFunction( jQuery.fn[ name ] ) ) {
                        return jQuery( elem )[ name ]( value );
                }

                // Fallback to prop when attributes are not supported
                if ( typeof elem.getAttribute === "undefined" ) {
                        return jQuery.prop( elem, name, value );
                }

                notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

                // All attributes are lowercase
                // Grab necessary hook if one is defined
                if ( notxml ) {
                        name = name.toLowerCase();
                        hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
                }

                if ( value !== undefined ) {

                        if ( value === null ) {
                                jQuery.removeAttr( elem, name );
                                return;

                        } else if ( hooks && "set" in hooks && notxml && (ret = hooks.set( elem, value, name )) !== undefined ) {
                                return ret;

                        } else {
                                elem.setAttribute( name, value + "" );
                                return value;
                        }

                } else if ( hooks && "get" in hooks && notxml && (ret = hooks.get( elem, name )) !== null ) {
                        return ret;

                } else {

                        ret = elem.getAttribute( name );

                        // Non-existent attributes return null, we normalize to undefined
                        return ret === null ?
                                undefined :
                                ret;
                }
        },

        removeAttr: function( elem, value ) {
                var propName, attrNames, name, isBool,
                        i = 0;

                if ( value && elem.nodeType === 1 ) {

                        attrNames = value.split( core_rspace );

                        for ( ; i < attrNames.length; i++ ) {
                                name = attrNames[ i ];

                                if ( name ) {
                                        propName = jQuery.propFix[ name ] || name;
                                        isBool = rboolean.test( name );

                                        // See #9699 for explanation of this approach (setting first, then removal)
                                        // Do not do this for boolean attributes (see #10870)
                                        if ( !isBool ) {
                                                jQuery.attr( elem, name, "" );
                                        }
                                        elem.removeAttribute( getSetAttribute ? name : propName );

                                        // Set corresponding property to false for boolean attributes
                                        if ( isBool && propName in elem ) {
                                                elem[ propName ] = false;
                                        }
                                }
                        }
                }
        },

        attrHooks: {
                type: {
                        set: function( elem, value ) {
                                // We can't allow the type property to be changed (since it causes problems in IE)
                                if ( rtype.test( elem.nodeName ) && elem.parentNode ) {
                                        jQuery.error( "type property can't be changed" );
                                } else if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
                                        // Setting the type on a radio button after the value resets the value in IE6-9
                                        // Reset value to it's default in case type is set after value
                                        // This is for element creation
                                        var val = elem.value;
                                        elem.setAttribute( "type", value );
                                        if ( val ) {
                                                elem.value = val;
                                        }
                                        return value;
                                }
                        }
                },
                // Use the value property for back compat
                // Use the nodeHook for button elements in IE6/7 (#1954)
                value: {
                        get: function( elem, name ) {
                                if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
                                        return nodeHook.get( elem, name );
                                }
                                return name in elem ?
                                        elem.value :
                                        null;
                        },
                        set: function( elem, value, name ) {
                                if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
                                        return nodeHook.set( elem, value, name );
                                }
                                // Does not return so that setAttribute is also used
                                elem.value = value;
                        }
                }
        },

        propFix: {
                tabindex: "tabIndex",
                readonly: "readOnly",
                "for": "htmlFor",
                "class": "className",
                maxlength: "maxLength",
                cellspacing: "cellSpacing",
                cellpadding: "cellPadding",
                rowspan: "rowSpan",
                colspan: "colSpan",
                usemap: "useMap",
                frameborder: "frameBorder",
                contenteditable: "contentEditable"
        },

        prop: function( elem, name, value ) {
                var ret, hooks, notxml,
                        nType = elem.nodeType;

                // don't get/set properties on text, comment and attribute nodes
                if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
                        return;
                }

                notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

                if ( notxml ) {
                        // Fix name and attach hooks
                        name = jQuery.propFix[ name ] || name;
                        hooks = jQuery.propHooks[ name ];
                }

                if ( value !== undefined ) {
                        if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
                                return ret;

                        } else {
                                return ( elem[ name ] = value );
                        }

                } else {
                        if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
                                return ret;

                        } else {
                                return elem[ name ];
                        }
                }
        },

        propHooks: {
                tabIndex: {
                        get: function( elem ) {
                                // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                                // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                                var attributeNode = elem.getAttributeNode("tabindex");

                                return attributeNode && attributeNode.specified ?
                                        parseInt( attributeNode.value, 10 ) :
                                        rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
                                                0 :
                                                undefined;
                        }
                }
        }
});

// Hook for boolean attributes
boolHook = {
        get: function( elem, name ) {
                // Align boolean attributes with corresponding properties
                // Fall back to attribute presence where some booleans are not supported
                var attrNode,
                        property = jQuery.prop( elem, name );
                return property === true || typeof property !== "boolean" && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
                        name.toLowerCase() :
                        undefined;
        },
        set: function( elem, value, name ) {
                var propName;
                if ( value === false ) {
                        // Remove boolean attributes when set to false
                        jQuery.removeAttr( elem, name );
                } else {
                        // value is true since we know at this point it's type boolean and not false
                        // Set boolean attributes to the same name and set the DOM property
                        propName = jQuery.propFix[ name ] || name;
                        if ( propName in elem ) {
                                // Only set the IDL specifically if it already exists on the element
                                elem[ propName ] = true;
                        }

                        elem.setAttribute( name, name.toLowerCase() );
                }
                return name;
        }
};

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

        fixSpecified = {
                name: true,
                id: true,
                coords: true
        };

        // Use this for any attribute in IE6/7
        // This fixes almost every IE6/7 issue
        nodeHook = jQuery.valHooks.button = {
                get: function( elem, name ) {
                        var ret;
                        ret = elem.getAttributeNode( name );
                        return ret && ( fixSpecified[ name ] ? ret.value !== "" : ret.specified ) ?
                                ret.value :
                                undefined;
                },
                set: function( elem, value, name ) {
                        // Set the existing or create a new attribute node
                        var ret = elem.getAttributeNode( name );
                        if ( !ret ) {
                                ret = document.createAttribute( name );
                                elem.setAttributeNode( ret );
                        }
                        return ( ret.value = value + "" );
                }
        };

        // Set width and height to auto instead of 0 on empty string( Bug #8150 )
        // This is for removals
        jQuery.each([ "width", "height" ], function( i, name ) {
                jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
                        set: function( elem, value ) {
                                if ( value === "" ) {
                                        elem.setAttribute( name, "auto" );
                                        return value;
                                }
                        }
                });
        });

        // Set contenteditable to false on removals(#10429)
        // Setting to empty string throws an error as an invalid value
        jQuery.attrHooks.contenteditable = {
                get: nodeHook.get,
                set: function( elem, value, name ) {
                        if ( value === "" ) {
                                value = "false";
                        }
                        nodeHook.set( elem, value, name );
                }
        };
}


// Some attributes require a special call on IE
if ( !jQuery.support.hrefNormalized ) {
        jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
                jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
                        get: function( elem ) {
                                var ret = elem.getAttribute( name, 2 );
                                return ret === null ? undefined : ret;
                        }
                });
        });
}

if ( !jQuery.support.style ) {
        jQuery.attrHooks.style = {
                get: function( elem ) {
                        // Return undefined in the case of empty string
                        // Normalize to lowercase since IE uppercases css property names
                        return elem.style.cssText.toLowerCase() || undefined;
                },
                set: function( elem, value ) {
                        return ( elem.style.cssText = value + "" );
                }
        };
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
        jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
                get: function( elem ) {
                        var parent = elem.parentNode;

                        if ( parent ) {
                                parent.selectedIndex;

                                // Make sure that it also works with optgroups, see #5701
                                if ( parent.parentNode ) {
                                        parent.parentNode.selectedIndex;
                                }
                        }
                        return null;
                }
        });
}

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
        jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
if ( !jQuery.support.checkOn ) {
        jQuery.each([ "radio", "checkbox" ], function() {
                jQuery.valHooks[ this ] = {
                        get: function( elem ) {
                                // Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
                                return elem.getAttribute("value") === null ? "on" : elem.value;
                        }
                };
        });
}
jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
                set: function( elem, value ) {
                        if ( jQuery.isArray( value ) ) {
                                return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
                        }
                }
        });
});
var rformElems = /^(?:textarea|input|select)$/i,
        rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/,
        rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
        rkeyEvent = /^key/,
        rmouseEvent = /^(?:mouse|contextmenu)|click/,
        rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
        hoverHack = function( events ) {
                return jQuery.event.special.hover ? events : events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
        };

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

        add: function( elem, types, handler, data, selector ) {

                var elemData, eventHandle, events,
                        t, tns, type, namespaces, handleObj,
                        handleObjIn, handlers, special;

                // Don't attach events to noData or text/comment nodes (allow plain objects tho)
                if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
                        return;
                }

                // Caller can pass in an object of custom data in lieu of the handler
                if ( handler.handler ) {
                        handleObjIn = handler;
                        handler = handleObjIn.handler;
                        selector = handleObjIn.selector;
                }

                // Make sure that the handler has a unique ID, used to find/remove it later
                if ( !handler.guid ) {
                        handler.guid = jQuery.guid++;
                }

                // Init the element's event structure and main handler, if this is the first
                events = elemData.events;
                if ( !events ) {
                        elemData.events = events = {};
                }
                eventHandle = elemData.handle;
                if ( !eventHandle ) {
                        elemData.handle = eventHandle = function( e ) {
                                // Discard the second event of a jQuery.event.trigger() and
                                // when an event is called after a page has unloaded
                                return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
                                        jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
                                        undefined;
                        };
                        // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
                        eventHandle.elem = elem;
                }

                // Handle multiple events separated by a space
                // jQuery(...).bind("mouseover mouseout", fn);
                types = jQuery.trim( hoverHack(types) ).split( " " );
                for ( t = 0; t < types.length; t++ ) {

                        tns = rtypenamespace.exec( types[t] ) || [];
                        type = tns[1];
                        namespaces = ( tns[2] || "" ).split( "." ).sort();

                        // If event changes its type, use the special event handlers for the changed type
                        special = jQuery.event.special[ type ] || {};

                        // If selector defined, determine special event api type, otherwise given type
                        type = ( selector ? special.delegateType : special.bindType ) || type;

                        // Update special based on newly reset type
                        special = jQuery.event.special[ type ] || {};

                        // handleObj is passed to all event handlers
                        handleObj = jQuery.extend({
                                type: type,
                                origType: tns[1],
                                data: data,
                                handler: handler,
                                guid: handler.guid,
                                selector: selector,
                                needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
                                namespace: namespaces.join(".")
                        }, handleObjIn );

                        // Init the event handler queue if we're the first
                        handlers = events[ type ];
                        if ( !handlers ) {
                                handlers = events[ type ] = [];
                                handlers.delegateCount = 0;

                                // Only use addEventListener/attachEvent if the special events handler returns false
                                if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
                                        // Bind the global event handler to the element
                                        if ( elem.addEventListener ) {
                                                elem.addEventListener( type, eventHandle, false );

                                        } else if ( elem.attachEvent ) {
                                                elem.attachEvent( "on" + type, eventHandle );
                                        }
                                }
                        }

                        if ( special.add ) {
                                special.add.call( elem, handleObj );

                                if ( !handleObj.handler.guid ) {
                                        handleObj.handler.guid = handler.guid;
                                }
                        }

                        // Add to the element's handler list, delegates in front
                        if ( selector ) {
                                handlers.splice( handlers.delegateCount++, 0, handleObj );
                        } else {
                                handlers.push( handleObj );
                        }

                        // Keep track of which events have ever been used, for event optimization
                        jQuery.event.global[ type ] = true;
                }

                // Nullify elem to prevent memory leaks in IE
                elem = null;
        },

        global: {},

        // Detach an event or set of events from an element
        remove: function( elem, types, handler, selector, mappedTypes ) {

                var t, tns, type, origType, namespaces, origCount,
                        j, events, special, eventType, handleObj,
                        elemData = jQuery.hasData( elem ) && jQuery._data( elem );

                if ( !elemData || !(events = elemData.events) ) {
                        return;
                }

                // Once for each type.namespace in types; type may be omitted
                types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
                for ( t = 0; t < types.length; t++ ) {
                        tns = rtypenamespace.exec( types[t] ) || [];
                        type = origType = tns[1];
                        namespaces = tns[2];

                        // Unbind all events (on this namespace, if provided) for the element
                        if ( !type ) {
                                for ( type in events ) {
                                        jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
                                }
                                continue;
                        }

                        special = jQuery.event.special[ type ] || {};
                        type = ( selector? special.delegateType : special.bindType ) || type;
                        eventType = events[ type ] || [];
                        origCount = eventType.length;
                        namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;

                        // Remove matching events
                        for ( j = 0; j < eventType.length; j++ ) {
                                handleObj = eventType[ j ];

                                if ( ( mappedTypes || origType === handleObj.origType ) &&
                                         ( !handler || handler.guid === handleObj.guid ) &&
                                         ( !namespaces || namespaces.test( handleObj.namespace ) ) &&
                                         ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
                                        eventType.splice( j--, 1 );

                                        if ( handleObj.selector ) {
                                                eventType.delegateCount--;
                                        }
                                        if ( special.remove ) {
                                                special.remove.call( elem, handleObj );
                                        }
                                }
                        }

                        // Remove generic event handler if we removed something and no more handlers exist
                        // (avoids potential for endless recursion during removal of special event handlers)
                        if ( eventType.length === 0 && origCount !== eventType.length ) {
                                if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
                                        jQuery.removeEvent( elem, type, elemData.handle );
                                }

                                delete events[ type ];
                        }
                }

                // Remove the expando if it's no longer used
                if ( jQuery.isEmptyObject( events ) ) {
                        delete elemData.handle;

                        // removeData also checks for emptiness and clears the expando if empty
                        // so use it instead of delete
                        jQuery.removeData( elem, "events", true );
                }
        },

        // Events that are safe to short-circuit if no handlers are attached.
        // Native DOM events should not be added, they may have inline handlers.
        customEvent: {
                "getData": true,
                "setData": true,
                "changeData": true
        },

        trigger: function( event, data, elem, onlyHandlers ) {
                // Don't do events on text and comment nodes
                if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
                        return;
                }

                // Event object or event type
                var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType,
                        type = event.type || event,
                        namespaces = [];

                // focus/blur morphs to focusin/out; ensure we're not firing them right now
                if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
                        return;
                }

                if ( type.indexOf( "!" ) >= 0 ) {
                        // Exclusive events trigger only for the exact event (no namespaces)
                        type = type.slice(0, -1);
                        exclusive = true;
                }

                if ( type.indexOf( "." ) >= 0 ) {
                        // Namespaced trigger; create a regexp to match event type in handle()
                        namespaces = type.split(".");
                        type = namespaces.shift();
                        namespaces.sort();
                }

                if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
                        // No jQuery handlers for this event type, and it can't have inline handlers
                        return;
                }

                // Caller can pass in an Event, Object, or just an event type string
                event = typeof event === "object" ?
                        // jQuery.Event object
                        event[ jQuery.expando ] ? event :
                        // Object literal
                        new jQuery.Event( type, event ) :
                        // Just the event type (string)
                        new jQuery.Event( type );

                event.type = type;
                event.isTrigger = true;
                event.exclusive = exclusive;
                event.namespace = namespaces.join( "." );
                event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
                ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";

                // Handle a global trigger
                if ( !elem ) {

                        // TODO: Stop taunting the data cache; remove global events and always attach to document
                        cache = jQuery.cache;
                        for ( i in cache ) {
                                if ( cache[ i ].events && cache[ i ].events[ type ] ) {
                                        jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
                                }
                        }
                        return;
                }

                // Clean up the event in case it is being reused
                event.result = undefined;
                if ( !event.target ) {
                        event.target = elem;
                }

                // Clone any incoming data and prepend the event, creating the handler arg list
                data = data != null ? jQuery.makeArray( data ) : [];
                data.unshift( event );

                // Allow special events to draw outside the lines
                special = jQuery.event.special[ type ] || {};
                if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
                        return;
                }

                // Determine event propagation path in advance, per W3C events spec (#9951)
                // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
                eventPath = [[ elem, special.bindType || type ]];
                if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

                        bubbleType = special.delegateType || type;
                        cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
                        for ( old = elem; cur; cur = cur.parentNode ) {
                                eventPath.push([ cur, bubbleType ]);
                                old = cur;
                        }

                        // Only add window if we got to document (e.g., not plain obj or detached DOM)
                        if ( old === (elem.ownerDocument || document) ) {
                                eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
                        }
                }

                // Fire handlers on the event path
                for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

                        cur = eventPath[i][0];
                        event.type = eventPath[i][1];

                        handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
                        if ( handle ) {
                                handle.apply( cur, data );
                        }
                        // Note that this is a bare JS function and not a jQuery handler
                        handle = ontype && cur[ ontype ];
                        if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
                                event.preventDefault();
                        }
                }
                event.type = type;

                // If nobody prevented the default action, do it now
                if ( !onlyHandlers && !event.isDefaultPrevented() ) {

                        if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
                                !(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

                                // Call a native DOM method on the target with the same name name as the event.
                                // Can't use an .isFunction() check here because IE6/7 fails that test.
                                // Don't do default actions on window, that's where global variables be (#6170)
                                // IE<9 dies on focus/blur to hidden element (#1486)
                                if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") || event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {

                                        // Don't re-trigger an onFOO event when we call its FOO() method
                                        old = elem[ ontype ];

                                        if ( old ) {
                                                elem[ ontype ] = null;
                                        }

                                        // Prevent re-triggering of the same event, since we already bubbled it above
                                        jQuery.event.triggered = type;
                                        elem[ type ]();
                                        jQuery.event.triggered = undefined;

                                        if ( old ) {
                                                elem[ ontype ] = old;
                                        }
                                }
                        }
                }

                return event.result;
        },

        dispatch: function( event ) {

                // Make a writable jQuery.Event from the native event object
                event = jQuery.event.fix( event || window.event );

                var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, related,
                        handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
                        delegateCount = handlers.delegateCount,
                        args = core_slice.call( arguments ),
                        run_all = !event.exclusive && !event.namespace,
                        special = jQuery.event.special[ event.type ] || {},
                        handlerQueue = [];

                // Use the fix-ed jQuery.Event rather than the (read-only) native event
                args[0] = event;
                event.delegateTarget = this;

                // Call the preDispatch hook for the mapped type, and let it bail if desired
                if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
                        return;
                }

                // Determine handlers that should run if there are delegated events
                // Avoid non-left-click bubbling in Firefox (#3861)
                if ( delegateCount && !(event.button && event.type === "click") ) {

                        for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {

                                // Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
                                if ( cur.disabled !== true || event.type !== "click" ) {
                                        selMatch = {};
                                        matches = [];
                                        for ( i = 0; i < delegateCount; i++ ) {
                                                handleObj = handlers[ i ];
                                                sel = handleObj.selector;

                                                if ( selMatch[ sel ] === undefined ) {
                                                        selMatch[ sel ] = handleObj.needsContext ?
                                                                jQuery( sel, this ).index( cur ) >= 0 :
                                                                jQuery.find( sel, this, null, [ cur ] ).length;
                                                }
                                                if ( selMatch[ sel ] ) {
                                                        matches.push( handleObj );
                                                }
                                        }
                                        if ( matches.length ) {
                                                handlerQueue.push({ elem: cur, matches: matches });
                                        }
                                }
                        }
                }

                // Add the remaining (directly-bound) handlers
                if ( handlers.length > delegateCount ) {
                        handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
                }

                // Run delegates first; they may want to stop propagation beneath us
                for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
                        matched = handlerQueue[ i ];
                        event.currentTarget = matched.elem;

                        for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
                                handleObj = matched.matches[ j ];

                                // Triggered event must either 1) be non-exclusive and have no namespace, or
                                // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                                if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

                                        event.data = handleObj.data;
                                        event.handleObj = handleObj;

                                        ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
                                                        .apply( matched.elem, args );

                                        if ( ret !== undefined ) {
                                                event.result = ret;
                                                if ( ret === false ) {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                }
                                        }
                                }
                        }
                }

                // Call the postDispatch hook for the mapped type
                if ( special.postDispatch ) {
                        special.postDispatch.call( this, event );
                }

                return event.result;
        },

        // Includes some event props shared by KeyEvent and MouseEvent
        // *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
        props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

        fixHooks: {},

        keyHooks: {
                props: "char charCode key keyCode".split(" "),
                filter: function( event, original ) {

                        // Add which for key events
                        if ( event.which == null ) {
                                event.which = original.charCode != null ? original.charCode : original.keyCode;
                        }

                        return event;
                }
        },

        mouseHooks: {
                props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
                filter: function( event, original ) {
                        var eventDoc, doc, body,
                                button = original.button,
                                fromElement = original.fromElement;

                        // Calculate pageX/Y if missing and clientX/Y available
                        if ( event.pageX == null && original.clientX != null ) {
                                eventDoc = event.target.ownerDocument || document;
                                doc = eventDoc.documentElement;
                                body = eventDoc.body;

                                event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
                                event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
                        }

                        // Add relatedTarget, if necessary
                        if ( !event.relatedTarget && fromElement ) {
                                event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
                        }

                        // Add which for click: 1 === left; 2 === middle; 3 === right
                        // Note: button is not normalized, so don't use it
                        if ( !event.which && button !== undefined ) {
                                event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
                        }

                        return event;
                }
        },

        fix: function( event ) {
                if ( event[ jQuery.expando ] ) {
                        return event;
                }

                // Create a writable copy of the event object and normalize some properties
                var i, prop,
                        originalEvent = event,
                        fixHook = jQuery.event.fixHooks[ event.type ] || {},
                        copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

                event = jQuery.Event( originalEvent );

                for ( i = copy.length; i; ) {
                        prop = copy[ --i ];
                        event[ prop ] = originalEvent[ prop ];
                }

                // Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
                if ( !event.target ) {
                        event.target = originalEvent.srcElement || document;
                }

                // Target should not be a text node (#504, Safari)
                if ( event.target.nodeType === 3 ) {
                        event.target = event.target.parentNode;
                }

                // For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)
                event.metaKey = !!event.metaKey;

                return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
        },

        special: {
                load: {
                        // Prevent triggered image.load events from bubbling to window.load
                        noBubble: true
                },

                focus: {
                        delegateType: "focusin"
                },
                blur: {
                        delegateType: "focusout"
                },

                beforeunload: {
                        setup: function( data, namespaces, eventHandle ) {
                                // We only want to do this special case on windows
                                if ( jQuery.isWindow( this ) ) {
                                        this.onbeforeunload = eventHandle;
                                }
                        },

                        teardown: function( namespaces, eventHandle ) {
                                if ( this.onbeforeunload === eventHandle ) {
                                        this.onbeforeunload = null;
                                }
                        }
                }
        },

        simulate: function( type, elem, event, bubble ) {
                // Piggyback on a donor event to simulate a different one.
                // Fake originalEvent to avoid donor's stopPropagation, but if the
                // simulated event prevents default then we do the same on the donor.
                var e = jQuery.extend(
                        new jQuery.Event(),
                        event,
                        { type: type,
                                isSimulated: true,
                                originalEvent: {}
                        }
                );
                if ( bubble ) {
                        jQuery.event.trigger( e, null, elem );
                } else {
                        jQuery.event.dispatch.call( elem, e );
                }
                if ( e.isDefaultPrevented() ) {
                        event.preventDefault();
                }
        }
};

// Some plugins are using, but it's undocumented/deprecated and will be removed.
// The 1.7 special event interface should provide all the hooks needed now.
jQuery.event.handle = jQuery.event.dispatch;

jQuery.removeEvent = document.removeEventListener ?
        function( elem, type, handle ) {
                if ( elem.removeEventListener ) {
                        elem.removeEventListener( type, handle, false );
                }
        } :
        function( elem, type, handle ) {
                var name = "on" + type;

                if ( elem.detachEvent ) {

                        // #8545, #7054, preventing memory leaks for custom events in IE6-8
                        // detachEvent needed property on element, by name of that event, to properly expose it to GC
                        if ( typeof elem[ name ] === "undefined" ) {
                                elem[ name ] = null;
                        }

                        elem.detachEvent( name, handle );
                }
        };

jQuery.Event = function( src, props ) {
        // Allow instantiation without the 'new' keyword
        if ( !(this instanceof jQuery.Event) ) {
                return new jQuery.Event( src, props );
        }

        // Event object
        if ( src && src.type ) {
                this.originalEvent = src;
                this.type = src.type;

                // Events bubbling up the document may have been marked as prevented
                // by a handler lower down the tree; reflect the correct value.
                this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
                        src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

        // Event type
        } else {
                this.type = src;
        }

        // Put explicitly provided properties onto the event object
        if ( props ) {
                jQuery.extend( this, props );
        }

        // Create a timestamp if incoming event doesn't have one
        this.timeStamp = src && src.timeStamp || jQuery.now();

        // Mark it as fixed
        this[ jQuery.expando ] = true;
};

function returnFalse() {
        return false;
}
function returnTrue() {
        return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
        preventDefault: function() {
                this.isDefaultPrevented = returnTrue;

                var e = this.originalEvent;
                if ( !e ) {
                        return;
                }

                // if preventDefault exists run it on the original event
                if ( e.preventDefault ) {
                        e.preventDefault();

                // otherwise set the returnValue property of the original event to false (IE)
                } else {
                        e.returnValue = false;
                }
        },
        stopPropagation: function() {
                this.isPropagationStopped = returnTrue;

                var e = this.originalEvent;
                if ( !e ) {
                        return;
                }
                // if stopPropagation exists run it on the original event
                if ( e.stopPropagation ) {
                        e.stopPropagation();
                }
                // otherwise set the cancelBubble property of the original event to true (IE)
                e.cancelBubble = true;
        },
        stopImmediatePropagation: function() {
                this.isImmediatePropagationStopped = returnTrue;
                this.stopPropagation();
        },
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
}, function( orig, fix ) {
        jQuery.event.special[ orig ] = {
                delegateType: fix,
                bindType: fix,

                handle: function( event ) {
                        var ret,
                                target = this,
                                related = event.relatedTarget,
                                handleObj = event.handleObj,
                                selector = handleObj.selector;

                        // For mousenter/leave call the handler if related is outside the target.
                        // NB: No relatedTarget if the mouse left/entered the browser window
                        if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
                                event.type = handleObj.origType;
                                ret = handleObj.handler.apply( this, arguments );
                                event.type = fix;
                        }
                        return ret;
                }
        };
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

        jQuery.event.special.submit = {
                setup: function() {
                        // Only need this for delegated form submit events
                        if ( jQuery.nodeName( this, "form" ) ) {
                                return false;
                        }

                        // Lazy-add a submit handler when a descendant form may potentially be submitted
                        jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
                                // Node name check avoids a VML-related crash in IE (#9807)
                                var elem = e.target,
                                        form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
                                if ( form && !jQuery._data( form, "_submit_attached" ) ) {
                                        jQuery.event.add( form, "submit._submit", function( event ) {
                                                event._submit_bubble = true;
                                        });
                                        jQuery._data( form, "_submit_attached", true );
                                }
                        });
                        // return undefined since we don't need an event listener
                },

                postDispatch: function( event ) {
                        // If form was submitted by the user, bubble the event up the tree
                        if ( event._submit_bubble ) {
                                delete event._submit_bubble;
                                if ( this.parentNode && !event.isTrigger ) {
                                        jQuery.event.simulate( "submit", this.parentNode, event, true );
                                }
                        }
                },

                teardown: function() {
                        // Only need this for delegated form submit events
                        if ( jQuery.nodeName( this, "form" ) ) {
                                return false;
                        }

                        // Remove delegated handlers; cleanData eventually reaps submit handlers attached above
                        jQuery.event.remove( this, "._submit" );
                }
        };
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

        jQuery.event.special.change = {

                setup: function() {

                        if ( rformElems.test( this.nodeName ) ) {
                                // IE doesn't fire change on a check/radio until blur; trigger it on click
                                // after a propertychange. Eat the blur-change in special.change.handle.
                                // This still fires onchange a second time for check/radio after blur.
                                if ( this.type === "checkbox" || this.type === "radio" ) {
                                        jQuery.event.add( this, "propertychange._change", function( event ) {
                                                if ( event.originalEvent.propertyName === "checked" ) {
                                                        this._just_changed = true;
                                                }
                                        });
                                        jQuery.event.add( this, "click._change", function( event ) {
                                                if ( this._just_changed && !event.isTrigger ) {
                                                        this._just_changed = false;
                                                }
                                                // Allow triggered, simulated change events (#11500)
                                                jQuery.event.simulate( "change", this, event, true );
                                        });
                                }
                                return false;
                        }
                        // Delegated event; lazy-add a change handler on descendant inputs
                        jQuery.event.add( this, "beforeactivate._change", function( e ) {
                                var elem = e.target;

                                if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "_change_attached" ) ) {
                                        jQuery.event.add( elem, "change._change", function( event ) {
                                                if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
                                                        jQuery.event.simulate( "change", this.parentNode, event, true );
                                                }
                                        });
                                        jQuery._data( elem, "_change_attached", true );
                                }
                        });
                },

                handle: function( event ) {
                        var elem = event.target;

                        // Swallow native change events from checkbox/radio, we already triggered them above
                        if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
                                return event.handleObj.handler.apply( this, arguments );
                        }
                },

                teardown: function() {
                        jQuery.event.remove( this, "._change" );

                        return !rformElems.test( this.nodeName );
                }
        };
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
        jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

                // Attach a single capturing handler while someone wants focusin/focusout
                var attaches = 0,
                        handler = function( event ) {
                                jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
                        };

                jQuery.event.special[ fix ] = {
                        setup: function() {
                                if ( attaches++ === 0 ) {
                                        document.addEventListener( orig, handler, true );
                                }
                        },
                        teardown: function() {
                                if ( --attaches === 0 ) {
                                        document.removeEventListener( orig, handler, true );
                                }
                        }
                };
        });
}

jQuery.fn.extend({

        on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
                var origFn, type;

                // Types can be a map of types/handlers
                if ( typeof types === "object" ) {
                        // ( types-Object, selector, data )
                        if ( typeof selector !== "string" ) { // && selector != null
                                // ( types-Object, data )
                                data = data || selector;
                                selector = undefined;
                        }
                        for ( type in types ) {
                                this.on( type, selector, data, types[ type ], one );
                        }
                        return this;
                }

                if ( data == null && fn == null ) {
                        // ( types, fn )
                        fn = selector;
                        data = selector = undefined;
                } else if ( fn == null ) {
                        if ( typeof selector === "string" ) {
                                // ( types, selector, fn )
                                fn = data;
                                data = undefined;
                        } else {
                                // ( types, data, fn )
                                fn = data;
                                data = selector;
                                selector = undefined;
                        }
                }
                if ( fn === false ) {
                        fn = returnFalse;
                } else if ( !fn ) {
                        return this;
                }

                if ( one === 1 ) {
                        origFn = fn;
                        fn = function( event ) {
                                // Can use an empty set, since event contains the info
                                jQuery().off( event );
                                return origFn.apply( this, arguments );
                        };
                        // Use same guid so caller can remove using origFn
                        fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
                }
                return this.each( function() {
                        jQuery.event.add( this, types, fn, data, selector );
                });
        },
        one: function( types, selector, data, fn ) {
                return this.on( types, selector, data, fn, 1 );
        },
        off: function( types, selector, fn ) {
                var handleObj, type;
                if ( types && types.preventDefault && types.handleObj ) {
                        // ( event )  dispatched jQuery.Event
                        handleObj = types.handleObj;
                        jQuery( types.delegateTarget ).off(
                                handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
                                handleObj.selector,
                                handleObj.handler
                        );
                        return this;
                }
                if ( typeof types === "object" ) {
                        // ( types-object [, selector] )
                        for ( type in types ) {
                                this.off( type, selector, types[ type ] );
                        }
                        return this;
                }
                if ( selector === false || typeof selector === "function" ) {
                        // ( types [, fn] )
                        fn = selector;
                        selector = undefined;
                }
                if ( fn === false ) {
                        fn = returnFalse;
                }
                return this.each(function() {
                        jQuery.event.remove( this, types, fn, selector );
                });
        },

        bind: function( types, data, fn ) {
                return this.on( types, null, data, fn );
        },
        unbind: function( types, fn ) {
                return this.off( types, null, fn );
        },

        live: function( types, data, fn ) {
                jQuery( this.context ).on( types, this.selector, data, fn );
                return this;
        },
        die: function( types, fn ) {
                jQuery( this.context ).off( types, this.selector || "**", fn );
                return this;
        },

        delegate: function( selector, types, data, fn ) {
                return this.on( types, selector, data, fn );
        },
        undelegate: function( selector, types, fn ) {
                // ( namespace ) or ( selector, types [, fn] )
                return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
        },

        trigger: function( type, data ) {
                return this.each(function() {
                        jQuery.event.trigger( type, data, this );
                });
        },
        triggerHandler: function( type, data ) {
                if ( this[0] ) {
                        return jQuery.event.trigger( type, data, this[0], true );
                }
        },

        toggle: function( fn ) {
                // Save reference to arguments for access in closure
                var args = arguments,
                        guid = fn.guid || jQuery.guid++,
                        i = 0,
                        toggler = function( event ) {
                                // Figure out which function to execute
                                var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
                                jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

                                // Make sure that clicks stop
                                event.preventDefault();

                                // and execute the function
                                return args[ lastToggle ].apply( this, arguments ) || false;
                        };

                // link all the functions, so any of them can unbind this click handler
                toggler.guid = guid;
                while ( i < args.length ) {
                        args[ i++ ].guid = guid;
                }

                return this.click( toggler );
        },

        hover: function( fnOver, fnOut ) {
                return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
        }
});

jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
        "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
        "change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

        // Handle event binding
        jQuery.fn[ name ] = function( data, fn ) {
                if ( fn == null ) {
                        fn = data;
                        data = null;
                }

                return arguments.length > 0 ?
                        this.on( name, null, data, fn ) :
                        this.trigger( name );
        };

        if ( rkeyEvent.test( name ) ) {
                jQuery.event.fixHooks[ name ] = jQuery.event.keyHooks;
        }

        if ( rmouseEvent.test( name ) ) {
                jQuery.event.fixHooks[ name ] = jQuery.event.mouseHooks;
        }
});
/*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var cachedruns,
        assertGetIdNotName,
        Expr,
        getText,
        isXML,
        contains,
        compile,
        sortOrder,
        hasDuplicate,
        outermostContext,

        baseHasDuplicate = true,
        strundefined = "undefined",

        expando = ( "sizcache" + Math.random() ).replace( ".", "" ),

        Token = String,
        document = window.document,
        docElem = document.documentElement,
        dirruns = 0,
        done = 0,
        pop = [].pop,
        push = [].push,
        slice = [].slice,
        // Use a stripped-down indexOf if a native one is unavailable
        indexOf = [].indexOf || function( elem ) {
                var i = 0,
                        len = this.length;
                for ( ; i < len; i++ ) {
                        if ( this[i] === elem ) {
                                return i;
                        }
                }
                return -1;
        },

        // Augment a function for special use by Sizzle
        markFunction = function( fn, value ) {
                fn[ expando ] = value == null || value;
                return fn;
        },

        createCache = function() {
                var cache = {},
                        keys = [];

                return markFunction(function( key, value ) {
                        // Only keep the most recent entries
                        if ( keys.push( key ) > Expr.cacheLength ) {
                                delete cache[ keys.shift() ];
                        }

                        // Retrieve with (key + " ") to avoid collision with native Object.prototype properties (see Issue #157)
                        return (cache[ key + " " ] = value);
                }, cache );
        },

        classCache = createCache(),
        tokenCache = createCache(),
        compilerCache = createCache(),

        // Regex

        // Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = "[\\x20\\t\\r\\n\\f]",
        // http://www.w3.org/TR/css3-syntax/#characters
        characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",

        // Loosely modeled on CSS identifier characters
        // An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
        // Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
        identifier = characterEncoding.replace( "w", "w#" ),

        // Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
        operators = "([*^$|!~]?=)",
        attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
                "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

        // Prefer arguments not in parens/brackets,
        //   then attribute selectors and non-pseudos (denoted by :),
        //   then anything else
        // These preferences are here to reduce the number of selectors
        //   needing tokenize in the PSEUDO preFilter
        pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",

        // For matchExpr.POS and matchExpr.needsContext
        pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
                "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)",

        // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
        rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

        rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
        rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
        rpseudo = new RegExp( pseudos ),

        // Easily-parseable/retrievable ID or TAG or CLASS selectors
        rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,

        rnot = /^:not/,
        rsibling = /[\x20\t\r\n\f]*[+~]/,
        rendsWithNot = /:not\($/,

        rheader = /h\d/i,
        rinputs = /input|select|textarea|button/i,

        rbackslash = /\\(?!\\)/g,

        matchExpr = {
                "ID": new RegExp( "^#(" + characterEncoding + ")" ),
                "CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
                "NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
                "TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
                "ATTR": new RegExp( "^" + attributes ),
                "PSEUDO": new RegExp( "^" + pseudos ),
                "POS": new RegExp( pos, "i" ),
                "CHILD": new RegExp( "^:(only|nth|first|last)-child(?:\\(" + whitespace +
                        "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
                        "*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
                // For use in libraries implementing .is()
                "needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
        },

        // Support

        // Used for testing something on an element
        assert = function( fn ) {
                var div = document.createElement("div");

                try {
                        return fn( div );
                } catch (e) {
                        return false;
                } finally {
                        // release memory in IE
                        div = null;
                }
        },

        // Check if getElementsByTagName("*") returns only elements
        assertTagNameNoComments = assert(function( div ) {
                div.appendChild( document.createComment("") );
                return !div.getElementsByTagName("*").length;
        }),

        // Check if getAttribute returns normalized href attributes
        assertHrefNotNormalized = assert(function( div ) {
                div.innerHTML = "<a href='#'></a>";
                return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
                        div.firstChild.getAttribute("href") === "#";
        }),

        // Check if attributes should be retrieved by attribute nodes
        assertAttributes = assert(function( div ) {
                div.innerHTML = "<select></select>";
                var type = typeof div.lastChild.getAttribute("multiple");
                // IE8 returns a string for some attributes even when not present
                return type !== "boolean" && type !== "string";
        }),

        // Check if getElementsByClassName can be trusted
        assertUsableClassName = assert(function( div ) {
                // Opera can't find a second classname (in 9.6)
                div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
                if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
                        return false;
                }

                // Safari 3.2 caches class attributes and doesn't catch changes
                div.lastChild.className = "e";
                return div.getElementsByClassName("e").length === 2;
        }),

        // Check if getElementById returns elements by name
        // Check if getElementsByName privileges form controls or returns elements by ID
        assertUsableName = assert(function( div ) {
                // Inject content
                div.id = expando + 0;
                div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
                docElem.insertBefore( div, docElem.firstChild );

                // Test
                var pass = document.getElementsByName &&
                        // buggy browsers will return fewer than the correct 2
                        document.getElementsByName( expando ).length === 2 +
                        // buggy browsers will return more than the correct 0
                        document.getElementsByName( expando + 0 ).length;
                assertGetIdNotName = !document.getElementById( expando );

                // Cleanup
                docElem.removeChild( div );

                return pass;
        });

// If slice is not available, provide a backup
try {
        slice.call( docElem.childNodes, 0 )[0].nodeType;
} catch ( e ) {
        slice = function( i ) {
                var elem,
                        results = [];
                for ( ; (elem = this[i]); i++ ) {
                        results.push( elem );
                }
                return results;
        };
}

function Sizzle( selector, context, results, seed ) {
        results = results || [];
        context = context || document;
        var match, elem, xml, m,
                nodeType = context.nodeType;

        if ( !selector || typeof selector !== "string" ) {
                return results;
        }

        if ( nodeType !== 1 && nodeType !== 9 ) {
                return [];
        }

        xml = isXML( context );

        if ( !xml && !seed ) {
                if ( (match = rquickExpr.exec( selector )) ) {
                        // Speed-up: Sizzle("#ID")
                        if ( (m = match[1]) ) {
                                if ( nodeType === 9 ) {
                                        elem = context.getElementById( m );
                                        // Check parentNode to catch when Blackberry 4.6 returns
                                        // nodes that are no longer in the document #6963
                                        if ( elem && elem.parentNode ) {
                                                // Handle the case where IE, Opera, and Webkit return items
                                                // by name instead of ID
                                                if ( elem.id === m ) {
                                                        results.push( elem );
                                                        return results;
                                                }
                                        } else {
                                                return results;
                                        }
                                } else {
                                        // Context is not a document
                                        if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
                                                contains( context, elem ) && elem.id === m ) {
                                                results.push( elem );
                                                return results;
                                        }
                                }

                        // Speed-up: Sizzle("TAG")
                        } else if ( match[2] ) {
                                push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
                                return results;

                        // Speed-up: Sizzle(".CLASS")
                        } else if ( (m = match[3]) && assertUsableClassName && context.getElementsByClassName ) {
                                push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
                                return results;
                        }
                }
        }

        // All others
        return select( selector.replace( rtrim, "$1" ), context, results, seed, xml );
}

Sizzle.matches = function( expr, elements ) {
        return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
        return Sizzle( expr, null, null, [ elem ] ).length > 0;
};

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
        return function( elem ) {
                var name = elem.nodeName.toLowerCase();
                return name === "input" && elem.type === type;
        };
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
        return function( elem ) {
                var name = elem.nodeName.toLowerCase();
                return (name === "input" || name === "button") && elem.type === type;
        };
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
        return markFunction(function( argument ) {
                argument = +argument;
                return markFunction(function( seed, matches ) {
                        var j,
                                matchIndexes = fn( [], seed.length, argument ),
                                i = matchIndexes.length;

                        // Match elements found at the specified indexes
                        while ( i-- ) {
                                if ( seed[ (j = matchIndexes[i]) ] ) {
                                        seed[j] = !(matches[j] = seed[j]);
                                }
                        }
                });
        });
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
        var node,
                ret = "",
                i = 0,
                nodeType = elem.nodeType;

        if ( nodeType ) {
                if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
                        // Use textContent for elements
                        // innerText usage removed for consistency of new lines (see #11153)
                        if ( typeof elem.textContent === "string" ) {
                                return elem.textContent;
                        } else {
                                // Traverse its children
                                for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
                                        ret += getText( elem );
                                }
                        }
                } else if ( nodeType === 3 || nodeType === 4 ) {
                        return elem.nodeValue;
                }
                // Do not include comment or processing instruction nodes
        } else {

                // If no nodeType, this is expected to be an array
                for ( ; (node = elem[i]); i++ ) {
                        // Do not traverse comment nodes
                        ret += getText( node );
                }
        }
        return ret;
};

isXML = Sizzle.isXML = function( elem ) {
        // documentElement is verified for cases where it doesn't yet exist
        // (such as loading iframes in IE - #4833)
        var documentElement = elem && (elem.ownerDocument || elem).documentElement;
        return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Element contains another
contains = Sizzle.contains = docElem.contains ?
        function( a, b ) {
                var adown = a.nodeType === 9 ? a.documentElement : a,
                        bup = b && b.parentNode;
                return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
        } :
        docElem.compareDocumentPosition ?
        function( a, b ) {
                return b && !!( a.compareDocumentPosition( b ) & 16 );
        } :
        function( a, b ) {
                while ( (b = b.parentNode) ) {
                        if ( b === a ) {
                                return true;
                        }
                }
                return false;
        };

Sizzle.attr = function( elem, name ) {
        var val,
                xml = isXML( elem );

        if ( !xml ) {
                name = name.toLowerCase();
        }
        if ( (val = Expr.attrHandle[ name ]) ) {
                return val( elem );
        }
        if ( xml || assertAttributes ) {
                return elem.getAttribute( name );
        }
        val = elem.getAttributeNode( name );
        return val ?
                typeof elem[ name ] === "boolean" ?
                        elem[ name ] ? name : null :
                        val.specified ? val.value : null :
                null;
};

Expr = Sizzle.selectors = {

        // Can be adjusted by the user
        cacheLength: 50,

        createPseudo: markFunction,

        match: matchExpr,

        // IE6/7 return a modified href
        attrHandle: assertHrefNotNormalized ?
                {} :
                {
                        "href": function( elem ) {
                                return elem.getAttribute( "href", 2 );
                        },
                        "type": function( elem ) {
                                return elem.getAttribute("type");
                        }
                },

        find: {
                "ID": assertGetIdNotName ?
                        function( id, context, xml ) {
                                if ( typeof context.getElementById !== strundefined && !xml ) {
                                        var m = context.getElementById( id );
                                        // Check parentNode to catch when Blackberry 4.6 returns
                                        // nodes that are no longer in the document #6963
                                        return m && m.parentNode ? [m] : [];
                                }
                        } :
                        function( id, context, xml ) {
                                if ( typeof context.getElementById !== strundefined && !xml ) {
                                        var m = context.getElementById( id );

                                        return m ?
                                                m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
                                                        [m] :
                                                        undefined :
                                                [];
                                }
                        },

                "TAG": assertTagNameNoComments ?
                        function( tag, context ) {
                                if ( typeof context.getElementsByTagName !== strundefined ) {
                                        return context.getElementsByTagName( tag );
                                }
                        } :
                        function( tag, context ) {
                                var results = context.getElementsByTagName( tag );

                                // Filter out possible comments
                                if ( tag === "*" ) {
                                        var elem,
                                                tmp = [],
                                                i = 0;

                                        for ( ; (elem = results[i]); i++ ) {
                                                if ( elem.nodeType === 1 ) {
                                                        tmp.push( elem );
                                                }
                                        }

                                        return tmp;
                                }
                                return results;
                        },

                "NAME": assertUsableName && function( tag, context ) {
                        if ( typeof context.getElementsByName !== strundefined ) {
                                return context.getElementsByName( name );
                        }
                },

                "CLASS": assertUsableClassName && function( className, context, xml ) {
                        if ( typeof context.getElementsByClassName !== strundefined && !xml ) {
                                return context.getElementsByClassName( className );
                        }
                }
        },

        relative: {
                ">": { dir: "parentNode", first: true },
                " ": { dir: "parentNode" },
                "+": { dir: "previousSibling", first: true },
                "~": { dir: "previousSibling" }
        },

        preFilter: {
                "ATTR": function( match ) {
                        match[1] = match[1].replace( rbackslash, "" );

                        // Move the given value to match[3] whether quoted or unquoted
                        match[3] = ( match[4] || match[5] || "" ).replace( rbackslash, "" );

                        if ( match[2] === "~=" ) {
                                match[3] = " " + match[3] + " ";
                        }

                        return match.slice( 0, 4 );
                },

                "CHILD": function( match ) {
                        /* matches from matchExpr["CHILD"]
                                1 type (only|nth|...)
                                2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
                                3 xn-component of xn+y argument ([+-]?\d*n|)
                                4 sign of xn-component
                                5 x of xn-component
                                6 sign of y-component
                                7 y of y-component
                        */
                        match[1] = match[1].toLowerCase();

                        if ( match[1] === "nth" ) {
                                // nth-child requires argument
                                if ( !match[2] ) {
                                        Sizzle.error( match[0] );
                                }

                                // numeric x and y parameters for Expr.filter.CHILD
                                // remember that false/true cast respectively to 0/1
                                match[3] = +( match[3] ? match[4] + (match[5] || 1) : 2 * ( match[2] === "even" || match[2] === "odd" ) );
                                match[4] = +( ( match[6] + match[7] ) || match[2] === "odd" );

                        // other types prohibit arguments
                        } else if ( match[2] ) {
                                Sizzle.error( match[0] );
                        }

                        return match;
                },

                "PSEUDO": function( match ) {
                        var unquoted, excess;
                        if ( matchExpr["CHILD"].test( match[0] ) ) {
                                return null;
                        }

                        if ( match[3] ) {
                                match[2] = match[3];
                        } else if ( (unquoted = match[4]) ) {
                                // Only check arguments that contain a pseudo
                                if ( rpseudo.test(unquoted) &&
                                        // Get excess from tokenize (recursively)
                                        (excess = tokenize( unquoted, true )) &&
                                        // advance to the next closing parenthesis
                                        (excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

                                        // excess is a negative index
                                        unquoted = unquoted.slice( 0, excess );
                                        match[0] = match[0].slice( 0, excess );
                                }
                                match[2] = unquoted;
                        }

                        // Return only captures needed by the pseudo filter method (type and argument)
                        return match.slice( 0, 3 );
                }
        },

        filter: {
                "ID": assertGetIdNotName ?
                        function( id ) {
                                id = id.replace( rbackslash, "" );
                                return function( elem ) {
                                        return elem.getAttribute("id") === id;
                                };
                        } :
                        function( id ) {
                                id = id.replace( rbackslash, "" );
                                return function( elem ) {
                                        var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                                        return node && node.value === id;
                                };
                        },

                "TAG": function( nodeName ) {
                        if ( nodeName === "*" ) {
                                return function() { return true; };
                        }
                        nodeName = nodeName.replace( rbackslash, "" ).toLowerCase();

                        return function( elem ) {
                                return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                        };
                },

                "CLASS": function( className ) {
                        var pattern = classCache[ expando ][ className + " " ];

                        return pattern ||
                                (pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
                                classCache( className, function( elem ) {
                                        return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
                                });
                },

                "ATTR": function( name, operator, check ) {
                        return function( elem, context ) {
                                var result = Sizzle.attr( elem, name );

                                if ( result == null ) {
                                        return operator === "!=";
                                }
                                if ( !operator ) {
                                        return true;
                                }

                                result += "";

                                return operator === "=" ? result === check :
                                        operator === "!=" ? result !== check :
                                        operator === "^=" ? check && result.indexOf( check ) === 0 :
                                        operator === "*=" ? check && result.indexOf( check ) > -1 :
                                        operator === "$=" ? check && result.substr( result.length - check.length ) === check :
                                        operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
                                        operator === "|=" ? result === check || result.substr( 0, check.length + 1 ) === check + "-" :
                                        false;
                        };
                },

                "CHILD": function( type, argument, first, last ) {

                        if ( type === "nth" ) {
                                return function( elem ) {
                                        var node, diff,
                                                parent = elem.parentNode;

                                        if ( first === 1 && last === 0 ) {
                                                return true;
                                        }

                                        if ( parent ) {
                                                diff = 0;
                                                for ( node = parent.firstChild; node; node = node.nextSibling ) {
                                                        if ( node.nodeType === 1 ) {
                                                                diff++;
                                                                if ( elem === node ) {
                                                                        break;
                                                                }
                                                        }
                                                }
                                        }

                                        // Incorporate the offset (or cast to NaN), then check against cycle size
                                        diff -= last;
                                        return diff === first || ( diff % first === 0 && diff / first >= 0 );
                                };
                        }

                        return function( elem ) {
                                var node = elem;

                                switch ( type ) {
                                        case "only":
                                        case "first":
                                                while ( (node = node.previousSibling) ) {
                                                        if ( node.nodeType === 1 ) {
                                                                return false;
                                                        }
                                                }

                                                if ( type === "first" ) {
                                                        return true;
                                                }

                                                node = elem;

                                                /* falls through */
                                        case "last":
                                                while ( (node = node.nextSibling) ) {
                                                        if ( node.nodeType === 1 ) {
                                                                return false;
                                                        }
                                                }

                                                return true;
                                }
                        };
                },

                "PSEUDO": function( pseudo, argument ) {
                        // pseudo-class names are case-insensitive
                        // http://www.w3.org/TR/selectors/#pseudo-classes
                        // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
                        // Remember that setFilters inherits from pseudos
                        var args,
                                fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
                                        Sizzle.error( "unsupported pseudo: " + pseudo );

                        // The user may use createPseudo to indicate that
                        // arguments are needed to create the filter function
                        // just as Sizzle does
                        if ( fn[ expando ] ) {
                                return fn( argument );
                        }

                        // But maintain support for old signatures
                        if ( fn.length > 1 ) {
                                args = [ pseudo, pseudo, "", argument ];
                                return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
                                        markFunction(function( seed, matches ) {
                                                var idx,
                                                        matched = fn( seed, argument ),
                                                        i = matched.length;
                                                while ( i-- ) {
                                                        idx = indexOf.call( seed, matched[i] );
                                                        seed[ idx ] = !( matches[ idx ] = matched[i] );
                                                }
                                        }) :
                                        function( elem ) {
                                                return fn( elem, 0, args );
                                        };
                        }

                        return fn;
                }
        },

        pseudos: {
                "not": markFunction(function( selector ) {
                        // Trim the selector passed to compile
                        // to avoid treating leading and trailing
                        // spaces as combinators
                        var input = [],
                                results = [],
                                matcher = compile( selector.replace( rtrim, "$1" ) );

                        return matcher[ expando ] ?
                                markFunction(function( seed, matches, context, xml ) {
                                        var elem,
                                                unmatched = matcher( seed, null, xml, [] ),
                                                i = seed.length;

                                        // Match elements unmatched by `matcher`
                                        while ( i-- ) {
                                                if ( (elem = unmatched[i]) ) {
                                                        seed[i] = !(matches[i] = elem);
                                                }
                                        }
                                }) :
                                function( elem, context, xml ) {
                                        input[0] = elem;
                                        matcher( input, null, xml, results );
                                        return !results.pop();
                                };
                }),

                "has": markFunction(function( selector ) {
                        return function( elem ) {
                                return Sizzle( selector, elem ).length > 0;
                        };
                }),

                "contains": markFunction(function( text ) {
                        return function( elem ) {
                                return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
                        };
                }),

                "enabled": function( elem ) {
                        return elem.disabled === false;
                },

                "disabled": function( elem ) {
                        return elem.disabled === true;
                },

                "checked": function( elem ) {
                        // In CSS3, :checked should return both checked and selected elements
                        // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                        var nodeName = elem.nodeName.toLowerCase();
                        return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
                },

                "selected": function( elem ) {
                        // Accessing this property makes selected-by-default
                        // options in Safari work properly
                        if ( elem.parentNode ) {
                                elem.parentNode.selectedIndex;
                        }

                        return elem.selected === true;
                },

                "parent": function( elem ) {
                        return !Expr.pseudos["empty"]( elem );
                },

                "empty": function( elem ) {
                        // http://www.w3.org/TR/selectors/#empty-pseudo
                        // :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
                        //   not comment, processing instructions, or others
                        // Thanks to Diego Perini for the nodeName shortcut
                        //   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
                        var nodeType;
                        elem = elem.firstChild;
                        while ( elem ) {
                                if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
                                        return false;
                                }
                                elem = elem.nextSibling;
                        }
                        return true;
                },

                "header": function( elem ) {
                        return rheader.test( elem.nodeName );
                },

                "text": function( elem ) {
                        var type, attr;
                        // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
                        // use getAttribute instead to test this case
                        return elem.nodeName.toLowerCase() === "input" &&
                                (type = elem.type) === "text" &&
                                ( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type );
                },

                // Input types
                "radio": createInputPseudo("radio"),
                "checkbox": createInputPseudo("checkbox"),
                "file": createInputPseudo("file"),
                "password": createInputPseudo("password"),
                "image": createInputPseudo("image"),

                "submit": createButtonPseudo("submit"),
                "reset": createButtonPseudo("reset"),

                "button": function( elem ) {
                        var name = elem.nodeName.toLowerCase();
                        return name === "input" && elem.type === "button" || name === "button";
                },

                "input": function( elem ) {
                        return rinputs.test( elem.nodeName );
                },

                "focus": function( elem ) {
                        var doc = elem.ownerDocument;
                        return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                },

                "active": function( elem ) {
                        return elem === elem.ownerDocument.activeElement;
                },

                // Positional types
                "first": createPositionalPseudo(function() {
                        return [ 0 ];
                }),

                "last": createPositionalPseudo(function( matchIndexes, length ) {
                        return [ length - 1 ];
                }),

                "eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
                        return [ argument < 0 ? argument + length : argument ];
                }),

                "even": createPositionalPseudo(function( matchIndexes, length ) {
                        for ( var i = 0; i < length; i += 2 ) {
                                matchIndexes.push( i );
                        }
                        return matchIndexes;
                }),

                "odd": createPositionalPseudo(function( matchIndexes, length ) {
                        for ( var i = 1; i < length; i += 2 ) {
                                matchIndexes.push( i );
                        }
                        return matchIndexes;
                }),

                "lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
                        for ( var i = argument < 0 ? argument + length : argument; --i >= 0; ) {
                                matchIndexes.push( i );
                        }
                        return matchIndexes;
                }),

                "gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
                        for ( var i = argument < 0 ? argument + length : argument; ++i < length; ) {
                                matchIndexes.push( i );
                        }
                        return matchIndexes;
                })
        }
};

function siblingCheck( a, b, ret ) {
        if ( a === b ) {
                return ret;
        }

        var cur = a.nextSibling;

        while ( cur ) {
                if ( cur === b ) {
                        return -1;
                }

                cur = cur.nextSibling;
        }

        return 1;
}

sortOrder = docElem.compareDocumentPosition ?
        function( a, b ) {
                if ( a === b ) {
                        hasDuplicate = true;
                        return 0;
                }

                return ( !a.compareDocumentPosition || !b.compareDocumentPosition ?
                        a.compareDocumentPosition :
                        a.compareDocumentPosition(b) & 4
                ) ? -1 : 1;
        } :
        function( a, b ) {
                // The nodes are identical, we can exit early
                if ( a === b ) {
                        hasDuplicate = true;
                        return 0;

                // Fallback to using sourceIndex (in IE) if it's available on both nodes
                } else if ( a.sourceIndex && b.sourceIndex ) {
                        return a.sourceIndex - b.sourceIndex;
                }

                var al, bl,
                        ap = [],
                        bp = [],
                        aup = a.parentNode,
                        bup = b.parentNode,
                        cur = aup;

                // If the nodes are siblings (or identical) we can do a quick check
                if ( aup === bup ) {
                        return siblingCheck( a, b );

                // If no parents were found then the nodes are disconnected
                } else if ( !aup ) {
                        return -1;

                } else if ( !bup ) {
                        return 1;
                }

                // Otherwise they're somewhere else in the tree so we need
                // to build up a full list of the parentNodes for comparison
                while ( cur ) {
                        ap.unshift( cur );
                        cur = cur.parentNode;
                }

                cur = bup;

                while ( cur ) {
                        bp.unshift( cur );
                        cur = cur.parentNode;
                }

                al = ap.length;
                bl = bp.length;

                // Start walking down the tree looking for a discrepancy
                for ( var i = 0; i < al && i < bl; i++ ) {
                        if ( ap[i] !== bp[i] ) {
                                return siblingCheck( ap[i], bp[i] );
                        }
                }

                // We ended someplace up the tree so do a sibling check
                return i === al ?
                        siblingCheck( a, bp[i], -1 ) :
                        siblingCheck( ap[i], b, 1 );
        };

// Always assume the presence of duplicates if sort doesn't
// pass them to our comparison function (as in Google Chrome).
[0, 0].sort( sortOrder );
baseHasDuplicate = !hasDuplicate;

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
        var elem,
                duplicates = [],
                i = 1,
                j = 0;

        hasDuplicate = baseHasDuplicate;
        results.sort( sortOrder );

        if ( hasDuplicate ) {
                for ( ; (elem = results[i]); i++ ) {
                        if ( elem === results[ i - 1 ] ) {
                                j = duplicates.push( i );
                        }
                }
                while ( j-- ) {
                        results.splice( duplicates[ j ], 1 );
                }
        }

        return results;
};

Sizzle.error = function( msg ) {
        throw new Error( "Syntax error, unrecognized expression: " + msg );
};

function tokenize( selector, parseOnly ) {
        var matched, match, tokens, type,
                soFar, groups, preFilters,
                cached = tokenCache[ expando ][ selector + " " ];

        if ( cached ) {
                return parseOnly ? 0 : cached.slice( 0 );
        }

        soFar = selector;
        groups = [];
        preFilters = Expr.preFilter;

        while ( soFar ) {

                // Comma and first run
                if ( !matched || (match = rcomma.exec( soFar )) ) {
                        if ( match ) {
                                // Don't consume trailing commas as valid
                                soFar = soFar.slice( match[0].length ) || soFar;
                        }
                        groups.push( tokens = [] );
                }

                matched = false;

                // Combinators
                if ( (match = rcombinators.exec( soFar )) ) {
                        tokens.push( matched = new Token( match.shift() ) );
                        soFar = soFar.slice( matched.length );

                        // Cast descendant combinators to space
                        matched.type = match[0].replace( rtrim, " " );
                }

                // Filters
                for ( type in Expr.filter ) {
                        if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
                                (match = preFilters[ type ]( match ))) ) {

                                tokens.push( matched = new Token( match.shift() ) );
                                soFar = soFar.slice( matched.length );
                                matched.type = type;
                                matched.matches = match;
                        }
                }

                if ( !matched ) {
                        break;
                }
        }

        // Return the length of the invalid excess
        // if we're just parsing
        // Otherwise, throw an error or return tokens
        return parseOnly ?
                soFar.length :
                soFar ?
                        Sizzle.error( selector ) :
                        // Cache the tokens
                        tokenCache( selector, groups ).slice( 0 );
}

function addCombinator( matcher, combinator, base ) {
        var dir = combinator.dir,
                checkNonElements = base && combinator.dir === "parentNode",
                doneName = done++;

        return combinator.first ?
                // Check against closest ancestor/preceding element
                function( elem, context, xml ) {
                        while ( (elem = elem[ dir ]) ) {
                                if ( checkNonElements || elem.nodeType === 1  ) {
                                        return matcher( elem, context, xml );
                                }
                        }
                } :

                // Check against all ancestor/preceding elements
                function( elem, context, xml ) {
                        // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
                        if ( !xml ) {
                                var cache,
                                        dirkey = dirruns + " " + doneName + " ",
                                        cachedkey = dirkey + cachedruns;
                                while ( (elem = elem[ dir ]) ) {
                                        if ( checkNonElements || elem.nodeType === 1 ) {
                                                if ( (cache = elem[ expando ]) === cachedkey ) {
                                                        return elem.sizset;
                                                } else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
                                                        if ( elem.sizset ) {
                                                                return elem;
                                                        }
                                                } else {
                                                        elem[ expando ] = cachedkey;
                                                        if ( matcher( elem, context, xml ) ) {
                                                                elem.sizset = true;
                                                                return elem;
                                                        }
                                                        elem.sizset = false;
                                                }
                                        }
                                }
                        } else {
                                while ( (elem = elem[ dir ]) ) {
                                        if ( checkNonElements || elem.nodeType === 1 ) {
                                                if ( matcher( elem, context, xml ) ) {
                                                        return elem;
                                                }
                                        }
                                }
                        }
                };
}

function elementMatcher( matchers ) {
        return matchers.length > 1 ?
                function( elem, context, xml ) {
                        var i = matchers.length;
                        while ( i-- ) {
                                if ( !matchers[i]( elem, context, xml ) ) {
                                        return false;
                                }
                        }
                        return true;
                } :
                matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
        var elem,
                newUnmatched = [],
                i = 0,
                len = unmatched.length,
                mapped = map != null;

        for ( ; i < len; i++ ) {
                if ( (elem = unmatched[i]) ) {
                        if ( !filter || filter( elem, context, xml ) ) {
                                newUnmatched.push( elem );
                                if ( mapped ) {
                                        map.push( i );
                                }
                        }
                }
        }

        return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
        if ( postFilter && !postFilter[ expando ] ) {
                postFilter = setMatcher( postFilter );
        }
        if ( postFinder && !postFinder[ expando ] ) {
                postFinder = setMatcher( postFinder, postSelector );
        }
        return markFunction(function( seed, results, context, xml ) {
                var temp, i, elem,
                        preMap = [],
                        postMap = [],
                        preexisting = results.length,

                        // Get initial elements from seed or context
                        elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

                        // Prefilter to get matcher input, preserving a map for seed-results synchronization
                        matcherIn = preFilter && ( seed || !selector ) ?
                                condense( elems, preMap, preFilter, context, xml ) :
                                elems,

                        matcherOut = matcher ?
                                // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
                                postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

                                        // ...intermediate processing is necessary
                                        [] :

                                        // ...otherwise use results directly
                                        results :
                                matcherIn;

                // Find primary matches
                if ( matcher ) {
                        matcher( matcherIn, matcherOut, context, xml );
                }

                // Apply postFilter
                if ( postFilter ) {
                        temp = condense( matcherOut, postMap );
                        postFilter( temp, [], context, xml );

                        // Un-match failing elements by moving them back to matcherIn
                        i = temp.length;
                        while ( i-- ) {
                                if ( (elem = temp[i]) ) {
                                        matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
                                }
                        }
                }

                if ( seed ) {
                        if ( postFinder || preFilter ) {
                                if ( postFinder ) {
                                        // Get the final matcherOut by condensing this intermediate into postFinder contexts
                                        temp = [];
                                        i = matcherOut.length;
                                        while ( i-- ) {
                                                if ( (elem = matcherOut[i]) ) {
                                                        // Restore matcherIn since elem is not yet a final match
                                                        temp.push( (matcherIn[i] = elem) );
                                                }
                                        }
                                        postFinder( null, (matcherOut = []), temp, xml );
                                }

                                // Move matched elements from seed to results to keep them synchronized
                                i = matcherOut.length;
                                while ( i-- ) {
                                        if ( (elem = matcherOut[i]) &&
                                                (temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

                                                seed[temp] = !(results[temp] = elem);
                                        }
                                }
                        }

                // Add elements to results, through postFinder if defined
                } else {
                        matcherOut = condense(
                                matcherOut === results ?
                                        matcherOut.splice( preexisting, matcherOut.length ) :
                                        matcherOut
                        );
                        if ( postFinder ) {
                                postFinder( null, results, matcherOut, xml );
                        } else {
                                push.apply( results, matcherOut );
                        }
                }
        });
}

function matcherFromTokens( tokens ) {
        var checkContext, matcher, j,
                len = tokens.length,
                leadingRelative = Expr.relative[ tokens[0].type ],
                implicitRelative = leadingRelative || Expr.relative[" "],
                i = leadingRelative ? 1 : 0,

                // The foundational matcher ensures that elements are reachable from top-level context(s)
                matchContext = addCombinator( function( elem ) {
                        return elem === checkContext;
                }, implicitRelative, true ),
                matchAnyContext = addCombinator( function( elem ) {
                        return indexOf.call( checkContext, elem ) > -1;
                }, implicitRelative, true ),
                matchers = [ function( elem, context, xml ) {
                        return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
                                (checkContext = context).nodeType ?
                                        matchContext( elem, context, xml ) :
                                        matchAnyContext( elem, context, xml ) );
                } ];

        for ( ; i < len; i++ ) {
                if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
                        matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
                } else {
                        matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

                        // Return special upon seeing a positional matcher
                        if ( matcher[ expando ] ) {
                                // Find the next relative operator (if any) for proper handling
                                j = ++i;
                                for ( ; j < len; j++ ) {
                                        if ( Expr.relative[ tokens[j].type ] ) {
                                                break;
                                        }
                                }
                                return setMatcher(
                                        i > 1 && elementMatcher( matchers ),
                                        i > 1 && tokens.slice( 0, i - 1 ).join("").replace( rtrim, "$1" ),
                                        matcher,
                                        i < j && matcherFromTokens( tokens.slice( i, j ) ),
                                        j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
                                        j < len && tokens.join("")
                                );
                        }
                        matchers.push( matcher );
                }
        }

        return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
        var bySet = setMatchers.length > 0,
                byElement = elementMatchers.length > 0,
                superMatcher = function( seed, context, xml, results, expandContext ) {
                        var elem, j, matcher,
                                setMatched = [],
                                matchedCount = 0,
                                i = "0",
                                unmatched = seed && [],
                                outermost = expandContext != null,
                                contextBackup = outermostContext,
                                // We must always have either seed elements or context
                                elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
                                // Nested matchers should use non-integer dirruns
                                dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.E);

                        if ( outermost ) {
                                outermostContext = context !== document && context;
                                cachedruns = superMatcher.el;
                        }

                        // Add elements passing elementMatchers directly to results
                        for ( ; (elem = elems[i]) != null; i++ ) {
                                if ( byElement && elem ) {
                                        for ( j = 0; (matcher = elementMatchers[j]); j++ ) {
                                                if ( matcher( elem, context, xml ) ) {
                                                        results.push( elem );
                                                        break;
                                                }
                                        }
                                        if ( outermost ) {
                                                dirruns = dirrunsUnique;
                                                cachedruns = ++superMatcher.el;
                                        }
                                }

                                // Track unmatched elements for set filters
                                if ( bySet ) {
                                        // They will have gone through all possible matchers
                                        if ( (elem = !matcher && elem) ) {
                                                matchedCount--;
                                        }

                                        // Lengthen the array for every element, matched or not
                                        if ( seed ) {
                                                unmatched.push( elem );
                                        }
                                }
                        }

                        // Apply set filters to unmatched elements
                        matchedCount += i;
                        if ( bySet && i !== matchedCount ) {
                                for ( j = 0; (matcher = setMatchers[j]); j++ ) {
                                        matcher( unmatched, setMatched, context, xml );
                                }

                                if ( seed ) {
                                        // Reintegrate element matches to eliminate the need for sorting
                                        if ( matchedCount > 0 ) {
                                                while ( i-- ) {
                                                        if ( !(unmatched[i] || setMatched[i]) ) {
                                                                setMatched[i] = pop.call( results );
                                                        }
                                                }
                                        }

                                        // Discard index placeholder values to get only actual matches
                                        setMatched = condense( setMatched );
                                }

                                // Add matches to results
                                push.apply( results, setMatched );

                                // Seedless set matches succeeding multiple successful matchers stipulate sorting
                                if ( outermost && !seed && setMatched.length > 0 &&
                                        ( matchedCount + setMatchers.length ) > 1 ) {

                                        Sizzle.uniqueSort( results );
                                }
                        }

                        // Override manipulation of globals by nested matchers
                        if ( outermost ) {
                                dirruns = dirrunsUnique;
                                outermostContext = contextBackup;
                        }

                        return unmatched;
                };

        superMatcher.el = 0;
        return bySet ?
                markFunction( superMatcher ) :
                superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
        var i,
                setMatchers = [],
                elementMatchers = [],
                cached = compilerCache[ expando ][ selector + " " ];

        if ( !cached ) {
                // Generate a function of recursive functions that can be used to check each element
                if ( !group ) {
                        group = tokenize( selector );
                }
                i = group.length;
                while ( i-- ) {
                        cached = matcherFromTokens( group[i] );
                        if ( cached[ expando ] ) {
                                setMatchers.push( cached );
                        } else {
                                elementMatchers.push( cached );
                        }
                }

                // Cache the compiled function
                cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
        }
        return cached;
};

function multipleContexts( selector, contexts, results ) {
        var i = 0,
                len = contexts.length;
        for ( ; i < len; i++ ) {
                Sizzle( selector, contexts[i], results );
        }
        return results;
}

function select( selector, context, results, seed, xml ) {
        var i, tokens, token, type, find,
                match = tokenize( selector ),
                j = match.length;

        if ( !seed ) {
                // Try to minimize operations if there is only one group
                if ( match.length === 1 ) {

                        // Take a shortcut and set the context if the root selector is an ID
                        tokens = match[0] = match[0].slice( 0 );
                        if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
                                        context.nodeType === 9 && !xml &&
                                        Expr.relative[ tokens[1].type ] ) {

                                context = Expr.find["ID"]( token.matches[0].replace( rbackslash, "" ), context, xml )[0];
                                if ( !context ) {
                                        return results;
                                }

                                selector = selector.slice( tokens.shift().length );
                        }

                        // Fetch a seed set for right-to-left matching
                        for ( i = matchExpr["POS"].test( selector ) ? -1 : tokens.length - 1; i >= 0; i-- ) {
                                token = tokens[i];

                                // Abort if we hit a combinator
                                if ( Expr.relative[ (type = token.type) ] ) {
                                        break;
                                }
                                if ( (find = Expr.find[ type ]) ) {
                                        // Search, expanding context for leading sibling combinators
                                        if ( (seed = find(
                                                token.matches[0].replace( rbackslash, "" ),
                                                rsibling.test( tokens[0].type ) && context.parentNode || context,
                                                xml
                                        )) ) {

                                                // If seed is empty or no tokens remain, we can return early
                                                tokens.splice( i, 1 );
                                                selector = seed.length && tokens.join("");
                                                if ( !selector ) {
                                                        push.apply( results, slice.call( seed, 0 ) );
                                                        return results;
                                                }

                                                break;
                                        }
                                }
                        }
                }
        }

        // Compile and execute a filtering function
        // Provide `match` to avoid retokenization if we modified the selector above
        compile( selector, match )(
                seed,
                context,
                xml,
                results,
                rsibling.test( selector )
        );
        return results;
}

if ( document.querySelectorAll ) {
        (function() {
                var disconnectedMatch,
                        oldSelect = select,
                        rescape = /'|\\/g,
                        rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

                        // qSa(:focus) reports false when true (Chrome 21), no need to also add to buggyMatches since matches checks buggyQSA
                        // A support test would require too much code (would include document ready)
                        rbuggyQSA = [ ":focus" ],

                        // matchesSelector(:active) reports false when true (IE9/Opera 11.5)
                        // A support test would require too much code (would include document ready)
                        // just skip matchesSelector for :active
                        rbuggyMatches = [ ":active" ],
                        matches = docElem.matchesSelector ||
                                docElem.mozMatchesSelector ||
                                docElem.webkitMatchesSelector ||
                                docElem.oMatchesSelector ||
                                docElem.msMatchesSelector;

                // Build QSA regex
                // Regex strategy adopted from Diego Perini
                assert(function( div ) {
                        // Select is set to empty string on purpose
                        // This is to test IE's treatment of not explictly
                        // setting a boolean content attribute,
                        // since its presence should be enough
                        // http://bugs.jquery.com/ticket/12359
                        div.innerHTML = "<select><option selected=''></option></select>";

                        // IE8 - Some boolean attributes are not treated correctly
                        if ( !div.querySelectorAll("[selected]").length ) {
                                rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
                        }

                        // Webkit/Opera - :checked should return selected option elements
                        // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                        // IE8 throws error here (do not put tests after this one)
                        if ( !div.querySelectorAll(":checked").length ) {
                                rbuggyQSA.push(":checked");
                        }
                });

                assert(function( div ) {

                        // Opera 10-12/IE9 - ^= $= *= and empty values
                        // Should not select anything
                        div.innerHTML = "<p test=''></p>";
                        if ( div.querySelectorAll("[test^='']").length ) {
                                rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
                        }

                        // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
                        // IE8 throws error here (do not put tests after this one)
                        div.innerHTML = "<input type='hidden'/>";
                        if ( !div.querySelectorAll(":enabled").length ) {
                                rbuggyQSA.push(":enabled", ":disabled");
                        }
                });

                // rbuggyQSA always contains :focus, so no need for a length check
                rbuggyQSA = /* rbuggyQSA.length && */ new RegExp( rbuggyQSA.join("|") );

                select = function( selector, context, results, seed, xml ) {
                        // Only use querySelectorAll when not filtering,
                        // when this is not xml,
                        // and when no QSA bugs apply
                        if ( !seed && !xml && !rbuggyQSA.test( selector ) ) {
                                var groups, i,
                                        old = true,
                                        nid = expando,
                                        newContext = context,
                                        newSelector = context.nodeType === 9 && selector;

                                // qSA works strangely on Element-rooted queries
                                // We can work around this by specifying an extra ID on the root
                                // and working up from there (Thanks to Andrew Dupont for the technique)
                                // IE 8 doesn't work on object elements
                                if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
                                        groups = tokenize( selector );

                                        if ( (old = context.getAttribute("id")) ) {
                                                nid = old.replace( rescape, "\\$&" );
                                        } else {
                                                context.setAttribute( "id", nid );
                                        }
                                        nid = "[id='" + nid + "'] ";

                                        i = groups.length;
                                        while ( i-- ) {
                                                groups[i] = nid + groups[i].join("");
                                        }
                                        newContext = rsibling.test( selector ) && context.parentNode || context;
                                        newSelector = groups.join(",");
                                }

                                if ( newSelector ) {
                                        try {
                                                push.apply( results, slice.call( newContext.querySelectorAll(
                                                        newSelector
                                                ), 0 ) );
                                                return results;
                                        } catch(qsaError) {
                                        } finally {
                                                if ( !old ) {
                                                        context.removeAttribute("id");
                                                }
                                        }
                                }
                        }

                        return oldSelect( selector, context, results, seed, xml );
                };

                if ( matches ) {
                        assert(function( div ) {
                                // Check to see if it's possible to do matchesSelector
                                // on a disconnected node (IE 9)
                                disconnectedMatch = matches.call( div, "div" );

                                // This should fail with an exception
                                // Gecko does not error, returns false instead
                                try {
                                        matches.call( div, "[test!='']:sizzle" );
                                        rbuggyMatches.push( "!=", pseudos );
                                } catch ( e ) {}
                        });

                        // rbuggyMatches always contains :active and :focus, so no need for a length check
                        rbuggyMatches = /* rbuggyMatches.length && */ new RegExp( rbuggyMatches.join("|") );

                        Sizzle.matchesSelector = function( elem, expr ) {
                                // Make sure that attribute selectors are quoted
                                expr = expr.replace( rattributeQuotes, "='$1']" );

                                // rbuggyMatches always contains :active, so no need for an existence check
                                if ( !isXML( elem ) && !rbuggyMatches.test( expr ) && !rbuggyQSA.test( expr ) ) {
                                        try {
                                                var ret = matches.call( elem, expr );

                                                // IE 9's matchesSelector returns false on disconnected nodes
                                                if ( ret || disconnectedMatch ||
                                                                // As well, disconnected nodes are said to be in a document
                                                                // fragment in IE 9
                                                                elem.document && elem.document.nodeType !== 11 ) {
                                                        return ret;
                                                }
                                        } catch(e) {}
                                }

                                return Sizzle( expr, null, null, [ elem ] ).length > 0;
                        };
                }
        })();
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Back-compat
function setFilters() {}
Expr.filters = setFilters.prototype = Expr.pseudos;
Expr.setFilters = new setFilters();

// Override sizzle attribute retrieval
Sizzle.attr = jQuery.attr;
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
var runtil = /Until$/,
        rparentsprev = /^(?:parents|prev(?:Until|All))/,
        isSimple = /^.[^:#\[\.,]*$/,
        rneedsContext = jQuery.expr.match.needsContext,
        // methods guaranteed to produce a unique set when starting from a unique set
        guaranteedUnique = {
                children: true,
                contents: true,
                next: true,
                prev: true
        };

jQuery.fn.extend({
        find: function( selector ) {
                var i, l, length, n, r, ret,
                        self = this;

                if ( typeof selector !== "string" ) {
                        return jQuery( selector ).filter(function() {
                                for ( i = 0, l = self.length; i < l; i++ ) {
                                        if ( jQuery.contains( self[ i ], this ) ) {
                                                return true;
                                        }
                                }
                        });
                }

                ret = this.pushStack( "", "find", selector );

                for ( i = 0, l = this.length; i < l; i++ ) {
                        length = ret.length;
                        jQuery.find( selector, this[i], ret );

                        if ( i > 0 ) {
                                // Make sure that the results are unique
                                for ( n = length; n < ret.length; n++ ) {
                                        for ( r = 0; r < length; r++ ) {
                                                if ( ret[r] === ret[n] ) {
                                                        ret.splice(n--, 1);
                                                        break;
                                                }
                                        }
                                }
                        }
                }

                return ret;
        },

        has: function( target ) {
                var i,
                        targets = jQuery( target, this ),
                        len = targets.length;

                return this.filter(function() {
                        for ( i = 0; i < len; i++ ) {
                                if ( jQuery.contains( this, targets[i] ) ) {
                                        return true;
                                }
                        }
                });
        },

        not: function( selector ) {
                return this.pushStack( winnow(this, selector, false), "not", selector);
        },

        filter: function( selector ) {
                return this.pushStack( winnow(this, selector, true), "filter", selector );
        },

        is: function( selector ) {
                return !!selector && (
                        typeof selector === "string" ?
                                // If this is a positional/relative selector, check membership in the returned set
                                // so $("p:first").is("p:last") won't return true for a doc with two "p".
                                rneedsContext.test( selector ) ?
                                        jQuery( selector, this.context ).index( this[0] ) >= 0 :
                                        jQuery.filter( selector, this ).length > 0 :
                                this.filter( selector ).length > 0 );
        },

        closest: function( selectors, context ) {
                var cur,
                        i = 0,
                        l = this.length,
                        ret = [],
                        pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
                                jQuery( selectors, context || this.context ) :
                                0;

                for ( ; i < l; i++ ) {
                        cur = this[i];

                        while ( cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11 ) {
                                if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
                                        ret.push( cur );
                                        break;
                                }
                                cur = cur.parentNode;
                        }
                }

                ret = ret.length > 1 ? jQuery.unique( ret ) : ret;

                return this.pushStack( ret, "closest", selectors );
        },

        // Determine the position of an element within
        // the matched set of elements
        index: function( elem ) {

                // No argument, return index in parent
                if ( !elem ) {
                        return ( this[0] && this[0].parentNode ) ? this.prevAll().length : -1;
                }

                // index in selector
                if ( typeof elem === "string" ) {
                        return jQuery.inArray( this[0], jQuery( elem ) );
                }

                // Locate the position of the desired element
                return jQuery.inArray(
                        // If it receives a jQuery object, the first element is used
                        elem.jquery ? elem[0] : elem, this );
        },

        add: function( selector, context ) {
                var set = typeof selector === "string" ?
                                jQuery( selector, context ) :
                                jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
                        all = jQuery.merge( this.get(), set );

                return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
                        all :
                        jQuery.unique( all ) );
        },

        addBack: function( selector ) {
                return this.add( selector == null ?
                        this.prevObject : this.prevObject.filter(selector)
                );
        }
});

jQuery.fn.andSelf = jQuery.fn.addBack;

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
function isDisconnected( node ) {
        return !node || !node.parentNode || node.parentNode.nodeType === 11;
}

function sibling( cur, dir ) {
        do {
                cur = cur[ dir ];
        } while ( cur && cur.nodeType !== 1 );

        return cur;
}

jQuery.each({
        parent: function( elem ) {
                var parent = elem.parentNode;
                return parent && parent.nodeType !== 11 ? parent : null;
        },
        parents: function( elem ) {
                return jQuery.dir( elem, "parentNode" );
        },
        parentsUntil: function( elem, i, until ) {
                return jQuery.dir( elem, "parentNode", until );
        },
        next: function( elem ) {
                return sibling( elem, "nextSibling" );
        },
        prev: function( elem ) {
                return sibling( elem, "previousSibling" );
        },
        nextAll: function( elem ) {
                return jQuery.dir( elem, "nextSibling" );
        },
        prevAll: function( elem ) {
                return jQuery.dir( elem, "previousSibling" );
        },
        nextUntil: function( elem, i, until ) {
                return jQuery.dir( elem, "nextSibling", until );
        },
        prevUntil: function( elem, i, until ) {
                return jQuery.dir( elem, "previousSibling", until );
        },
        siblings: function( elem ) {
                return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
        },
        children: function( elem ) {
                return jQuery.sibling( elem.firstChild );
        },
        contents: function( elem ) {
                return jQuery.nodeName( elem, "iframe" ) ?
                        elem.contentDocument || elem.contentWindow.document :
                        jQuery.merge( [], elem.childNodes );
        }
}, function( name, fn ) {
        jQuery.fn[ name ] = function( until, selector ) {
                var ret = jQuery.map( this, fn, until );

                if ( !runtil.test( name ) ) {
                        selector = until;
                }

                if ( selector && typeof selector === "string" ) {
                        ret = jQuery.filter( selector, ret );
                }

                ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

                if ( this.length > 1 && rparentsprev.test( name ) ) {
                        ret = ret.reverse();
                }

                return this.pushStack( ret, name, core_slice.call( arguments ).join(",") );
        };
});

jQuery.extend({
        filter: function( expr, elems, not ) {
                if ( not ) {
                        expr = ":not(" + expr + ")";
                }

                return elems.length === 1 ?
                        jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
                        jQuery.find.matches(expr, elems);
        },

        dir: function( elem, dir, until ) {
                var matched = [],
                        cur = elem[ dir ];

                while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
                        if ( cur.nodeType === 1 ) {
                                matched.push( cur );
                        }
                        cur = cur[dir];
                }
                return matched;
        },

        sibling: function( n, elem ) {
                var r = [];

                for ( ; n; n = n.nextSibling ) {
                        if ( n.nodeType === 1 && n !== elem ) {
                                r.push( n );
                        }
                }

                return r;
        }
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, keep ) {

        // Can't pass null or undefined to indexOf in Firefox 4
        // Set to 0 to skip string check
        qualifier = qualifier || 0;

        if ( jQuery.isFunction( qualifier ) ) {
                return jQuery.grep(elements, function( elem, i ) {
                        var retVal = !!qualifier.call( elem, i, elem );
                        return retVal === keep;
                });

        } else if ( qualifier.nodeType ) {
                return jQuery.grep(elements, function( elem, i ) {
                        return ( elem === qualifier ) === keep;
                });

        } else if ( typeof qualifier === "string" ) {
                var filtered = jQuery.grep(elements, function( elem ) {
                        return elem.nodeType === 1;
                });

                if ( isSimple.test( qualifier ) ) {
                        return jQuery.filter(qualifier, filtered, !keep);
                } else {
                        qualifier = jQuery.filter( qualifier, filtered );
                }
        }

        return jQuery.grep(elements, function( elem, i ) {
                return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
        });
}
function createSafeFragment( document ) {
        var list = nodeNames.split( "|" ),
        safeFrag = document.createDocumentFragment();

        if ( safeFrag.createElement ) {
                while ( list.length ) {
                        safeFrag.createElement(
                                list.pop()
                        );
                }
        }
        return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
                "header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
        rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
        rleadingWhitespace = /^\s+/,
        rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
        rtagName = /<([\w:]+)/,
        rtbody = /<tbody/i,
        rhtml = /<|&#?\w+;/,
        rnoInnerhtml = /<(?:script|style|link)/i,
        rnocache = /<(?:script|object|embed|option|style)/i,
        rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
        rcheckableType = /^(?:checkbox|radio)$/,
        // checked="checked" or checked
        rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
        rscriptType = /\/(java|ecma)script/i,
        rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,
        wrapMap = {
                option: [ 1, "<select multiple='multiple'>", "</select>" ],
                legend: [ 1, "<fieldset>", "</fieldset>" ],
                thead: [ 1, "<table>", "</table>" ],
                tr: [ 2, "<table><tbody>", "</tbody></table>" ],
                td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
                col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
                area: [ 1, "<map>", "</map>" ],
                _default: [ 0, "", "" ]
        },
        safeFragment = createSafeFragment( document ),
        fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
// unless wrapped in a div with non-breaking characters in front of it.
if ( !jQuery.support.htmlSerialize ) {
        wrapMap._default = [ 1, "X<div>", "</div>" ];
}

jQuery.fn.extend({
        text: function( value ) {
                return jQuery.access( this, function( value ) {
                        return value === undefined ?
                                jQuery.text( this ) :
                                this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
                }, null, value, arguments.length );
        },

        wrapAll: function( html ) {
                if ( jQuery.isFunction( html ) ) {
                        return this.each(function(i) {
                                jQuery(this).wrapAll( html.call(this, i) );
                        });
                }

                if ( this[0] ) {
                        // The elements to wrap the target around
                        var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

                        if ( this[0].parentNode ) {
                                wrap.insertBefore( this[0] );
                        }

                        wrap.map(function() {
                                var elem = this;

                                while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
                                        elem = elem.firstChild;
                                }

                                return elem;
                        }).append( this );
                }

                return this;
        },

        wrapInner: function( html ) {
                if ( jQuery.isFunction( html ) ) {
                        return this.each(function(i) {
                                jQuery(this).wrapInner( html.call(this, i) );
                        });
                }

                return this.each(function() {
                        var self = jQuery( this ),
                                contents = self.contents();

                        if ( contents.length ) {
                                contents.wrapAll( html );

                        } else {
                                self.append( html );
                        }
                });
        },

        wrap: function( html ) {
                var isFunction = jQuery.isFunction( html );

                return this.each(function(i) {
                        jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
                });
        },

        unwrap: function() {
                return this.parent().each(function() {
                        if ( !jQuery.nodeName( this, "body" ) ) {
                                jQuery( this ).replaceWith( this.childNodes );
                        }
                }).end();
        },

        append: function() {
                return this.domManip(arguments, true, function( elem ) {
                        if ( this.nodeType === 1 || this.nodeType === 11 ) {
                                this.appendChild( elem );
                        }
                });
        },

        prepend: function() {
                return this.domManip(arguments, true, function( elem ) {
                        if ( this.nodeType === 1 || this.nodeType === 11 ) {
                                this.insertBefore( elem, this.firstChild );
                        }
                });
        },

        before: function() {
                if ( !isDisconnected( this[0] ) ) {
                        return this.domManip(arguments, false, function( elem ) {
                                this.parentNode.insertBefore( elem, this );
                        });
                }

                if ( arguments.length ) {
                        var set = jQuery.clean( arguments );
                        return this.pushStack( jQuery.merge( set, this ), "before", this.selector );
                }
        },

        after: function() {
                if ( !isDisconnected( this[0] ) ) {
                        return this.domManip(arguments, false, function( elem ) {
                                this.parentNode.insertBefore( elem, this.nextSibling );
                        });
                }

                if ( arguments.length ) {
                        var set = jQuery.clean( arguments );
                        return this.pushStack( jQuery.merge( this, set ), "after", this.selector );
                }
        },

        // keepData is for internal use only--do not document
        remove: function( selector, keepData ) {
                var elem,
                        i = 0;

                for ( ; (elem = this[i]) != null; i++ ) {
                        if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
                                if ( !keepData && elem.nodeType === 1 ) {
                                        jQuery.cleanData( elem.getElementsByTagName("*") );
                                        jQuery.cleanData( [ elem ] );
                                }

                                if ( elem.parentNode ) {
                                        elem.parentNode.removeChild( elem );
                                }
                        }
                }

                return this;
        },

        empty: function() {
                var elem,
                        i = 0;

                for ( ; (elem = this[i]) != null; i++ ) {
                        // Remove element nodes and prevent memory leaks
                        if ( elem.nodeType === 1 ) {
                                jQuery.cleanData( elem.getElementsByTagName("*") );
                        }

                        // Remove any remaining nodes
                        while ( elem.firstChild ) {
                                elem.removeChild( elem.firstChild );
                        }
                }

                return this;
        },

        clone: function( dataAndEvents, deepDataAndEvents ) {
                dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
                deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

                return this.map( function () {
                        return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
                });
        },

        html: function( value ) {
                return jQuery.access( this, function( value ) {
                        var elem = this[0] || {},
                                i = 0,
                                l = this.length;

                        if ( value === undefined ) {
                                return elem.nodeType === 1 ?
                                        elem.innerHTML.replace( rinlinejQuery, "" ) :
                                        undefined;
                        }

                        // See if we can take a shortcut and just use innerHTML
                        if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
                                ( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
                                ( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
                                !wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

                                value = value.replace( rxhtmlTag, "<$1></$2>" );

                                try {
                                        for (; i < l; i++ ) {
                                                // Remove element nodes and prevent memory leaks
                                                elem = this[i] || {};
                                                if ( elem.nodeType === 1 ) {
                                                        jQuery.cleanData( elem.getElementsByTagName( "*" ) );
                                                        elem.innerHTML = value;
                                                }
                                        }

                                        elem = 0;

                                // If using innerHTML throws an exception, use the fallback method
                                } catch(e) {}
                        }

                        if ( elem ) {
                                this.empty().append( value );
                        }
                }, null, value, arguments.length );
        },

        replaceWith: function( value ) {
                if ( !isDisconnected( this[0] ) ) {
                        // Make sure that the elements are removed from the DOM before they are inserted
                        // this can help fix replacing a parent with child elements
                        if ( jQuery.isFunction( value ) ) {
                                return this.each(function(i) {
                                        var self = jQuery(this), old = self.html();
                                        self.replaceWith( value.call( this, i, old ) );
                                });
                        }

                        if ( typeof value !== "string" ) {
                                value = jQuery( value ).detach();
                        }

                        return this.each(function() {
                                var next = this.nextSibling,
                                        parent = this.parentNode;

                                jQuery( this ).remove();

                                if ( next ) {
                                        jQuery(next).before( value );
                                } else {
                                        jQuery(parent).append( value );
                                }
                        });
                }

                return this.length ?
                        this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value ) :
                        this;
        },

        detach: function( selector ) {
                return this.remove( selector, true );
        },

        domManip: function( args, table, callback ) {

                // Flatten any nested arrays
                args = [].concat.apply( [], args );

                var results, first, fragment, iNoClone,
                        i = 0,
                        value = args[0],
                        scripts = [],
                        l = this.length;

                // We can't cloneNode fragments that contain checked, in WebKit
                if ( !jQuery.support.checkClone && l > 1 && typeof value === "string" && rchecked.test( value ) ) {
                        return this.each(function() {
                                jQuery(this).domManip( args, table, callback );
                        });
                }

                if ( jQuery.isFunction(value) ) {
                        return this.each(function(i) {
                                var self = jQuery(this);
                                args[0] = value.call( this, i, table ? self.html() : undefined );
                                self.domManip( args, table, callback );
                        });
                }

                if ( this[0] ) {
                        results = jQuery.buildFragment( args, this, scripts );
                        fragment = results.fragment;
                        first = fragment.firstChild;

                        if ( fragment.childNodes.length === 1 ) {
                                fragment = first;
                        }

                        if ( first ) {
                                table = table && jQuery.nodeName( first, "tr" );

                                // Use the original fragment for the last item instead of the first because it can end up
                                // being emptied incorrectly in certain situations (#8070).
                                // Fragments from the fragment cache must always be cloned and never used in place.
                                for ( iNoClone = results.cacheable || l - 1; i < l; i++ ) {
                                        callback.call(
                                                table && jQuery.nodeName( this[i], "table" ) ?
                                                        findOrAppend( this[i], "tbody" ) :
                                                        this[i],
                                                i === iNoClone ?
                                                        fragment :
                                                        jQuery.clone( fragment, true, true )
                                        );
                                }
                        }

                        // Fix #11809: Avoid leaking memory
                        fragment = first = null;

                        if ( scripts.length ) {
                                jQuery.each( scripts, function( i, elem ) {
                                        if ( elem.src ) {
                                                if ( jQuery.ajax ) {
                                                        jQuery.ajax({
                                                                url: elem.src,
                                                                type: "GET",
                                                                dataType: "script",
                                                                async: false,
                                                                global: false,
                                                                "throws": true
                                                        });
                                                } else {
                                                        jQuery.error("no ajax");
                                                }
                                        } else {
                                                jQuery.globalEval( ( elem.text || elem.textContent || elem.innerHTML || "" ).replace( rcleanScript, "" ) );
                                        }

                                        if ( elem.parentNode ) {
                                                elem.parentNode.removeChild( elem );
                                        }
                                });
                        }
                }

                return this;
        }
});

function findOrAppend( elem, tag ) {
        return elem.getElementsByTagName( tag )[0] || elem.appendChild( elem.ownerDocument.createElement( tag ) );
}

function cloneCopyEvent( src, dest ) {

        if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
                return;
        }

        var type, i, l,
                oldData = jQuery._data( src ),
                curData = jQuery._data( dest, oldData ),
                events = oldData.events;

        if ( events ) {
                delete curData.handle;
                curData.events = {};

                for ( type in events ) {
                        for ( i = 0, l = events[ type ].length; i < l; i++ ) {
                                jQuery.event.add( dest, type, events[ type ][ i ] );
                        }
                }
        }

        // make the cloned public data object a copy from the original
        if ( curData.data ) {
                curData.data = jQuery.extend( {}, curData.data );
        }
}

function cloneFixAttributes( src, dest ) {
        var nodeName;

        // We do not need to do anything for non-Elements
        if ( dest.nodeType !== 1 ) {
                return;
        }

        // clearAttributes removes the attributes, which we don't want,
        // but also removes the attachEvent events, which we *do* want
        if ( dest.clearAttributes ) {
                dest.clearAttributes();
        }

        // mergeAttributes, in contrast, only merges back on the
        // original attributes, not the events
        if ( dest.mergeAttributes ) {
                dest.mergeAttributes( src );
        }

        nodeName = dest.nodeName.toLowerCase();

        if ( nodeName === "object" ) {
                // IE6-10 improperly clones children of object elements using classid.
                // IE10 throws NoModificationAllowedError if parent is null, #12132.
                if ( dest.parentNode ) {
                        dest.outerHTML = src.outerHTML;
                }

                // This path appears unavoidable for IE9. When cloning an object
                // element in IE9, the outerHTML strategy above is not sufficient.
                // If the src has innerHTML and the destination does not,
                // copy the src.innerHTML into the dest.innerHTML. #10324
                if ( jQuery.support.html5Clone && (src.innerHTML && !jQuery.trim(dest.innerHTML)) ) {
                        dest.innerHTML = src.innerHTML;
                }

        } else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
                // IE6-8 fails to persist the checked state of a cloned checkbox
                // or radio button. Worse, IE6-7 fail to give the cloned element
                // a checked appearance if the defaultChecked value isn't also set

                dest.defaultChecked = dest.checked = src.checked;

                // IE6-7 get confused and end up setting the value of a cloned
                // checkbox/radio button to an empty string instead of "on"
                if ( dest.value !== src.value ) {
                        dest.value = src.value;
                }

        // IE6-8 fails to return the selected option to the default selected
        // state when cloning options
        } else if ( nodeName === "option" ) {
                dest.selected = src.defaultSelected;

        // IE6-8 fails to set the defaultValue to the correct value when
        // cloning other types of input fields
        } else if ( nodeName === "input" || nodeName === "textarea" ) {
                dest.defaultValue = src.defaultValue;

        // IE blanks contents when cloning scripts
        } else if ( nodeName === "script" && dest.text !== src.text ) {
                dest.text = src.text;
        }

        // Event data gets referenced instead of copied if the expando
        // gets copied too
        dest.removeAttribute( jQuery.expando );
}

jQuery.buildFragment = function( args, context, scripts ) {
        var fragment, cacheable, cachehit,
                first = args[ 0 ];

        // Set context from what may come in as undefined or a jQuery collection or a node
        // Updated to fix #12266 where accessing context[0] could throw an exception in IE9/10 &
        // also doubles as fix for #8950 where plain objects caused createDocumentFragment exception
        context = context || document;
        context = !context.nodeType && context[0] || context;
        context = context.ownerDocument || context;

        // Only cache "small" (1/2 KB) HTML strings that are associated with the main document
        // Cloning options loses the selected state, so don't cache them
        // IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
        // Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
        // Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
        if ( args.length === 1 && typeof first === "string" && first.length < 512 && context === document &&
                first.charAt(0) === "<" && !rnocache.test( first ) &&
                (jQuery.support.checkClone || !rchecked.test( first )) &&
                (jQuery.support.html5Clone || !rnoshimcache.test( first )) ) {

                // Mark cacheable and look for a hit
                cacheable = true;
                fragment = jQuery.fragments[ first ];
                cachehit = fragment !== undefined;
        }

        if ( !fragment ) {
                fragment = context.createDocumentFragment();
                jQuery.clean( args, context, fragment, scripts );

                // Update the cache, but only store false
                // unless this is a second parsing of the same content
                if ( cacheable ) {
                        jQuery.fragments[ first ] = cachehit && fragment;
                }
        }

        return { fragment: fragment, cacheable: cacheable };
};

jQuery.fragments = {};

jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
}, function( name, original ) {
        jQuery.fn[ name ] = function( selector ) {
                var elems,
                        i = 0,
                        ret = [],
                        insert = jQuery( selector ),
                        l = insert.length,
                        parent = this.length === 1 && this[0].parentNode;

                if ( (parent == null || parent && parent.nodeType === 11 && parent.childNodes.length === 1) && l === 1 ) {
                        insert[ original ]( this[0] );
                        return this;
                } else {
                        for ( ; i < l; i++ ) {
                                elems = ( i > 0 ? this.clone(true) : this ).get();
                                jQuery( insert[i] )[ original ]( elems );
                                ret = ret.concat( elems );
                        }

                        return this.pushStack( ret, name, insert.selector );
                }
        };
});

function getAll( elem ) {
        if ( typeof elem.getElementsByTagName !== "undefined" ) {
                return elem.getElementsByTagName( "*" );

        } else if ( typeof elem.querySelectorAll !== "undefined" ) {
                return elem.querySelectorAll( "*" );

        } else {
                return [];
        }
}

// Used in clean, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
        if ( rcheckableType.test( elem.type ) ) {
                elem.defaultChecked = elem.checked;
        }
}

jQuery.extend({
        clone: function( elem, dataAndEvents, deepDataAndEvents ) {
                var srcElements,
                        destElements,
                        i,
                        clone;

                if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
                        clone = elem.cloneNode( true );

                // IE<=8 does not properly clone detached, unknown element nodes
                } else {
                        fragmentDiv.innerHTML = elem.outerHTML;
                        fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
                }

                if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
                                (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {
                        // IE copies events bound via attachEvent when using cloneNode.
                        // Calling detachEvent on the clone will also remove the events
                        // from the original. In order to get around this, we use some
                        // proprietary methods to clear the events. Thanks to MooTools
                        // guys for this hotness.

                        cloneFixAttributes( elem, clone );

                        // Using Sizzle here is crazy slow, so we use getElementsByTagName instead
                        srcElements = getAll( elem );
                        destElements = getAll( clone );

                        // Weird iteration because IE will replace the length property
                        // with an element if you are cloning the body and one of the
                        // elements on the page has a name or id of "length"
                        for ( i = 0; srcElements[i]; ++i ) {
                                // Ensure that the destination node is not null; Fixes #9587
                                if ( destElements[i] ) {
                                        cloneFixAttributes( srcElements[i], destElements[i] );
                                }
                        }
                }

                // Copy the events from the original to the clone
                if ( dataAndEvents ) {
                        cloneCopyEvent( elem, clone );

                        if ( deepDataAndEvents ) {
                                srcElements = getAll( elem );
                                destElements = getAll( clone );

                                for ( i = 0; srcElements[i]; ++i ) {
                                        cloneCopyEvent( srcElements[i], destElements[i] );
                                }
                        }
                }

                srcElements = destElements = null;

                // Return the cloned set
                return clone;
        },

        clean: function( elems, context, fragment, scripts ) {
                var i, j, elem, tag, wrap, depth, div, hasBody, tbody, len, handleScript, jsTags,
                        safe = context === document && safeFragment,
                        ret = [];

                // Ensure that context is a document
                if ( !context || typeof context.createDocumentFragment === "undefined" ) {
                        context = document;
                }

                // Use the already-created safe fragment if context permits
                for ( i = 0; (elem = elems[i]) != null; i++ ) {
                        if ( typeof elem === "number" ) {
                                elem += "";
                        }

                        if ( !elem ) {
                                continue;
                        }

                        // Convert html string into DOM nodes
                        if ( typeof elem === "string" ) {
                                if ( !rhtml.test( elem ) ) {
                                        elem = context.createTextNode( elem );
                                } else {
                                        // Ensure a safe container in which to render the html
                                        safe = safe || createSafeFragment( context );
                                        div = context.createElement("div");
                                        safe.appendChild( div );

                                        // Fix "XHTML"-style tags in all browsers
                                        elem = elem.replace(rxhtmlTag, "<$1></$2>");

                                        // Go to html and back, then peel off extra wrappers
                                        tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
                                        wrap = wrapMap[ tag ] || wrapMap._default;
                                        depth = wrap[0];
                                        div.innerHTML = wrap[1] + elem + wrap[2];

                                        // Move to the right depth
                                        while ( depth-- ) {
                                                div = div.lastChild;
                                        }

                                        // Remove IE's autoinserted <tbody> from table fragments
                                        if ( !jQuery.support.tbody ) {

                                                // String was a <table>, *may* have spurious <tbody>
                                                hasBody = rtbody.test(elem);
                                                        tbody = tag === "table" && !hasBody ?
                                                                div.firstChild && div.firstChild.childNodes :

                                                                // String was a bare <thead> or <tfoot>
                                                                wrap[1] === "<table>" && !hasBody ?
                                                                        div.childNodes :
                                                                        [];

                                                for ( j = tbody.length - 1; j >= 0 ; --j ) {
                                                        if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
                                                                tbody[ j ].parentNode.removeChild( tbody[ j ] );
                                                        }
                                                }
                                        }

                                        // IE completely kills leading whitespace when innerHTML is used
                                        if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
                                                div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
                                        }

                                        elem = div.childNodes;

                                        // Take out of fragment container (we need a fresh div each time)
                                        div.parentNode.removeChild( div );
                                }
                        }

                        if ( elem.nodeType ) {
                                ret.push( elem );
                        } else {
                                jQuery.merge( ret, elem );
                        }
                }

                // Fix #11356: Clear elements from safeFragment
                if ( div ) {
                        elem = div = safe = null;
                }

                // Reset defaultChecked for any radios and checkboxes
                // about to be appended to the DOM in IE 6/7 (#8060)
                if ( !jQuery.support.appendChecked ) {
                        for ( i = 0; (elem = ret[i]) != null; i++ ) {
                                if ( jQuery.nodeName( elem, "input" ) ) {
                                        fixDefaultChecked( elem );
                                } else if ( typeof elem.getElementsByTagName !== "undefined" ) {
                                        jQuery.grep( elem.getElementsByTagName("input"), fixDefaultChecked );
                                }
                        }
                }

                // Append elements to a provided document fragment
                if ( fragment ) {
                        // Special handling of each script element
                        handleScript = function( elem ) {
                                // Check if we consider it executable
                                if ( !elem.type || rscriptType.test( elem.type ) ) {
                                        // Detach the script and store it in the scripts array (if provided) or the fragment
                                        // Return truthy to indicate that it has been handled
                                        return scripts ?
                                                scripts.push( elem.parentNode ? elem.parentNode.removeChild( elem ) : elem ) :
                                                fragment.appendChild( elem );
                                }
                        };

                        for ( i = 0; (elem = ret[i]) != null; i++ ) {
                                // Check if we're done after handling an executable script
                                if ( !( jQuery.nodeName( elem, "script" ) && handleScript( elem ) ) ) {
                                        // Append to fragment and handle embedded scripts
                                        fragment.appendChild( elem );
                                        if ( typeof elem.getElementsByTagName !== "undefined" ) {
                                                // handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
                                                jsTags = jQuery.grep( jQuery.merge( [], elem.getElementsByTagName("script") ), handleScript );

                                                // Splice the scripts into ret after their former ancestor and advance our index beyond them
                                                ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
                                                i += jsTags.length;
                                        }
                                }
                        }
                }

                return ret;
        },

        cleanData: function( elems, /* internal */ acceptData ) {
                var data, id, elem, type,
                        i = 0,
                        internalKey = jQuery.expando,
                        cache = jQuery.cache,
                        deleteExpando = jQuery.support.deleteExpando,
                        special = jQuery.event.special;

                for ( ; (elem = elems[i]) != null; i++ ) {

                        if ( acceptData || jQuery.acceptData( elem ) ) {

                                id = elem[ internalKey ];
                                data = id && cache[ id ];

                                if ( data ) {
                                        if ( data.events ) {
                                                for ( type in data.events ) {
                                                        if ( special[ type ] ) {
                                                                jQuery.event.remove( elem, type );

                                                        // This is a shortcut to avoid jQuery.event.remove's overhead
                                                        } else {
                                                                jQuery.removeEvent( elem, type, data.handle );
                                                        }
                                                }
                                        }

                                        // Remove cache only if it was not already removed by jQuery.event.remove
                                        if ( cache[ id ] ) {

                                                delete cache[ id ];

                                                // IE does not allow us to delete expando properties from nodes,
                                                // nor does it have a removeAttribute function on Document nodes;
                                                // we must handle all of these cases
                                                if ( deleteExpando ) {
                                                        delete elem[ internalKey ];

                                                } else if ( elem.removeAttribute ) {
                                                        elem.removeAttribute( internalKey );

                                                } else {
                                                        elem[ internalKey ] = null;
                                                }

                                                jQuery.deletedIds.push( id );
                                        }
                                }
                        }
                }
        }
});
// Limit scope pollution from any deprecated API
(function() {

var matched, browser;

// Use of jQuery.browser is frowned upon.
// More details: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch maintained for back-compat
jQuery.uaMatch = function( ua ) {
        ua = ua.toLowerCase();

        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
                /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
                /(msie) ([\w.]+)/.exec( ua ) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
                [];

        return {
                browser: match[ 1 ] || "",
                version: match[ 2 ] || "0"
        };
};

matched = jQuery.uaMatch( navigator.userAgent );
browser = {};

if ( matched.browser ) {
        browser[ matched.browser ] = true;
        browser.version = matched.version;
}

// Chrome is Webkit, but Webkit is also Safari.
if ( browser.chrome ) {
        browser.webkit = true;
} else if ( browser.webkit ) {
        browser.safari = true;
}

jQuery.browser = browser;

jQuery.sub = function() {
        function jQuerySub( selector, context ) {
                return new jQuerySub.fn.init( selector, context );
        }
        jQuery.extend( true, jQuerySub, this );
        jQuerySub.superclass = this;
        jQuerySub.fn = jQuerySub.prototype = this();
        jQuerySub.fn.constructor = jQuerySub;
        jQuerySub.sub = this.sub;
        jQuerySub.fn.init = function init( selector, context ) {
                if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
                        context = jQuerySub( context );
                }

                return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
        };
        jQuerySub.fn.init.prototype = jQuerySub.fn;
        var rootjQuerySub = jQuerySub(document);
        return jQuerySub;
};

})();
var curCSS, iframe, iframeDoc,
        ralpha = /alpha\([^)]*\)/i,
        ropacity = /opacity=([^)]*)/,
        rposition = /^(top|right|bottom|left)$/,
        // swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
        // see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
        rdisplayswap = /^(none|table(?!-c[ea]).+)/,
        rmargin = /^margin/,
        rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
        rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
        rrelNum = new RegExp( "^([-+])=(" + core_pnum + ")", "i" ),
        elemdisplay = { BODY: "block" },

        cssShow = { position: "absolute", visibility: "hidden", display: "block" },
        cssNormalTransform = {
                letterSpacing: 0,
                fontWeight: 400
        },

        cssExpand = [ "Top", "Right", "Bottom", "Left" ],
        cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],

        eventsToggle = jQuery.fn.toggle;

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

        // shortcut for names that are not vendor prefixed
        if ( name in style ) {
                return name;
        }

        // check for vendor prefixed names
        var capName = name.charAt(0).toUpperCase() + name.slice(1),
                origName = name,
                i = cssPrefixes.length;

        while ( i-- ) {
                name = cssPrefixes[ i ] + capName;
                if ( name in style ) {
                        return name;
                }
        }

        return origName;
}

function isHidden( elem, el ) {
        elem = el || elem;
        return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

function showHide( elements, show ) {
        var elem, display,
                values = [],
                index = 0,
                length = elements.length;

        for ( ; index < length; index++ ) {
                elem = elements[ index ];
                if ( !elem.style ) {
                        continue;
                }
                values[ index ] = jQuery._data( elem, "olddisplay" );
                if ( show ) {
                        // Reset the inline display of this element to learn if it is
                        // being hidden by cascaded rules or not
                        if ( !values[ index ] && elem.style.display === "none" ) {
                                elem.style.display = "";
                        }

                        // Set elements which have been overridden with display: none
                        // in a stylesheet to whatever the default browser style is
                        // for such an element
                        if ( elem.style.display === "" && isHidden( elem ) ) {
                                values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
                        }
                } else {
                        display = curCSS( elem, "display" );

                        if ( !values[ index ] && display !== "none" ) {
                                jQuery._data( elem, "olddisplay", display );
                        }
                }
        }

        // Set the display of most of the elements in a second loop
        // to avoid the constant reflow
        for ( index = 0; index < length; index++ ) {
                elem = elements[ index ];
                if ( !elem.style ) {
                        continue;
                }
                if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
                        elem.style.display = show ? values[ index ] || "" : "none";
                }
        }

        return elements;
}

jQuery.fn.extend({
        css: function( name, value ) {
                return jQuery.access( this, function( elem, name, value ) {
                        return value !== undefined ?
                                jQuery.style( elem, name, value ) :
                                jQuery.css( elem, name );
                }, name, value, arguments.length > 1 );
        },
        show: function() {
                return showHide( this, true );
        },
        hide: function() {
                return showHide( this );
        },
        toggle: function( state, fn2 ) {
                var bool = typeof state === "boolean";

                if ( jQuery.isFunction( state ) && jQuery.isFunction( fn2 ) ) {
                        return eventsToggle.apply( this, arguments );
                }

                return this.each(function() {
                        if ( bool ? state : isHidden( this ) ) {
                                jQuery( this ).show();
                        } else {
                                jQuery( this ).hide();
                        }
                });
        }
});

jQuery.extend({
        // Add in style property hooks for overriding the default
        // behavior of getting and setting a style property
        cssHooks: {
                opacity: {
                        get: function( elem, computed ) {
                                if ( computed ) {
                                        // We should always get a number back from opacity
                                        var ret = curCSS( elem, "opacity" );
                                        return ret === "" ? "1" : ret;

                                }
                        }
                }
        },

        // Exclude the following css properties to add px
        cssNumber: {
                "fillOpacity": true,
                "fontWeight": true,
                "lineHeight": true,
                "opacity": true,
                "orphans": true,
                "widows": true,
                "zIndex": true,
                "zoom": true
        },

        // Add in properties whose names you wish to fix before
        // setting or getting the value
        cssProps: {
                // normalize float css property
                "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
        },

        // Get and set the style property on a DOM Node
        style: function( elem, name, value, extra ) {
                // Don't set styles on text and comment nodes
                if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
                        return;
                }

                // Make sure that we're working with the right name
                var ret, type, hooks,
                        origName = jQuery.camelCase( name ),
                        style = elem.style;

                name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

                // gets hook for the prefixed version
                // followed by the unprefixed version
                hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

                // Check if we're setting a value
                if ( value !== undefined ) {
                        type = typeof value;

                        // convert relative number strings (+= or -=) to relative numbers. #7345
                        if ( type === "string" && (ret = rrelNum.exec( value )) ) {
                                value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
                                // Fixes bug #9237
                                type = "number";
                        }

                        // Make sure that NaN and null values aren't set. See: #7116
                        if ( value == null || type === "number" && isNaN( value ) ) {
                                return;
                        }

                        // If a number was passed in, add 'px' to the (except for certain CSS properties)
                        if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
                                value += "px";
                        }

                        // If a hook was provided, use that value, otherwise just set the specified value
                        if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
                                // Wrapped to prevent IE from throwing errors when 'invalid' values are provided
                                // Fixes bug #5509
                                try {
                                        style[ name ] = value;
                                } catch(e) {}
                        }

                } else {
                        // If a hook was provided get the non-computed value from there
                        if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
                                return ret;
                        }

                        // Otherwise just get the value from the style object
                        return style[ name ];
                }
        },

        css: function( elem, name, numeric, extra ) {
                var val, num, hooks,
                        origName = jQuery.camelCase( name );

                // Make sure that we're working with the right name
                name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

                // gets hook for the prefixed version
                // followed by the unprefixed version
                hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

                // If a hook was provided get the computed value from there
                if ( hooks && "get" in hooks ) {
                        val = hooks.get( elem, true, extra );
                }

                // Otherwise, if a way to get the computed value exists, use that
                if ( val === undefined ) {
                        val = curCSS( elem, name );
                }

                //convert "normal" to computed value
                if ( val === "normal" && name in cssNormalTransform ) {
                        val = cssNormalTransform[ name ];
                }

                // Return, converting to number if forced or a qualifier was provided and val looks numeric
                if ( numeric || extra !== undefined ) {
                        num = parseFloat( val );
                        return numeric || jQuery.isNumeric( num ) ? num || 0 : val;
                }
                return val;
        },

        // A method for quickly swapping in/out CSS properties to get correct calculations
        swap: function( elem, options, callback ) {
                var ret, name,
                        old = {};

                // Remember the old values, and insert the new ones
                for ( name in options ) {
                        old[ name ] = elem.style[ name ];
                        elem.style[ name ] = options[ name ];
                }

                ret = callback.call( elem );

                // Revert the old values
                for ( name in options ) {
                        elem.style[ name ] = old[ name ];
                }

                return ret;
        }
});

// NOTE: To any future maintainer, we've window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
        curCSS = function( elem, name ) {
                var ret, width, minWidth, maxWidth,
                        computed = window.getComputedStyle( elem, null ),
                        style = elem.style;

                if ( computed ) {

                        // getPropertyValue is only needed for .css('filter') in IE9, see #12537
                        ret = computed.getPropertyValue( name ) || computed[ name ];

                        if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
                                ret = jQuery.style( elem, name );
                        }

                        // A tribute to the "awesome hack by Dean Edwards"
                        // Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
                        // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
                        // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
                        if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {
                                width = style.width;
                                minWidth = style.minWidth;
                                maxWidth = style.maxWidth;

                                style.minWidth = style.maxWidth = style.width = ret;
                                ret = computed.width;

                                style.width = width;
                                style.minWidth = minWidth;
                                style.maxWidth = maxWidth;
                        }
                }

                return ret;
        };
} else if ( document.documentElement.currentStyle ) {
        curCSS = function( elem, name ) {
                var left, rsLeft,
                        ret = elem.currentStyle && elem.currentStyle[ name ],
                        style = elem.style;

                // Avoid setting ret to empty string here
                // so we don't default to auto
                if ( ret == null && style && style[ name ] ) {
                        ret = style[ name ];
                }

                // From the awesome hack by Dean Edwards
                // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

                // If we're not dealing with a regular pixel number
                // but a number that has a weird ending, we need to convert it to pixels
                // but not position css attributes, as those are proportional to the parent element instead
                // and we can't measure the parent instead because it might trigger a "stacking dolls" problem
                if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

                        // Remember the original values
                        left = style.left;
                        rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

                        // Put in the new values to get a computed value out
                        if ( rsLeft ) {
                                elem.runtimeStyle.left = elem.currentStyle.left;
                        }
                        style.left = name === "fontSize" ? "1em" : ret;
                        ret = style.pixelLeft + "px";

                        // Revert the changed values
                        style.left = left;
                        if ( rsLeft ) {
                                elem.runtimeStyle.left = rsLeft;
                        }
                }

                return ret === "" ? "auto" : ret;
        };
}

function setPositiveNumber( elem, value, subtract ) {
        var matches = rnumsplit.exec( value );
        return matches ?
                        Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
                        value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox ) {
        var i = extra === ( isBorderBox ? "border" : "content" ) ?
                // If we already have the right measurement, avoid augmentation
                4 :
                // Otherwise initialize for horizontal or vertical properties
                name === "width" ? 1 : 0,

                val = 0;

        for ( ; i < 4; i += 2 ) {
                // both box models exclude margin, so add it if we want it
                if ( extra === "margin" ) {
                        // we use jQuery.css instead of curCSS here
                        // because of the reliableMarginRight CSS hook!
                        val += jQuery.css( elem, extra + cssExpand[ i ], true );
                }

                // From this point on we use curCSS for maximum performance (relevant in animations)
                if ( isBorderBox ) {
                        // border-box includes padding, so remove it if we want content
                        if ( extra === "content" ) {
                                val -= parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;
                        }

                        // at this point, extra isn't border nor margin, so remove border
                        if ( extra !== "margin" ) {
                                val -= parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
                        }
                } else {
                        // at this point, extra isn't content, so add padding
                        val += parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;

                        // at this point, extra isn't content nor padding, so add border
                        if ( extra !== "padding" ) {
                                val += parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
                        }
                }
        }

        return val;
}

function getWidthOrHeight( elem, name, extra ) {

        // Start with offset property, which is equivalent to the border-box value
        var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
                valueIsBorderBox = true,
                isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box";

        // some non-html elements return undefined for offsetWidth, so check for null/undefined
        // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
        // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
        if ( val <= 0 || val == null ) {
                // Fall back to computed then uncomputed css if necessary
                val = curCSS( elem, name );
                if ( val < 0 || val == null ) {
                        val = elem.style[ name ];
                }

                // Computed unit is not pixels. Stop here and return.
                if ( rnumnonpx.test(val) ) {
                        return val;
                }

                // we need the check for style in case a browser which returns unreliable values
                // for getComputedStyle silently falls back to the reliable elem.style
                valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

                // Normalize "", auto, and prepare for extra
                val = parseFloat( val ) || 0;
        }

        // use the active box-sizing model to add/subtract irrelevant styles
        return ( val +
                augmentWidthOrHeight(
                        elem,
                        name,
                        extra || ( isBorderBox ? "border" : "content" ),
                        valueIsBorderBox
                )
        ) + "px";
}


// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
        if ( elemdisplay[ nodeName ] ) {
                return elemdisplay[ nodeName ];
        }

        var elem = jQuery( "<" + nodeName + ">" ).appendTo( document.body ),
                display = elem.css("display");
        elem.remove();

        // If the simple way fails,
        // get element's real default display by attaching it to a temp iframe
        if ( display === "none" || display === "" ) {
                // Use the already-created iframe if possible
                iframe = document.body.appendChild(
                        iframe || jQuery.extend( document.createElement("iframe"), {
                                frameBorder: 0,
                                width: 0,
                                height: 0
                        })
                );

                // Create a cacheable copy of the iframe document on first call.
                // IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
                // document to it; WebKit & Firefox won't allow reusing the iframe document.
                if ( !iframeDoc || !iframe.createElement ) {
                        iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
                        iframeDoc.write("<!doctype html><html><body>");
                        iframeDoc.close();
                }

                elem = iframeDoc.body.appendChild( iframeDoc.createElement(nodeName) );

                display = curCSS( elem, "display" );
                document.body.removeChild( iframe );
        }

        // Store the correct default display
        elemdisplay[ nodeName ] = display;

        return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
        jQuery.cssHooks[ name ] = {
                get: function( elem, computed, extra ) {
                        if ( computed ) {
                                // certain elements can have dimension info if we invisibly show them
                                // however, it must have a current display style that would benefit from this
                                if ( elem.offsetWidth === 0 && rdisplayswap.test( curCSS( elem, "display" ) ) ) {
                                        return jQuery.swap( elem, cssShow, function() {
                                                return getWidthOrHeight( elem, name, extra );
                                        });
                                } else {
                                        return getWidthOrHeight( elem, name, extra );
                                }
                        }
                },

                set: function( elem, value, extra ) {
                        return setPositiveNumber( elem, value, extra ?
                                augmentWidthOrHeight(
                                        elem,
                                        name,
                                        extra,
                                        jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box"
                                ) : 0
                        );
                }
        };
});

if ( !jQuery.support.opacity ) {
        jQuery.cssHooks.opacity = {
                get: function( elem, computed ) {
                        // IE uses filters for opacity
                        return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
                                ( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
                                computed ? "1" : "";
                },

                set: function( elem, value ) {
                        var style = elem.style,
                                currentStyle = elem.currentStyle,
                                opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
                                filter = currentStyle && currentStyle.filter || style.filter || "";

                        // IE has trouble with opacity if it does not have layout
                        // Force it by setting the zoom level
                        style.zoom = 1;

                        // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
                        if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
                                style.removeAttribute ) {

                                // Setting style.filter to null, "" & " " still leave "filter:" in the cssText
                                // if "filter:" is present at all, clearType is disabled, we want to avoid this
                                // style.removeAttribute is IE Only, but so apparently is this code path...
                                style.removeAttribute( "filter" );

                                // if there there is no filter style applied in a css rule, we are done
                                if ( currentStyle && !currentStyle.filter ) {
                                        return;
                                }
                        }

                        // otherwise, set new filter values
                        style.filter = ralpha.test( filter ) ?
                                filter.replace( ralpha, opacity ) :
                                filter + " " + opacity;
                }
        };
}

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
        if ( !jQuery.support.reliableMarginRight ) {
                jQuery.cssHooks.marginRight = {
                        get: function( elem, computed ) {
                                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                                // Work around by temporarily setting element display to inline-block
                                return jQuery.swap( elem, { "display": "inline-block" }, function() {
                                        if ( computed ) {
                                                return curCSS( elem, "marginRight" );
                                        }
                                });
                        }
                };
        }

        // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
        // getComputedStyle returns percent when specified for top/left/bottom/right
        // rather than make the css module depend on the offset module, we just check for it here
        if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
                jQuery.each( [ "top", "left" ], function( i, prop ) {
                        jQuery.cssHooks[ prop ] = {
                                get: function( elem, computed ) {
                                        if ( computed ) {
                                                var ret = curCSS( elem, prop );
                                                // if curCSS returns percentage, fallback to offset
                                                return rnumnonpx.test( ret ) ? jQuery( elem ).position()[ prop ] + "px" : ret;
                                        }
                                }
                        };
                });
        }

});

if ( jQuery.expr && jQuery.expr.filters ) {
        jQuery.expr.filters.hidden = function( elem ) {
                return ( elem.offsetWidth === 0 && elem.offsetHeight === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || curCSS( elem, "display" )) === "none");
        };

        jQuery.expr.filters.visible = function( elem ) {
                return !jQuery.expr.filters.hidden( elem );
        };
}

// These hooks are used by animate to expand properties
jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
}, function( prefix, suffix ) {
        jQuery.cssHooks[ prefix + suffix ] = {
                expand: function( value ) {
                        var i,

                                // assumes a single number if not a string
                                parts = typeof value === "string" ? value.split(" ") : [ value ],
                                expanded = {};

                        for ( i = 0; i < 4; i++ ) {
                                expanded[ prefix + cssExpand[ i ] + suffix ] =
                                        parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
                        }

                        return expanded;
                }
        };

        if ( !rmargin.test( prefix ) ) {
                jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
        }
});
var r20 = /%20/g,
        rbracket = /\[\]$/,
        rCRLF = /\r?\n/g,
        rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
        rselectTextarea = /^(?:select|textarea)/i;

jQuery.fn.extend({
        serialize: function() {
                return jQuery.param( this.serializeArray() );
        },
        serializeArray: function() {
                return this.map(function(){
                        return this.elements ? jQuery.makeArray( this.elements ) : this;
                })
                .filter(function(){
                        return this.name && !this.disabled &&
                                ( this.checked || rselectTextarea.test( this.nodeName ) ||
                                        rinput.test( this.type ) );
                })
                .map(function( i, elem ){
                        var val = jQuery( this ).val();

                        return val == null ?
                                null :
                                jQuery.isArray( val ) ?
                                        jQuery.map( val, function( val, i ){
                                                return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
                                        }) :
                                        { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
                }).get();
        }
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
        var prefix,
                s = [],
                add = function( key, value ) {
                        // If value is a function, invoke it and return its value
                        value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
                        s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
                };

        // Set traditional to true for jQuery <= 1.3.2 behavior.
        if ( traditional === undefined ) {
                traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
        }

        // If an array was passed in, assume that it is an array of form elements.
        if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
                // Serialize the form elements
                jQuery.each( a, function() {
                        add( this.name, this.value );
                });

        } else {
                // If traditional, encode the "old" way (the way 1.3.2 or older
                // did it), otherwise encode params recursively.
                for ( prefix in a ) {
                        buildParams( prefix, a[ prefix ], traditional, add );
                }
        }

        // Return the resulting serialization
        return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
        var name;

        if ( jQuery.isArray( obj ) ) {
                // Serialize array item.
                jQuery.each( obj, function( i, v ) {
                        if ( traditional || rbracket.test( prefix ) ) {
                                // Treat each array item as a scalar.
                                add( prefix, v );

                        } else {
                                // If array item is non-scalar (array or object), encode its
                                // numeric index to resolve deserialization ambiguity issues.
                                // Note that rack (as of 1.0.0) can't currently deserialize
                                // nested arrays properly, and attempting to do so may cause
                                // a server error. Possible fixes are to modify rack's
                                // deserialization algorithm or to provide an option or flag
                                // to force array serialization to be shallow.
                                buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
                        }
                });

        } else if ( !traditional && jQuery.type( obj ) === "object" ) {
                // Serialize object item.
                for ( name in obj ) {
                        buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
                }

        } else {
                // Serialize scalar item.
                add( prefix, obj );
        }
}
var
        // Document location
        ajaxLocParts,
        ajaxLocation,

        rhash = /#.*$/,
        rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
        // #7653, #8125, #8152: local protocol detection
        rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
        rnoContent = /^(?:GET|HEAD)$/,
        rprotocol = /^\/\//,
        rquery = /\?/,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        rts = /([?&])_=[^&]*/,
        rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

        // Keep a copy of the old load method
        _load = jQuery.fn.load,

        /* Prefilters
         * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
         * 2) These are called:
         *    - BEFORE asking for a transport
         *    - AFTER param serialization (s.data is a string if s.processData is true)
         * 3) key is the dataType
         * 4) the catchall symbol "*" can be used
         * 5) execution will start with transport dataType and THEN continue down to "*" if needed
         */
        prefilters = {},

        /* Transports bindings
         * 1) key is the dataType
         * 2) the catchall symbol "*" can be used
         * 3) selection will start with transport dataType and THEN go to "*" if needed
         */
        transports = {},

        // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
        allTypes = ["*/"] + ["*"];

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
        ajaxLocation = location.href;
} catch( e ) {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        ajaxLocation = document.createElement( "a" );
        ajaxLocation.href = "";
        ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

        // dataTypeExpression is optional and defaults to "*"
        return function( dataTypeExpression, func ) {

                if ( typeof dataTypeExpression !== "string" ) {
                        func = dataTypeExpression;
                        dataTypeExpression = "*";
                }

                var dataType, list, placeBefore,
                        dataTypes = dataTypeExpression.toLowerCase().split( core_rspace ),
                        i = 0,
                        length = dataTypes.length;

                if ( jQuery.isFunction( func ) ) {
                        // For each dataType in the dataTypeExpression
                        for ( ; i < length; i++ ) {
                                dataType = dataTypes[ i ];
                                // We control if we're asked to add before
                                // any existing element
                                placeBefore = /^\+/.test( dataType );
                                if ( placeBefore ) {
                                        dataType = dataType.substr( 1 ) || "*";
                                }
                                list = structure[ dataType ] = structure[ dataType ] || [];
                                // then we add to the structure accordingly
                                list[ placeBefore ? "unshift" : "push" ]( func );
                        }
                }
        };
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR,
                dataType /* internal */, inspected /* internal */ ) {

        dataType = dataType || options.dataTypes[ 0 ];
        inspected = inspected || {};

        inspected[ dataType ] = true;

        var selection,
                list = structure[ dataType ],
                i = 0,
                length = list ? list.length : 0,
                executeOnly = ( structure === prefilters );

        for ( ; i < length && ( executeOnly || !selection ); i++ ) {
                selection = list[ i ]( options, originalOptions, jqXHR );
                // If we got redirected to another dataType
                // we try there if executing only and not done already
                if ( typeof selection === "string" ) {
                        if ( !executeOnly || inspected[ selection ] ) {
                                selection = undefined;
                        } else {
                                options.dataTypes.unshift( selection );
                                selection = inspectPrefiltersOrTransports(
                                                structure, options, originalOptions, jqXHR, selection, inspected );
                        }
                }
        }
        // If we're only executing or nothing was selected
        // we try the catchall dataType if not done already
        if ( ( executeOnly || !selection ) && !inspected[ "*" ] ) {
                selection = inspectPrefiltersOrTransports(
                                structure, options, originalOptions, jqXHR, "*", inspected );
        }
        // unnecessary when only executing (prefilters)
        // but it'll be ignored by the caller in that case
        return selection;
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
        var key, deep,
                flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for ( key in src ) {
                if ( src[ key ] !== undefined ) {
                        ( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
                }
        }
        if ( deep ) {
                jQuery.extend( true, target, deep );
        }
}

jQuery.fn.load = function( url, params, callback ) {
        if ( typeof url !== "string" && _load ) {
                return _load.apply( this, arguments );
        }

        // Don't do a request if no elements are being requested
        if ( !this.length ) {
                return this;
        }

        var selector, type, response,
                self = this,
                off = url.indexOf(" ");

        if ( off >= 0 ) {
                selector = url.slice( off, url.length );
                url = url.slice( 0, off );
        }

        // If it's a function
        if ( jQuery.isFunction( params ) ) {

                // We assume that it's the callback
                callback = params;
                params = undefined;

        // Otherwise, build a param string
        } else if ( params && typeof params === "object" ) {
                type = "POST";
        }

        // Request the remote document
        jQuery.ajax({
                url: url,

                // if "type" variable is undefined, then "GET" method will be used
                type: type,
                dataType: "html",
                data: params,
                complete: function( jqXHR, status ) {
                        if ( callback ) {
                                self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
                        }
                }
        }).done(function( responseText ) {

                // Save response for use in complete callback
                response = arguments;

                // See if a selector was specified
                self.html( selector ?

                        // Create a dummy div to hold the results
                        jQuery("<div>")

                                // inject the contents of the document in, removing the scripts
                                // to avoid any 'Permission Denied' errors in IE
                                .append( responseText.replace( rscript, "" ) )

                                // Locate the specified elements
                                .find( selector ) :

                        // If not, just inject the full result
                        responseText );

        });

        return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ), function( i, o ){
        jQuery.fn[ o ] = function( f ){
                return this.on( o, f );
        };
});

jQuery.each( [ "get", "post" ], function( i, method ) {
        jQuery[ method ] = function( url, data, callback, type ) {
                // shift arguments if data argument was omitted
                if ( jQuery.isFunction( data ) ) {
                        type = type || callback;
                        callback = data;
                        data = undefined;
                }

                return jQuery.ajax({
                        type: method,
                        url: url,
                        data: data,
                        success: callback,
                        dataType: type
                });
        };
});

jQuery.extend({

        getScript: function( url, callback ) {
                return jQuery.get( url, undefined, callback, "script" );
        },

        getJSON: function( url, data, callback ) {
                return jQuery.get( url, data, callback, "json" );
        },

        // Creates a full fledged settings object into target
        // with both ajaxSettings and settings fields.
        // If target is omitted, writes into ajaxSettings.
        ajaxSetup: function( target, settings ) {
                if ( settings ) {
                        // Building a settings object
                        ajaxExtend( target, jQuery.ajaxSettings );
                } else {
                        // Extending ajaxSettings
                        settings = target;
                        target = jQuery.ajaxSettings;
                }
                ajaxExtend( target, settings );
                return target;
        },

        ajaxSettings: {
                url: ajaxLocation,
                isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
                global: true,
                type: "GET",
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                processData: true,
                async: true,
                /*
                timeout: 0,
                data: null,
                dataType: null,
                username: null,
                password: null,
                cache: null,
                throws: false,
                traditional: false,
                headers: {},
                */

                accepts: {
                        xml: "application/xml, text/xml",
                        html: "text/html",
                        text: "text/plain",
                        json: "application/json, text/javascript",
                        "*": allTypes
                },

                contents: {
                        xml: /xml/,
                        html: /html/,
                        json: /json/
                },

                responseFields: {
                        xml: "responseXML",
                        text: "responseText"
                },

                // List of data converters
                // 1) key format is "source_type destination_type" (a single space in-between)
                // 2) the catchall symbol "*" can be used for source_type
                converters: {

                        // Convert anything to text
                        "* text": window.String,

                        // Text to html (true = no transformation)
                        "text html": true,

                        // Evaluate text as a json expression
                        "text json": jQuery.parseJSON,

                        // Parse text as xml
                        "text xml": jQuery.parseXML
                },

                // For options that shouldn't be deep extended:
                // you can add your own custom options here if
                // and when you create one that shouldn't be
                // deep extended (see ajaxExtend)
                flatOptions: {
                        context: true,
                        url: true
                }
        },

        ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
        ajaxTransport: addToPrefiltersOrTransports( transports ),

        // Main method
        ajax: function( url, options ) {

                // If url is an object, simulate pre-1.5 signature
                if ( typeof url === "object" ) {
                        options = url;
                        url = undefined;
                }

                // Force options to be an object
                options = options || {};

                var // ifModified key
                        ifModifiedKey,
                        // Response headers
                        responseHeadersString,
                        responseHeaders,
                        // transport
                        transport,
                        // timeout handle
                        timeoutTimer,
                        // Cross-domain detection vars
                        parts,
                        // To know if global events are to be dispatched
                        fireGlobals,
                        // Loop variable
                        i,
                        // Create the final options object
                        s = jQuery.ajaxSetup( {}, options ),
                        // Callbacks context
                        callbackContext = s.context || s,
                        // Context for global events
                        // It's the callbackContext if one was provided in the options
                        // and if it's a DOM node or a jQuery collection
                        globalEventContext = callbackContext !== s &&
                                ( callbackContext.nodeType || callbackContext instanceof jQuery ) ?
                                                jQuery( callbackContext ) : jQuery.event,
                        // Deferreds
                        deferred = jQuery.Deferred(),
                        completeDeferred = jQuery.Callbacks( "once memory" ),
                        // Status-dependent callbacks
                        statusCode = s.statusCode || {},
                        // Headers (they are sent all at once)
                        requestHeaders = {},
                        requestHeadersNames = {},
                        // The jqXHR state
                        state = 0,
                        // Default abort message
                        strAbort = "canceled",
                        // Fake xhr
                        jqXHR = {

                                readyState: 0,

                                // Caches the header
                                setRequestHeader: function( name, value ) {
                                        if ( !state ) {
                                                var lname = name.toLowerCase();
                                                name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
                                                requestHeaders[ name ] = value;
                                        }
                                        return this;
                                },

                                // Raw string
                                getAllResponseHeaders: function() {
                                        return state === 2 ? responseHeadersString : null;
                                },

                                // Builds headers hashtable if needed
                                getResponseHeader: function( key ) {
                                        var match;
                                        if ( state === 2 ) {
                                                if ( !responseHeaders ) {
                                                        responseHeaders = {};
                                                        while( ( match = rheaders.exec( responseHeadersString ) ) ) {
                                                                responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
                                                        }
                                                }
                                                match = responseHeaders[ key.toLowerCase() ];
                                        }
                                        return match === undefined ? null : match;
                                },

                                // Overrides response content-type header
                                overrideMimeType: function( type ) {
                                        if ( !state ) {
                                                s.mimeType = type;
                                        }
                                        return this;
                                },

                                // Cancel the request
                                abort: function( statusText ) {
                                        statusText = statusText || strAbort;
                                        if ( transport ) {
                                                transport.abort( statusText );
                                        }
                                        done( 0, statusText );
                                        return this;
                                }
                        };

                // Callback for when everything is done
                // It is defined here because jslint complains if it is declared
                // at the end of the function (which would be more logical and readable)
                function done( status, nativeStatusText, responses, headers ) {
                        var isSuccess, success, error, response, modified,
                                statusText = nativeStatusText;

                        // Called once
                        if ( state === 2 ) {
                                return;
                        }

                        // State is "done" now
                        state = 2;

                        // Clear timeout if it exists
                        if ( timeoutTimer ) {
                                clearTimeout( timeoutTimer );
                        }

                        // Dereference transport for early garbage collection
                        // (no matter how long the jqXHR object will be used)
                        transport = undefined;

                        // Cache response headers
                        responseHeadersString = headers || "";

                        // Set readyState
                        jqXHR.readyState = status > 0 ? 4 : 0;

                        // Get response data
                        if ( responses ) {
                                response = ajaxHandleResponses( s, jqXHR, responses );
                        }

                        // If successful, handle type chaining
                        if ( status >= 200 && status < 300 || status === 304 ) {

                                // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
                                if ( s.ifModified ) {

                                        modified = jqXHR.getResponseHeader("Last-Modified");
                                        if ( modified ) {
                                                jQuery.lastModified[ ifModifiedKey ] = modified;
                                        }
                                        modified = jqXHR.getResponseHeader("Etag");
                                        if ( modified ) {
                                                jQuery.etag[ ifModifiedKey ] = modified;
                                        }
                                }

                                // If not modified
                                if ( status === 304 ) {

                                        statusText = "notmodified";
                                        isSuccess = true;

                                // If we have data
                                } else {

                                        isSuccess = ajaxConvert( s, response );
                                        statusText = isSuccess.state;
                                        success = isSuccess.data;
                                        error = isSuccess.error;
                                        isSuccess = !error;
                                }
                        } else {
                                // We extract error from statusText
                                // then normalize statusText and status for non-aborts
                                error = statusText;
                                if ( !statusText || status ) {
                                        statusText = "error";
                                        if ( status < 0 ) {
                                                status = 0;
                                        }
                                }
                        }

                        // Set data for the fake xhr object
                        jqXHR.status = status;
                        jqXHR.statusText = ( nativeStatusText || statusText ) + "";

                        // Success/Error
                        if ( isSuccess ) {
                                deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
                        } else {
                                deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
                        }

                        // Status-dependent callbacks
                        jqXHR.statusCode( statusCode );
                        statusCode = undefined;

                        if ( fireGlobals ) {
                                globalEventContext.trigger( "ajax" + ( isSuccess ? "Success" : "Error" ),
                                                [ jqXHR, s, isSuccess ? success : error ] );
                        }

                        // Complete
                        completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

                        if ( fireGlobals ) {
                                globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
                                // Handle the global AJAX counter
                                if ( !( --jQuery.active ) ) {
                                        jQuery.event.trigger( "ajaxStop" );
                                }
                        }
                }

                // Attach deferreds
                deferred.promise( jqXHR );
                jqXHR.success = jqXHR.done;
                jqXHR.error = jqXHR.fail;
                jqXHR.complete = completeDeferred.add;

                // Status-dependent callbacks
                jqXHR.statusCode = function( map ) {
                        if ( map ) {
                                var tmp;
                                if ( state < 2 ) {
                                        for ( tmp in map ) {
                                                statusCode[ tmp ] = [ statusCode[tmp], map[tmp] ];
                                        }
                                } else {
                                        tmp = map[ jqXHR.status ];
                                        jqXHR.always( tmp );
                                }
                        }
                        return this;
                };

                // Remove hash character (#7531: and string promotion)
                // Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
                // We also use the url parameter if available
                s.url = ( ( url || s.url ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

                // Extract dataTypes list
                s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().split( core_rspace );

                // A cross-domain request is in order when we have a protocol:host:port mismatch
                if ( s.crossDomain == null ) {
                        parts = rurl.exec( s.url.toLowerCase() );
                        s.crossDomain = !!( parts &&
                                ( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
                                        ( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
                                                ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
                        );
                }

                // Convert data if not already a string
                if ( s.data && s.processData && typeof s.data !== "string" ) {
                        s.data = jQuery.param( s.data, s.traditional );
                }

                // Apply prefilters
                inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

                // If request was aborted inside a prefilter, stop there
                if ( state === 2 ) {
                        return jqXHR;
                }

                // We can fire global events as of now if asked to
                fireGlobals = s.global;

                // Uppercase the type
                s.type = s.type.toUpperCase();

                // Determine if request has content
                s.hasContent = !rnoContent.test( s.type );

                // Watch for a new set of requests
                if ( fireGlobals && jQuery.active++ === 0 ) {
                        jQuery.event.trigger( "ajaxStart" );
                }

                // More options handling for requests with no content
                if ( !s.hasContent ) {

                        // If data is available, append data to url
                        if ( s.data ) {
                                s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.data;
                                // #9682: remove data so that it's not used in an eventual retry
                                delete s.data;
                        }

                        // Get ifModifiedKey before adding the anti-cache parameter
                        ifModifiedKey = s.url;

                        // Add anti-cache in url if needed
                        if ( s.cache === false ) {

                                var ts = jQuery.now(),
                                        // try replacing _= if it is there
                                        ret = s.url.replace( rts, "$1_=" + ts );

                                // if nothing was replaced, add timestamp to the end
                                s.url = ret + ( ( ret === s.url ) ? ( rquery.test( s.url ) ? "&" : "?" ) + "_=" + ts : "" );
                        }
                }

                // Set the correct header, if data is being sent
                if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
                        jqXHR.setRequestHeader( "Content-Type", s.contentType );
                }

                // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
                if ( s.ifModified ) {
                        ifModifiedKey = ifModifiedKey || s.url;
                        if ( jQuery.lastModified[ ifModifiedKey ] ) {
                                jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ ifModifiedKey ] );
                        }
                        if ( jQuery.etag[ ifModifiedKey ] ) {
                                jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ ifModifiedKey ] );
                        }
                }

                // Set the Accepts header for the server, depending on the dataType
                jqXHR.setRequestHeader(
                        "Accept",
                        s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
                                s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
                                s.accepts[ "*" ]
                );

                // Check for headers option
                for ( i in s.headers ) {
                        jqXHR.setRequestHeader( i, s.headers[ i ] );
                }

                // Allow custom headers/mimetypes and early abort
                if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
                                // Abort if not done already and return
                                return jqXHR.abort();

                }

                // aborting is no longer a cancellation
                strAbort = "abort";

                // Install callbacks on deferreds
                for ( i in { success: 1, error: 1, complete: 1 } ) {
                        jqXHR[ i ]( s[ i ] );
                }

                // Get transport
                transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

                // If no transport, we auto-abort
                if ( !transport ) {
                        done( -1, "No Transport" );
                } else {
                        jqXHR.readyState = 1;
                        // Send global event
                        if ( fireGlobals ) {
                                globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
                        }
                        // Timeout
                        if ( s.async && s.timeout > 0 ) {
                                timeoutTimer = setTimeout( function(){
                                        jqXHR.abort( "timeout" );
                                }, s.timeout );
                        }

                        try {
                                state = 1;
                                transport.send( requestHeaders, done );
                        } catch (e) {
                                // Propagate exception as error if not done
                                if ( state < 2 ) {
                                        done( -1, e );
                                // Simply rethrow otherwise
                                } else {
                                        throw e;
                                }
                        }
                }

                return jqXHR;
        },

        // Counter for holding the number of active queries
        active: 0,

        // Last-Modified header cache for next request
        lastModified: {},
        etag: {}

});

/* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

        var ct, type, finalDataType, firstDataType,
                contents = s.contents,
                dataTypes = s.dataTypes,
                responseFields = s.responseFields;

        // Fill responseXXX fields
        for ( type in responseFields ) {
                if ( type in responses ) {
                        jqXHR[ responseFields[type] ] = responses[ type ];
                }
        }

        // Remove auto dataType and get content-type in the process
        while( dataTypes[ 0 ] === "*" ) {
                dataTypes.shift();
                if ( ct === undefined ) {
                        ct = s.mimeType || jqXHR.getResponseHeader( "content-type" );
                }
        }

        // Check if we're dealing with a known content-type
        if ( ct ) {
                for ( type in contents ) {
                        if ( contents[ type ] && contents[ type ].test( ct ) ) {
                                dataTypes.unshift( type );
                                break;
                        }
                }
        }

        // Check to see if we have a response for the expected dataType
        if ( dataTypes[ 0 ] in responses ) {
                finalDataType = dataTypes[ 0 ];
        } else {
                // Try convertible dataTypes
                for ( type in responses ) {
                        if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
                                finalDataType = type;
                                break;
                        }
                        if ( !firstDataType ) {
                                firstDataType = type;
                        }
                }
                // Or just use first one
                finalDataType = finalDataType || firstDataType;
        }

        // If we found a dataType
        // We add the dataType to the list if needed
        // and return the corresponding response
        if ( finalDataType ) {
                if ( finalDataType !== dataTypes[ 0 ] ) {
                        dataTypes.unshift( finalDataType );
                }
                return responses[ finalDataType ];
        }
}

// Chain conversions given the request and the original response
function ajaxConvert( s, response ) {

        var conv, conv2, current, tmp,
                // Work with a copy of dataTypes in case we need to modify it for conversion
                dataTypes = s.dataTypes.slice(),
                prev = dataTypes[ 0 ],
                converters = {},
                i = 0;

        // Apply the dataFilter if provided
        if ( s.dataFilter ) {
                response = s.dataFilter( response, s.dataType );
        }

        // Create converters map with lowercased keys
        if ( dataTypes[ 1 ] ) {
                for ( conv in s.converters ) {
                        converters[ conv.toLowerCase() ] = s.converters[ conv ];
                }
        }

        // Convert to each sequential dataType, tolerating list modification
        for ( ; (current = dataTypes[++i]); ) {

                // There's only work to do if current dataType is non-auto
                if ( current !== "*" ) {

                        // Convert response if prev dataType is non-auto and differs from current
                        if ( prev !== "*" && prev !== current ) {

                                // Seek a direct converter
                                conv = converters[ prev + " " + current ] || converters[ "* " + current ];

                                // If none found, seek a pair
                                if ( !conv ) {
                                        for ( conv2 in converters ) {

                                                // If conv2 outputs current
                                                tmp = conv2.split(" ");
                                                if ( tmp[ 1 ] === current ) {

                                                        // If prev can be converted to accepted input
                                                        conv = converters[ prev + " " + tmp[ 0 ] ] ||
                                                                converters[ "* " + tmp[ 0 ] ];
                                                        if ( conv ) {
                                                                // Condense equivalence converters
                                                                if ( conv === true ) {
                                                                        conv = converters[ conv2 ];

                                                                // Otherwise, insert the intermediate dataType
                                                                } else if ( converters[ conv2 ] !== true ) {
                                                                        current = tmp[ 0 ];
                                                                        dataTypes.splice( i--, 0, current );
                                                                }

                                                                break;
                                                        }
                                                }
                                        }
                                }

                                // Apply converter (if not an equivalence)
                                if ( conv !== true ) {

                                        // Unless errors are allowed to bubble, catch and return them
                                        if ( conv && s["throws"] ) {
                                                response = conv( response );
                                        } else {
                                                try {
                                                        response = conv( response );
                                                } catch ( e ) {
                                                        return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
                                                }
                                        }
                                }
                        }

                        // Update prev for next iteration
                        prev = current;
                }
        }

        return { state: "success", data: response };
}
var oldCallbacks = [],
        rquestion = /\?/,
        rjsonp = /(=)\?(?=&|$)|\?\?/,
        nonce = jQuery.now();

// Default jsonp settings
jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
                var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
                this[ callback ] = true;
                return callback;
        }
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

        var callbackName, overwritten, responseContainer,
                data = s.data,
                url = s.url,
                hasCallback = s.jsonp !== false,
                replaceInUrl = hasCallback && rjsonp.test( url ),
                replaceInData = hasCallback && !replaceInUrl && typeof data === "string" &&
                        !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") &&
                        rjsonp.test( data );

        // Handle iff the expected data type is "jsonp" or we have a parameter to set
        if ( s.dataTypes[ 0 ] === "jsonp" || replaceInUrl || replaceInData ) {

                // Get callback name, remembering preexisting value associated with it
                callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
                        s.jsonpCallback() :
                        s.jsonpCallback;
                overwritten = window[ callbackName ];

                // Insert callback into url or form data
                if ( replaceInUrl ) {
                        s.url = url.replace( rjsonp, "$1" + callbackName );
                } else if ( replaceInData ) {
                        s.data = data.replace( rjsonp, "$1" + callbackName );
                } else if ( hasCallback ) {
                        s.url += ( rquestion.test( url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
                }

                // Use data converter to retrieve json after script execution
                s.converters["script json"] = function() {
                        if ( !responseContainer ) {
                                jQuery.error( callbackName + " was not called" );
                        }
                        return responseContainer[ 0 ];
                };

                // force json dataType
                s.dataTypes[ 0 ] = "json";

                // Install callback
                window[ callbackName ] = function() {
                        responseContainer = arguments;
                };

                // Clean-up function (fires after converters)
                jqXHR.always(function() {
                        // Restore preexisting value
                        window[ callbackName ] = overwritten;

                        // Save back as free
                        if ( s[ callbackName ] ) {
                                // make sure that re-using the options doesn't screw things around
                                s.jsonpCallback = originalSettings.jsonpCallback;

                                // save the callback name for future use
                                oldCallbacks.push( callbackName );
                        }

                        // Call if it was a function and we have a response
                        if ( responseContainer && jQuery.isFunction( overwritten ) ) {
                                overwritten( responseContainer[ 0 ] );
                        }

                        responseContainer = overwritten = undefined;
                });

                // Delegate to script
                return "script";
        }
});
// Install script dataType
jQuery.ajaxSetup({
        accepts: {
                script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
                script: /javascript|ecmascript/
        },
        converters: {
                "text script": function( text ) {
                        jQuery.globalEval( text );
                        return text;
                }
        }
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
        if ( s.cache === undefined ) {
                s.cache = false;
        }
        if ( s.crossDomain ) {
                s.type = "GET";
                s.global = false;
        }
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

        // This transport only deals with cross domain requests
        if ( s.crossDomain ) {

                var script,
                        head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;

                return {

                        send: function( _, callback ) {

                                script = document.createElement( "script" );

                                script.async = "async";

                                if ( s.scriptCharset ) {
                                        script.charset = s.scriptCharset;
                                }

                                script.src = s.url;

                                // Attach handlers for all browsers
                                script.onload = script.onreadystatechange = function( _, isAbort ) {

                                        if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

                                                // Handle memory leak in IE
                                                script.onload = script.onreadystatechange = null;

                                                // Remove the script
                                                if ( head && script.parentNode ) {
                                                        head.removeChild( script );
                                                }

                                                // Dereference the script
                                                script = undefined;

                                                // Callback if not abort
                                                if ( !isAbort ) {
                                                        callback( 200, "success" );
                                                }
                                        }
                                };
                                // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                                // This arises when a base node is used (#2709 and #4378).
                                head.insertBefore( script, head.firstChild );
                        },

                        abort: function() {
                                if ( script ) {
                                        script.onload( 0, 1 );
                                }
                        }
                };
        }
});
var xhrCallbacks,
        // #5280: Internet Explorer will keep connections alive if we don't abort on unload
        xhrOnUnloadAbort = window.ActiveXObject ? function() {
                // Abort all pending requests
                for ( var key in xhrCallbacks ) {
                        xhrCallbacks[ key ]( 0, 1 );
                }
        } : false,
        xhrId = 0;

// Functions to create xhrs
function createStandardXHR() {
        try {
                return new window.XMLHttpRequest();
        } catch( e ) {}
}

function createActiveXHR() {
        try {
                return new window.ActiveXObject( "Microsoft.XMLHTTP" );
        } catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
        /* Microsoft failed to properly
         * implement the XMLHttpRequest in IE7 (can't request local files),
         * so we use the ActiveXObject when it is available
         * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
         * we need a fallback.
         */
        function() {
                return !this.isLocal && createStandardXHR() || createActiveXHR();
        } :
        // For all other browsers, use the standard XMLHttpRequest object
        createStandardXHR;

// Determine support properties
(function( xhr ) {
        jQuery.extend( jQuery.support, {
                ajax: !!xhr,
                cors: !!xhr && ( "withCredentials" in xhr )
        });
})( jQuery.ajaxSettings.xhr() );

// Create transport if the browser can provide an xhr
if ( jQuery.support.ajax ) {

        jQuery.ajaxTransport(function( s ) {
                // Cross domain only allowed if supported through XMLHttpRequest
                if ( !s.crossDomain || jQuery.support.cors ) {

                        var callback;

                        return {
                                send: function( headers, complete ) {

                                        // Get a new xhr
                                        var handle, i,
                                                xhr = s.xhr();

                                        // Open the socket
                                        // Passing null username, generates a login popup on Opera (#2865)
                                        if ( s.username ) {
                                                xhr.open( s.type, s.url, s.async, s.username, s.password );
                                        } else {
                                                xhr.open( s.type, s.url, s.async );
                                        }

                                        // Apply custom fields if provided
                                        if ( s.xhrFields ) {
                                                for ( i in s.xhrFields ) {
                                                        xhr[ i ] = s.xhrFields[ i ];
                                                }
                                        }

                                        // Override mime type if needed
                                        if ( s.mimeType && xhr.overrideMimeType ) {
                                                xhr.overrideMimeType( s.mimeType );
                                        }

                                        // X-Requested-With header
                                        // For cross-domain requests, seeing as conditions for a preflight are
                                        // akin to a jigsaw puzzle, we simply never set it to be sure.
                                        // (it can always be set on a per-request basis or even using ajaxSetup)
                                        // For same-domain requests, won't change header if already provided.
                                        if ( !s.crossDomain && !headers["X-Requested-With"] ) {
                                                headers[ "X-Requested-With" ] = "XMLHttpRequest";
                                        }

                                        // Need an extra try/catch for cross domain requests in Firefox 3
                                        try {
                                                for ( i in headers ) {
                                                        xhr.setRequestHeader( i, headers[ i ] );
                                                }
                                        } catch( _ ) {}

                                        // Do send the request
                                        // This may raise an exception which is actually
                                        // handled in jQuery.ajax (so no try/catch here)
                                        xhr.send( ( s.hasContent && s.data ) || null );

                                        // Listener
                                        callback = function( _, isAbort ) {

                                                var status,
                                                        statusText,
                                                        responseHeaders,
                                                        responses,
                                                        xml;

                                                // Firefox throws exceptions when accessing properties
                                                // of an xhr when a network error occurred
                                                // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                                                try {

                                                        // Was never called and is aborted or complete
                                                        if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

                                                                // Only called once
                                                                callback = undefined;

                                                                // Do not keep as active anymore
                                                                if ( handle ) {
                                                                        xhr.onreadystatechange = jQuery.noop;
                                                                        if ( xhrOnUnloadAbort ) {
                                                                                delete xhrCallbacks[ handle ];
                                                                        }
                                                                }

                                                                // If it's an abort
                                                                if ( isAbort ) {
                                                                        // Abort it manually if needed
                                                                        if ( xhr.readyState !== 4 ) {
                                                                                xhr.abort();
                                                                        }
                                                                } else {
                                                                        status = xhr.status;
                                                                        responseHeaders = xhr.getAllResponseHeaders();
                                                                        responses = {};
                                                                        xml = xhr.responseXML;

                                                                        // Construct response list
                                                                        if ( xml && xml.documentElement /* #4958 */ ) {
                                                                                responses.xml = xml;
                                                                        }

                                                                        // When requesting binary data, IE6-9 will throw an exception
                                                                        // on any attempt to access responseText (#11426)
                                                                        try {
                                                                                responses.text = xhr.responseText;
                                                                        } catch( e ) {
                                                                        }

                                                                        // Firefox throws an exception when accessing
                                                                        // statusText for faulty cross-domain requests
                                                                        try {
                                                                                statusText = xhr.statusText;
                                                                        } catch( e ) {
                                                                                // We normalize with Webkit giving an empty statusText
                                                                                statusText = "";
                                                                        }

                                                                        // Filter status for non standard behaviors

                                                                        // If the request is local and we have data: assume a success
                                                                        // (success with no data won't get notified, that's the best we
                                                                        // can do given current implementations)
                                                                        if ( !status && s.isLocal && !s.crossDomain ) {
                                                                                status = responses.text ? 200 : 404;
                                                                        // IE - #1450: sometimes returns 1223 when it should be 204
                                                                        } else if ( status === 1223 ) {
                                                                                status = 204;
                                                                        }
                                                                }
                                                        }
                                                } catch( firefoxAccessException ) {
                                                        if ( !isAbort ) {
                                                                complete( -1, firefoxAccessException );
                                                        }
                                                }

                                                // Call complete if needed
                                                if ( responses ) {
                                                        complete( status, statusText, responses, responseHeaders );
                                                }
                                        };

                                        if ( !s.async ) {
                                                // if we're in sync mode we fire the callback
                                                callback();
                                        } else if ( xhr.readyState === 4 ) {
                                                // (IE6 & IE7) if it's in cache and has been
                                                // retrieved directly we need to fire the callback
                                                setTimeout( callback, 0 );
                                        } else {
                                                handle = ++xhrId;
                                                if ( xhrOnUnloadAbort ) {
                                                        // Create the active xhrs callbacks list if needed
                                                        // and attach the unload handler
                                                        if ( !xhrCallbacks ) {
                                                                xhrCallbacks = {};
                                                                jQuery( window ).unload( xhrOnUnloadAbort );
                                                        }
                                                        // Add to list of active xhrs callbacks
                                                        xhrCallbacks[ handle ] = callback;
                                                }
                                                xhr.onreadystatechange = callback;
                                        }
                                },

                                abort: function() {
                                        if ( callback ) {
                                                callback(0,1);
                                        }
                                }
                        };
                }
        });
}
var fxNow, timerId,
        rfxtypes = /^(?:toggle|show|hide)$/,
        rfxnum = new RegExp( "^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
        rrun = /queueHooks$/,
        animationPrefilters = [ defaultPrefilter ],
        tweeners = {
                "*": [function( prop, value ) {
                        var end, unit,
                                tween = this.createTween( prop, value ),
                                parts = rfxnum.exec( value ),
                                target = tween.cur(),
                                start = +target || 0,
                                scale = 1,
                                maxIterations = 20;

                        if ( parts ) {
                                end = +parts[2];
                                unit = parts[3] || ( jQuery.cssNumber[ prop ] ? "" : "px" );

                                // We need to compute starting value
                                if ( unit !== "px" && start ) {
                                        // Iteratively approximate from a nonzero starting point
                                        // Prefer the current property, because this process will be trivial if it uses the same units
                                        // Fallback to end or a simple constant
                                        start = jQuery.css( tween.elem, prop, true ) || end || 1;

                                        do {
                                                // If previous iteration zeroed out, double until we get *something*
                                                // Use a string for doubling factor so we don't accidentally see scale as unchanged below
                                                scale = scale || ".5";

                                                // Adjust and apply
                                                start = start / scale;
                                                jQuery.style( tween.elem, prop, start + unit );

                                        // Update scale, tolerating zero or NaN from tween.cur()
                                        // And breaking the loop if scale is unchanged or perfect, or if we've just had enough
                                        } while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
                                }

                                tween.unit = unit;
                                tween.start = start;
                                // If a +=/-= token was provided, we're doing a relative animation
                                tween.end = parts[1] ? start + ( parts[1] + 1 ) * end : end;
                        }
                        return tween;
                }]
        };

// Animations created synchronously will run synchronously
function createFxNow() {
        setTimeout(function() {
                fxNow = undefined;
        }, 0 );
        return ( fxNow = jQuery.now() );
}

function createTweens( animation, props ) {
        jQuery.each( props, function( prop, value ) {
                var collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
                        index = 0,
                        length = collection.length;
                for ( ; index < length; index++ ) {
                        if ( collection[ index ].call( animation, prop, value ) ) {

                                // we're done with this property
                                return;
                        }
                }
        });
}

function Animation( elem, properties, options ) {
        var result,
                index = 0,
                tweenerIndex = 0,
                length = animationPrefilters.length,
                deferred = jQuery.Deferred().always( function() {
                        // don't match elem in the :animated selector
                        delete tick.elem;
                }),
                tick = function() {
                        var currentTime = fxNow || createFxNow(),
                                remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
                                // archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
                                temp = remaining / animation.duration || 0,
                                percent = 1 - temp,
                                index = 0,
                                length = animation.tweens.length;

                        for ( ; index < length ; index++ ) {
                                animation.tweens[ index ].run( percent );
                        }

                        deferred.notifyWith( elem, [ animation, percent, remaining ]);

                        if ( percent < 1 && length ) {
                                return remaining;
                        } else {
                                deferred.resolveWith( elem, [ animation ] );
                                return false;
                        }
                },
                animation = deferred.promise({
                        elem: elem,
                        props: jQuery.extend( {}, properties ),
                        opts: jQuery.extend( true, { specialEasing: {} }, options ),
                        originalProperties: properties,
                        originalOptions: options,
                        startTime: fxNow || createFxNow(),
                        duration: options.duration,
                        tweens: [],
                        createTween: function( prop, end, easing ) {
                                var tween = jQuery.Tween( elem, animation.opts, prop, end,
                                                animation.opts.specialEasing[ prop ] || animation.opts.easing );
                                animation.tweens.push( tween );
                                return tween;
                        },
                        stop: function( gotoEnd ) {
                                var index = 0,
                                        // if we are going to the end, we want to run all the tweens
                                        // otherwise we skip this part
                                        length = gotoEnd ? animation.tweens.length : 0;

                                for ( ; index < length ; index++ ) {
                                        animation.tweens[ index ].run( 1 );
                                }

                                // resolve when we played the last frame
                                // otherwise, reject
                                if ( gotoEnd ) {
                                        deferred.resolveWith( elem, [ animation, gotoEnd ] );
                                } else {
                                        deferred.rejectWith( elem, [ animation, gotoEnd ] );
                                }
                                return this;
                        }
                }),
                props = animation.props;

        propFilter( props, animation.opts.specialEasing );

        for ( ; index < length ; index++ ) {
                result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
                if ( result ) {
                        return result;
                }
        }

        createTweens( animation, props );

        if ( jQuery.isFunction( animation.opts.start ) ) {
                animation.opts.start.call( elem, animation );
        }

        jQuery.fx.timer(
                jQuery.extend( tick, {
                        anim: animation,
                        queue: animation.opts.queue,
                        elem: elem
                })
        );

        // attach callbacks from options
        return animation.progress( animation.opts.progress )
                .done( animation.opts.done, animation.opts.complete )
                .fail( animation.opts.fail )
                .always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
        var index, name, easing, value, hooks;

        // camelCase, specialEasing and expand cssHook pass
        for ( index in props ) {
                name = jQuery.camelCase( index );
                easing = specialEasing[ name ];
                value = props[ index ];
                if ( jQuery.isArray( value ) ) {
                        easing = value[ 1 ];
                        value = props[ index ] = value[ 0 ];
                }

                if ( index !== name ) {
                        props[ name ] = value;
                        delete props[ index ];
                }

                hooks = jQuery.cssHooks[ name ];
                if ( hooks && "expand" in hooks ) {
                        value = hooks.expand( value );
                        delete props[ name ];

                        // not quite $.extend, this wont overwrite keys already present.
                        // also - reusing 'index' from above because we have the correct "name"
                        for ( index in value ) {
                                if ( !( index in props ) ) {
                                        props[ index ] = value[ index ];
                                        specialEasing[ index ] = easing;
                                }
                        }
                } else {
                        specialEasing[ name ] = easing;
                }
        }
}

jQuery.Animation = jQuery.extend( Animation, {

        tweener: function( props, callback ) {
                if ( jQuery.isFunction( props ) ) {
                        callback = props;
                        props = [ "*" ];
                } else {
                        props = props.split(" ");
                }

                var prop,
                        index = 0,
                        length = props.length;

                for ( ; index < length ; index++ ) {
                        prop = props[ index ];
                        tweeners[ prop ] = tweeners[ prop ] || [];
                        tweeners[ prop ].unshift( callback );
                }
        },

        prefilter: function( callback, prepend ) {
                if ( prepend ) {
                        animationPrefilters.unshift( callback );
                } else {
                        animationPrefilters.push( callback );
                }
        }
});

function defaultPrefilter( elem, props, opts ) {
        var index, prop, value, length, dataShow, toggle, tween, hooks, oldfire,
                anim = this,
                style = elem.style,
                orig = {},
                handled = [],
                hidden = elem.nodeType && isHidden( elem );

        // handle queue: false promises
        if ( !opts.queue ) {
                hooks = jQuery._queueHooks( elem, "fx" );
                if ( hooks.unqueued == null ) {
                        hooks.unqueued = 0;
                        oldfire = hooks.empty.fire;
                        hooks.empty.fire = function() {
                                if ( !hooks.unqueued ) {
                                        oldfire();
                                }
                        };
                }
                hooks.unqueued++;

                anim.always(function() {
                        // doing this makes sure that the complete handler will be called
                        // before this completes
                        anim.always(function() {
                                hooks.unqueued--;
                                if ( !jQuery.queue( elem, "fx" ).length ) {
                                        hooks.empty.fire();
                                }
                        });
                });
        }

        // height/width overflow pass
        if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
                // Make sure that nothing sneaks out
                // Record all 3 overflow attributes because IE does not
                // change the overflow attribute when overflowX and
                // overflowY are set to the same value
                opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

                // Set display property to inline-block for height/width
                // animations on inline elements that are having width/height animated
                if ( jQuery.css( elem, "display" ) === "inline" &&
                                jQuery.css( elem, "float" ) === "none" ) {

                        // inline-level elements accept inline-block;
                        // block-level elements need to be inline with layout
                        if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
                                style.display = "inline-block";

                        } else {
                                style.zoom = 1;
                        }
                }
        }

        if ( opts.overflow ) {
                style.overflow = "hidden";
                if ( !jQuery.support.shrinkWrapBlocks ) {
                        anim.done(function() {
                                style.overflow = opts.overflow[ 0 ];
                                style.overflowX = opts.overflow[ 1 ];
                                style.overflowY = opts.overflow[ 2 ];
                        });
                }
        }


        // show/hide pass
        for ( index in props ) {
                value = props[ index ];
                if ( rfxtypes.exec( value ) ) {
                        delete props[ index ];
                        toggle = toggle || value === "toggle";
                        if ( value === ( hidden ? "hide" : "show" ) ) {
                                continue;
                        }
                        handled.push( index );
                }
        }

        length = handled.length;
        if ( length ) {
                dataShow = jQuery._data( elem, "fxshow" ) || jQuery._data( elem, "fxshow", {} );
                if ( "hidden" in dataShow ) {
                        hidden = dataShow.hidden;
                }

                // store state if its toggle - enables .stop().toggle() to "reverse"
                if ( toggle ) {
                        dataShow.hidden = !hidden;
                }
                if ( hidden ) {
                        jQuery( elem ).show();
                } else {
                        anim.done(function() {
                                jQuery( elem ).hide();
                        });
                }
                anim.done(function() {
                        var prop;
                        jQuery.removeData( elem, "fxshow", true );
                        for ( prop in orig ) {
                                jQuery.style( elem, prop, orig[ prop ] );
                        }
                });
                for ( index = 0 ; index < length ; index++ ) {
                        prop = handled[ index ];
                        tween = anim.createTween( prop, hidden ? dataShow[ prop ] : 0 );
                        orig[ prop ] = dataShow[ prop ] || jQuery.style( elem, prop );

                        if ( !( prop in dataShow ) ) {
                                dataShow[ prop ] = tween.start;
                                if ( hidden ) {
                                        tween.end = tween.start;
                                        tween.start = prop === "width" || prop === "height" ? 1 : 0;
                                }
                        }
                }
        }
}

function Tween( elem, options, prop, end, easing ) {
        return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
        constructor: Tween,
        init: function( elem, options, prop, end, easing, unit ) {
                this.elem = elem;
                this.prop = prop;
                this.easing = easing || "swing";
                this.options = options;
                this.start = this.now = this.cur();
                this.end = end;
                this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
        },
        cur: function() {
                var hooks = Tween.propHooks[ this.prop ];

                return hooks && hooks.get ?
                        hooks.get( this ) :
                        Tween.propHooks._default.get( this );
        },
        run: function( percent ) {
                var eased,
                        hooks = Tween.propHooks[ this.prop ];

                if ( this.options.duration ) {
                        this.pos = eased = jQuery.easing[ this.easing ](
                                percent, this.options.duration * percent, 0, 1, this.options.duration
                        );
                } else {
                        this.pos = eased = percent;
                }
                this.now = ( this.end - this.start ) * eased + this.start;

                if ( this.options.step ) {
                        this.options.step.call( this.elem, this.now, this );
                }

                if ( hooks && hooks.set ) {
                        hooks.set( this );
                } else {
                        Tween.propHooks._default.set( this );
                }
                return this;
        }
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
        _default: {
                get: function( tween ) {
                        var result;

                        if ( tween.elem[ tween.prop ] != null &&
                                (!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
                                return tween.elem[ tween.prop ];
                        }

                        // passing any value as a 4th parameter to .css will automatically
                        // attempt a parseFloat and fallback to a string if the parse fails
                        // so, simple values such as "10px" are parsed to Float.
                        // complex values such as "rotate(1rad)" are returned as is.
                        result = jQuery.css( tween.elem, tween.prop, false, "" );
                        // Empty strings, null, undefined and "auto" are converted to 0.
                        return !result || result === "auto" ? 0 : result;
                },
                set: function( tween ) {
                        // use step hook for back compat - use cssHook if its there - use .style if its
                        // available and use plain properties where available
                        if ( jQuery.fx.step[ tween.prop ] ) {
                                jQuery.fx.step[ tween.prop ]( tween );
                        } else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
                                jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
                        } else {
                                tween.elem[ tween.prop ] = tween.now;
                        }
                }
        }
};

// Remove in 2.0 - this supports IE8's panic based approach
// to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function( tween ) {
                if ( tween.elem.nodeType && tween.elem.parentNode ) {
                        tween.elem[ tween.prop ] = tween.now;
                }
        }
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
        var cssFn = jQuery.fn[ name ];
        jQuery.fn[ name ] = function( speed, easing, callback ) {
                return speed == null || typeof speed === "boolean" ||
                        // special check for .toggle( handler, handler, ... )
                        ( !i && jQuery.isFunction( speed ) && jQuery.isFunction( easing ) ) ?
                        cssFn.apply( this, arguments ) :
                        this.animate( genFx( name, true ), speed, easing, callback );
        };
});

jQuery.fn.extend({
        fadeTo: function( speed, to, easing, callback ) {

                // show any hidden elements after setting opacity to 0
                return this.filter( isHidden ).css( "opacity", 0 ).show()

                        // animate to the value specified
                        .end().animate({ opacity: to }, speed, easing, callback );
        },
        animate: function( prop, speed, easing, callback ) {
                var empty = jQuery.isEmptyObject( prop ),
                        optall = jQuery.speed( speed, easing, callback ),
                        doAnimation = function() {
                                // Operate on a copy of prop so per-property easing won't be lost
                                var anim = Animation( this, jQuery.extend( {}, prop ), optall );

                                // Empty animations resolve immediately
                                if ( empty ) {
                                        anim.stop( true );
                                }
                        };

                return empty || optall.queue === false ?
                        this.each( doAnimation ) :
                        this.queue( optall.queue, doAnimation );
        },
        stop: function( type, clearQueue, gotoEnd ) {
                var stopQueue = function( hooks ) {
                        var stop = hooks.stop;
                        delete hooks.stop;
                        stop( gotoEnd );
                };

                if ( typeof type !== "string" ) {
                        gotoEnd = clearQueue;
                        clearQueue = type;
                        type = undefined;
                }
                if ( clearQueue && type !== false ) {
                        this.queue( type || "fx", [] );
                }

                return this.each(function() {
                        var dequeue = true,
                                index = type != null && type + "queueHooks",
                                timers = jQuery.timers,
                                data = jQuery._data( this );

                        if ( index ) {
                                if ( data[ index ] && data[ index ].stop ) {
                                        stopQueue( data[ index ] );
                                }
                        } else {
                                for ( index in data ) {
                                        if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
                                                stopQueue( data[ index ] );
                                        }
                                }
                        }

                        for ( index = timers.length; index--; ) {
                                if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
                                        timers[ index ].anim.stop( gotoEnd );
                                        dequeue = false;
                                        timers.splice( index, 1 );
                                }
                        }

                        // start the next in the queue if the last step wasn't forced
                        // timers currently will call their complete callbacks, which will dequeue
                        // but only if they were gotoEnd
                        if ( dequeue || !gotoEnd ) {
                                jQuery.dequeue( this, type );
                        }
                });
        }
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
        var which,
                attrs = { height: type },
                i = 0;

        // if we include width, step value is 1 to do all cssExpand values,
        // if we don't include width, step value is 2 to skip over Left and Right
        includeWidth = includeWidth? 1 : 0;
        for( ; i < 4 ; i += 2 - includeWidth ) {
                which = cssExpand[ i ];
                attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
        }

        if ( includeWidth ) {
                attrs.opacity = attrs.width = type;
        }

        return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: { opacity: "show" },
        fadeOut: { opacity: "hide" },
        fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
        jQuery.fn[ name ] = function( speed, easing, callback ) {
                return this.animate( props, speed, easing, callback );
        };
});

jQuery.speed = function( speed, easing, fn ) {
        var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
                complete: fn || !fn && easing ||
                        jQuery.isFunction( speed ) && speed,
                duration: speed,
                easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
        };

        opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
                opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

        // normalize opt.queue - true/undefined/null -> "fx"
        if ( opt.queue == null || opt.queue === true ) {
                opt.queue = "fx";
        }

        // Queueing
        opt.old = opt.complete;

        opt.complete = function() {
                if ( jQuery.isFunction( opt.old ) ) {
                        opt.old.call( this );
                }

                if ( opt.queue ) {
                        jQuery.dequeue( this, opt.queue );
                }
        };

        return opt;
};

jQuery.easing = {
        linear: function( p ) {
                return p;
        },
        swing: function( p ) {
                return 0.5 - Math.cos( p*Math.PI ) / 2;
        }
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
        var timer,
                timers = jQuery.timers,
                i = 0;

        fxNow = jQuery.now();

        for ( ; i < timers.length; i++ ) {
                timer = timers[ i ];
                // Checks the timer has not already been removed
                if ( !timer() && timers[ i ] === timer ) {
                        timers.splice( i--, 1 );
                }
        }

        if ( !timers.length ) {
                jQuery.fx.stop();
        }
        fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
        if ( timer() && jQuery.timers.push( timer ) && !timerId ) {
                timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
        }
};

jQuery.fx.interval = 13;

jQuery.fx.stop = function() {
        clearInterval( timerId );
        timerId = null;
};

jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        // Default speed
        _default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
        jQuery.expr.filters.animated = function( elem ) {
                return jQuery.grep(jQuery.timers, function( fn ) {
                        return elem === fn.elem;
                }).length;
        };
}
var rroot = /^(?:body|html)$/i;

jQuery.fn.offset = function( options ) {
        if ( arguments.length ) {
                return options === undefined ?
                        this :
                        this.each(function( i ) {
                                jQuery.offset.setOffset( this, options, i );
                        });
        }

        var docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft,
                box = { top: 0, left: 0 },
                elem = this[ 0 ],
                doc = elem && elem.ownerDocument;

        if ( !doc ) {
                return;
        }

        if ( (body = doc.body) === elem ) {
                return jQuery.offset.bodyOffset( elem );
        }

        docElem = doc.documentElement;

        // Make sure it's not a disconnected DOM node
        if ( !jQuery.contains( docElem, elem ) ) {
                return box;
        }

        // If we don't have gBCR, just use 0,0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        if ( typeof elem.getBoundingClientRect !== "undefined" ) {
                box = elem.getBoundingClientRect();
        }
        win = getWindow( doc );
        clientTop  = docElem.clientTop  || body.clientTop  || 0;
        clientLeft = docElem.clientLeft || body.clientLeft || 0;
        scrollTop  = win.pageYOffset || docElem.scrollTop;
        scrollLeft = win.pageXOffset || docElem.scrollLeft;
        return {
                top: box.top  + scrollTop  - clientTop,
                left: box.left + scrollLeft - clientLeft
        };
};

jQuery.offset = {

        bodyOffset: function( body ) {
                var top = body.offsetTop,
                        left = body.offsetLeft;

                if ( jQuery.support.doesNotIncludeMarginInBodyOffset ) {
                        top  += parseFloat( jQuery.css(body, "marginTop") ) || 0;
                        left += parseFloat( jQuery.css(body, "marginLeft") ) || 0;
                }

                return { top: top, left: left };
        },

        setOffset: function( elem, options, i ) {
                var position = jQuery.css( elem, "position" );

                // set position first, in-case top/left are set even on static elem
                if ( position === "static" ) {
                        elem.style.position = "relative";
                }

                var curElem = jQuery( elem ),
                        curOffset = curElem.offset(),
                        curCSSTop = jQuery.css( elem, "top" ),
                        curCSSLeft = jQuery.css( elem, "left" ),
                        calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
                        props = {}, curPosition = {}, curTop, curLeft;

                // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
                if ( calculatePosition ) {
                        curPosition = curElem.position();
                        curTop = curPosition.top;
                        curLeft = curPosition.left;
                } else {
                        curTop = parseFloat( curCSSTop ) || 0;
                        curLeft = parseFloat( curCSSLeft ) || 0;
                }

                if ( jQuery.isFunction( options ) ) {
                        options = options.call( elem, i, curOffset );
                }

                if ( options.top != null ) {
                        props.top = ( options.top - curOffset.top ) + curTop;
                }
                if ( options.left != null ) {
                        props.left = ( options.left - curOffset.left ) + curLeft;
                }

                if ( "using" in options ) {
                        options.using.call( elem, props );
                } else {
                        curElem.css( props );
                }
        }
};


jQuery.fn.extend({

        position: function() {
                if ( !this[0] ) {
                        return;
                }

                var elem = this[0],

                // Get *real* offsetParent
                offsetParent = this.offsetParent(),

                // Get correct offsets
                offset       = this.offset(),
                parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

                // Subtract element margins
                // note: when an element has margin: auto the offsetLeft and marginLeft
                // are the same in Safari causing offset.left to incorrectly be 0
                offset.top  -= parseFloat( jQuery.css(elem, "marginTop") ) || 0;
                offset.left -= parseFloat( jQuery.css(elem, "marginLeft") ) || 0;

                // Add offsetParent borders
                parentOffset.top  += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;
                parentOffset.left += parseFloat( jQuery.css(offsetParent[0], "borderLeftWidth") ) || 0;

                // Subtract the two offsets
                return {
                        top:  offset.top  - parentOffset.top,
                        left: offset.left - parentOffset.left
                };
        },

        offsetParent: function() {
                return this.map(function() {
                        var offsetParent = this.offsetParent || document.body;
                        while ( offsetParent && (!rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
                                offsetParent = offsetParent.offsetParent;
                        }
                        return offsetParent || document.body;
                });
        }
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
        var top = /Y/.test( prop );

        jQuery.fn[ method ] = function( val ) {
                return jQuery.access( this, function( elem, method, val ) {
                        var win = getWindow( elem );

                        if ( val === undefined ) {
                                return win ? (prop in win) ? win[ prop ] :
                                        win.document.documentElement[ method ] :
                                        elem[ method ];
                        }

                        if ( win ) {
                                win.scrollTo(
                                        !top ? val : jQuery( win ).scrollLeft(),
                                         top ? val : jQuery( win ).scrollTop()
                                );

                        } else {
                                elem[ method ] = val;
                        }
                }, method, val, arguments.length, null );
        };
});

function getWindow( elem ) {
        return jQuery.isWindow( elem ) ?
                elem :
                elem.nodeType === 9 ?
                        elem.defaultView || elem.parentWindow :
                        false;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
        jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
                // margin is only for outerHeight, outerWidth
                jQuery.fn[ funcName ] = function( margin, value ) {
                        var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
                                extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

                        return jQuery.access( this, function( elem, type, value ) {
                                var doc;

                                if ( jQuery.isWindow( elem ) ) {
                                        // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
                                        // isn't a whole lot we can do. See pull request at this URL for discussion:
                                        // https://github.com/jquery/jquery/pull/764
                                        return elem.document.documentElement[ "client" + name ];
                                }

                                // Get document width or height
                                if ( elem.nodeType === 9 ) {
                                        doc = elem.documentElement;

                                        // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
                                        // unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
                                        return Math.max(
                                                elem.body[ "scroll" + name ], doc[ "scroll" + name ],
                                                elem.body[ "offset" + name ], doc[ "offset" + name ],
                                                doc[ "client" + name ]
                                        );
                                }

                                return value === undefined ?
                                        // Get width or height on the element, requesting but not forcing parseFloat
                                        jQuery.css( elem, type, value, extra ) :

                                        // Set width or height on the element
                                        jQuery.style( elem, type, value, extra );
                        }, type, chainable ? margin : undefined, chainable, null );
                };
        });
});
// Expose jQuery to the global object
window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
        define( "jquery", [], function () { return jQuery; } );
}

})( window );

/* ===================================================
 * bootstrap-transition.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


  /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
   * ======================================================= */

  $(function () {

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd otransitionend'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);/* ==========================================================
 * bootstrap-alert.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#alerts
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.alert

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT NO CONFLICT
  * ================= */

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


 /* ALERT DATA-API
  * ============== */

  $(document).on('click.alert.data-api', dismiss, Alert.prototype.close)

}(window.jQuery);/* ============================================================
 * bootstrap-button.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }

  Button.prototype.setState = function (state) {
    var d = 'disabled'
      , $el = this.$element
      , data = $el.data()
      , val = $el.is('input') ? 'val' : 'html'

    state = state + 'Text'
    data.resetText || $el.data('resetText', $el[val]())

    $el[val](data[state] || this.options[state])

    // push to event loop to allow forms to submit
    setTimeout(function () {
      state == 'loadingText' ?
        $el.addClass(d).attr(d, d) :
        $el.removeClass(d).removeAttr(d)
    }, 0)
  }

  Button.prototype.toggle = function () {
    var $parent = this.$element.closest('[data-toggle="buttons-radio"]')

    $parent && $parent
      .find('.active')
      .removeClass('active')

    this.$element.toggleClass('active')
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  var old = $.fn.button

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON NO CONFLICT
  * ================== */

  $.fn.button.noConflict = function () {
    $.fn.button = old
    return this
  }


 /* BUTTON DATA-API
  * =============== */

  $(document).on('click.button.data-api', '[data-toggle^=button]', function (e) {
    var $btn = $(e.target)
    if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
    $btn.button('toggle')
  })

}(window.jQuery);/* ==========================================================
 * bootstrap-carousel.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#carousel
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* CAROUSEL CLASS DEFINITION
  * ========================= */

  var Carousel = function (element, options) {
    this.$element = $(element)
    this.$indicators = this.$element.find('.carousel-indicators')
    this.options = options
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
  }

  Carousel.prototype = {

    cycle: function (e) {
      if (!e) this.paused = false
      if (this.interval) clearInterval(this.interval);
      this.options.interval
        && !this.paused
        && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      return this
    }

  , getActiveIndex: function () {
      this.$active = this.$element.find('.item.active')
      this.$items = this.$active.parent().children()
      return this.$items.index(this.$active)
    }

  , to: function (pos) {
      var activeIndex = this.getActiveIndex()
        , that = this

      if (pos > (this.$items.length - 1) || pos < 0) return

      if (this.sliding) {
        return this.$element.one('slid', function () {
          that.to(pos)
        })
      }

      if (activeIndex == pos) {
        return this.pause().cycle()
      }

      return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
    }

  , pause: function (e) {
      if (!e) this.paused = true
      if (this.$element.find('.next, .prev').length && $.support.transition.end) {
        this.$element.trigger($.support.transition.end)
        this.cycle(true)
      }
      clearInterval(this.interval)
      this.interval = null
      return this
    }

  , next: function () {
      if (this.sliding) return
      return this.slide('next')
    }

  , prev: function () {
      if (this.sliding) return
      return this.slide('prev')
    }

  , slide: function (type, next) {
      var $active = this.$element.find('.item.active')
        , $next = next || $active[type]()
        , isCycling = this.interval
        , direction = type == 'next' ? 'left' : 'right'
        , fallback  = type == 'next' ? 'first' : 'last'
        , that = this
        , e

      this.sliding = true

      isCycling && this.pause()

      $next = $next.length ? $next : this.$element.find('.item')[fallback]()

      e = $.Event('slide', {
        relatedTarget: $next[0]
      , direction: direction
      })

      if ($next.hasClass('active')) return

      if (this.$indicators.length) {
        this.$indicators.find('.active').removeClass('active')
        this.$element.one('slid', function () {
          var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
          $nextIndicator && $nextIndicator.addClass('active')
        })
      }

      if ($.support.transition && this.$element.hasClass('slide')) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $next.addClass(type)
        $next[0].offsetWidth // force reflow
        $active.addClass(direction)
        $next.addClass(direction)
        this.$element.one($.support.transition.end, function () {
          $next.removeClass([type, direction].join(' ')).addClass('active')
          $active.removeClass(['active', direction].join(' '))
          that.sliding = false
          setTimeout(function () { that.$element.trigger('slid') }, 0)
        })
      } else {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $active.removeClass('active')
        $next.addClass('active')
        this.sliding = false
        this.$element.trigger('slid')
      }

      isCycling && this.cycle()

      return this
    }

  }


 /* CAROUSEL PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.carousel

  $.fn.carousel = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('carousel')
        , options = $.extend({}, $.fn.carousel.defaults, typeof option == 'object' && option)
        , action = typeof option == 'string' ? option : options.slide
      if (!data) $this.data('carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action]()
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.defaults = {
    interval: 5000
  , pause: 'hover'
  }

  $.fn.carousel.Constructor = Carousel


 /* CAROUSEL NO CONFLICT
  * ==================== */

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }

 /* CAROUSEL DATA-API
  * ================= */

  $(document).on('click.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this = $(this), href
      , $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      , options = $.extend({}, $target.data(), $this.data())
      , slideIndex

    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('carousel').pause().to(slideIndex).cycle()
    }

    e.preventDefault()
  })

}(window.jQuery);/* =============================================================
 * bootstrap-collapse.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning || this.$element.hasClass('in')) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning || !this.$element.hasClass('in')) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSE PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.collapse

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = $.extend({}, $.fn.collapse.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSE NO CONFLICT
  * ==================== */

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old
    return this
  }


 /* COLLAPSE DATA-API
  * ================= */

  $(document).on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
    var $this = $(this), href
      , target = $this.attr('data-target')
        || e.preventDefault()
        || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
      , option = $(target).data('collapse') ? 'toggle' : $this.data()
    $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
    $(target).collapse(option)
  })

}(window.jQuery);/* ============================================================
 * bootstrap-dropdown.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        $parent.toggleClass('open')
      }

      $this.focus()

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) {
        if (e.which == 27) $parent.find(toggle).focus()
        return $this.click()
      }

      $items = $('[role=menu] li:not(.divider):visible a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    $(toggle).each(function () {
      getParent($(this)).removeClass('open')
    })
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = selector && $(selector)

    if (!$parent || !$parent.length) $parent = $this.parent()

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  var old = $.fn.dropdown

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


 /* DROPDOWN NO CONFLICT
  * ==================== */

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(document)
    .on('click.dropdown.data-api', clearMenus)
    .on('click.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.dropdown-menu', function (e) { e.stopPropagation() })
    .on('click.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
    .on('keydown.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)

}(window.jQuery);
/* =========================================================
 * bootstrap-modal.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#modals
 * =========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


!function ($) {

  "use strict"; // jshint ;_;


 /* MODAL CLASS DEFINITION
  * ====================== */

  var Modal = function (element, options) {
    this.options = options
    this.$element = $(element)
      .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this))
    this.options.remote && this.$element.find('.modal-body').load(this.options.remote)
  }

  Modal.prototype = {

      constructor: Modal

    , toggle: function () {
        return this[!this.isShown ? 'show' : 'hide']()
      }

    , show: function () {
        var that = this
          , e = $.Event('show')

        this.$element.trigger(e)

        if (this.isShown || e.isDefaultPrevented()) return

        this.isShown = true

        this.escape()

        this.backdrop(function () {
          var transition = $.support.transition && that.$element.hasClass('fade')

          if (!that.$element.parent().length) {
            that.$element.appendTo(document.body) //don't move modals dom position
          }

          that.$element.show()

          if (transition) {
            that.$element[0].offsetWidth // force reflow
          }

          that.$element
            .addClass('in')
            .attr('aria-hidden', false)

          that.enforceFocus()

          transition ?
            that.$element.one($.support.transition.end, function () { that.$element.focus().trigger('shown') }) :
            that.$element.focus().trigger('shown')

        })
      }

    , hide: function (e) {
        e && e.preventDefault()

        var that = this

        e = $.Event('hide')

        this.$element.trigger(e)

        if (!this.isShown || e.isDefaultPrevented()) return

        this.isShown = false

        this.escape()

        $(document).off('focusin.modal')

        this.$element
          .removeClass('in')
          .attr('aria-hidden', true)

        $.support.transition && this.$element.hasClass('fade') ?
          this.hideWithTransition() :
          this.hideModal()
      }

    , enforceFocus: function () {
        var that = this
        $(document).on('focusin.modal', function (e) {
          if (that.$element[0] !== e.target && !that.$element.has(e.target).length) {
            that.$element.focus()
          }
        })
      }

    , escape: function () {
        var that = this
        if (this.isShown && this.options.keyboard) {
          this.$element.on('keyup.dismiss.modal', function ( e ) {
            e.which == 27 && that.hide()
          })
        } else if (!this.isShown) {
          this.$element.off('keyup.dismiss.modal')
        }
      }

    , hideWithTransition: function () {
        var that = this
          , timeout = setTimeout(function () {
              that.$element.off($.support.transition.end)
              that.hideModal()
            }, 500)

        this.$element.one($.support.transition.end, function () {
          clearTimeout(timeout)
          that.hideModal()
        })
      }

    , hideModal: function () {
        var that = this
        this.$element.hide()
        this.backdrop(function () {
          that.removeBackdrop()
          that.$element.trigger('hidden')
        })
      }

    , removeBackdrop: function () {
        this.$backdrop && this.$backdrop.remove()
        this.$backdrop = null
      }

    , backdrop: function (callback) {
        var that = this
          , animate = this.$element.hasClass('fade') ? 'fade' : ''

        if (this.isShown && this.options.backdrop) {
          var doAnimate = $.support.transition && animate

          this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
            .appendTo(document.body)

          this.$backdrop.click(
            this.options.backdrop == 'static' ?
              $.proxy(this.$element[0].focus, this.$element[0])
            : $.proxy(this.hide, this)
          )

          if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

          this.$backdrop.addClass('in')

          if (!callback) return

          doAnimate ?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (!this.isShown && this.$backdrop) {
          this.$backdrop.removeClass('in')

          $.support.transition && this.$element.hasClass('fade')?
            this.$backdrop.one($.support.transition.end, callback) :
            callback()

        } else if (callback) {
          callback()
        }
      }
  }


 /* MODAL PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.modal

  $.fn.modal = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('modal')
        , options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option)
      if (!data) $this.data('modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option]()
      else if (options.show) data.show()
    })
  }

  $.fn.modal.defaults = {
      backdrop: true
    , keyboard: true
    , show: true
  }

  $.fn.modal.Constructor = Modal


 /* MODAL NO CONFLICT
  * ================= */

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


 /* MODAL DATA-API
  * ============== */

  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })

}(window.jQuery);
/* ===========================================================
 * bootstrap-tooltip.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var defaults = $.fn[this.type].defaults
        , options = {}
        , self

      this._options && $.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      }, this)

      self = $(e.currentTarget)[this.type](options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
/* ===========================================================
 * bootstrap-popover.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#popovers
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* POPOVER PUBLIC CLASS DEFINITION
  * =============================== */

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }


  /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
     ========================================== */

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype, {

    constructor: Popover

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()
        , content = this.getContent()

      $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
      $tip.find('.popover-content')[this.options.html ? 'html' : 'text'](content)

      $tip.removeClass('fade top bottom left right in')
    }

  , hasContent: function () {
      return this.getTitle() || this.getContent()
    }

  , getContent: function () {
      var content
        , $e = this.$element
        , o = this.options

      content = (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)
        || $e.attr('data-content')

      return content
    }

  , tip: function () {
      if (!this.$tip) {
        this.$tip = $(this.options.template)
      }
      return this.$tip
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  })


 /* POPOVER PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.popover

  $.fn.popover = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('popover')
        , options = typeof option == 'object' && option
      if (!data) $this.data('popover', (data = new Popover(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.popover.Constructor = Popover

  $.fn.popover.defaults = $.extend({} , $.fn.tooltip.defaults, {
    placement: 'right'
  , trigger: 'click'
  , content: ''
  , template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


 /* POPOVER NO CONFLICT
  * =================== */

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(window.jQuery);
/* =============================================================
 * bootstrap-scrollspy.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#scrollspy
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* SCROLLSPY CLASS DEFINITION
  * ========================== */

  function ScrollSpy(element, options) {
    var process = $.proxy(this.process, this)
      , $element = $(element).is('body') ? $(window) : $(element)
      , href
    this.options = $.extend({}, $.fn.scrollspy.defaults, options)
    this.$scrollElement = $element.on('scroll.scroll-spy.data-api', process)
    this.selector = (this.options.target
      || ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
      || '') + ' .nav li > a'
    this.$body = $('body')
    this.refresh()
    this.process()
  }

  ScrollSpy.prototype = {

      constructor: ScrollSpy

    , refresh: function () {
        var self = this
          , $targets

        this.offsets = $([])
        this.targets = $([])

        $targets = this.$body
          .find(this.selector)
          .map(function () {
            var $el = $(this)
              , href = $el.data('target') || $el.attr('href')
              , $href = /^#\w/.test(href) && $(href)
            return ( $href
              && $href.length
              && [[ $href.position().top + (!$.isWindow(self.$scrollElement.get(0)) && self.$scrollElement.scrollTop()), href ]] ) || null
          })
          .sort(function (a, b) { return a[0] - b[0] })
          .each(function () {
            self.offsets.push(this[0])
            self.targets.push(this[1])
          })
      }

    , process: function () {
        var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
          , scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
          , maxScroll = scrollHeight - this.$scrollElement.height()
          , offsets = this.offsets
          , targets = this.targets
          , activeTarget = this.activeTarget
          , i

        if (scrollTop >= maxScroll) {
          return activeTarget != (i = targets.last()[0])
            && this.activate ( i )
        }

        for (i = offsets.length; i--;) {
          activeTarget != targets[i]
            && scrollTop >= offsets[i]
            && (!offsets[i + 1] || scrollTop <= offsets[i + 1])
            && this.activate( targets[i] )
        }
      }

    , activate: function (target) {
        var active
          , selector

        this.activeTarget = target

        $(this.selector)
          .parent('.active')
          .removeClass('active')

        selector = this.selector
          + '[data-target="' + target + '"],'
          + this.selector + '[href="' + target + '"]'

        active = $(selector)
          .parent('li')
          .addClass('active')

        if (active.parent('.dropdown-menu').length)  {
          active = active.closest('li.dropdown').addClass('active')
        }

        active.trigger('activate')
      }

  }


 /* SCROLLSPY PLUGIN DEFINITION
  * =========================== */

  var old = $.fn.scrollspy

  $.fn.scrollspy = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('scrollspy')
        , options = typeof option == 'object' && option
      if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.scrollspy.Constructor = ScrollSpy

  $.fn.scrollspy.defaults = {
    offset: 10
  }


 /* SCROLLSPY NO CONFLICT
  * ===================== */

  $.fn.scrollspy.noConflict = function () {
    $.fn.scrollspy = old
    return this
  }


 /* SCROLLSPY DATA-API
  * ================== */

  $(window).on('load', function () {
    $('[data-spy="scroll"]').each(function () {
      var $spy = $(this)
      $spy.scrollspy($spy.data())
    })
  })

}(window.jQuery);/* ========================================================
 * bootstrap-tab.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#tabs
 * ========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TAB CLASS DEFINITION
  * ==================== */

  var Tab = function (element) {
    this.element = $(element)
  }

  Tab.prototype = {

    constructor: Tab

  , show: function () {
      var $this = this.element
        , $ul = $this.closest('ul:not(.dropdown-menu)')
        , selector = $this.attr('data-target')
        , previous
        , $target
        , e

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      if ( $this.parent('li').hasClass('active') ) return

      previous = $ul.find('.active:last a')[0]

      e = $.Event('show', {
        relatedTarget: previous
      })

      $this.trigger(e)

      if (e.isDefaultPrevented()) return

      $target = $(selector)

      this.activate($this.parent('li'), $ul)
      this.activate($target, $target.parent(), function () {
        $this.trigger({
          type: 'shown'
        , relatedTarget: previous
        })
      })
    }

  , activate: function ( element, container, callback) {
      var $active = container.find('> .active')
        , transition = callback
            && $.support.transition
            && $active.hasClass('fade')

      function next() {
        $active
          .removeClass('active')
          .find('> .dropdown-menu > .active')
          .removeClass('active')

        element.addClass('active')

        if (transition) {
          element[0].offsetWidth // reflow for transition
          element.addClass('in')
        } else {
          element.removeClass('fade')
        }

        if ( element.parent('.dropdown-menu') ) {
          element.closest('li.dropdown').addClass('active')
        }

        callback && callback()
      }

      transition ?
        $active.one($.support.transition.end, next) :
        next()

      $active.removeClass('in')
    }
  }


 /* TAB PLUGIN DEFINITION
  * ===================== */

  var old = $.fn.tab

  $.fn.tab = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tab')
      if (!data) $this.data('tab', (data = new Tab(this)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tab.Constructor = Tab


 /* TAB NO CONFLICT
  * =============== */

  $.fn.tab.noConflict = function () {
    $.fn.tab = old
    return this
  }


 /* TAB DATA-API
  * ============ */

  $(document).on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

}(window.jQuery);/* =============================================================
 * bootstrap-typeahead.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#typeahead
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function($){

  "use strict"; // jshint ;_;


 /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.typeahead.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.source = this.options.source
    this.$menu = $(this.options.menu)
    this.shown = false
    this.listen()
  }

  Typeahead.prototype = {

    constructor: Typeahead

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function (item) {
      return item
    }

  , show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu
        .insertAfter(this.$element)
        .css({
          top: pos.top + pos.height
        , left: pos.left
        })
        .show()

      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }

      return this.render(items.slice(0, this.options.items)).show()
    }

  , matcher: function (item) {
      return ~item.toLowerCase().indexOf(this.query.toLowerCase())
    }

  , sorter: function (items) {
      var beginswith = []
        , caseSensitive = []
        , caseInsensitive = []
        , item

      while (item = items.shift()) {
        if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
        else if (~item.indexOf(this.query)) caseSensitive.push(item)
        else caseInsensitive.push(item)
      }

      return beginswith.concat(caseSensitive, caseInsensitive)
    }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function (items) {
      var that = this

      items = $(items).map(function (i, item) {
        i = $(that.options.item).attr('data-value', item)
        i.find('a').html(that.highlighter(item))
        return i[0]
      })

      items.first().addClass('active')
      this.$menu.html(items)
      return this
    }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , focus: function (e) {
      this.focused = true
    }

  , blur: function (e) {
      this.focused = false
      if (!this.mousedover && this.shown) this.hide()
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
      this.$element.focus()
    }

  , mouseenter: function (e) {
      this.mousedover = true
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  , mouseleave: function (e) {
      this.mousedover = false
      if (!this.focused && this.shown) this.hide()
    }

  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead

  $.fn.typeahead = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('typeahead')
        , options = typeof option == 'object' && option
      if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.typeahead.defaults = {
    source: []
  , items: 8
  , menu: '<ul class="typeahead dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.typeahead.Constructor = Typeahead


 /* TYPEAHEAD NO CONFLICT
  * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old
    return this
  }


 /* TYPEAHEAD DATA-API
  * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this)
    if ($this.data('typeahead')) return
    $this.typeahead($this.data())
  })

}(window.jQuery);
/* ==========================================================
 * bootstrap-affix.js v2.3.1
 * http://twitter.github.com/bootstrap/javascript.html#affix
 * ==========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* AFFIX CLASS DEFINITION
  * ====================== */

  var Affix = function (element, options) {
    this.options = $.extend({}, $.fn.affix.defaults, options)
    this.$window = $(window)
      .on('scroll.affix.data-api', $.proxy(this.checkPosition, this))
      .on('click.affix.data-api',  $.proxy(function () { setTimeout($.proxy(this.checkPosition, this), 1) }, this))
    this.$element = $(element)
    this.checkPosition()
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var scrollHeight = $(document).height()
      , scrollTop = this.$window.scrollTop()
      , position = this.$element.offset()
      , offset = this.options.offset
      , offsetBottom = offset.bottom
      , offsetTop = offset.top
      , reset = 'affix affix-top affix-bottom'
      , affix

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top()
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom()

    affix = this.unpin != null && (scrollTop + this.unpin <= position.top) ?
      false    : offsetBottom != null && (position.top + this.$element.height() >= scrollHeight - offsetBottom) ?
      'bottom' : offsetTop != null && scrollTop <= offsetTop ?
      'top'    : false

    if (this.affixed === affix) return

    this.affixed = affix
    this.unpin = affix == 'bottom' ? position.top - scrollTop : null

    this.$element.removeClass(reset).addClass('affix' + (affix ? '-' + affix : ''))
  }


 /* AFFIX PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.affix

  $.fn.affix = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('affix')
        , options = typeof option == 'object' && option
      if (!data) $this.data('affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.affix.Constructor = Affix

  $.fn.affix.defaults = {
    offset: 0
  }


 /* AFFIX NO CONFLICT
  * ================= */

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }


 /* AFFIX DATA-API
  * ============== */

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
        , data = $spy.data()

      data.offset = data.offset || {}

      data.offsetBottom && (data.offset.bottom = data.offsetBottom)
      data.offsetTop && (data.offset.top = data.offsetTop)

      $spy.affix(data)
    })
  })


}(window.jQuery);
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

this.JS=this.JS||{};JS.extend=function(a,b){b=b||{};for(var c in b){if(a[c]===b[c])continue;a[c]=b[c]}return a};JS.extend(JS,{makeFunction:function(){return function(){return this.initialize?(this.initialize.apply(this,arguments)||this):this}},makeBridge:function(a){var b=function(){};b.prototype=a.prototype;return new b},bind:function(){var a=JS.array(arguments),b=a.shift(),c=a.shift()||null;return function(){return b.apply(c,a.concat(JS.array(arguments)))}},callsSuper:function(a){return a.SUPER===undefined?a.SUPER=/\bcallSuper\b/.test(a.toString()):a.SUPER},mask:function(a){var b=a.toString().replace(/callSuper/g,'super');a.toString=function(){return b};return a},array:function(a){if(!a)return[];if(a.toArray)return a.toArray();var b=a.length,c=[];while(b--)c[b]=a[b];return c},indexOf:function(a,b){for(var c=0,d=a.length;c<d;c++){if(a[c]===b)return c}return-1},isFn:function(a){return a instanceof Function},isType:function(a,b){if(!a||!b)return false;return(b instanceof Function&&a instanceof b)||(typeof b==='string'&&typeof a===b)||(a.isA&&a.isA(b))},ignore:function(a,b){return/^(include|extend)$/.test(a)&&typeof b==='object'}});JS.Module=JS.makeFunction();JS.extend(JS.Module.prototype,{END_WITHOUT_DOT:/([^\.])$/,initialize:function(a,b,c){this.__mod__=this;this.__inc__=[];this.__fns__={};this.__dep__=[];this.__mct__={};if(typeof a==='string'){this.__nom__=this.displayName=a}else{this.__nom__=this.displayName='';c=b;b=a}c=c||{};this.__res__=c._1||null;if(b)this.include(b,false);if(JS.Module.__chainq__)JS.Module.__chainq__.push(this)},setName:function(a){this.__nom__=this.displayName=a||'';for(var b in this.__mod__.__fns__)this.__name__(b);if(a&&this.__meta__)this.__meta__.setName(a+'.')},__name__:function(a){if(!this.__nom__)return;var b=this.__mod__.__fns__[a]||{};a=this.__nom__.replace(this.END_WITHOUT_DOT,'$1#')+a;if(JS.isFn(b.setName))return b.setName(a);if(JS.isFn(b))b.displayName=a},define:function(a,b,c,d){var f=(d||{})._0||this;this.__fns__[a]=b;this.__name__(a);if(JS.Module._0&&f&&JS.isFn(b))JS.Module._0(a,f);if(c!==false)this.resolve()},instanceMethod:function(a){var b=this.lookup(a).pop();return JS.isFn(b)?b:null},instanceMethods:function(a,b){var c=this.__mod__,b=b||[],d=c.ancestors(),f=d.length,e;for(e in c.__fns__){if(c.__fns__.hasOwnProperty(e)&&JS.isFn(c.__fns__[e])&&JS.indexOf(b,e)===-1)b.push(e)}if(a===false)return b;while(f--)d[f].instanceMethods(false,b);return b},include:function(a,b,c){b=(b!==false);if(!a)return b?this.resolve():this.uncache();c=c||{};if(a.__mod__)a=a.__mod__;var d=a.include,f=a.extend,e=c._4||this,g,h,i,j;if(a.__inc__&&a.__fns__){this.__inc__.push(a);a.__dep__.push(this);if(c._2)a.extended&&a.extended(c._2);else a.included&&a.included(e)}else{if(c._5){for(h in a){if(JS.ignore(h,a[h]))continue;this.define(h,a[h],false,{_0:e||c._2||this})}}else{if(typeof d==='object'||JS.isType(d,JS.Module)){g=[].concat(d);for(i=0,j=g.length;i<j;i++)e.include(g[i],b,c)}if(typeof f==='object'||JS.isType(f,JS.Module)){g=[].concat(f);for(i=0,j=g.length;i<j;i++)e.extend(g[i],false);e.extend()}c._5=true;return e.include(a,b,c)}}b?this.resolve():this.uncache()},includes:function(a){var b=this.__mod__,c=b.__inc__.length;if(Object===a||b===a||b.__res__===a.prototype)return true;while(c--){if(b.__inc__[c].includes(a))return true}return false},match:function(a){return a.isA&&a.isA(this)},ancestors:function(a){var b=this.__mod__,c=(a===undefined),d=(b.__res__||{}).klass,f=(d&&b.__res__===d.prototype)?d:b,e,g;if(c&&b.__anc__)return b.__anc__.slice();a=a||[];for(e=0,g=b.__inc__.length;e<g;e++)b.__inc__[e].ancestors(a);if(JS.indexOf(a,f)===-1)a.push(f);if(c)b.__anc__=a.slice();return a},lookup:function(a){var b=this.__mod__,c=b.__mct__;if(c[a])return c[a].slice();var d=b.ancestors(),f=[],e,g,h;for(e=0,g=d.length;e<g;e++){h=d[e].__mod__.__fns__[a];if(h)f.push(h)}c[a]=f.slice();return f},make:function(a,b){if(!JS.isFn(b)||!JS.callsSuper(b))return b;var c=this;return function(){return c.chain(this,a,arguments)}},chain:JS.mask(function(c,d,f){var e=this.lookup(d),g=e.length-1,h=c.callSuper,i=JS.array(f),j;c.callSuper=function(){var a=arguments.length;while(a--)i[a]=arguments[a];g-=1;var b=e[g].apply(c,i);g+=1;return b};j=e.pop().apply(c,i);h?c.callSuper=h:delete c.callSuper;return j}),resolve:function(a){var b=this.__mod__,a=a||b,c=a.__res__,d,f,e,g;if(a===b){b.uncache(false);d=b.__dep__.length;while(d--)b.__dep__[d].resolve()}if(!c)return;for(d=0,f=b.__inc__.length;d<f;d++)b.__inc__[d].resolve(a);for(e in b.__fns__){g=a.make(e,b.__fns__[e]);if(c[e]!==g)c[e]=g}},uncache:function(a){var b=this.__mod__,c=b.__dep__.length;b.__anc__=null;b.__mct__={};if(a===false)return;while(c--)b.__dep__[c].uncache()}});JS.Class=JS.makeFunction();JS.extend(JS.Class.prototype=JS.makeBridge(JS.Module),{initialize:function(a,b,c){if(typeof a==='string'){this.__nom__=this.displayName=a}else{this.__nom__=this.displayName='';c=b;b=a}var d=JS.extend(JS.makeFunction(),this);d.klass=d.constructor=this.klass;if(!JS.isFn(b)){c=b;b=Object}d.inherit(b);d.include(c,false);d.resolve();do{b.inherited&&b.inherited(d)}while(b=b.superclass);return d},inherit:function(a){this.superclass=a;if(this.__eigen__&&a.__eigen__)this.extend(a.__eigen__(),true);this.subclasses=[];(a.subclasses||[]).push(this);var b=this.prototype=JS.makeBridge(a);b.klass=b.constructor=this;this.__mod__=new JS.Module(this.__nom__,{},{_1:this.prototype});this.include(JS.Kernel,false);if(a!==Object)this.include(a.__mod__||new JS.Module(a.prototype,{_1:a.prototype}),false)},include:function(a,b,c){if(!a)return;var d=this.__mod__,c=c||{};c._4=this;return d.include(a,b,c)},define:function(a,b,c,d){var f=this.__mod__;d=d||{};d._0=this;f.define(a,b,c,d)}});JS.Module=new JS.Class('Module',JS.Module.prototype);JS.Class=new JS.Class('Class',JS.Module,JS.Class.prototype);JS.Module.klass=JS.Module.constructor=JS.Class.klass=JS.Class.constructor=JS.Class;JS.extend(JS.Module,{_3:[],__chainq__:[],methodAdded:function(a,b){this._3.push([a,b])},_0:function(a,b){var c=this._3,d=c.length;while(d--)c[d][0].call(c[d][1]||null,a,b)}});JS.Kernel=JS.extend(new JS.Module('Kernel',{__eigen__:function(){if(this.__meta__)return this.__meta__;var a=this.__nom__,b=this.klass.__nom__,c=a||(b?'#<'+b+'>':''),d=this.__meta__=new JS.Module(c?c+'.':'',{},{_1:this});d.include(this.klass.__mod__,false);return d},equals:function(a){return this===a},extend:function(a,b){return this.__eigen__().include(a,b,{_2:this})},hash:function(){return this.__hashcode__=this.__hashcode__||JS.Kernel.getHashCode()},isA:function(a){return this.__eigen__().includes(a)},method:function(a){var b=this,c=b.__mcache__=b.__mcache__||{};if((c[a]||{}).fn===b[a])return c[a].bd;return(c[a]={fn:b[a],bd:JS.bind(b[a],b)}).bd},methods:function(){return this.__eigen__().instanceMethods(true)},tap:function(a,b){a.call(b||null,this);return this}}),{__hashIndex__:0,getHashCode:function(){this.__hashIndex__+=1;return(Math.floor(new Date().getTime()/1000)+this.__hashIndex__).toString(16)}});JS.Module.include(JS.Kernel);JS.extend(JS.Module,JS.Kernel.__fns__);JS.Class.include(JS.Kernel);JS.extend(JS.Class,JS.Kernel.__fns__);JS.Interface=new JS.Class({initialize:function(d){this.test=function(a,b){var c=d.length;while(c--){if(!JS.isFn(a[d[c]]))return b?d[c]:false}return true}},extend:{ensure:function(){var a=JS.array(arguments),b=a.shift(),c,d;while(c=a.shift()){d=c.test(b,true);if(d!==true)throw new Error('object does not implement '+d+'()');}}}});JS.Singleton=new JS.Class({initialize:function(a,b,c){return new(new JS.Class(a,b,c))}});

Bluff={VERSION:'0.3.6',array:function(c){if(c.length===undefined)return[c];var d=[],f=c.length;while(f--)d[f]=c[f];return d},array_new:function(c,d){var f=[];while(c--)f.push(d);return f},each:function(c,d,f){for(var g=0,h=c.length;g<h;g++){d.call(f||null,c[g],g)}},index:function(c,d){for(var f=0,g=c.length;f<g;f++){if(c[f]===d)return f}return-1},keys:function(c){var d=[],f;for(f in c)d.push(f);return d},map:function(d,f,g){var h=[];this.each(d,function(c){h.push(f.call(g||null,c))});return h},reverse_each:function(c,d,f){var g=c.length;while(g--)d.call(f||null,c[g],g)},sum:function(c){var d=0,f=c.length;while(f--)d+=c[f];return d},Mini:{}};Bluff.Base=new JS.Class({extend:{DEBUG:false,DATA_LABEL_INDEX:0,DATA_VALUES_INDEX:1,DATA_COLOR_INDEX:2,LEGEND_MARGIN:20,TITLE_MARGIN:20,LABEL_MARGIN:10,DEFAULT_MARGIN:20,DEFAULT_TARGET_WIDTH:800,THOUSAND_SEPARATOR:','},top_margin:null,bottom_margin:null,right_margin:null,left_margin:null,title_margin:null,legend_margin:null,labels:null,center_labels_over_point:null,has_left_labels:null,x_axis_label:null,y_axis_label:null,y_axis_increment:null,colors:null,title:null,font:null,font_color:null,hide_line_markers:null,hide_legend:null,hide_title:null,hide_line_numbers:null,no_data_message:null,title_font_size:null,legend_font_size:null,marker_font_size:null,marker_color:null,marker_count:null,minimum_value:null,maximum_value:null,sort:null,additional_line_values:null,stacked:null,legend_box_size:null,tooltips:false,initialize:function(c,d){this._0=new Bluff.Renderer(c);d=d||this.klass.DEFAULT_TARGET_WIDTH;var f;if(typeof d!=='number'){f=d.split('x');this._j=parseFloat(f[0]);this._t=parseFloat(f[1])}else{this._j=parseFloat(d);this._t=this._j*0.75}this.initialize_ivars();this._1j();this.theme_keynote();this._10={}},initialize_ivars:function(){this._b=800;this._L=800*(this._t/this._j);this._5=0;this.marker_count=null;this.maximum_value=this.minimum_value=null;this._c=false;this._1=[];this.labels={};this._u={};this.sort=true;this.title=null;this._a=this._j/this._b;this.marker_font_size=21.0;this.legend_font_size=20.0;this.title_font_size=36.0;this.top_margin=this.bottom_margin=this.left_margin=this.right_margin=this.klass.DEFAULT_MARGIN;this.legend_margin=this.klass.LEGEND_MARGIN;this.title_margin=this.klass.TITLE_MARGIN;this.legend_box_size=20.0;this.no_data_message="No Data";this.hide_line_markers=this.hide_legend=this.hide_title=this.hide_line_numbers=false;this.center_labels_over_point=true;this.has_left_labels=false;this.additional_line_values=[];this._1C=[];this._k={};this.x_axis_label=this.y_axis_label=null;this.y_axis_increment=null;this.stacked=null;this._9=null},set_margins:function(c){this.top_margin=this.left_margin=this.right_margin=this.bottom_margin=c},set_font:function(c){this.font=c;this._0.font=this.font},add_color:function(c){this.colors.push(c)},replace_colors:function(c){this.colors=c||[];this._w=0},set_theme:function(c){this._1j();this._k={colors:['black','white'],additional_line_colors:[],marker_color:'white',font_color:'black',background_colors:null,background_image:null};for(var d in c)this._k[d]=c[d];this.colors=this._k.colors;this.marker_color=this._k.marker_color;this.font_color=this._k.font_color||this.marker_color;this._1C=this._k.additional_line_colors;this._M()},set_background:function(c){if(c.colors)this._k.background_colors=c.colors;if(c.image)this._k.background_image=c.image;this._M()},theme_keynote:function(){this._11='#6886B4';this._12='#FDD84E';this._v='#72AE6E';this._D='#D1695E';this._13='#8A6EAF';this._E='#EFAA43';this._F='white';this.colors=[this._12,this._11,this._v,this._D,this._13,this._E,this._F];this.set_theme({colors:this.colors,marker_color:'white',font_color:'white',background_colors:['black','#4a465a']})},theme_37signals:function(){this._v='#339933';this._13='#cc99cc';this._11='#336699';this._12='#FFF804';this._D='#ff0000';this._E='#cf5910';this._G='black';this.colors=[this._12,this._11,this._v,this._D,this._13,this._E,this._G];this.set_theme({colors:this.colors,marker_color:'black',font_color:'black',background_colors:['#d1edf5','white']})},theme_rails_keynote:function(){this._v='#00ff00';this._14='#333333';this._E='#ff5d00';this._D='#f61100';this._F='white';this._15='#999999';this._G='black';this.colors=[this._v,this._14,this._E,this._D,this._F,this._15,this._G];this.set_theme({colors:this.colors,marker_color:'white',font_color:'white',background_colors:['#0083a3','#0083a3']})},theme_odeo:function(){this._14='#202020';this._F='white';this._1D='#a21764';this._v='#8ab438';this._15='#999999';this._1E='#3a5b87';this._G='black';this.colors=[this._14,this._F,this._1E,this._1D,this._v,this._15,this._G];this.set_theme({colors:this.colors,marker_color:'white',font_color:'white',background_colors:['#ff47a4','#ff1f81']})},theme_pastel:function(){this.colors=['#a9dada','#aedaa9','#daaea9','#dadaa9','#a9a9da','#daaeda','#dadada'];this.set_theme({colors:this.colors,marker_color:'#aea9a9',font_color:'black',background_colors:'white'})},theme_greyscale:function(){this.colors=['#282828','#383838','#686868','#989898','#c8c8c8','#e8e8e8'];this.set_theme({colors:this.colors,marker_color:'#aea9a9',font_color:'black',background_colors:'white'})},data:function(f,g,h){g=(g===undefined)?[]:g;h=h||null;g=Bluff.array(g);this._1.push([f,g,(h||this._1F())]);this._5=(g.length>this._5)?g.length:this._5;Bluff.each(g,function(c,d){if(c===undefined)return;if(this.maximum_value===null&&this.minimum_value===null)this.maximum_value=this.minimum_value=c;this.maximum_value=this._1k(c)?c:this.maximum_value;if(this.maximum_value>=0)this._c=true;this.minimum_value=this._1G(c)?c:this.minimum_value;if(this.minimum_value<0)this._c=true},this)},draw:function(){if(this.stacked)this._1H();this._1I();this._x(function(){this._0.rectangle(this.left_margin,this.top_margin,this._b-this.right_margin,this._L-this.bottom_margin);this._0.rectangle(this._2,this._7,this._l,this._g)})},clear:function(){this._M()},on:function(c,d,f){var g=this._10[c]=this._10[c]||[];g.push([d,f])},trigger:function(d,f){var g=this._10[d];if(!g)return;Bluff.each(g,function(c){c[0].call(c[1],f)})},_1I:function(){if(!this._c)return this._1J();this._16();this._1K();if(this.sort)this._1L();this._1M();this._N();this._1N();this._1O()},_16:function(g){if(this._9===null||g===true){this._9=[];if(!this._c)return;this._1l();Bluff.each(this._1,function(d){var f=[];Bluff.each(d[this.klass.DATA_VALUES_INDEX],function(c){if(c===null||c===undefined)f.push(null);else f.push((c-this.minimum_value)/this._i)},this);this._9.push([d[this.klass.DATA_LABEL_INDEX],f,d[this.klass.DATA_COLOR_INDEX]])},this)}},_1l:function(){this._i=this.maximum_value-this.minimum_value;this._i=this._i>0?this._i:1;var c=Math.round(Math.LOG10E*Math.log(this._i));this._1m=Math.pow(10,3-c)},_1K:function(){this._O=this.hide_line_markers?0:this._P(this.marker_font_size);this._1n=this.hide_title?0:this._P(this.title_font_size);this._1o=this.hide_legend?0:this._P(this.legend_font_size);var c,d,f,g,h,i,j;if(this.hide_line_markers){this._2=this.left_margin;this._17=this.right_margin;this._1p=this.bottom_margin}else{d=0;if(this.has_left_labels){c='';for(j in this.labels){c=c.length>this.labels[j].length?c:this.labels[j]}d=this._H(this.marker_font_size,c)*1.25}else{d=this._H(this.marker_font_size,this._Q(this.maximum_value))}f=this.hide_line_numbers&&!this.has_left_labels?0.0:d+this.klass.LABEL_MARGIN*2;this._2=this.left_margin+f+(this.y_axis_label===null?0.0:this._O+this.klass.LABEL_MARGIN*2);g=-Infinity;for(j in this.labels)g=g>Number(j)?g:Number(j);g=Math.round(g);h=(g>=(this._5-1)&&this.center_labels_over_point)?this._H(this.marker_font_size,this.labels[g])/2:0;this._17=this.right_margin+h;this._1p=this.bottom_margin+this._O+this.klass.LABEL_MARGIN}this._l=this._b-this._17;this._6=this._b-this._2-this._17;this._7=this.top_margin+(this.hide_title?this.title_margin:this._1n+this.title_margin)+(this.hide_legend?this.legend_margin:this._1o+this.legend_margin);i=(this.x_axis_label===null)?0.0:this._O+this.klass.LABEL_MARGIN;this._g=this._L-this._1p-i;this._3=this._g-this._7},_1N:function(){if(this.x_axis_label){var c=this._g+this.klass.LABEL_MARGIN*2+this._O;this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='north';this._0.annotate_scaled(this._b,1.0,0.0,c,this.x_axis_label,this._a);this._x(function(){this._0.line(0.0,c,this._b,c)})}},_N:function(){if(this.hide_line_markers)return;if(this.y_axis_increment===null){if(this.marker_count===null){Bluff.each([3,4,5,6,7],function(c){if(!this.marker_count&&this._i%c===0)this.marker_count=c},this);this.marker_count=this.marker_count||4}this._18=(this._i>0)?this._19(this._i/this.marker_count):1}else{this.maximum_value=Math.max(Math.ceil(this.maximum_value),this.y_axis_increment);this.minimum_value=Math.floor(this.minimum_value);this._1l();this._16(true);this.marker_count=Math.round(this._i/this.y_axis_increment);this._18=this.y_axis_increment}this._1P=this._3/(this._i/this._18);var d,f,g,h;for(d=0,f=this.marker_count;d<=f;d++){g=this._7+this._3-d*this._1P;this._0.stroke=this.marker_color;this._0.stroke_width=1;this._0.line(this._2,g,this._l,g);h=d*this._18+this.minimum_value;if(!this.hide_line_numbers){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.font_weight='normal';this._0.stroke='transparent';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='east';this._0.annotate_scaled(this._2-this.klass.LABEL_MARGIN,1.0,0.0,g,this._Q(h),this._a)}}},_1q:function(c){return(this._b-c)/2},_1M:function(){if(this.hide_legend)return;this._I=Bluff.map(this._1,function(c){return c[this.klass.DATA_LABEL_INDEX]},this);var i=this.legend_box_size;if(this.font)this._0.font=this.font;this._0.pointsize=this.legend_font_size;var j=[[]];Bluff.each(this._I,function(c){var d=j.length-1;var f=this._0.get_type_metrics(c);var g=f.width+i*2.7;j[d].push(g);if(Bluff.sum(j[d])>(this._b*0.9))j.push([j[d].pop()])},this);var k=this._1q(Bluff.sum(j[0]));var m=this.hide_title?this.top_margin+this.title_margin:this.top_margin+this.title_margin+this._1n;this._x(function(){this._0.stroke_width=1;this._0.line(0,m,this._b,m)});Bluff.each(this._I,function(c,d){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(this.legend_font_size);this._0.stroke='transparent';this._0.font_weight='normal';this._0.gravity='west';this._0.annotate_scaled(this._b,1.0,k+(i*1.7),m,c,this._a);this._0.stroke='transparent';this._0.fill=this._1[d][this.klass.DATA_COLOR_INDEX];this._0.rectangle(k,m-i/2.0,k+i,m+i/2.0);this._0.pointsize=this.legend_font_size;var f=this._0.get_type_metrics(c);var g=f.width+(i*2.7),h;j[0].shift();if(j[0].length==0){this._x(function(){this._0.line(0.0,m,this._b,m)});j.shift();if(j.length>0)k=this._1q(Bluff.sum(j[0]));h=Math.max(this._1o,i)+this.legend_margin;if(j.length>0){m+=h;this._7+=h;this._3=this._g-this._7}}else{k+=g}},this);this._w=0},_1O:function(){if(this.hide_title||!this.title)return;this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(this.title_font_size);this._0.font_weight='bold';this._0.gravity='north';this._0.annotate_scaled(this._b,1.0,0,this.top_margin,this.title,this._a)},_e:function(c,d){if(this.hide_line_markers)return;var f;if(this.labels[d]&&!this._u[d]){f=this._g+this.klass.LABEL_MARGIN;this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.font_weight='normal';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='north';this._0.annotate_scaled(1.0,1.0,c,f,this.labels[d],this._a);this._u[d]=true;this._x(function(){this._0.stroke_width=1;this._0.line(0.0,f,this._b,f)})}},_y:function(d,f,g,h,i,j,k,m){if(!this.tooltips)return;var n=this._0.tooltip(d,f,g,h,i,j,k);Bluff.Event.observe(n,'click',function(){var c={series:i,label:this.labels[m],value:k,color:j};this.trigger('click:datapoint',c)},this)},_1J:function(){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.font_weight='normal';this._0.pointsize=this._d(80);this._0.gravity='center';this._0.annotate_scaled(this._b,this._L/2,0,10,this.no_data_message,this._a)},_M:function(){var c=this._k.background_colors;switch(true){case c instanceof Array:this._1Q.apply(this,c);break;case typeof c==='string':this._1R(c);break;default:this._1S(this._k.background_image);break}},_1R:function(c){this._0.render_solid_background(this._j,this._t,c)},_1Q:function(c,d){this._0.render_gradiated_background(this._j,this._t,c,d)},_1S:function(c){},_1j:function(){this._w=0;this._u={};this._k={};this._0.scale(this._a,this._a)},_2k:function(c){return this._a*c},_d:function(c){var d=c*this._a;return d},_R:function(c,d){return(c>d)?d:c},_1k:function(c,d){return c>this.maximum_value},_1G:function(c,d){return c<this.minimum_value},_1r:function(c,d){return c},_2l:function(c,d){return c},_19:function(c){if(c==0)return 1.0;var d=1.0;while(c<10){c*=10;d/=10}while(c>100){c/=10;d*=10}return Math.floor(c)*d},_1L:function(){var f=this._1T,g=this.klass.DATA_VALUES_INDEX;this._9.sort(function(c,d){return f(d[g])-f(c[g])});this._1.sort(function(c,d){return f(d[g])-f(c[g])})},_1T:function(d){var f=0;Bluff.each(d,function(c){f+=(c||0)});return f},_1H:function(){var g=[],h=this._5;while(h--)g[h]=0;Bluff.each(this._1,function(f){Bluff.each(f[this.klass.DATA_VALUES_INDEX],function(c,d){g[d]+=c},this);f[this.klass.DATA_VALUES_INDEX]=Bluff.array(g)},this)},_x:function(c){if(this.klass.DEBUG){this._0.fill='transparent';this._0.stroke='turquoise';c.call(this)}},_1F:function(){var c=this._w;this._w=(this._w+1)%this.colors.length;return this.colors[c]},_Q:function(c){var d=this.klass.THOUSAND_SEPARATOR,f=(this._i%this.marker_count==0||this.y_axis_increment!==null)?String(Math.round(c)):String(Math.floor(c*this._1m)/this._1m);var g=f.split('.');g[0]=g[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1'+d);return g.join('.')},_P:function(c){return this._0.caps_height(c)},_H:function(c,d){return this._0.text_width(c,d)}});Bluff.Area=new JS.Class(Bluff.Base,{draw:function(){this.callSuper();if(!this._c)return;this._S=this._6/(this._5-1);this._0.stroke='transparent';Bluff.each(this._9,function(h){var i=[],j=0.0,k=0.0;Bluff.each(h[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._S*d);var g=this._7+(this._3-c*this._3);if(j>0&&k>0){i.push(f);i.push(g)}else{i.push(this._2);i.push(this._g-1);i.push(f);i.push(g)}this._e(f,d);j=f;k=g},this);i.push(this._l);i.push(this._g-1);i.push(this._2);i.push(this._g-1);this._0.fill=h[this.klass.DATA_COLOR_INDEX];this._0.polyline(i)},this)}});Bluff.BarConversion=new JS.Class({mode:null,zero:null,graph_top:null,graph_height:null,minimum_value:null,spread:null,getLeftYRightYscaled:function(c,d){var f;switch(this.mode){case 1:d[0]=this.graph_top+this.graph_height*(1-c)+1;d[1]=this.graph_top+this.graph_height-1;break;case 2:d[0]=this.graph_top+1;d[1]=this.graph_top+this.graph_height*(1-c)-1;break;case 3:f=c-this.minimum_value/this.spread;if(c>=this.zero){d[0]=this.graph_top+this.graph_height*(1-(f-this.zero))+1;d[1]=this.graph_top+this.graph_height*(1-this.zero)-1}else{d[0]=this.graph_top+this.graph_height*(1-(f-this.zero))+1;d[1]=this.graph_top+this.graph_height*(1-this.zero)-1}break;default:d[0]=0.0;d[1]=0.0}}});Bluff.Bar=new JS.Class(Bluff.Base,{bar_spacing:0.9,draw:function(){this.center_labels_over_point=(Bluff.keys(this.labels).length>this._5);this.callSuper();if(!this._c)return;this._T()},_T:function(){this._8=this._6/(this._5*this._1.length);var n=(this._8*(1-this.bar_spacing))/2;this._0.stroke_opacity=0.0;var l=new Bluff.BarConversion();l.graph_height=this._3;l.graph_top=this._7;if(this.minimum_value>=0){l.mode=1}else{if(this.maximum_value<=0){l.mode=2}else{l.mode=3;l.spread=this._i;l.minimum_value=this.minimum_value;l.zero=-this.minimum_value/this._i}}Bluff.each(this._9,function(j,k){var m=this._1[k][this.klass.DATA_VALUES_INDEX];Bluff.each(j[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._8*(k+d+((this._1.length-1)*d)))+n;var g=f+this._8*this.bar_spacing;var h=[];l.getLeftYRightYscaled(c,h);this._0.fill=j[this.klass.DATA_COLOR_INDEX];this._0.rectangle(f,h[0],g,h[1]);this._y(f,h[0],g-f,h[1]-h[0],j[this.klass.DATA_LABEL_INDEX],j[this.klass.DATA_COLOR_INDEX],m[d],d);var i=this._2+(this._1.length*this._8*d)+(this._1.length*this._8/2.0);this._e(i-(this.center_labels_over_point?this._8/2.0:0.0),d)},this)},this);if(this.center_labels_over_point)this._e(this._l,this._5)}});Bluff.Line=new JS.Class(Bluff.Base,{baseline_value:null,baseline_color:null,line_width:null,dot_radius:null,hide_dots:null,hide_lines:null,initialize:function(c){if(arguments.length>3)throw'Wrong number of arguments';if(arguments.length===1||(typeof arguments[1]!=='number'&&typeof arguments[1]!=='string'))this.callSuper(c,null);else this.callSuper();this.hide_dots=this.hide_lines=false;this.baseline_color='red';this.baseline_value=null},draw:function(){this.callSuper();if(!this._c)return;this.x_increment=(this._5>1)?(this._6/(this._5-1)):this._6;var l;if(this._U!==undefined){l=this._7+(this._3-this._U*this._3);this._0.push();this._0.stroke=this.baseline_color;this._0.fill_opacity=0.0;this._0.stroke_width=3.0;this._0.line(this._2,l,this._2+this._6,l);this._0.pop()}Bluff.each(this._9,function(i,j){var k=null,m=null;var n=this._1[j][this.klass.DATA_VALUES_INDEX];this._1U=this._1V(i);Bluff.each(i[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this.x_increment*d);if(typeof c!=='number')return;this._e(f,d);var g=this._7+(this._3-c*this._3);this._0.stroke=i[this.klass.DATA_COLOR_INDEX];this._0.fill=i[this.klass.DATA_COLOR_INDEX];this._0.stroke_opacity=1.0;this._0.stroke_width=this.line_width||this._R(this._j/(this._9[0][this.klass.DATA_VALUES_INDEX].length*6),3.0);var h=this.dot_radius||this._R(this._j/(this._9[0][this.klass.DATA_VALUES_INDEX].length*2),7.0);if(!this.hide_lines&&k!==null&&m!==null){this._0.line(k,m,f,g)}else if(this._1U){this._0.circle(f,g,f-h,g)}if(!this.hide_dots)this._0.circle(f,g,f-h,g);this._y(f-h,g-h,2*h,2*h,i[this.klass.DATA_LABEL_INDEX],i[this.klass.DATA_COLOR_INDEX],n[d],d);k=f;m=g},this)},this)},_16:function(){this.maximum_value=Math.max(this.maximum_value,this.baseline_value);this.callSuper();if(this.baseline_value!==null)this._U=this.baseline_value/this.maximum_value},_1V:function(d){var f=0;Bluff.each(d[this.klass.DATA_VALUES_INDEX],function(c){if(c!==undefined)f+=1});return f===1}});Bluff.Dot=new JS.Class(Bluff.Base,{draw:function(){this.has_left_labels=true;this.callSuper();if(!this._c)return;var k=1.0;this._J=this._3/this._5;this._1a=this._J*k/this._9.length;this._0.stroke_opacity=0.0;var m=Bluff.array_new(this._5,0),n=Bluff.array_new(this._5,this._2),l=(this._J*(1-k))/2;Bluff.each(this._9,function(i,j){Bluff.each(i[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(c*this._6)-Math.round(this._1a/6.0);var g=this._7+(this._J*d)+l+Math.round(this._1a/2.0);if(j===0){this._0.stroke=this.marker_color;this._0.stroke_width=1.0;this._0.opacity=0.1;this._0.line(this._2,g,this._2+this._6,g)}this._0.fill=i[this.klass.DATA_COLOR_INDEX];this._0.stroke='transparent';this._0.circle(f,g,f+Math.round(this._1a/3.0),g);var h=this._7+(this._J*d+this._J/2)+l;this._e(h,d)},this)},this)},_N:function(){if(this.hide_line_markers)return;this._0.stroke_antialias=false;this._0.stroke_width=1;var c=5;var d=this._19(this.maximum_value/c);for(var f=0;f<=c;f++){var g=(this._l-this._2)/c,h=this._l-(g*f)-1,i=f-c,j=Math.abs(i)*d;this._0.stroke=this.marker_color;this._0.line(h,this._g,h,this._g+0.5*this.klass.LABEL_MARGIN);if(!this.hide_line_numbers){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='center';this._0.annotate_scaled(0,0,h,this._g+(this.klass.LABEL_MARGIN*2.0),j,this._a)}this._0.stroke_antialias=true}},_e:function(c,d){if(this.labels[d]&&!this._u[d]){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.font_weight='normal';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='east';this._0.annotate_scaled(1,1,this._2-this.klass.LABEL_MARGIN*2.0,c,this.labels[d],this._a);this._u[d]=true}}});Bluff.Net=new JS.Class(Bluff.Base,{hide_dots:null,line_width:null,dot_radius:null,initialize:function(){this.callSuper();this.hide_dots=false;this.hide_line_numbers=true},draw:function(){this.callSuper();if(!this._c)return;this._z=this._3/2.0;this._A=this._2+(this._6/2.0);this._B=this._7+(this._3/2.0)-10;this._S=this._6/(this._5-1);var s=this.dot_radius||this._R(this._j/(this._9[0][this.klass.DATA_VALUES_INDEX].length*2.5),7.0);this._0.stroke_opacity=1.0;this._0.stroke_width=this.line_width||this._R(this._j/(this._9[0][this.klass.DATA_VALUES_INDEX].length*4),3.0);var r;if(this._U!==undefined){r=this._7+(this._3-this._U*this._3);this._0.push();this._0.stroke_color=this.baseline_color;this._0.fill_opacity=0.0;this._0.stroke_width=5;this._0.line(this._2,r,this._2+this._6,r);this._0.pop()}Bluff.each(this._9,function(o){var p=null,q=null;Bluff.each(o[this.klass.DATA_VALUES_INDEX],function(c,d){if(c===undefined)return;var f=d*Math.PI*2/this._5,g=c*this._z,h=this._A+Math.sin(f)*g,i=this._B-Math.cos(f)*g,j=(d+1<o[this.klass.DATA_VALUES_INDEX].length)?d+1:0,k=j*Math.PI*2/this._5,m=o[this.klass.DATA_VALUES_INDEX][j]*this._z,n=this._A+Math.sin(k)*m,l=this._B-Math.cos(k)*m;this._0.stroke=o[this.klass.DATA_COLOR_INDEX];this._0.fill=o[this.klass.DATA_COLOR_INDEX];this._0.line(h,i,n,l);if(!this.hide_dots)this._0.circle(h,i,h-s,i)},this)},this)},_N:function(){if(this.hide_line_markers)return;this._z=this._3/2.0;this._A=this._2+(this._6/2.0);this._B=this._7+(this._3/2.0)-10;var c,d;for(var f=0,g=this._5;f<g;f++){c=f*Math.PI*2/this._5;this._0.stroke=this.marker_color;this._0.stroke_width=1;this._0.line(this._A,this._B,this._A+Math.sin(c)*this._z,this._B-Math.cos(c)*this._z);d=this.labels[f]?this.labels[f]:'000';this._e(this._A,this._B,c*360/(2*Math.PI),this._z,d)}},_e:function(c,d,f,g,h){var i=1.1,j=c,k=d,m=f*Math.PI/180,n=j+(g*i*Math.sin(m)),l=k-(g*i*Math.cos(m));this._0.fill=this.marker_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(20);this._0.stroke='transparent';this._0.font_weight='bold';this._0.gravity='center';this._0.annotate_scaled(0,0,n,l,h,this._a)}});Bluff.Pie=new JS.Class(Bluff.Base,{extend:{TEXT_OFFSET_PERCENTAGE:0.08},zero_degreee:null,hide_labels_less_than:null,initialize_ivars:function(){this.callSuper();this.zero_degree=0.0;this.hide_labels_less_than=0.0},draw:function(){this.hide_line_markers=true;this.callSuper();if(!this._c)return;var j=this._3,k=(Math.min(this._6,this._3)/2.0)*0.8,m=this._2+(this._6-j)/2.0,n=this._2+(this._6/2.0),l=this._7+(this._3/2.0)-10,o=this._1W(),p=this.zero_degree,q=this.klass.DATA_VALUES_INDEX;if(this.sort)this._1.sort(function(a,b){return a[q][0]-b[q][0]});Bluff.each(this._1,function(c,d){if(c[this.klass.DATA_VALUES_INDEX][0]>0){this._0.fill=c[this.klass.DATA_COLOR_INDEX];var f=(c[this.klass.DATA_VALUES_INDEX][0]/o)*360;this._0.circle(n,l,n+k,l,p,p+f+0.5);var g=p+((p+f)-p)/2,h=Math.round((c[this.klass.DATA_VALUES_INDEX][0]/o)*100.0),i;if(h>=this.hide_labels_less_than){i=this._Q(c[this.klass.DATA_VALUES_INDEX][0]);this._e(n,l,g,k+(k*this.klass.TEXT_OFFSET_PERCENTAGE),i,c,d)}p+=f}},this)},_e:function(c,d,f,g,h,i,j){var k=20.0,m=c,n=d,l=g+k,o=l*0.15,p=m+((l+o)*Math.cos(f*Math.PI/180)),q=n+(l*Math.sin(f*Math.PI/180));this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(this.marker_font_size);this._0.font_weight='bold';this._0.gravity='center';this._0.annotate_scaled(0,0,p,q,h,this._a);this._y(p-20,q-20,40,40,i[this.klass.DATA_LABEL_INDEX],i[this.klass.DATA_COLOR_INDEX],h,j)},_1W:function(){var d=0;Bluff.each(this._1,function(c){d+=c[this.klass.DATA_VALUES_INDEX][0]},this);return d}});Bluff.SideBar=new JS.Class(Bluff.Base,{bar_spacing:0.9,draw:function(){this.has_left_labels=true;this.callSuper();if(!this._c)return;this._T()},_T:function(){this._V=this._3/this._5;this._8=this._V/this._9.length;this._0.stroke_opacity=0.0;var q=Bluff.array_new(this._5,0),s=Bluff.array_new(this._5,this._2),r=(this._8*(1-this.bar_spacing))/2;Bluff.each(this._9,function(l,o){var p=this._1[o][this.klass.DATA_VALUES_INDEX];Bluff.each(l[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._6-c*this._6-q[d]),g=this._2+this._6-q[d],h=g-f,i=s[d]-1,j=this._7+(this._V*d)+(this._8*o)+r,k=i+h,m=j+this._8*this.bar_spacing;q[d]+=(c*this._6);this._0.stroke='transparent';this._0.fill=l[this.klass.DATA_COLOR_INDEX];this._0.rectangle(i,j,k,m);this._y(i,j,k-i,m-j,l[this.klass.DATA_LABEL_INDEX],l[this.klass.DATA_COLOR_INDEX],p[d],d);var n=this._7+(this._V*d+this._V/2);this._e(n,d)},this)},this)},_N:function(){if(this.hide_line_markers)return;this._0.stroke_antialias=false;this._0.stroke_width=1;var c=5;var d=this._19(this._i/c),f,g,h,i;for(var j=0;j<=c;j++){f=(this._l-this._2)/c;g=this._l-(f*j)-1;h=j-c;i=Math.abs(h)*d+this.minimum_value;this._0.stroke=this.marker_color;this._0.line(g,this._g,g,this._7);if(!this.hide_line_numbers){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='center';this._0.annotate_scaled(0,0,g,this._g+(this.klass.LABEL_MARGIN*2.0),this._Q(i),this._a)}}},_e:function(c,d){if(this.labels[d]&&!this._u[d]){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.stroke='transparent';this._0.font_weight='normal';this._0.pointsize=this._d(this.marker_font_size);this._0.gravity='east';this._0.annotate_scaled(1,1,this._2-this.klass.LABEL_MARGIN*2.0,c,this.labels[d],this._a);this._u[d]=true}}});Bluff.Spider=new JS.Class(Bluff.Base,{hide_text:null,hide_axes:null,transparent_background:null,initialize:function(c,d,f){this.callSuper(c,f);this._1X=d;this.hide_legend=true},draw:function(){this.hide_line_markers=true;this.callSuper();if(!this._c)return;var c=this._3,d=this._3/2.0,f=this._2+(this._6-c)/2.0,g=this._2+(this._6/2.0),h=this._7+(this._3/2.0)-25;this._1Y=d/this._1X;var i=this._1Z(),j=0.0,k=(2*Math.PI)/this._1.length,m=0.0;if(!this.hide_axes)this._20(g,h,d,k);this._21(g,h,k)},_1s:function(c){return c*this._1Y},_e:function(c,d,f,g,h){var i=50,j=c,k=d+0,m=j+((g+i)*Math.cos(f)),n=k+((g+i)*Math.sin(f));this._0.fill=this.marker_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(this.legend_font_size);this._0.stroke='transparent';this._0.font_weight='bold';this._0.gravity='center';this._0.annotate_scaled(0,0,m,n,h,this._a)},_20:function(g,h,i,j,k){if(this.hide_axes)return;var m=0.0;Bluff.each(this._1,function(c){this._0.stroke=k||c[this.klass.DATA_COLOR_INDEX];this._0.stroke_width=5.0;var d=i*Math.cos(m);var f=i*Math.sin(m);this._0.line(g,h,g+d,h+f);if(!this.hide_text)this._e(g,h,m,i,c[this.klass.DATA_LABEL_INDEX]);m+=j},this)},_21:function(d,f,g,h){var i=[],j=0.0;Bluff.each(this._1,function(c){i.push(d+this._1s(c[this.klass.DATA_VALUES_INDEX][0])*Math.cos(j));i.push(f+this._1s(c[this.klass.DATA_VALUES_INDEX][0])*Math.sin(j));j+=g},this);this._0.stroke_width=1.0;this._0.stroke=h||this.marker_color;this._0.fill=h||this.marker_color;this._0.fill_opacity=0.4;this._0.polyline(i)},_1Z:function(){var d=0.0;Bluff.each(this._1,function(c){d+=c[this.klass.DATA_VALUES_INDEX][0]},this);return d}});Bluff.Base.StackedMixin=new JS.Module({_1b:function(){var g={};Bluff.each(this._1,function(f){Bluff.each(f[this.klass.DATA_VALUES_INDEX],function(c,d){if(!g[d])g[d]=0.0;g[d]+=c},this)},this);for(var h in g){if(g[h]>this.maximum_value)this.maximum_value=g[h]}this.minimum_value=0}});Bluff.StackedArea=new JS.Class(Bluff.Base,{include:Bluff.Base.StackedMixin,last_series_goes_on_bottom:null,draw:function(){this._1b();this.callSuper();if(!this._c)return;this._S=this._6/(this._5-1);this._0.stroke='transparent';var n=Bluff.array_new(this._5,0);var l=null;var o=this.last_series_goes_on_bottom?'reverse_each':'each';Bluff[o](this._9,function(h){var i=l;l=[];Bluff.each(h[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._S*d);var g=this._7+(this._3-c*this._3-n[d]);n[d]+=(c*this._3);l.push(f);l.push(g);this._e(f,d)},this);var j,k,m;if(i){j=Bluff.array(l);for(k=i.length/2-1;k>=0;k--){j.push(i[2*k]);j.push(i[2*k+1])}j.push(l[0]);j.push(l[1])}else{j=Bluff.array(l);j.push(this._l);j.push(this._g-1);j.push(this._2);j.push(this._g-1);j.push(l[0]);j.push(l[1])}this._0.fill=h[this.klass.DATA_COLOR_INDEX];this._0.polyline(j)},this)}});Bluff.StackedBar=new JS.Class(Bluff.Base,{include:Bluff.Base.StackedMixin,bar_spacing:0.9,draw:function(){this._1b();this.callSuper();if(!this._c)return;this._8=this._6/this._5;var l=(this._8*(1-this.bar_spacing))/2;this._0.stroke_opacity=0.0;var o=Bluff.array_new(this._5,0);Bluff.each(this._9,function(k,m){var n=this._1[m][this.klass.DATA_VALUES_INDEX];Bluff.each(k[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._8*d)+(this._8*this.bar_spacing/2.0);this._e(f,d);if(c==0)return;var g=this._2+(this._8*d)+l;var h=this._7+(this._3-c*this._3-o[d])+1;var i=g+this._8*this.bar_spacing;var j=this._7+this._3-o[d]-1;o[d]+=(c*this._3);this._0.fill=k[this.klass.DATA_COLOR_INDEX];this._0.rectangle(g,h,i,j);this._y(g,h,i-g,j-h,k[this.klass.DATA_LABEL_INDEX],k[this.klass.DATA_COLOR_INDEX],n[d],d)},this)},this)}});Bluff.AccumulatorBar=new JS.Class(Bluff.StackedBar,{draw:function(){if(this._1.length!==1)throw'Incorrect number of datasets';var g=[],h=0,i=[];Bluff.each(this._1[0][this.klass.DATA_VALUES_INDEX],function(d){var f=-Infinity;Bluff.each(i,function(c){f=Math.max(f,c)});i.push((h>0)?(d+f):d);g.push(i[h]-d);h+=1},this);this.data("Accumulator",g);this.callSuper()}});Bluff.SideStackedBar=new JS.Class(Bluff.SideBar,{include:Bluff.Base.StackedMixin,bar_spacing:0.9,draw:function(){this.has_left_labels=true;this._1b();this.callSuper()},_T:function(){this._8=this._3/this._5;var q=Bluff.array_new(this._5,0),s=Bluff.array_new(this._5,this._2),r=(this._8*(1-this.bar_spacing))/2;Bluff.each(this._9,function(l,o){var p=this._1[o][this.klass.DATA_VALUES_INDEX];Bluff.each(l[this.klass.DATA_VALUES_INDEX],function(c,d){var f=this._2+(this._6-c*this._6-q[d])+1;var g=this._2+this._6-q[d]-1;var h=g-f;this._0.fill=l[this.klass.DATA_COLOR_INDEX];var i=s[d],j=this._7+(this._8*d)+r,k=i+h,m=j+this._8*this.bar_spacing;s[d]+=h;q[d]+=(c*this._6-2);this._0.rectangle(i,j,k,m);this._y(i,j,k-i,m-j,l[this.klass.DATA_LABEL_INDEX],l[this.klass.DATA_COLOR_INDEX],p[d],d);var n=this._7+(this._8*d)+(this._8*this.bar_spacing/2.0);this._e(n,d)},this)},this)},_1k:function(c,d){d=d||0;return this._1r(c,d)>this.maximum_value},_1r:function(d,f){var g=0;Bluff.each(this._1,function(c){g+=c[this.klass.DATA_VALUES_INDEX][f]},this);return g}});Bluff.Mini.Legend=new JS.Module({hide_mini_legend:false,_1c:function(){if(this.hide_mini_legend)return;this._I=Bluff.map(this._1,function(c){return c[this.klass.DATA_LABEL_INDEX]},this);var d=this._d(this._1.length*this._1t()+this.top_margin+this.bottom_margin);this._22=this._L;this._23=this._b;switch(this.legend_position){case'right':this._t=Math.max(this._t,d);this._j+=this._24()+this.left_margin;break;default:this._t+=d;break}this._M()},_1t:function(){return this._P(this.legend_font_size)*1.7},_24:function(){var d=0;Bluff.each(this._I,function(c){d=Math.max(this._H(this.legend_font_size,c),d)},this);return this._d(d+40*1.7)},_1d:function(){if(this.hide_mini_legend)return;var f=40.0,g=10.0,h=100.0,i=40.0;if(this.font)this._0.font=this.font;this._0.pointsize=this.legend_font_size;var j,k;switch(this.legend_position){case'right':j=this._23+this.left_margin;k=this.top_margin+i;break;default:j=h,k=this._22+i;break}this._x(function(){this._0.line(0.0,k,this._b,k)});Bluff.each(this._I,function(c,d){this._0.fill=this.font_color;if(this.font)this._0.font=this.font;this._0.pointsize=this._d(this.legend_font_size);this._0.stroke='transparent';this._0.font_weight='normal';this._0.gravity='west';this._0.annotate_scaled(this._b,1.0,j+(f*1.7),k,this._25(c),this._a);this._0.stroke='transparent';this._0.fill=this._1[d][this.klass.DATA_COLOR_INDEX];this._0.rectangle(j,k-f/2.0,j+f,k+f/2.0);k+=this._1t()},this);this._w=0},_25:function(c){var d=String(c);while(this._H(this._d(this.legend_font_size),d)>(this._j-this.legend_left_margin-this.right_margin)&&(d.length>1))d=d.substr(0,d.length-1);return d+(d.length<String(c).length?"...":'')}});Bluff.Mini.Bar=new JS.Class(Bluff.Bar,{include:Bluff.Mini.Legend,initialize_ivars:function(){this.callSuper();this.hide_legend=true;this.hide_title=true;this.hide_line_numbers=true;this.marker_font_size=50.0;this.minimum_value=0.0;this.maximum_value=0.0;this.legend_font_size=60.0},draw:function(){this._1c();this.callSuper();this._1d()}});Bluff.Mini.Pie=new JS.Class(Bluff.Pie,{include:Bluff.Mini.Legend,initialize_ivars:function(){this.callSuper();this.hide_legend=true;this.hide_title=true;this.hide_line_numbers=true;this.marker_font_size=60.0;this.legend_font_size=60.0},draw:function(){this._1c();this.callSuper();this._1d()}});Bluff.Mini.SideBar=new JS.Class(Bluff.SideBar,{include:Bluff.Mini.Legend,initialize_ivars:function(){this.callSuper();this.hide_legend=true;this.hide_title=true;this.hide_line_numbers=true;this.marker_font_size=50.0;this.legend_font_size=50.0},draw:function(){this._1c();this.callSuper();this._1d()}});Bluff.Renderer=new JS.Class({extend:{WRAPPER_CLASS:'bluff-wrapper',TEXT_CLASS:'bluff-text',TARGET_CLASS:'bluff-tooltip-target'},font:'Arial, Helvetica, Verdana, sans-serif',gravity:'north',initialize:function(c){this._n=document.getElementById(c);this._4=this._n.getContext('2d')},scale:function(c,d){this._f=c;this._h=d||c},caps_height:function(c){var d=this._W(c,'X'),f=this._K(d).height;this._X(d);return f},text_width:function(c,d){var f=this._W(c,d);var g=this._K(f).width;this._X(f);return g},get_type_metrics:function(c){var d=this._W(this.pointsize,c);document.body.appendChild(d);var f=this._K(d);this._X(d);return f},clear:function(c,d){this._n.width=c;this._n.height=d;this._4.clearRect(0,0,c,d);var f=this._1u(),g=f.childNodes,h=g.length;f.style.width=c+'px';f.style.height=d+'px';while(h--){if(g[h].tagName.toLowerCase()!=='canvas'){Bluff.Event.stopObserving(g[h]);this._X(g[h])}}},push:function(){this._4.save()},pop:function(){this._4.restore()},render_gradiated_background:function(c,d,f,g){this.clear(c,d);var h=this._4.createLinearGradient(0,0,0,d);h.addColorStop(0,f);h.addColorStop(1,g);this._4.fillStyle=h;this._4.fillRect(0,0,c,d)},render_solid_background:function(c,d,f){this.clear(c,d);this._4.fillStyle=f;this._4.fillRect(0,0,c,d)},annotate_scaled:function(c,d,f,g,h,i){var j=(c*i)>=1?(c*i):1;var k=(d*i)>=1?(d*i):1;var h=this._W(this.pointsize,h);h.style.color=this.fill;h.style.cursor='default';h.style.fontWeight=this.font_weight;h.style.textAlign='center';h.style.left=(this._f*f+this._26(h,j))+'px';h.style.top=(this._h*g+this._27(h,k))+'px'},tooltip:function(d,f,g,h,i,j,k){if(g<0)d+=g;if(h<0)f+=h;var m=this._n.parentNode,n=document.createElement('div');n.className=this.klass.TARGET_CLASS;n.style.cursor='default';n.style.position='absolute';n.style.left=(this._f*d-3)+'px';n.style.top=(this._h*f-3)+'px';n.style.width=(this._f*Math.abs(g)+5)+'px';n.style.height=(this._h*Math.abs(h)+5)+'px';n.style.fontSize=0;n.style.overflow='hidden';Bluff.Event.observe(n,'mouseover',function(c){Bluff.Tooltip.show(i,j,k)});Bluff.Event.observe(n,'mouseout',function(c){Bluff.Tooltip.hide()});m.appendChild(n);return n},circle:function(c,d,f,g,h,i){var j=Math.sqrt(Math.pow(f-c,2)+Math.pow(g-d,2));var k=0,m=2*Math.PI;this._4.fillStyle=this.fill;this._4.beginPath();if(h!==undefined&&i!==undefined&&Math.abs(Math.floor(i-h))!==360){k=h*Math.PI/180;m=i*Math.PI/180;this._4.moveTo(this._f*(c+j*Math.cos(m)),this._h*(d+j*Math.sin(m)));this._4.lineTo(this._f*c,this._h*d);this._4.lineTo(this._f*(c+j*Math.cos(k)),this._h*(d+j*Math.sin(k)))}this._4.arc(this._f*c,this._h*d,this._f*j,k,m,false);this._4.fill()},line:function(c,d,f,g){this._4.strokeStyle=this.stroke;this._4.lineWidth=this.stroke_width;this._4.beginPath();this._4.moveTo(this._f*c,this._h*d);this._4.lineTo(this._f*f,this._h*g);this._4.stroke()},polyline:function(c){this._4.fillStyle=this.fill;this._4.globalAlpha=this.fill_opacity||1;try{this._4.strokeStyle=this.stroke}catch(e){}var d=c.shift(),f=c.shift();this._4.beginPath();this._4.moveTo(this._f*d,this._h*f);while(c.length>0){d=c.shift();f=c.shift();this._4.lineTo(this._f*d,this._h*f)}this._4.fill()},rectangle:function(c,d,f,g){var h;if(c>f){h=c;c=f;f=h}if(d>g){h=d;d=g;g=h}try{this._4.fillStyle=this.fill;this._4.fillRect(this._f*c,this._h*d,this._f*(f-c),this._h*(g-d))}catch(e){}try{this._4.strokeStyle=this.stroke;if(this.stroke!=='transparent')this._4.strokeRect(this._f*c,this._h*d,this._f*(f-c),this._h*(g-d))}catch(e){}},_26:function(c,d){var f=this._K(c).width;switch(this.gravity){case'west':return 0;case'east':return d-f;case'north':case'south':case'center':return(d-f)/2}},_27:function(c,d){var f=this._K(c).height;switch(this.gravity){case'north':return 0;case'south':return d-f;case'west':case'east':case'center':return(d-f)/2}},_1u:function(){var c=this._n.parentNode;if(c.className===this.klass.WRAPPER_CLASS)return c;c=document.createElement('div');c.className=this.klass.WRAPPER_CLASS;c.style.position='relative';c.style.border='none';c.style.padding='0 0 0 0';this._n.parentNode.insertBefore(c,this._n);c.appendChild(this._n);return c},_W:function(c,d){var f=this._28(d);f.style.fontFamily=this.font;f.style.fontSize=(typeof c==='number')?c+'px':c;return f},_28:function(c){var d=document.createElement('div');d.className=this.klass.TEXT_CLASS;d.style.position='absolute';d.appendChild(document.createTextNode(c));this._1u().appendChild(d);return d},_X:function(c){c.parentNode.removeChild(c);if(c.className===this.klass.TARGET_CLASS)Bluff.Event.stopObserving(c)},_K:function(c){var d=c.style.display;return(d&&d!=='none')?{width:c.offsetWidth,height:c.offsetHeight}:{width:c.clientWidth,height:c.clientHeight}}});Bluff.Event={_Y:[],_1v:(window.attachEvent&&navigator.userAgent.indexOf('Opera')===-1),observe:function(d,f,g,h){var i=Bluff.map(this._1w(d,f),function(c){return c._29});if(Bluff.index(i,g)!==-1)return;var j=function(c){g.call(h||null,d,Bluff.Event._2a(c))};this._Y.push({_Z:d,_1e:f,_29:g,_1x:j});if(d.addEventListener)d.addEventListener(f,j,false);else d.attachEvent('on'+f,j)},stopObserving:function(d){var f=d?this._1w(d):this._Y;Bluff.each(f,function(c){if(c._Z.removeEventListener)c._Z.removeEventListener(c._1e,c._1x,false);else c._Z.detachEvent('on'+c._1e,c._1x)})},_1w:function(d,f){var g=[];Bluff.each(this._Y,function(c){if(d&&c._Z!==d)return;if(f&&c._1e!==f)return;g.push(c)});return g},_2a:function(c){if(!this._1v)return c;if(!c)return false;if(c._2b)return c;c._2b=true;var d=this._2c(c);c.target=c.srcElement;c.pageX=d.x;c.pageY=d.y;return c},_2c:function(c){var d=document.documentElement,f=document.body||{scrollLeft:0,scrollTop:0};return{x:c.pageX||(c.clientX+(d.scrollLeft||f.scrollLeft)-(d.clientLeft||0)),y:c.pageY||(c.clientY+(d.scrollTop||f.scrollTop)-(d.clientTop||0))}}};if(Bluff.Event._1v)window.attachEvent('onunload',function(){Bluff.Event.stopObserving();Bluff.Event._Y=null});if(navigator.userAgent.indexOf('AppleWebKit/')>-1)window.addEventListener('unload',function(){},false);Bluff.Tooltip=new JS.Singleton({LEFT_OFFSET:20,TOP_OFFSET:-6,DATA_LENGTH:8,CLASS_NAME:'bluff-tooltip',setup:function(){this._o=document.createElement('div');this._o.className=this.CLASS_NAME;this._o.style.position='absolute';this.hide();document.body.appendChild(this._o);Bluff.Event.observe(document.body,'mousemove',function(c,d){this._o.style.left=(d.pageX+this.LEFT_OFFSET)+'px';this._o.style.top=(d.pageY+this.TOP_OFFSET)+'px'},this)},show:function(c,d,f){f=Number(String(f).substr(0,this.DATA_LENGTH));this._o.innerHTML='<span class="color" style="background: '+d+';">&nbsp;</span> <span class="label">'+c+'</span> <span class="data">'+f+'</span>';this._o.style.display=''},hide:function(){this._o.style.display='none'}});Bluff.Event.observe(window,'load',Bluff.Tooltip.method('setup'));Bluff.TableReader=new JS.Class({NUMBER_FORMAT:/\-?(0|[1-9]\d*)(\.\d+)?(e[\+\-]?\d+)?/i,initialize:function(c,d){this._1f=d||{};this._2d=this._1f.orientation||'auto';this._2e=(typeof c==='string')?document.getElementById(c):c},get_data:function(){if(!this._1)this._1y();return this._1},get_labels:function(){if(!this._1g)this._1y();return this._1g},get_title:function(){return this._2f},get_series:function(c){if(this._1[c])return this._1[c];return this._1[c]={points:[]}},_1y:function(){this._C=this._m=0;this._p=this._q=0;this._1=[];this._1g={};this._r=[];this._s=[];this._1h=[];this._1i=[];this._1z(this._2e);this._2g();this._2h();Bluff.each(this._s,function(c,d){this.get_series(d-this._q).name=c},this);Bluff.each(this._r,function(c,d){this._1g[d-this._p]=c},this)},_1z:function(c){this._2i(c);var d,f=c.childNodes,g=f.length;for(d=0;d<g;d++)this._1z(f[d])},_2i:function(c){if(!c.tagName)return;var d=this._1A(c.innerHTML),f,g;switch(c.tagName.toUpperCase()){case'TR':if(!this._c)this._p=this._C;this._C+=1;this._m=0;break;case'TD':if(!this._c)this._q=this._m;this._c=true;this._m+=1;d=d.match(this.NUMBER_FORMAT);if(d===null){this.get_series(f).points[g]=null}else{f=this._m-this._q-1;g=this._C-this._p-1;this.get_series(f).points[g]=parseFloat(d[0])}break;case'TH':this._m+=1;if(this._2j(c)){this._1i.push(this._m);this._1h.push(this._C)}if(this._m===1&&this._C===1)this._r[0]=this._s[0]=d;else if(c.scope==="row"||this._m===1)this._r[this._C-1]=d;else this._s[this._m-1]=d;break;case'CAPTION':this._2f=d;break}},_2j:function(c){if(!this._1f.except)return false;var d=this._1A(c.innerHTML),f=(c.className||'').split(/\s+/),g=[].concat(this._1f.except);if(Bluff.index(g,d)>=0)return true;var h=f.length;while(h--){if(Bluff.index(g,f[h])>=0)return true}return false},_2g:function(){var d=this._1i.length,f;while(d--){f=this._1i[d];if(f<=this._q)continue;this._s.splice(f-1,1);if(f>=this._q)this._1.splice(f-1-this._q,1)}var d=this._1h.length,f;while(d--){f=this._1h[d];if(f<=this._p)continue;this._r.splice(f-1,1);Bluff.each(this._1,function(c){if(f>=this._p)c.points.splice(f-1-this._p,1)},this)}},_2h:function(){switch(this._2d){case'auto':if((this._r.length>1&&this._s.length===1)||this._r.length<this._s.length){this._1B()}break;case'rows':this._1B();break}},_1B:function(){var h=this._1,i;this._1=[];Bluff.each(h,function(f,g){Bluff.each(f.points,function(c,d){this.get_series(d).points[g]=c},this)},this);i=this._r;this._r=this._s;this._s=i;i=this._p;this._p=this._q;this._q=i},_1A:function(c){return c.replace(/<\/?[^>]+>/gi,'')},extend:{Mixin:new JS.Module({data_from_table:function(d,f){var g=new Bluff.TableReader(d,f),h=g.get_data();Bluff.each(h,function(c){this.data(c.name,c.points)},this);this.labels=g.get_labels();this.title=g.get_title()||this.title}})}});Bluff.Base.include(Bluff.TableReader.Mixin);
(function() {

  $(document).ready(function() {
    function draw_pie_chart(div, data) {
      //Create pie charts
      var chart = new Bluff.Bar(div, 460);
        //Setup theme
        var colors = ['#6886B4', '#FDD84E', '#72AE6E', '#D1695E', '#8A6EAF', '#EFAA43', 'white'];
        chart.set_theme({
        colors: colors,
        marker_color: 'white',
        font_color: 'white',
        background_colors: ['#008000', '#008000']
      });
      chart.tooltips = true;
      chart.hide_line_markers = false;
      chart.minimum_value = 0;
      var max_value = 0;
      //Add each data item to chart
      for (var i in data.items) {
        var item = data.items[i];
        chart.data(item.label, item.data);
        if (item.data > max_value) {
        max_value = item.data;
        }
      }
      chart.maximum_value = max_value;
      //Finally draw the chart
      chart.draw();
    }

    if ($('#total_jobs_chart').length > 0) {
      var total_jobs_data = $('#total_jobs_chart').data('set');
      if (total_jobs_data !== null) {
        draw_pie_chart('total_jobs_chart', total_jobs_data);
        $("#total_jobs_container").css('visibility', 'visible');
      }
    }

    if ($('#buried_jobs_chart').length > 0) {
      var buried_jobs_data = $('#buried_jobs_chart').data('set');
      if (buried_jobs_data !== null) {
        draw_pie_chart('buried_jobs_chart', buried_jobs_data);
        $("#buried_jobs_container").css('visibility', 'visible');
      }
    }
  });

})();
(function() {

  $(document).ready(function() {
    //Enable Tooltips
    $("[rel=tooltip]").tooltip();

    if ($('#form_tube_name').length > 0) {
      //Setup Typeahead For Tube Names on Add Job Form
      var tubeNames = $('#form_tube_name').data('tubes');
      $('#form_tube_name').typeahead({source: tubeNames});
    }

    //Update Underscore delimiters <% %> to Handlebar-style {{ }}
    _.templateSettings = {
      interpolate: /\{\{\=(.+?)\}\}/g,
      evaluate: /\{\{(.+?)\}\}/g
    };
  });

})();
(function() {

  $(document).ready(function() {
    // Enable Peek Button Handlers
    if ($("#peek_ready_btn").length > 0) {
      $("#peek_ready_btn").click(function(event) {
        event.preventDefault();
        peek('ready');
      });
    }
    if ($("#peek_delayed_btn").length > 0) {
      $("#peek_delayed_btn").click(function(event) {
        event.preventDefault();
        peek('delayed');
      });
    }
    if ($("#peek_buried_btn").length > 0) {
      $("#peek_buried_btn").click(function(event) {
        event.preventDefault();
        peek('buried');
      });
    }
    if ($("#add_job_btn").length > 0) {
      $("#add_job_btn").click(function(event) {
        event.preventDefault();
        add_job();
      });
    }

    function peek(queue) {
      var tube = document.getElementById("form_tube_name").value;
      var url_base = document.getElementById("form_url_base").value;
      var jqxhr = $.getJSON(url_base+"peek/"+encodeURIComponent(tube)+"/"+queue, function(data) {
        if (data.hasOwnProperty("error")) {
          alert(data.error);
        } else {
          $("#job_info_popup_title").html(create_job_info_title(data));
          $("#job_info_popup_body").html(create_job_info_table(data));
          $("#job_info_popup_footer").html(create_job_info_buttons(tube, data, url_base));
          $("[rel=tooltip]").tooltip();  //refresh tooltips
          $("#job_info_popup").modal({});
        }
      }).error(function() { alert("An error occurred while trying to peek at the next job."); });
    }

    function add_job() {
      var tube = document.getElementById("form_tube_name").value;
      var priority = document.getElementById("form_job_priority").value;
      var delay = document.getElementById("form_job_delay").value;
      var ttr = document.getElementById("form_job_ttr").value;
      var body = document.getElementById("form_job_body").value;
      // Use defaults if empty
      if (tube === "") {
        tube = "default";
        document.getElementById("form_tube_name").value = tube;
      }
      if (priority === "") {
        priority = "65536";
        document.getElementById("form_job_priority").value = priority;
      }
      if (delay === "") {
        delay = "0";
        document.getElementById("form_job_delay").value = delay;
      }
      if (ttr === "") {
        ttr = "120";
        document.getElementById("form_job_ttr").value = ttr;
      }
      if (body === "") {
        body = "{}";
        document.getElementById("form_job_body").value = body;
      }
      //Ensure valid body JSON
      var parsed_body_json = null;
      var body_parse_error = null;
      try {
        parsed_body_json = JSON.parse(body);
        if (parsed_body_json.constructor == Array) {
          throw "Job Body JSON must be a Hash";
        }
      } catch(e) {
        body_parse_error = e;
      }
      if (body_parse_error !== null) {
        alert("Job Body JSON parse error: "+body_parse_error);
      } else {
        // Build the confirmation popup
        data = {};
        data.tube = tube;
        data.pri = priority;
        data.delay = delay;
        data.ttr = ttr;
        data.body = JSON.stringify(parsed_body_json);
        $("#job_info_popup_title").html(create_new_job_title());
        $("#job_info_popup_body").html(create_job_info_table(data));
        $("#job_info_popup_footer").html(create_new_job_buttons());
        $("#confirm_add_job_btn").click(function() {
          $("#add_job_form").submit();
        });
        $("[rel=tooltip]").tooltip();  //refresh tooltips
        $("#job_info_popup").modal({});
      }
    }

    function create_new_job_buttons() {
      var job_info_buttons = "";
      job_info_buttons += "<a id=\"confirm_add_job_btn\" href=\"#\" class=\"btn\">Add Job</a>";
      return job_info_buttons;
    }

    function create_job_info_buttons(tube, data, url_base) {
      var job_id = data.id;
      var priority = data.pri;
      var job_info_buttons = "";
      job_info_buttons += "<a href=\""+url_base+"delete/"+encodeURIComponent(tube)+"/"+job_id+"\" class=\"btn\">Delete Job</a>";
      return job_info_buttons;
    }

    function create_new_job_title() {
      return "<h3>Add new job?</h3>";
    }

    function create_job_info_title(data) {
      var id = data.id;
      var state = data.state;
      return "<h3>Job id: "+id+" ("+state+")</h3>";
    }

    function create_job_info_table(data) {
      var compiled = _.template($('#job_modal_template').text());
      return compiled({data: data});
    }
  });

})();
(function() {

  $(document).ready(function() {
    function filter_table_by_tube() {
      var tube = $("#peek_range_tube_select").val();
      if (tube === '') {
        $('tr.datum[data-tube]').show();
      } else {
        $('tr.datum[data-tube!="'+tube+'"]').hide();
        $('tr.datum[data-tube="'+tube+'"]').show();
      }
    }

    if ($('#peek_range_table').length > 0) {
      $("#peek_range_tube_select").change(function(event) {
        filter_table_by_tube();
      });

      //Run Immediately on Page Load
      filter_table_by_tube();
    }
  });

})();