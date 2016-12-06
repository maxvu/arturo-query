'use strict';
var should = require( 'should' );
var expr = require( '../src/expr.js' );
var parser = require( '../src/parser.js' );

var term = expr.term;
var conj = expr.conj;
var disj = expr.disj;

let parse = ( query ) => {
    return (new parser( query )).parse().reduce();
};

/*
    More complex cases that 
*/

describe( 'complex cases', function () {

    describe( 'complex logic', function () {
    
        it( 'should flatten all conjuntive terms', function () {
            parse(
                'alpha ( ( beta ) () ( gamma ( delta ) ) )'
            ).should.be.an.instanceOf( conj ).and.deepEqual(
                parse( 'alpha beta gamma delta' )
            );
        } );
        
        it( 'should flatten all disjunctive terms', function () {
            parse(
                'alpha or ( ( beta ) or () or ( gamma | ( delta ) ) )'
            ).should.be.an.instanceOf( conj ).and.deepEqual(
                parse( 'alpha | beta | gamma | delta' )
            );
        } );
        
        it( 'properly expand conj/disj combinations', function () {
            parse(
                'A !( B or !( C or D ) )'
            ).toString().should.equal(
                parse( 'A !B (C or D)' ).toString()
            );
        } );
    
    } );
    
} );
