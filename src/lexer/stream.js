'use strict';
var charmap = require( './charmap.js' );
var symbol = require( './symbol.js' );
var site = require( './site.js' );

/*
    A (string, number) tuple representing an input stream and its current index.    
    The peek()/extract() combination allows pulling out substrings, sites
      without having the client juggle index numbers.
*/

module.exports = class stream {
    constructor ( raw ) {
        this._raw = raw;
        this._pos = 0;
        this._peek = 0;
    }
    
    skip ( n ) {
        this._peek = ( this._pos += ( n || 1 ) );
        return this;
    }
    
    done () {
        return this._peek >= this._raw.length;
    }
    
    get ( offset ) {
        return this._raw[ this._peek + ( offset | 0 ) ];
    }
    
    // move peek back to pos
    reset () {
        this._peek = this._pos;
        return this;
    }
    
    // move pos up to peek
    sync () {
        this._pos = this._peek;
        return this;
    }
    
    // advance 'peek' pointer
    peek ( n ) {
        this._peek += ( n || 1 );
        return this;
    }
    
    // pick out the substring and bounding indices
    extract () {
        let ls = new site(
            this._pos,
            this._peek,
            this._pos === this._peek
                ? this._raw[ this._pos ]
                : this._raw.slice( this._pos, this._peek )
        );
        this.sync();
        return ls;
    }
    
    /*
        charmap indicators
    */
    
    isWhitespace () {
        return !this.done() && charmap.WTS.indexOf( this.get() ) !== -1;
    }
    
    isQuote () {
        return charmap.QUO.DET.indexOf( this.get() ) !== -1;
    }
    
    isQuoteEscape () {
        return !this.done() && charmap.QUO.ESC.indexOf( this.get() ) !== -1;
    }
    
    isLeftParenthesis () {
        return !this.done() && charmap.PAR.OPN.indexOf( this.get() ) !== -1;
    }
    
    isRightParenthesis () {
        return !this.done() && charmap.PAR.CLS.indexOf( this.get() ) !== -1;
    }
    
    isTagDelimiter () {
        return !this.done() && charmap.TAG.DET.indexOf( this.get() ) !== -1;
    }
    
    isNegator () {
        return !this.done() && charmap.NEG.DET.indexOf( this.get() ) !== -1;
    }
    
    isDisjunctor () {
        return !this.done() && charmap.ORO.DET.indexOf( this.get() ) !== -1;
    }
    
    isBareTermInterrupter () {
        return !this.done() && charmap.TRM.INT.indexOf( this.get() ) !== -1;
    }
    
    isBareTerm () {
        return (
            !this.done() &&
            !this.isBareTermInterrupter() &&
            !this.isWhitespace()
        );
    }
    
};

