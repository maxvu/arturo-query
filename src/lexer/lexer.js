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
    
    getRaw () {
        return this._stream._raw;
    }
    
    lex () {
        if ( this._error !== null ) return null;
        if ( this._output !== null ) return this._output;
        this._output = [];
        
        try {
            while ( !this._stream.done() ) {
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
        let quote_open = this._stream.peek().extract();
        while (
            !this._stream.done() &&
            this._stream.get() !== quote_open.getText()
        ) {
            this._stream.peek();
        }
        if ( this._stream.done() )
            throw new Error( "Unterminated quote" );
        this._output.push( new symbol.types.quo( quote_open ) );
        this._output.push( new symbol.types.trm( this._stream.extract() ) );
        this._stream.peek();
        this._output.push( new symbol.types.quo( this._stream.extract() ) );
    }
    
    lx_lpr () {
        this._stream.peek();
        this._output.push( new symbol.types.lpr( this._stream.extract() ) );
    }
    
    lx_rpr () {
        this._stream.peek();
        this._output.push( new symbol.types.rpr( this._stream.extract() ) );
    }

    lx_trm () {
        while ( this._stream.isBareTerm() )
            this._stream.peek();
        this._output.push( new symbol.types.trm( this._stream.extract() ) );
    }
    
    lx_tag () {
        this._stream.peek();
        this._output.push( new symbol.types.tag( this._stream.extract() ) );
    }
    
    lx_neg () {
        this._stream.peek();
        this._output.push( new symbol.types.neg( this._stream.extract() ) );
    }
    
    lx_oro () {
        this._stream.peek();
        this._output.push( new symbol.types.oro( this._stream.extract() ) );
    }
    
};

