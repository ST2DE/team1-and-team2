var gulp = require('gulp')
var sass = require('gulp-sass')
var babel = require('gulp-babel')

gulp.task('sass', () => {
    return gulp.src('./src/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./public/'))
})

gulp.task('sass:watch', () => {
    gulp.watch('./src/*.scss', ['sass'])
})

gulp.task('default', () => {
    gulp.src('./src/*.js')
        .pipe(babel())
        .pipe(gulp.dest('./public'))
})