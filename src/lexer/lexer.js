'use strict';
var symbol = require( './symbol.js' );
var stream = require( './stream.js' );
var charmap = require( './charmap.js' );

module.exports = class lexer {
    
    constructor ( raw ) {
        this._stream = new stream( raw );
        this._output = null;
        this._error = null;
    }
    
    getStream () {
        return this._stream;
    }
    
    isOkay () {
        return this._error === null;
    }
    
    getError () {
        return this._error.message;
    }
    
    getOutput () {
        return this._output;
    }
    
    lex () {
        this._output = [];
        try {
            while ( !this._stream.done() ) {
                this._stream.dump();
                if ( this._stream.isWhitespace() )
                    this.lx_wts();
                    
                else if ( this._stream.isQuote() )
                    this.lx_quo();
                    
                else if ( this._stream.isLeftParenthesis() )
                    this.lx_lpr();
                    
                else if ( this._stream.isRightParenthesis() )
                    this.lx_rpr();
                    
                else if ( this._stream.isTagDelimiter() )
                    this.lx_tag();
                    
                else if ( this._stream.isNegator() )
                    this.lx_neg();
                    
                else if ( this._stream.isDisjunctor() )
                    this.lx_oro();
                    
                else
                    this.lx_trm();
            }
            return this._output;
        } catch ( ex ) {
            this._error = ex;
            this._error.message += ` at position ${this._stream.reset()._peek}`;
            return null;
        }
    }
    
    lx_wts () {
        while ( this._stream.isWhitespace() )
            this._stream.peek();
        this._output.push( new symbol.types.wts( this._stream.extract() ) );
    }

    lx_quo () {
        let quote_open = this._stream.get();
        this._stream.skip();
        while ( !this._stream.done() ) {
            this._stream.peek();
            console.log( `lx_quo scan char(${this._stream.get()})` );
            if (
                this._stream.get() === quote_open &&
                charmap.QUO.ESC.indexOf( this._stream.get( -1 ) ) === -1
            ) {
                break;
            }
        }
        if ( this._stream.done() )
            throw new Error( "Unterminated quote" );
        this._output.push( new symbol.types.quo( quote_open ) );
        this._output.push( new symbol.types.trm( this._stream.extract() ) );
        this._output.push( new symbol.types.quo( quote_open ) );
        this._stream.skip();
    }
    
    lx_lpr () {
        this._output.push( new symbol.types.lpr( this._stream.get() ) );
        this._stream.skip();
    }
    
    lx_rpr () {
        this._output.push( new symbol.types.rpr( this._stream.get() ) );
        this._stream.skip();
    }

    lx_trm () {
        while ( this._stream.isBareTerm() )
            this._stream.peek();
        this._output.push(  new symbol.types.trm( this._stream.extract() ) );
    }
    
    lx_tag () {
        this._output.push( new symbol.types.tag( this._stream.get() ) );
        this._stream.skip();
    }
    
    lx_neg () {
        this._output.push( new symbol.types.neg( this._stream.get() ) );
        this._stream.skip();
    }
    
    lx_oro () {
        this._output.push( new symbol.types.oro( this._stream.get() ) );
        this._stream.skip();
    }
    
};

let is = require( 'util' ).inspect;
let lx = new module.exports( ' hello- ( "world" ) | ago:!!3d' );
lx.getStream().dump()
console.log( is( lx.lex() ) );
lx.getStream().dump();
console.log( is( lx ) );


