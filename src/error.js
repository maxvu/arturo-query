'use strict';
var site = require( './site' );

/*
    A simple union with JS-standard Error with our site information.
*/

module.exports = class ParsingError extends Error {

    constructor ( site, message ) {
        super( message );
        this.site = site;
        this.stack = (new Error()).stack;
    }
    
    getReport () {
        return `${this.message} at position ${this.site.getBegin()}`;
    };
    
    getSite () {
        return this.site;
    }
    
};

