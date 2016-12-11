'use strict';
var site = require( './site' );

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

