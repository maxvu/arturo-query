'use strict';

/*
    A bunch of character constants, mostly used by lexer.
*/

module.exports = {

    // whitespace
    wts : " \n\t\v\r",
    
    // quoted terms
    quo : {
        det : "\"'"
    },
    
    // parentheticals
    par : {
        opn : '(',
        cls : ')'
    },
    
    // attr/value 'tag' pairs
    tag : {
        det : ':'
    },
    
    // negation
    neg : {
        det : '!-'
    },
    
    // disjunctive operator
    oro : {
        det : '|',
    },
    
    // bare term, interrupting characters
    trm : {
        int : ':!(\"\')|'
    }
};

