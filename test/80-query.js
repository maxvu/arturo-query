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
    
    describe( 'isUniverse() / isZeroSet() - ', function () {
    
        it( 'empty query is the universe', function () {
            (new query( '' )).isUniverse().should.be.true();
            (new query( '' )).isZeroSet().should.be.false();
        } );
        
        it( 'any query with any term or tag is neither zero nor universe', function () {
            [
                'a',
                '!a',
                'attr:val',
                '!attr:val'
            ].forEach( ( test ) => {
                (new query( test )).isUniverse().should.be.false();
                (new query( test )).isZeroSet().should.be.false();
            } );
        } );
        
        it( 'conjunction with contradicting terms is the zero set', function () {
            (new query( 'a !a' )).isZeroSet().should.be.true();
            (new query( 'a !a' )).isUniverse().should.be.false();
        } );
        
        it( 'conjunction with contradicting tags is the zero set', function () {
            (new query( 'attr:val !attr:val' )).isZeroSet().should.be.true();
            (new query( 'attr:val !attr:val' )).isUniverse().should.be.false();
        } );
        
        it( 'disjunction with contradicting terms is the universe', function () {
            (new query( 'a | !a' )).isUniverse().should.be.true();
            (new query( 'a | !a' )).isZeroSet().should.be.false();
        } );
        
        it( 'disjunction with contradicting tags is /neither zero nor universe/', function () {
            (new query( 'attr:val | !attr:val' )).isUniverse().should.be.false();
            (new query( 'attr:val | !attr:val' )).isZeroSet().should.be.false();
        } );

    
    } );
    
    it( 'toString() should work', function () {
        (new query( 'a | b !c' )).toString().should.equal(
            (new query( '(a or b) not c' )).toString()
        );
    } );
    
} );
