'use strict';

/*
    A tuple describing where, in the original stream, this symbol was found.
*/

module.exports = class site {

    constructor ( start, end, text ) {
        this._start = start;  // inclusive bound
        this._end = end;      // exclusive bound
        this._text = text;
    }
    
    getStart () {
        return this._start;
    }
    
    getEnd () {
        return this._end;
    }
    
    getText () {
        return this._text;
    }

};
