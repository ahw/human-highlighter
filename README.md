![VimHooks](https://s3.amazonaws.com/pd93f014/human-highlighter.png?v=1)

This bit of code takes a chunk of text and draws randomized highlighter
lines over each line on the page. It's not as simple as just wrapping text
in a single `<span>` and applying CSS &mdash; the code takes care of
figuring out where all the line wrapping occurs and creates a new
highlighter line for each displayed line on the page.  Afterwards it applies
some CSS3 `transform`s (`rotate` and `translate`) to jitter the lines a bit.

Usage
-----

### Add HTML
Take a block of HTML and wrap whatever lines you want highlighted with
`<span class="hh">` tags like this:

```html
<p>Upset by two nostalgias facing each other like two mirrors, he lost
his marvelous sense of unreality and he ended up recommending to all of
them that they <span class="hh">leave Macondo,</span> that they forget
everything he had taught them about the world and the human heart, that
they shit on Horace, and that wherever they might be they always
remember that <span class="hh">the past was a lie, that memory has no
return, that every spring gone by could never be recovered, and that the
wildest and most tenacious love was an ephemeral truth in the
end.</span></p>
```

### Add JS
Put the **human-highlighter** code on your page. You can `require`
**human-highlighter.js** if you're using Browserify, or you can just depend
on having HumanHighlighter as a browser global by putting
**dist/human-highlighter.min.js** on the page. Either way, using the
following code to highlight everything in `<span class="hh">` tags.

```javascript
// Skip this line if you're using human-highlighter.browser.js to make
// HumanHighlighter a global.
var HumanHighlighter = require('./human-highlighter');

var highlighter = new HumanHighlighter({
    // Check the source for available configuration options
});

highlighter.highlight();
```

<!--
### Add CSS
Also make sure you include **highlighter.css** or **highlighter.min.css** in
your page to get any styles not set dynamically in the JavaScript.
-->
