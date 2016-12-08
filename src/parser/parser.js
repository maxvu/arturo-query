'use strict';

var expr = require( './expr.js' );
var lexer = require( '../lexer/lexer.js' );
var lextypes = require( '../lexer/symbol.js' ).types;

// TODO: localize error to specific symbols
module.exports = class parser {

    constructor ( raw ) {
        this._error = null;
        this._input = null;
        this._output = null;
        this._lexer = new lexer( raw );
    }
    
    isOkay () {
        return this._error === null;
    }
    
    getError () {
        return this._error.message;
    }
    
    parse () {
        if ( this._error !== null )
            return null;
        if ( this._output !== null )
            return this._output;
        this._input = this._lexer.lex();
        if ( !this._lexer.isOkay() ) {
            this._error = this._lex._error;
            return null;
        }
        
        this._output = this._input;
        console.log( require( 'util' ).inspect( this._output ) );
        
        // strip all whitespace and quotes
        this._output = this._output.filter( ( sym ) => {
            return (
                !( sym instanceof lextypes.wts ) &&
                !( sym instanceof lextypes.quo )
            );
        } );
        
        // promote all lexer 'trm's to expr.terms
        this._output = this._output.map( ( sym ) => {
            if ( sym instanceof lextypes.trm )
                return new expr.types.term( sym );
            else
                return sym;
        } );
        
        // combine tag pairs
        this._output = this.ps_tags( this._output );
        
        // fold parenthetical groups into conj's and over OR's for disj's
        this._output = this.ps_expr( this._output );
        
        // implicit AND
        
        console.log( require( 'util' ).inspect( this._output, { depth: 10 } ) );
    }
    
    ps_tags ( input ) {
        var idx;
        while ( ( idx = input.findIndex( ( sym ) => {
            return ( sym instanceof lextypes.tag );
        } ) ) !== -1 ) {
            if ( idx === 0 )
                throw new Error( "Tag delimeter occurs at beginning of stream" );
            if ( idx === input.length - 1 )
                throw new Error( "Tag delimeter occurs at end of stream" );
            if ( !( input[ idx - 1 ] instanceof expr.types.term ) )
                throw new Error( "Tag attribute not given as term" );
            if ( !( input[ idx + 1 ] instanceof expr.types.term ) )
                throw new Error( "Tag value not given as term" );
            let triplet = input.splice( idx - 1, 3 );
            let tag = new expr.types.tag( triplet );
            input.splice( idx - 1, 0, tag );
        }
        return input;
    }
    
    ps_expr ( input, expect_rpr ) { // TODO: make a stack
        let output = [];
        while ( input.length ) {
            let curr = input.shift();
            if ( curr instanceof lextypes.lpr ) {
                output.push( new expr.types.conj(
                    this.ps_or(
                        this.ps_expr( input, 1 )
                    )
                ) );
            } else if ( curr instanceof lextypes.rpr ) {
                if ( !expect_rpr )
                    throw new Error( "Unbalanced paren (extra right-paren)" );
                return output;
            } else {
                output.push( curr );
            }
        }
        if ( expect_rpr )
            throw new Error( "Unbalanced paren (extra left-paren)" );
        return this.ps_or( output );
    }
    
    ps_or ( input ) {
        if ( !input.length ) return [];
        if ( input[ 0 ] instanceof lextypes.oro )
            throw new Error( "OR cannot occur at beginning of expression." );
        if ( input[ input.length - 1 ] instanceof lextypes.oro )
            throw new Error( "OR cannot occur at end of expression." );
        let output = [];
        while ( input.length ) {
            let curr = input.shift();
            if ( curr instanceof lextypes.oro ) {
                let prev = output.pop();
                if ( prev instanceof lextypes.oro )
                    throw new Error( "OR cannot occur twice consecutively" );
                let next = input.shift();
                output.push( new expr.types.disj([ prev, next ]) );
            } else {
                output.push( curr );
            }
        }
        return output;
    }

};
