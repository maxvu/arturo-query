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

describe( 'parser', function () {

    describe( 'constructor', function () {
        it( 'should accept only a String', function () {
            (() => {
                new parser( [] )
            }).should.throw();
            (() => {
                new parser( 3 )
            }).should.throw();
            (() => {
                new parser( new RegExp() )
            }).should.throw();
        } );
    } );
    
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
        
    } );
    
    describe( 'quoted terms', function () {
        
        it( 'should be ignored when empty', function () {
            parse( '""' ).should.deepEqual( parse( '' ) );
        } );
        
        // TODO: quoted terms with just whitespace inside
        
        it( 'should throw when unterminated', function () {
            ( () => { return parse( '"' ) } ).should.throw();
            ( () => { return parse( '\'' ) } ).should.throw();
        } );
        
        it( 'should escape quoting character', function () {
            ( () => {
                return parse( ` "esc\\\"aped" ` )
            } )().should.not.throw().and.deepEqual(
                parse( ` 'esc\"aped' ` )
            );
        } );
    
    } );
    
    describe( 'quoted terms', function () {
        
        it( 'should be ignored when empty', function () {
            parse( '""' ).should.deepEqual( parse( '' ) );
        } );
        
        // TODO: quoted terms with just whitespace inside
        
        it( 'should throw when unterminated', function () {
            ( () => { return parse( '"' ) } ).should.throw();
            ( () => { return parse( '\'' ) } ).should.throw();
        } );
        
        it( 'should escape quoting character', function () {
            ( () => {
                return parse( ` "esc\\\"aped" ` )
            } )().should.not.throw().and.deepEqual(
                parse( ` 'esc\"aped' ` )
            );
        } );
        
        it( 'should not be interrupted by parentheticals', function () {
            ( () => {
                return parse( ` 'elk(gull)' ` );
            } )()._children.should.containEql(
                new term( "elk(gull)" )
            )
        } );
    
    } );
    
    describe( 'negated expressions', function () {
        
        it( 'should not be confused with terms that begin with "not"', function () {
            parse(
                ' nothing '
            ).should.deepEqual( parse(
                ' "nothing" '
            ) );
        } );

        it( 'should negate bare terms', function () {
            parse(
                ' !slug '
            )._children.should.containEql(
                new term( 'slug' ).negate()
            );
        } );
        
        it( 'should negate quoted terms', function () {
            parse(
                ' !"quail" '
            )._children.should.containEql(
                new term( 'quail' ).negate()
            );
            parse(
                " !'tiger' "
            )._children.should.containEql(
                new term( 'tiger' ).negate()
            );
        } );
        
        it( 'should negate paren groups', function () {
            parse(
                ' !( worm ) '
            )._children.should.containEql(
                new term( 'worm' ).negate()
            );
            parse(
                ' !( -( worm ) ) '
            )._children.should.containEql(
                new term( 'worm' )
            );
            parse(
                ' !( not ( !worm ) ) '
            )._children.should.containEql(
                new term( 'worm' ).negate()
            );
        } );
        
        it( 'can occur in combination', function () {
            parse(
                ' !not -( worm ) '
            )._children.should.containEql(
                new term( 'worm' ).negate()
            );
            
            parse(
                ' not not not panda '
            )._children.should.containEql(
                new term( 'panda' ).negate()
            );
            
            parse(
                ' !! starfish '
            )._children.should.containEql(
                new term( 'starfish' )
            );
        } );
        
        it( 'should throw without an expression to negate', function () {
            ( () => { return parse( '!' ) } ).should.throw();
            ( () => { return parse( 'not' ) } ).should.throw();
            ( () => { return parse( '-' ) } ).should.throw();
        } );
        
    } );
    
    describe( 'disjunctive operators', function () {
    
        it( 'should produce disjunctions', function () {
            parse(
                ' snail or whale '
            )._children.should.containEql(
                new disj([
                    new term( 'snail' ),
                    new term( 'whale' )
                ])
            );
            parse(
                ' snail | whale '
            )._children.should.containEql(
                new disj([
                    new term( 'snail' ),
                    new term( 'whale' )
                ])
            );
        } );
        
        it( 'should not be confused with terms that begin with "or"', function () {
            parse(
                ' orca '
            ).should.deepEqual( parse(
                ' "orca" '
            ) );
        } );
        
        it( 'cannot occur at the beginning of a query', function () {
            ( () => {
                parse( ' or termite ' )
            } ).should.throw();
            
            ( () => {
                parse( ' | termite ' )
            } ).should.throw();
        } );
        
        it( 'cannot occur at the end of a query', function () {
            ( () => {
                parse( ' toad or ' )
            } ).should.throw();
            
            ( () => {
                parse( ' toad | ' )
            } ).should.throw();
        } );
        
        it( 'cannot occur twice and adjacently', function () {
            ( () => {
                parse( ' tarantula or or squirrel ' )
            } ).should.throw();
            
            ( () => {
                parse( ' sparrow | or snail ' )
            } ).should.throw();
            
            ( () => {
                parse( ' yak || vulture ' )
            } ).should.throw();
            
            ( () => {
                parse( ' yak | \t| vulture ' )
            } ).should.throw();
        } );
        
    } );
    
    describe( 'parenthetical groups', function () {
        
        it( 'should die when left unmatched', function () {
            ( () => {
                parse( ' ( swan ' )
            } ).should.throw();
            
            ( () => {
                parse( ' ) warthog ' )
            } ).should.throw();
        } );
        
    } );
    
} );


