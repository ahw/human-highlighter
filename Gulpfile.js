// Acknowledgements:
// - https://gist.github.com/Sigmus/9253068

var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var browserify = require('browserify');
var rename = require('gulp-rename');
var watchify = require('watchify');
var notify = require('gulp-notify');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var sizereport = require('gulp-sizereport');
var minifycss = require('gulp-minify-css');

var src_dir = './src';
var dist_dir = './dist';

function handleErrors() {
    var args = Array.prototype.slice.call(arguments);
    notify.onError({
        title: "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);
    this.emit('end'); // Keep gulp from hanging on this task
}

// function reloadChrome() {
//     var url = 'http://localhost:7700/reload';
//     gutil.log('Making Chrome reload request to ' + url);
//     http.request(url).end();
// }

// Based on: http://blog.avisi.nl/2014/04/25/how-to-keep-a-fast-build-with-browserify-and-reactjs/
function buildScript(file, options) {
    var isProductionBuild = !!gutil.env.production;
    var outfile = file;
    if (options && options.minify) {
        isProductionBuild = true;
        outfile = file.match(/^(.+)\.js$/)[1] + '.min.js';
    }

    gutil.log('Compiling file:', file);
    var props = {entries: [src_dir + '/' + file], debug: true, cache: {}, packageCache: {}};
    var bundler = browserify(props);
    // bundler.transform(reactify);
    function rebundle() {
        var stream = bundler.bundle();
        if (isProductionBuild) {
            gutil.log('Uglifying js for production build');
            return stream.on('error', handleErrors)
                .pipe(source(file))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(rename('human-highlighter.min.js'))
                .pipe(gulp.dest(dist_dir))
                .pipe(sizereport({gzip: true}));
                // .on('finish', reloadChrome);
        } else {
            gutil.log('Leaving js un-minified for non-production build');
            return stream.on('error', handleErrors)
                .pipe(source(file))
                .pipe(buffer()) // Need to turn this into a buffer to report size
                .pipe(rename('human-highlighter.js'))
                .pipe(gulp.dest(dist_dir))
                .pipe(sizereport({gzip: true}));
                // .on('finish', reloadChrome);
        }
    }
    bundler.on('update', function() {
        rebundle();
        gutil.log('Rebundle...');
    });
    return rebundle();
}

// Deletes everything in the build and dist directories
gulp.task('clean', function() {
    return gulp.src([dist_dir], {read: false})
        .pipe(clean());
});
gulp.task('sizereport', function() {
    return gulp.src(dist_dir + '/*').pipe(sizereport({gzip: true}));
});

gulp.task('browserify', function() {
    buildScript('human-highlighter.browser-global.js', {minify: true});
    buildScript('human-highlighter.browser-global.js', {minify: false});
});

// Watch files for changes
gulp.task('watch', function() {
    gulp.watch(src_dir + '/**/*.js', ['browserify']);
    gulp.watch(src_dir + '/**/*.css', ['css']);
    // gulp.watch(sassDir + '/**/*.scss', ['sass']);
});

gulp.task('lint', function() {
    return gulp.src(src_dir + '/**/*.js')
        .pipe(react())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', ['browserify', 'css']);
