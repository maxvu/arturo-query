'use strict';
var site = require( './site.js' );

/*
    A string paired with two marching pointers (indices).
    Helps, with `site`, to pull out substrings and their locations without
      needing client to juggle index numbers.
    Because we want to be able to `peek()` at characters without committing to
      keeping them, the end-bound is -- like `site`'s and like slice() 
      -- exclusive.
*/

module.exports = class stream {

    constructor ( raw ) {
        this._raw = raw || '';
        this._begin = 0;
        this._end = 0;
    }
    
    // have we reached the end of the string?
    done () {
        return this._end === this._raw.length;
    }
    
    // advance 'end' pointer one index
    step () {
        if ( !this.done() )
            this._end++;
        return this;
    }
    
    // what character sits under 'end'?
    peek ( n ) {
        if ( !Number.isInteger( n ) )
            n = Math.floor( n );
        if ( n < 0 )
            n = 0;
        return this._raw[ this._end + ( n || 0 ) ];
    }
    
    // pull out the substring between 'begin' and 'end',  return as a site
    // and sync 'begin' to 'end'
    extract () {
        if ( this._begin === this._end )
            return null;
        let s = new site(
            this._begin,
            this._end,
            this._raw.slice( this._begin, this._end )
        );
        this._begin = this._end;
        return s;
    }
    
};

