'use strict';
var should = require( 'should' );
var expr = require( '../src/expr.js' );
var parser = require( '../src/parser.js' );

var term = expr.term;
var conj = expr.conj;
var disj = expr.disj;

let parse = ( query ) => {
    return (new parser( query )).debug().parse().reduce();
};

describe( 'parser', function () {
    
    describe( 'bare terms', function () {
        it( 'should parse simple terms', function () {
            parse( 'chicken' ).should.deepEqual(
                new conj([ new term( 'chicken' ) ])
            );
        } );
        
        it( 'should be interrupted by various whitespace', function () {
            parse( 'eel horse' ).should.deepEqual(
                new conj([
                    new term( 'eel' ),
                    new term( 'horse' )
                ])
            );
            parse( " leopard\tmarlin" ).should.deepEqual(
                new conj([
                    new term( 'leopard' ),
                    new term( 'marlin' )
                ])
            );
            parse( "\viguana\nmanatee\r" ).should.deepEqual(
                new conj([
                    new term( 'iguana' ),
                    new term( 'manatee' )
                ])
            );
        } );
        
        it( 'should interpret infixed dashes as part of the term', function () {
            parse(
                'chicken-horse'
            ).should.deepEqual( parse( 
                ' "chicken-horse" '
            ) );
            parse(
                'hornet-marmot-'
            ).should.deepEqual( parse( 
                ' "hornet-marmot-" '
            ) );
        } );
        
        it( 'should interrupted by quotes', function () {
            parse(
                ' seal"stingray" '
            ).should.deepEqual( parse( 
                'seal stingray'
            ) );
            
            parse(
                '  toucan\'snake\'  '
            ).should.deepEqual( parse( 
                'toucan snake'
            ) );
        } );
        
        it( 'should interrupted by parenthetical expressions', function () {
            parse(
                ' seal(stingray) '
            ).should.deepEqual( parse( 
                'seal (stingray)'
            ) );
        } );
        
        it( 'should interrupted by disjunction operators', function () {
            parse(
                ' wasp|stork '
            ).should.deepEqual( parse( 
                'wasp or stork'
            ) );
        } );
        
        it( 'should not confuse terms that begin with "or"', function () {
            parse(
                ' orca '
            ).should.deepEqual( parse(
                ' "orca" '
            ) );
        } );
        
        it( 'should not confuse terms that begin with "and"', function () {
            parse(
                ' andean-cat '
            ).should.deepEqual( parse(
                ' "andean-cat" '
            ) );
        } );
        
    } );
    
} );
