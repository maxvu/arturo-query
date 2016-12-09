'use strict';
var should = require( 'should' );
var lexer = require( '../src/lexer/lexer.js' );

describe( 'lexer', function () {

    let lexdump = ( test_string ) => {
        let lx = new lexer( test_string );
        lx.lex();
        return lx._output.reduce( ( acc, sym ) => {
            acc.push( `${sym.constructor.name}(${sym.getText()})` );
            return acc;
        }, [] ).join( ' ' );
    };
    
    let expectdump = ( map ) => {
        for ( var key in map )
            lexdump( key ).should.equal( map[ key ] );
    };
    
    it( 'should accept the empty string', function () {
        (new lexer( '' )).lex().should.be.an.Array();
    } );
    
    describe( 'whitespace', function () {
        it( 'should be interpreted properly', function () {
            expectdump({
                // each whitespace character named in the map triggers wts()
                ' x '   : 'wts( ) trm(x) wts( )',
                '\tx\v' : 'wts(\t) trm(x) wts(\v)',
                '\nx\r' : 'wts(\n) trm(x) wts(\r)'
            });
        } );
    } );

    describe( 'quoted terms', function () {
    
        it( 'should be interpreted properly', function () {
            expectdump({

                // normal case
                'x "y"' : 'trm(x) wts( ) quo(") trm(y) quo(")',
                
                // no spacing on left, double-quotes
                'x"y"'  : 'trm(x) quo(") trm(y) quo(")',
                
                // no spacing on right, double-quotes
                '"x"y'  : 'quo(") trm(x) quo(") trm(y)',
                
                // no spacing on left, single-quotes
                "x'y'"  : "trm(x) quo(') trm(y) quo(')",
                
                // no spacing on right, single-quotes
                "'x'y"  : "quo(') trm(x) quo(') trm(y)",

            });
        } );
        
        it( 'should report on unterminated quote', function () {
            [
                ' " ',
                " ' ",
                " a ' b ",
                ' a " b '
            ].forEach( ( bad_case ) => {
                let lx = (new lexer( bad_case ) );
                lx.lex();
                lx.isOkay().should.be.false();
                lx.getError().should.not.be.null();
            } );
        } );
        
        // sorry, no escaped characters...
        
    } );
    
    describe( 'bare terms', function () {
    
        it( 'should be interpreted properly', function () {
            expectdump({
                
                // basic case
                'hello'        : 'trm(hello)',
                
                // negator char doesn't interrupt term
                'hello-world'  : 'trm(hello-world)',
                
                // parens /do/ interrupt
                'hello(world)' : 'trm(hello) lpr(() trm(world) rpr())',
                
                // bang-negator /does/ interrupt
                'hello!world' : 'trm(hello) neg(!) trm(world)',
                
                // disjunctive /does/ interrups
                'hello|world' : 'trm(hello) oro(|) trm(world)'
                
            });
        } );
    
    } );
    
    describe( 'negators', function () {
    
        it( 'should be interpreted properly', function () {
            expectdump({
                '!x'   : 'neg(!) trm(x)',
                '!"x"' : 'neg(!) quo(") trm(x) quo(")',
                "!'x'" : "neg(!) quo(') trm(x) quo(')",
                '!(x)' : 'neg(!) lpr(() trm(x) rpr())',
                '(!x)' : 'lpr(() neg(!) trm(x) rpr())',
                
                '-x'   : 'neg(-) trm(x)',
                '-"x"' : 'neg(-) quo(") trm(x) quo(")',
                "-'x'" : "neg(-) quo(') trm(x) quo(')",
                '-(x)' : 'neg(-) lpr(() trm(x) rpr())',
                '(-x)' : 'lpr(() neg(-) trm(x) rpr())'
            });
        } );
        
    } );
    
    describe( 'tag delimiters', function () {
        it( 'should be interpreted properly', function () {
            expectdump({
                'a:b'   : 'trm(a) tag(:) trm(b)',
                '"a":b' : 'quo(") trm(a) quo(") tag(:) trm(b)',
                'a:"b"' : 'trm(a) tag(:) quo(") trm(b) quo(")',
                '!a:b'  : 'neg(!) trm(a) tag(:) trm(b)',
                'a:!b'  : 'trm(a) tag(:) neg(!) trm(b)',
                'a:-b'  : 'trm(a) tag(:) neg(-) trm(b)'
            });
        } );
    } );

} );

it( 'all be okay in the end', function () {

} );
