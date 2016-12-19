'use strict';

/*
    Given an array and a sorting function, divide an array into map 'buckets'.
    I think this is like lodash's partition().
    
    sort should return a string or, if it shouldn't be included, not-a-string.
*/

module.exports = ( arr, sort ) => {

    var map = {};
    
    for ( var i = 0; i < arr.length; i++ ) {
        let result = sort( arr[ i ] );
        if ( !( result instanceof String ) && typeof result !== 'string' )
            continue;
        if ( !( result in map ) )
            map[ result ] = [];
        map[ result ].push( arr[ i ] );
    }
    
    return map;
    
};

