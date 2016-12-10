'use strict';

/*
    A simple tuple that describes where, in a lexer stream, a particular token
    was found and which characters make it up.
*/

module.exports = class site {

    constructor ( begin, end, text ) {
        this._begin = begin;  // beginning of substring in the stream (incl.)
        this._end = end;      // end of substring in stream (excl.)
        this._text = text;    // the substring
    }
    
    getBegin () {
        return this._begin;
    }
    
    getEnd () {
        return this._end;
    }
    
    getText () {
        return this._text;
    }

};

