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
    
    it( 'should peek() at 0 when given arg < 0', function () {
        let s = new stream( 'hi' );
        should( s.peek( -1 ) ).equal( 'h' );
        s.step();
        should( s.peek( -1 ) ).equal( 'i' );
    } );
    
    it( 'should extract() null when substring is empty', function () {
        let s = new stream( 'hi' );
        should( s.extract() ).be.null();
        s.step().extract();
        should( s.extract() ).be.null();
        should( s.step().extract().getText() ).equal( 'i' );
        should( s.step().step().extract() ).be.null();
    } );
    
    it( 'should extract() exclusive of `end`', function () {
        let s = (new stream( 'hello' )).step().step();
        s.extract().getText().should.equal( 'he' );
    } );

} );
