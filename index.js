var query = require( './src/query' );

module.exports = ( txt_query ) => {

    return (new query( txt_query ) );
    
};
