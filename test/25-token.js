'use strict';
var should = require( 'should' );
var token = require( '../src/token' );
var site = require( '../src/site' );

var stub = {
    site : function ( text ) {
        return new site( 0, 0, text );
    }
};

describe( 'token', function () {

    it( 'should die if not given a site', function () {
        
        ( () => { new token.tok( 1 ); } ).should.throw( /site/ );
        ( () => { new token.trm( 1 ); } ).should.throw( /site/ );
        ( () => { new token.quo( 1 ); } ).should.throw( /site/ );
        ( () => { new token.lpr( 1 ); } ).should.throw( /site/ );
        
    } );
    
    it( 'should identify type with getType()', function () {

        (new token.trm( stub.site() ) ).getType().should.equal(
            token.type_ids.trm
        );
        
        (new token.quo( stub.site() ) ).getType().should.equal(
            token.type_ids.quo
        );
        
        (new token.tag( stub.site() ) ).getType().should.equal(
            token.type_ids.tag
        );
        
        (new token.lpr( stub.site() ) ).getType().should.equal(
            token.type_ids.lpr
        );
        
        (new token.rpr( stub.site() ) ).getType().should.equal(
            token.type_ids.rpr
        );
    
        (new token.neg( stub.site() ) ).getType().should.equal(
            token.type_ids.neg
        );
    
        (new token.oro( stub.site() ) ).getType().should.equal(
            token.type_ids.oro
        );
    
        (new token.wts( stub.site() ) ).getType().should.equal(
            token.type_ids.wts
        );
    
    } );
    
} );
