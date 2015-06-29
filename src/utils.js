var _ = {};
module.exports =  _;

_.now = Date.now || function() {
    return new Date().getTime();
};

_.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
        var last = _.now() - timestamp;

        if (last < wait && last >= 0) {
            timeout = setTimeout(later, wait - last);
        } else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            }
        }
    };

    return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }

        return result;
    };
}

_.unif = function(lo, hi) {
    return (hi - lo) * Math.random() + lo;
}

_.jitter = function(el, lo, hi) {
    var value = 'rotate(' + unif(lo, hi) + 'deg)';
    el.style['transform'] = value;
    el.style['-webkit-transform'] = value;
}

_.createElement = function(str) {
    var div = document.createElement('div');
    div.innerHTML = str;
    var elements = div.firstChild; 
}

_.applyStyles = function(el, styles, options) {
    options = options || {};
    Object.keys(styles).forEach(function(property) {
        el.style[property] = styles[property];
        if (options.prefix) {
            if (typeof options.prefix !== 'object') {
                options.prefix = ['webkit', 'moz'];
            }
            options.prefix.forEach(function(prefix) {
                el.style['-' + prefix + '-' + property] = styles[property];
            });
        }
    });
};

_.ELEMENT_NODE = 1;
_.TEXT_NODE = 3;
_.PROCESSING_INSTRUCTION_NODE = 7;
_.COMMENT_NODE = 8;
_.DOCUMENT_NODE = 9;
_.DOCUMENT_TYPE_NODE = 10;
_.DOCUMENT_FRAGMENT_NODE = 11;
