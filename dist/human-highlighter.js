(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Build this using browserify and the resulting bundle can be used as a
// "traditional" browser global for the lazy.
window.HumanHighlighter = require('./human-highlighter');

},{"./human-highlighter":2}],2:[function(require,module,exports){
var utils = require('./utils');

var hasInitializedResizeHandler = false;
function HumanHighlighter(options) {
    options = options || {};
    this.color = options.color || 'black';
    this.colors = options.colors || ['yellow', '#F7F233', '#F7F243', '#FDE821'];
    this.randomizeColors = options.randomizeColors !== false;
    this.highlightClassName = 'hh' || options.highlightClassName;
    this.wrapperHighlightClassName = 'hh-hl';
    this.wrapperTextClassName = 'hh-t';
    this.negJitterX = typeof options.negJitterX !== 'undefined' ? options.negJitterX : -1;
    this.posJitterX = typeof options.posJitterX !== 'undefined' ? options.posJitterX :  0.75;
    this.negJitterY = typeof options.negJitterY !== 'undefined' ? options.negJitterY : -0.25;
    this.posJitterY = typeof options.posJitterY !== 'undefined' ? options.posJitterY :  0.25;
    this.adjacentSideLength = typeof options.adjacentSideLength !== 'undefined' ? options.adjacentSideLength : 1;
}

getTopOffsetFromParent = function(el) {
    return el.getBoundingClientRect().top - el.parentElement.getBoundingClientRect().top;
}

HumanHighlighter.prototype.getWrapper = function(text) {
    return '<span class="' + this.wrapperHighlightClassName + '"><span class="' + this.wrapperTextClassName + '">' + text + '</span></span>';
}

HumanHighlighter.prototype._getHighlightColor = function() {
    var _this = this;
    _this.colorIndex = _this.colorIndex || 0;

    if (_this.randomizeColors) {
        return _this.colors[Math.floor(utils.unif(0, _this.colors.length))];
    } else {
        return  _this.colors[_this.colorIndex];
    }
    ++_this.colorIndex % _this.colors.length;
}

HumanHighlighter.prototype.highlight = function(options) {
    var _this = this;
    setTimeout(function() {
        options = options || {};
        Object.keys(options).forEach(function(key) {
            _this[key] = options[key];
        });

        Array.prototype.slice.call(document.getElementsByClassName(_this.wrapperHighlightClassName)).forEach(function(el) {
            el.remove();
        });

        Array.prototype.slice.call(document.getElementsByClassName(_this.highlightClassName)).forEach(function(el) {
            // Make a copy of the element for manipulation, set the original to
            // display:none.
            var textToHighlight = el.innerHTML;
            if (el.nextSibling && el.nextSibling.nodeType === utils.TEXT_NODE && /^\S/.test(el.nextSibling.wholeText)) {
                // Get whatever non-whitespace stuff (e.g., punctuation)
                // that appears after the chunk we want to highlight. Due to
                // the way line wrapping works, it'll make our lives easier
                // if we just include this non-whitespace stuff in the
                // highlighted chunk. Reference:
                // https://developer.mozilla.org/en-US/docs/Web/API/Text
                textToHighlight += el.nextSibling.wholeText.match(/^\S+/)[0];
                console.log('Appending adjacent non-whitespace text to highlighted text: "' + el.nextSibling.wholeText.match(/^\S+/)[0] + '"');
                console.log('New textToHighlight is now: "' + textToHighlight + '"');

                // Now chop off that same non-whitespace stuff from the
                // adject text node.
                var adjacentText = el.nextSibling.wholeText.replace(/^\S+/, "");
                el.nextSibling.nodeValue = adjacentText;
                console.log('new adject text node is now:', el.nextSibling.nodeValue);
            }
            el.innerHTML = textToHighlight; // Re-assign in case we've added stuff
            el.style.display = 'none';
            var wrapperElements = _this.getWrapper(textToHighlight);
            el.insertAdjacentHTML('afterend', wrapperElements);
        });

        Array.prototype.slice.call(document.getElementsByClassName(_this.wrapperHighlightClassName)).forEach(function(el) {
            var highlighterEl = el;
            var textEl = highlighterEl.firstChild;
            var words = textEl.innerHTML.split(/\s+/);

            textEl.innerHTML = words[0]; // first word
            var singleLineHeight = highlighterEl.getBoundingClientRect().height;
            var singleLineTop = getTopOffsetFromParent(highlighterEl);
            var height = singleLineHeight;
            var top = singleLineTop;
            var startIndex = 0;
            var endIndex = 1;

            while (endIndex <= words.length) {
                textEl.innerHTML = words.slice(startIndex, endIndex).join(' ');
                // console.log('textEl has words', words.slice(startIndex, endIndex).join(' '));

                height = highlighterEl.getBoundingClientRect().height;
                top = getTopOffsetFromParent(highlighterEl);

                if (height > singleLineHeight || top !== singleLineTop) {
                    // console.log('Height:', height, 'Single Line Height:', singleLineHeight, 'Top:', top, 'Single Line Top:', singleLineTop); 
                    textEl.innerHTML = words.slice(startIndex, endIndex-1).join(' ');
                    highlighterEl.style.background = _this._getHighlightColor();
                    var newHighlightedLine = ' ' + _this.getWrapper(words[endIndex-1]);
                    highlighterEl.insertAdjacentHTML('afterend', newHighlightedLine);
                    startIndex = endIndex - 1;

                    highlighterEl = highlighterEl.nextElementSibling;
                    textEl = highlighterEl.firstChild;
                    singleLineHeight = highlighterEl.getBoundingClientRect().height;
                    singleLineTop = getTopOffsetFromParent(highlighterEl);

                } else {
                    endIndex++;
                }
            }

            // Potentially redundant in certain cases, but whatever.
            var background = _this._getHighlightColor();
            utils.applyStyles(highlighterEl, {
                display: 'inline-block',
                padding: '0',
                background: background,
                color: _this.color,
                position: 'relative',
                zIndex: 1
            });

            utils.applyStyles(highlighterEl.firstChild, {
                display: 'inline-block'
                // text-shadow: 1px 0px 1px black;
            });
        }); 

        _this._jitterHighlights();
        if (!hasInitializedResizeHandler) {
            window.addEventListener('resize', utils.debounce(_this.highlight.bind(_this), 500));
            hasInitializedResizeHandler = true;
        }
    }, 1);
}

HumanHighlighter.prototype._jitterHighlights = function() {
    var _this = this;
    Array.prototype.slice.call(document.getElementsByClassName(_this.wrapperHighlightClassName)).forEach(function(el) {
        var highlighterEl = el;
        var textEl = el.firstChild;
        var count = textEl.innerHTML.length;
        var maxAngle = 180 * Math.atan(_this.adjacentSideLength / count) / Math.PI
        var angle = utils.unif(-maxAngle, maxAngle);
        var dx = utils.unif(_this.negJitterX, _this.posJitterX);
        var dy = utils.unif(_this.negJitterY, _this.posJitterY);
        var height = el.getBoundingClientRect().height
        var dh = utils.unif(0, 0.25 * height);
        
        var posRotateValue = 'rotate(' + angle + 'deg)';
        var negRotateValue = 'rotate(' + (-1 * angle) + 'deg)';
        var posTranslateValue = 'translate(' + dx + 'em, ' + dy + 'em)';
        var negTranslateValue = 'translate(' + (-1*dx) + 'em, ' + (-1*dy) + 'em)';

        utils.applyStyles(highlighterEl, {transform: posRotateValue + ' ' + posTranslateValue}, {prefix: ['webkit']});;
        highlighterEl.style['height'] = (height - dh) + 'px';
        utils.applyStyles(textEl, {transform: negTranslateValue + ' ' + negRotateValue}, {prefix: ['webkit']});
    });     
}

module.exports = HumanHighlighter;

},{"./utils":3}],3:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaHVtYW4taGlnaGxpZ2h0ZXIuYnJvd3Nlci1nbG9iYWwuanMiLCJzcmMvaHVtYW4taGlnaGxpZ2h0ZXIuanMiLCJzcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEJ1aWxkIHRoaXMgdXNpbmcgYnJvd3NlcmlmeSBhbmQgdGhlIHJlc3VsdGluZyBidW5kbGUgY2FuIGJlIHVzZWQgYXMgYVxuLy8gXCJ0cmFkaXRpb25hbFwiIGJyb3dzZXIgZ2xvYmFsIGZvciB0aGUgbGF6eS5cbndpbmRvdy5IdW1hbkhpZ2hsaWdodGVyID0gcmVxdWlyZSgnLi9odW1hbi1oaWdobGlnaHRlcicpO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgaGFzSW5pdGlhbGl6ZWRSZXNpemVIYW5kbGVyID0gZmFsc2U7XG5mdW5jdGlvbiBIdW1hbkhpZ2hsaWdodGVyKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLmNvbG9yID0gb3B0aW9ucy5jb2xvciB8fCAnYmxhY2snO1xuICAgIHRoaXMuY29sb3JzID0gb3B0aW9ucy5jb2xvcnMgfHwgWyd5ZWxsb3cnLCAnI0Y3RjIzMycsICcjRjdGMjQzJywgJyNGREU4MjEnXTtcbiAgICB0aGlzLnJhbmRvbWl6ZUNvbG9ycyA9IG9wdGlvbnMucmFuZG9taXplQ29sb3JzICE9PSBmYWxzZTtcbiAgICB0aGlzLmhpZ2hsaWdodENsYXNzTmFtZSA9ICdoaCcgfHwgb3B0aW9ucy5oaWdobGlnaHRDbGFzc05hbWU7XG4gICAgdGhpcy53cmFwcGVySGlnaGxpZ2h0Q2xhc3NOYW1lID0gJ2hoLWhsJztcbiAgICB0aGlzLndyYXBwZXJUZXh0Q2xhc3NOYW1lID0gJ2hoLXQnO1xuICAgIHRoaXMubmVnSml0dGVyWCA9IHR5cGVvZiBvcHRpb25zLm5lZ0ppdHRlclggIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5uZWdKaXR0ZXJYIDogLTE7XG4gICAgdGhpcy5wb3NKaXR0ZXJYID0gdHlwZW9mIG9wdGlvbnMucG9zSml0dGVyWCAhPT0gJ3VuZGVmaW5lZCcgPyBvcHRpb25zLnBvc0ppdHRlclggOiAgMC43NTtcbiAgICB0aGlzLm5lZ0ppdHRlclkgPSB0eXBlb2Ygb3B0aW9ucy5uZWdKaXR0ZXJZICE9PSAndW5kZWZpbmVkJyA/IG9wdGlvbnMubmVnSml0dGVyWSA6IC0wLjI1O1xuICAgIHRoaXMucG9zSml0dGVyWSA9IHR5cGVvZiBvcHRpb25zLnBvc0ppdHRlclkgIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5wb3NKaXR0ZXJZIDogIDAuMjU7XG4gICAgdGhpcy5hZGphY2VudFNpZGVMZW5ndGggPSB0eXBlb2Ygb3B0aW9ucy5hZGphY2VudFNpZGVMZW5ndGggIT09ICd1bmRlZmluZWQnID8gb3B0aW9ucy5hZGphY2VudFNpZGVMZW5ndGggOiAxO1xufVxuXG5nZXRUb3BPZmZzZXRGcm9tUGFyZW50ID0gZnVuY3Rpb24oZWwpIHtcbiAgICByZXR1cm4gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIC0gZWwucGFyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG59XG5cbkh1bWFuSGlnaGxpZ2h0ZXIucHJvdG90eXBlLmdldFdyYXBwZXIgPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgcmV0dXJuICc8c3BhbiBjbGFzcz1cIicgKyB0aGlzLndyYXBwZXJIaWdobGlnaHRDbGFzc05hbWUgKyAnXCI+PHNwYW4gY2xhc3M9XCInICsgdGhpcy53cmFwcGVyVGV4dENsYXNzTmFtZSArICdcIj4nICsgdGV4dCArICc8L3NwYW4+PC9zcGFuPic7XG59XG5cbkh1bWFuSGlnaGxpZ2h0ZXIucHJvdG90eXBlLl9nZXRIaWdobGlnaHRDb2xvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgX3RoaXMuY29sb3JJbmRleCA9IF90aGlzLmNvbG9ySW5kZXggfHwgMDtcblxuICAgIGlmIChfdGhpcy5yYW5kb21pemVDb2xvcnMpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzLmNvbG9yc1tNYXRoLmZsb29yKHV0aWxzLnVuaWYoMCwgX3RoaXMuY29sb3JzLmxlbmd0aCkpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gIF90aGlzLmNvbG9yc1tfdGhpcy5jb2xvckluZGV4XTtcbiAgICB9XG4gICAgKytfdGhpcy5jb2xvckluZGV4ICUgX3RoaXMuY29sb3JzLmxlbmd0aDtcbn1cblxuSHVtYW5IaWdobGlnaHRlci5wcm90b3R5cGUuaGlnaGxpZ2h0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBfdGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcblxuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKF90aGlzLndyYXBwZXJIaWdobGlnaHRDbGFzc05hbWUpKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICBlbC5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShfdGhpcy5oaWdobGlnaHRDbGFzc05hbWUpKS5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAvLyBNYWtlIGEgY29weSBvZiB0aGUgZWxlbWVudCBmb3IgbWFuaXB1bGF0aW9uLCBzZXQgdGhlIG9yaWdpbmFsIHRvXG4gICAgICAgICAgICAvLyBkaXNwbGF5Om5vbmUuXG4gICAgICAgICAgICB2YXIgdGV4dFRvSGlnaGxpZ2h0ID0gZWwuaW5uZXJIVE1MO1xuICAgICAgICAgICAgaWYgKGVsLm5leHRTaWJsaW5nICYmIGVsLm5leHRTaWJsaW5nLm5vZGVUeXBlID09PSB1dGlscy5URVhUX05PREUgJiYgL15cXFMvLnRlc3QoZWwubmV4dFNpYmxpbmcud2hvbGVUZXh0KSkge1xuICAgICAgICAgICAgICAgIC8vIEdldCB3aGF0ZXZlciBub24td2hpdGVzcGFjZSBzdHVmZiAoZS5nLiwgcHVuY3R1YXRpb24pXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBhcHBlYXJzIGFmdGVyIHRoZSBjaHVuayB3ZSB3YW50IHRvIGhpZ2hsaWdodC4gRHVlIHRvXG4gICAgICAgICAgICAgICAgLy8gdGhlIHdheSBsaW5lIHdyYXBwaW5nIHdvcmtzLCBpdCdsbCBtYWtlIG91ciBsaXZlcyBlYXNpZXJcbiAgICAgICAgICAgICAgICAvLyBpZiB3ZSBqdXN0IGluY2x1ZGUgdGhpcyBub24td2hpdGVzcGFjZSBzdHVmZiBpbiB0aGVcbiAgICAgICAgICAgICAgICAvLyBoaWdobGlnaHRlZCBjaHVuay4gUmVmZXJlbmNlOlxuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9UZXh0XG4gICAgICAgICAgICAgICAgdGV4dFRvSGlnaGxpZ2h0ICs9IGVsLm5leHRTaWJsaW5nLndob2xlVGV4dC5tYXRjaCgvXlxcUysvKVswXTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXBwZW5kaW5nIGFkamFjZW50IG5vbi13aGl0ZXNwYWNlIHRleHQgdG8gaGlnaGxpZ2h0ZWQgdGV4dDogXCInICsgZWwubmV4dFNpYmxpbmcud2hvbGVUZXh0Lm1hdGNoKC9eXFxTKy8pWzBdICsgJ1wiJyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05ldyB0ZXh0VG9IaWdobGlnaHQgaXMgbm93OiBcIicgKyB0ZXh0VG9IaWdobGlnaHQgKyAnXCInKTtcblxuICAgICAgICAgICAgICAgIC8vIE5vdyBjaG9wIG9mZiB0aGF0IHNhbWUgbm9uLXdoaXRlc3BhY2Ugc3R1ZmYgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBhZGplY3QgdGV4dCBub2RlLlxuICAgICAgICAgICAgICAgIHZhciBhZGphY2VudFRleHQgPSBlbC5uZXh0U2libGluZy53aG9sZVRleHQucmVwbGFjZSgvXlxcUysvLCBcIlwiKTtcbiAgICAgICAgICAgICAgICBlbC5uZXh0U2libGluZy5ub2RlVmFsdWUgPSBhZGphY2VudFRleHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25ldyBhZGplY3QgdGV4dCBub2RlIGlzIG5vdzonLCBlbC5uZXh0U2libGluZy5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gdGV4dFRvSGlnaGxpZ2h0OyAvLyBSZS1hc3NpZ24gaW4gY2FzZSB3ZSd2ZSBhZGRlZCBzdHVmZlxuICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIHZhciB3cmFwcGVyRWxlbWVudHMgPSBfdGhpcy5nZXRXcmFwcGVyKHRleHRUb0hpZ2hsaWdodCk7XG4gICAgICAgICAgICBlbC5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyZW5kJywgd3JhcHBlckVsZW1lbnRzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShfdGhpcy53cmFwcGVySGlnaGxpZ2h0Q2xhc3NOYW1lKSkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodGVyRWwgPSBlbDtcbiAgICAgICAgICAgIHZhciB0ZXh0RWwgPSBoaWdobGlnaHRlckVsLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICB2YXIgd29yZHMgPSB0ZXh0RWwuaW5uZXJIVE1MLnNwbGl0KC9cXHMrLyk7XG5cbiAgICAgICAgICAgIHRleHRFbC5pbm5lckhUTUwgPSB3b3Jkc1swXTsgLy8gZmlyc3Qgd29yZFxuICAgICAgICAgICAgdmFyIHNpbmdsZUxpbmVIZWlnaHQgPSBoaWdobGlnaHRlckVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBzaW5nbGVMaW5lVG9wID0gZ2V0VG9wT2Zmc2V0RnJvbVBhcmVudChoaWdobGlnaHRlckVsKTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBzaW5nbGVMaW5lSGVpZ2h0O1xuICAgICAgICAgICAgdmFyIHRvcCA9IHNpbmdsZUxpbmVUb3A7XG4gICAgICAgICAgICB2YXIgc3RhcnRJbmRleCA9IDA7XG4gICAgICAgICAgICB2YXIgZW5kSW5kZXggPSAxO1xuXG4gICAgICAgICAgICB3aGlsZSAoZW5kSW5kZXggPD0gd29yZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGV4dEVsLmlubmVySFRNTCA9IHdvcmRzLnNsaWNlKHN0YXJ0SW5kZXgsIGVuZEluZGV4KS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3RleHRFbCBoYXMgd29yZHMnLCB3b3Jkcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCkuam9pbignICcpKTtcblxuICAgICAgICAgICAgICAgIGhlaWdodCA9IGhpZ2hsaWdodGVyRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRvcCA9IGdldFRvcE9mZnNldEZyb21QYXJlbnQoaGlnaGxpZ2h0ZXJFbCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gc2luZ2xlTGluZUhlaWdodCB8fCB0b3AgIT09IHNpbmdsZUxpbmVUb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0hlaWdodDonLCBoZWlnaHQsICdTaW5nbGUgTGluZSBIZWlnaHQ6Jywgc2luZ2xlTGluZUhlaWdodCwgJ1RvcDonLCB0b3AsICdTaW5nbGUgTGluZSBUb3A6Jywgc2luZ2xlTGluZVRvcCk7IFxuICAgICAgICAgICAgICAgICAgICB0ZXh0RWwuaW5uZXJIVE1MID0gd29yZHMuc2xpY2Uoc3RhcnRJbmRleCwgZW5kSW5kZXgtMSkuam9pbignICcpO1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlckVsLnN0eWxlLmJhY2tncm91bmQgPSBfdGhpcy5fZ2V0SGlnaGxpZ2h0Q29sb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0hpZ2hsaWdodGVkTGluZSA9ICcgJyArIF90aGlzLmdldFdyYXBwZXIod29yZHNbZW5kSW5kZXgtMV0pO1xuICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRlckVsLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJlbmQnLCBuZXdIaWdobGlnaHRlZExpbmUpO1xuICAgICAgICAgICAgICAgICAgICBzdGFydEluZGV4ID0gZW5kSW5kZXggLSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodGVyRWwgPSBoaWdobGlnaHRlckVsLm5leHRFbGVtZW50U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgdGV4dEVsID0gaGlnaGxpZ2h0ZXJFbC5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVMaW5lSGVpZ2h0ID0gaGlnaGxpZ2h0ZXJFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHNpbmdsZUxpbmVUb3AgPSBnZXRUb3BPZmZzZXRGcm9tUGFyZW50KGhpZ2hsaWdodGVyRWwpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZW5kSW5kZXgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBvdGVudGlhbGx5IHJlZHVuZGFudCBpbiBjZXJ0YWluIGNhc2VzLCBidXQgd2hhdGV2ZXIuXG4gICAgICAgICAgICB2YXIgYmFja2dyb3VuZCA9IF90aGlzLl9nZXRIaWdobGlnaHRDb2xvcigpO1xuICAgICAgICAgICAgdXRpbHMuYXBwbHlTdHlsZXMoaGlnaGxpZ2h0ZXJFbCwge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcwJyxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBiYWNrZ3JvdW5kLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBfdGhpcy5jb2xvcixcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgICAgICB6SW5kZXg6IDFcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB1dGlscy5hcHBseVN0eWxlcyhoaWdobGlnaHRlckVsLmZpcnN0Q2hpbGQsIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xuICAgICAgICAgICAgICAgIC8vIHRleHQtc2hhZG93OiAxcHggMHB4IDFweCBibGFjaztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTsgXG5cbiAgICAgICAgX3RoaXMuX2ppdHRlckhpZ2hsaWdodHMoKTtcbiAgICAgICAgaWYgKCFoYXNJbml0aWFsaXplZFJlc2l6ZUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1dGlscy5kZWJvdW5jZShfdGhpcy5oaWdobGlnaHQuYmluZChfdGhpcyksIDUwMCkpO1xuICAgICAgICAgICAgaGFzSW5pdGlhbGl6ZWRSZXNpemVIYW5kbGVyID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sIDEpO1xufVxuXG5IdW1hbkhpZ2hsaWdodGVyLnByb3RvdHlwZS5faml0dGVySGlnaGxpZ2h0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShfdGhpcy53cmFwcGVySGlnaGxpZ2h0Q2xhc3NOYW1lKSkuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgICB2YXIgaGlnaGxpZ2h0ZXJFbCA9IGVsO1xuICAgICAgICB2YXIgdGV4dEVsID0gZWwuZmlyc3RDaGlsZDtcbiAgICAgICAgdmFyIGNvdW50ID0gdGV4dEVsLmlubmVySFRNTC5sZW5ndGg7XG4gICAgICAgIHZhciBtYXhBbmdsZSA9IDE4MCAqIE1hdGguYXRhbihfdGhpcy5hZGphY2VudFNpZGVMZW5ndGggLyBjb3VudCkgLyBNYXRoLlBJXG4gICAgICAgIHZhciBhbmdsZSA9IHV0aWxzLnVuaWYoLW1heEFuZ2xlLCBtYXhBbmdsZSk7XG4gICAgICAgIHZhciBkeCA9IHV0aWxzLnVuaWYoX3RoaXMubmVnSml0dGVyWCwgX3RoaXMucG9zSml0dGVyWCk7XG4gICAgICAgIHZhciBkeSA9IHV0aWxzLnVuaWYoX3RoaXMubmVnSml0dGVyWSwgX3RoaXMucG9zSml0dGVyWSk7XG4gICAgICAgIHZhciBoZWlnaHQgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHRcbiAgICAgICAgdmFyIGRoID0gdXRpbHMudW5pZigwLCAwLjI1ICogaGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIHZhciBwb3NSb3RhdGVWYWx1ZSA9ICdyb3RhdGUoJyArIGFuZ2xlICsgJ2RlZyknO1xuICAgICAgICB2YXIgbmVnUm90YXRlVmFsdWUgPSAncm90YXRlKCcgKyAoLTEgKiBhbmdsZSkgKyAnZGVnKSc7XG4gICAgICAgIHZhciBwb3NUcmFuc2xhdGVWYWx1ZSA9ICd0cmFuc2xhdGUoJyArIGR4ICsgJ2VtLCAnICsgZHkgKyAnZW0pJztcbiAgICAgICAgdmFyIG5lZ1RyYW5zbGF0ZVZhbHVlID0gJ3RyYW5zbGF0ZSgnICsgKC0xKmR4KSArICdlbSwgJyArICgtMSpkeSkgKyAnZW0pJztcblxuICAgICAgICB1dGlscy5hcHBseVN0eWxlcyhoaWdobGlnaHRlckVsLCB7dHJhbnNmb3JtOiBwb3NSb3RhdGVWYWx1ZSArICcgJyArIHBvc1RyYW5zbGF0ZVZhbHVlfSwge3ByZWZpeDogWyd3ZWJraXQnXX0pOztcbiAgICAgICAgaGlnaGxpZ2h0ZXJFbC5zdHlsZVsnaGVpZ2h0J10gPSAoaGVpZ2h0IC0gZGgpICsgJ3B4JztcbiAgICAgICAgdXRpbHMuYXBwbHlTdHlsZXModGV4dEVsLCB7dHJhbnNmb3JtOiBuZWdUcmFuc2xhdGVWYWx1ZSArICcgJyArIG5lZ1JvdGF0ZVZhbHVlfSwge3ByZWZpeDogWyd3ZWJraXQnXX0pO1xuICAgIH0pOyAgICAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gSHVtYW5IaWdobGlnaHRlcjtcbiIsInZhciBfID0ge307XG5tb2R1bGUuZXhwb3J0cyA9ICBfO1xuXG5fLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbn07XG5cbl8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG5cbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxhc3QgPSBfLm5vdygpIC0gdGltZXN0YW1wO1xuXG4gICAgICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID49IDApIHtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xufVxuXG5fLnVuaWYgPSBmdW5jdGlvbihsbywgaGkpIHtcbiAgICByZXR1cm4gKGhpIC0gbG8pICogTWF0aC5yYW5kb20oKSArIGxvO1xufVxuXG5fLmppdHRlciA9IGZ1bmN0aW9uKGVsLCBsbywgaGkpIHtcbiAgICB2YXIgdmFsdWUgPSAncm90YXRlKCcgKyB1bmlmKGxvLCBoaSkgKyAnZGVnKSc7XG4gICAgZWwuc3R5bGVbJ3RyYW5zZm9ybSddID0gdmFsdWU7XG4gICAgZWwuc3R5bGVbJy13ZWJraXQtdHJhbnNmb3JtJ10gPSB2YWx1ZTtcbn1cblxuXy5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdi5pbm5lckhUTUwgPSBzdHI7XG4gICAgdmFyIGVsZW1lbnRzID0gZGl2LmZpcnN0Q2hpbGQ7IFxufVxuXG5fLmFwcGx5U3R5bGVzID0gZnVuY3Rpb24oZWwsIHN0eWxlcywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIE9iamVjdC5rZXlzKHN0eWxlcykuZm9yRWFjaChmdW5jdGlvbihwcm9wZXJ0eSkge1xuICAgICAgICBlbC5zdHlsZVtwcm9wZXJ0eV0gPSBzdHlsZXNbcHJvcGVydHldO1xuICAgICAgICBpZiAob3B0aW9ucy5wcmVmaXgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5wcmVmaXggIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wcmVmaXggPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wdGlvbnMucHJlZml4LmZvckVhY2goZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgICAgICAgICAgICAgZWwuc3R5bGVbJy0nICsgcHJlZml4ICsgJy0nICsgcHJvcGVydHldID0gc3R5bGVzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5fLkVMRU1FTlRfTk9ERSA9IDE7XG5fLlRFWFRfTk9ERSA9IDM7XG5fLlBST0NFU1NJTkdfSU5TVFJVQ1RJT05fTk9ERSA9IDc7XG5fLkNPTU1FTlRfTk9ERSA9IDg7XG5fLkRPQ1VNRU5UX05PREUgPSA5O1xuXy5ET0NVTUVOVF9UWVBFX05PREUgPSAxMDtcbl8uRE9DVU1FTlRfRlJBR01FTlRfTk9ERSA9IDExO1xuIl19
