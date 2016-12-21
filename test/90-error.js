'use strict';
var should = require( 'should' );
var query = require( '../src/query' );
var error = require( '../src/error' );
var site = require( '../src/site' );

describe( 'error', function () {

    it( 'should identify a site', function () {
    
        try {
            new query( 'a or ( b' );
        } catch ( ex ) {
            ex.should.be.instanceof( error );
            ex.should.have.property( 'getSite' );
            ex.getSite().should.be.instanceof( site );
            ex.getSite().getBegin().should.equal( 5 );
            ex.getSite().getEnd().should.equal( 6 );
            return;
        }
        
        should().fail();
        
    } );
    
    it( 'should report as a string naming location', function () {
    
        try {
            new query( '"hello' );
        } catch ( ex ) {
            ex.should.be.instanceof( error );
            ex.should.have.property( 'getReport' );
            ex.getReport().should.be.a.String();
            ex.getReport().should.equal( 'Unterminated quote at position 0' );
            return;
        }
        
        should().fail();
        
    } );
    
} );
