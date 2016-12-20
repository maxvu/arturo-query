'use strict';
var should = require( 'should' );
var expr = require( '../src/expr' );
var query = require( '../src/query' );
var site = require( '../src/site' );

let stub = {
    term : function ( begin, end, id ) {
        return new expr.term(
            new token.trm(
                new site( begin, end, id )
            )
        );
    }
};

describe( 'query', function () {

    it( 'should accept a string', function () {
        new query( 'a or b' );
    } );
    
    it( 'should correctly dissect disjunctives', function () {
    
        // no disjunctives
        (new query( '( a b c )' )).toDisjunction().toString( 1 )
            .should.equal( '( "a" "b" "c" )' );
        
        // simple disjunctive, degree two
        (new query( 'a ( b | c )' )).toDisjunction().toString( 1 )
            .should.equal( '( "a" "b" ) OR ( "a" "c" )' );
            
        // simple disjunctive, degree two
        (new query( 'a b c | d' )).toDisjunction().toString( 1 )
            .should.equal( '( "a" "b" "c" ) OR ( "a" "b" "d" )' );

        // simple disjunctive, degree three
        (new query( '( a | b ) | ( c )' )).toDisjunction().toString( 1 )
            .should.equal( '( "a" ) OR ( "b" ) OR ( "c" )' );
        
        // simple disjunctive, degree four
        (new query( '( a | b ) ( 1 | 2 )' )).toDisjunction().toString( 1 )
            .should.equal( '( "a" "1" ) OR ( "a" "2" ) OR ( "b" "1" ) OR ( "b" "2" )' );

    } );
    
} );
