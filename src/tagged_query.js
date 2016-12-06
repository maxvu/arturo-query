'use strict';

var parser = require( './parser.js' );
var expr = require( './expr.js' );

var query = require ( './query.js' ).query;
var subquery = require ( './query.js' ).subquery;

const R_TAG = new RegExp( '^([^\:]+)\:([^\:]+)$' );

/*
    A 'tagged' query is one that notes a semantic meaning for terms in the shape
    of "K:V" for attribute-value pairs for search criteria that aren't full-text.
    
    This is done so late in the game because different folks may have different 
    ideas about more complicated searches or, even, the ':' syntax I chose here.
*/

module.exports = {

    // utility to pass the tuple
    // thrown away almost right after created
    tag : class tag {
    
        constructor ( attr, value ) {
            this._attr = attr;
            this._value = value;
        }
        
        getAttr () {
            return this._attr;
        }
        
        getValue () {
            return this._value;
        }
        
    },
    
    // parse a pair or indicate unparseable
    parseTag : ( term ) => {
        let matches = term.getId().match( R_TAG );
        if ( matches === null )
            return null;
        return new tag( matches[ 1 ], matches[ 2 ] );
    },
    
    // for every tag-like term encountered, remove and set in _tags[]
    extractTags : ( sq ) => {
        sq._terms.forEach( ( term ) => {
            let tag;
            if ( ( tag = parseTag( sq._terms[ i ] ) ) !== null ) {
                sq._terms.splice( sq._terms.indexOf( term ), 1 );
                sq._tags[ tag.getAttr() ] = tag.getValue();
            }
        } );
        return sq;
    },

    taggedSubquery : class tagged_subquery extends subquery {
        
        constructor ( conj ) {
            super( conj );
            this._tags = [];
            extractTags( this );
        }
        
        toString () {
            let ss = super.toString() + ' ';
            ss += this._tags.keys.map( ( acc, tag ) => {
                return `${tag.getAttr()}:${tag.getValue()}`;
            }, '' ).join( ' ' );
        }
        
    },
    
    taggedQuery : class taggedQuery extends query {
    
        constructor ( raw ) {
            super( raw );
            this._subqueries = this._subqueries.map( ( sq ) => {
                return extractTags( sq );
            } );
        }    
    
    }

};

