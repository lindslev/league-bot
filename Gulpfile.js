var gulp = require('gulp');
var browserify = require('gulp-browserify');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var babelify = require('babelify');
var reactify = require('reactify');

gulp.task('browserify', function() {
    gulp.src('src/client/js/app.js')
        .pipe(browserify({transform: ['babelify', 'reactify']}))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('copy', function() {
    gulp.src('src/client/index.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('buildCSS', function () {
    gulp.src('src/client/sass/main.scss')
        .pipe(sass())
        .pipe(gulp.dest('src/server/public'));
});

gulp.task('default',['browserify', 'copy', 'buildCSS']);
// gulp.task('default',['browserify', 'copy']);

gulp.task('watch', function() {
    gulp.watch('src/**/*.*', ['default']);
});
