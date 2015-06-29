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
