module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine', 'karma-typescript'],
		files: [
			'src/**/*.ts',
			'tests/**/*.ts'
		],
		preprocessors: {
			'**/*.ts': 'karma-typescript'
		},
		plugins: [
			require('karma-typescript'),
			require('karma-jasmine'),
			require('karma-chrome-launcher'),
			require('karma-jasmine-html-reporter'),
			require('karma-coverage'),
			require('karma-coverage-istanbul-reporter')
		],
		client: {
			jasmine: {
				// you can add configuration options for Jasmine here
				// the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
				// for example, you can disable the random execution with `random: false`
				// or set a specific seed with `seed: 4321`
			},
			clearContext: false // leave Jasmine Spec Runner output visible in browser
		},
		jasmineHtmlReporter: {
			suppressAll: true // removes the duplicated traces
		},
		coverageReporter: {
			dir: require('path').join(__dirname, './coverage'),
			combineBrowserReports: true,
			skipFilesWithNoCoverage: true,
			subdir: '.',
			reporters: [
				{ type: 'html' },
				{ type: 'text-summary' }
			]
		},
		reporters: ['progress', 'kjhtml', 'karma-typescript', 'coverage-istanbul'],
		port: 9876,
		colors: true,
		logLevel: config.LOG_INFO,
		autoWatch: true,
		browsers: ['Chrome'],
		singleRun: false,
		restartOnFileChange: true
	});
};