'use strict';
var site = require( './site' );
var token = require( './token' );
var stream = require( './stream' );
var charmap = require( './charmap' );

module.exports = ( raw ) => {
    
    var input = new stream( raw );
    var output = [];
    
    // lex whitespace
    function lx_wts () {
        while( input.scan( charmap.wts ) )
            input.step();
        output.push( new token.wts( input.extract() ) );
    }
    
    function lx_trm () {
        while (
            !input.scan( charmap.trm.int ) &&
            !input.scan( charmap.wts ) &&
            !input.done()
        ) {
            input.step();
        }
        output.push( new token.trm( input.extract() ) );
    }
    
    function lx_quo () {
        let opening_quote = new token.quo( input.step().extract() );
        while ( !input.done() && !input.scan( opening_quote.getText() ) )
            input.step();
        if ( input.done() )
            throw opening_quote.getSite().error( "Unterminated quote" );
        output.push( opening_quote );
        output.push( new token.trm( input.extract() ) );
        output.push( new token.quo( input.step().extract() ) );
    }
    
    function lx () {
        if ( input.scan( charmap.wts ) )
            lx_wts();
        else if ( input.scan( charmap.quo.det ) )
            lx_quo();
        else if ( input.scan( charmap.par.opn ) )
            output.push( new token.lpr( input.step().extract() ) );
        else if ( input.scan( charmap.par.cls ) )
            output.push( new token.rpr( input.step().extract() ) );
        else if ( input.scan( charmap.tag.det ) )
            output.push( new token.tag( input.step().extract() ) );
        else if ( input.scan( charmap.neg.det ) )
            output.push( new token.neg( input.step().extract() ) );
        else if ( input.scan( charmap.oro.det ) )
            output.push( new token.oro( input.step().extract() ) );
        else
            lx_trm();
    }
    
    while ( !input.done() )
        lx();
    
    return output;
    
};


