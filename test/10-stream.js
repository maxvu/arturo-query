'use strict';
var should = require( 'should' );
var stream = require( '../src/stream.js' );

describe( 'stream', function () {

    it( 'should report done() when done', function () {
        let s = new stream( 'hi' )
        s.done().should.be.false();
        s.step();
        s.done().should.be.false();
        s.step();
        s.done().should.be.true();
    } );
    
    it( 'should not step() past the end of the string', function () {
        let s = new stream( 'hi' );
        s.step().step().step().step().done().should.be.true();
        s.extract().getText().should.equal( 'hi' );
    } );
    
    it( 'should peek() at current index when given no arg', function () {
        let s = new stream( 'hi' );
        should( s.peek() ).equal( 'h' );
        s.step();
        should( s.peek() ).equal( 'i' );
    } );
    
    it( 'should peek() at index _end + n when given arg', function () {
        let s = new stream( 'hi' );
        should( s.peek( 0 ) ).equal( 'h' );
        should( s.peek( 1 ) ).equal( 'i' );
    } );
    
    it( 'should peek() at the floor() of a non-Integer arg', function () {
        let s = new stream( 'hi' );
        should( s.peek( 0.5 ) ).equal( 'h' );
        should( s.peek( 1.5 ) ).equal( 'i' );
    } );
    
    it( 'should extract() zero-length site when substring is empty', function () {
        let st1 = new stream( 'hi' );
        st1.extract().getText().should.equal( '' );
        should( st1.extract().getBegin() ).equal( 0 );
        should( st1.extract().getEnd() ).equal( 0 );
        let st2 = new stream( 'hi' ).step();
        st2.extract();
        should( st2.extract().getBegin() ).equal( 1 );
        should( st2.extract().getEnd() ).equal( 1 );
    } );
    
    it( 'should extract() exclusive of `end`', function () {
        let s = (new stream( 'hello' )).step().step();
        s.extract().getText().should.equal( 'he' );
    } );
    
    it( 'should scan() correctly', function () {
        let s = new stream( 'hi' );
        should( s.scan( 'abcd' ) ).be.false();
        should( s.scan( 'efgh' ) ).be.true();
        s.step();
        should( s.scan( 'abcd' ) ).be.false();
        should( s.scan( 'efgh' ) ).be.false();
        should( s.scan( 'ijkl' ) ).be.true();
    } );
    
    it( 'can scan() backwards', function () {
        let s = new stream( 'hi' );
        s.step();
        should( s.scan( 'h', -1 ) ).be.true();
    } );

} );
