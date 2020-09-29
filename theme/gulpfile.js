const { parallel, series, watch, src, dest } = require('gulp');

// JS related plugins
const babel  = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

// CSS related plugins
var sass         = require( 'gulp-sass' );
var autoprefixer = require( 'gulp-autoprefixer' );

// HTML related plugins
var nunjucksRender = require('gulp-nunjucks-render');

// Utility plugins
const del          = require('del');
const plumber      = require('gulp-plumber');
const rename       = require( 'gulp-rename' );
const sourcemaps   = require( 'gulp-sourcemaps' );


// Project related variables
// Package Variables
const pkg = require('./package.json');
// Theme location inside Wordpress
const wp = '../wordpress/wp-content/themes';


// Javascript Variables
const jsConfig = require('./src/config');

const jsSRC = './src/js';
const jsTMP = './tmp';
const jsURL = './dist/js';
const jsURLWP = `${wp}/${pkg.name}/js`;

// SCSS/CSS Variables
const styleSRC     = './src/scss/style.scss';
const styleURL     = './dist/css/';
const styleURLWP   = `${wp}/${pkg.name}/css`;
const mapURL       = './';

// HTML Variables
const htmlSRC     = './src/pages/**/*.html';
const htmlURL     = './dist/';
const njkSRC			= './src/pages/**/*.+(html|njk)';
const njkTMP			= './src/templates/';

// PHP variables
var phpSRC     = './wp-theme/**/*.php';
var phpURL   = `${wp}/${pkg.name}/`;

// Images Variables
const imgSRC       = './src/images/**/*';
const imgURL       = './dist/images/';
const imgURLWP     = `${wp}/${pkg.name}/images/`;

// Fonts Variables
const fontsSRC     = './src/fonts/**/*';
const fontsURL     = './dist/fonts/';
const fontsURLWP   = `${wp}/${pkg.name}/fonts/`;

// Watch Locations
const styleWatch   = './src/scss/**/*.scss';
const jsWatch      = './src/js/**/*.js';
const imgWatch     = './src/images/**/*.*';
const fontsWatch   = './src/fonts/**/*.*';
const htmlWatch    = './src/pages/**/*.+(html|njk)';
const njkWatch    = './src/templates/**/*.*';
const phpWatch    = './wp-theme/**/*.php';

// Project related functions
// Javascript Processing
function jsDeps(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const deps = (config.deps || []).map(f => {
        if (f[0] == '~') {
          return `./node_modules/${f.slice(1, f.length)}.js`
        } else {
          return `${jsSRC}/${f}.js`
        }
      });
      if (deps.length == 0) {
        done();
        return;
      }
      return src(deps)
        .pipe(concat(`${config.name}.deps.js`))
        .pipe(dest(jsTMP));
    }
  });

  return parallel(...tasks, (parallelDone) => {
    parallelDone();
    done();
  })();
}

function jsBuild(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const files = (config.files || []).map(f => `${jsSRC}/${f}.js`);
      if (files.length == 0) {
        done();
        return;
      }
      return src(files)
        .pipe(plumber())
        .pipe(concat(`${config.name}.build.js`))
        .pipe(babel({
          presets: [
            ['@babel/env', {
              modules: false
            }]
          ]
        }))
        .pipe(uglify())
        .pipe(dest(jsTMP))
    }
  })

  return parallel(...tasks, (parallelDone) => {
    parallelDone();
    done();
  })();
}

function jsConcat(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const files = [
        `${jsTMP}/${config.name}.deps.js`,
        `${jsTMP}/${config.name}.build.js`
      ];
      return src(files, { allowEmpty: true })
        .pipe(plumber())
        .pipe(concat(`${config.name}.js`))
        .pipe(dest(jsURL))
        .pipe(dest(jsURLWP))
    }
  })

  return parallel(...tasks, (parallelDone) => {
    parallelDone();
    done();
  })();
}

function jsClean(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const files = [
        `${jsTMP}/${config.name}.deps.js`,
        `${jsTMP}/${config.name}.build.js`
      ];
      return del(files);
    }
  });

  return parallel(...tasks, (parallelDone) => {
    parallelDone();
    done();
  })();
}

// SCSS/CSS Processing
function css(done) {
	src( [ styleSRC ] )
    .pipe( plumber() )
		.pipe( sourcemaps.init() )
		.pipe( sass({
			errLogToConsole: true,
			outputStyle: 'nested'
		}) )
		.on( 'error', console.error.bind( console ) )
		.pipe( autoprefixer() )
		.pipe( rename( { suffix: '.min' } ) )
		.pipe( sourcemaps.write( mapURL ) )
		.pipe( dest( styleURL ) )
		.pipe( dest( styleURLWP ) )
	done();
};

// HTML Processing
function html(done) {
  src( [ njkSRC ] )
  .pipe( plumber() )
  .pipe(nunjucksRender({
      path: [njkTMP]
    }))
  .pipe( dest( htmlURL ) )
	done();
};

// PHP Copying
function php(done) {
  return src( phpSRC )
  .pipe( dest( phpURL ) )
	done();
};

// Copy Files
// Images
function images(done) {
  return src( imgSRC )
		.pipe( plumber() )
		.pipe( dest( imgURL ))
	 	.pipe( dest( imgURLWP ));
  done();
};

// Fonts
function fonts(done) {
  return src( fontsSRC )
		.pipe( plumber() )
		.pipe( dest( fontsURL ))
	 	.pipe( dest( fontsURLWP ));
  done();
};


// Exporting methods
// Default Export
exports.default = series(
  parallel(jsDeps, jsBuild, css, images, fonts, php, html),
  jsConcat
);

// Watcher
exports.watch = function() {
  watch(styleWatch, css);
	watch(jsWatch, series( parallel( jsDeps, jsBuild), jsConcat));
	watch(imgWatch, images);
	watch(fontsWatch, fonts);
	watch(phpWatch, php);
	watch(htmlWatch, html);
	watch(njkWatch, html);
};
