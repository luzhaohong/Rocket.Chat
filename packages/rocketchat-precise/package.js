Package.describe({
	name: 'rocketchat:precise',
	version: '0.0.1',
	summary: 'Accounts login handler for Precise',
	git: ''
});

Package.onUse(function(api) {
	api.use('rocketchat:logger');
	api.use('rocketchat:lib');
	api.use('ecmascript');
	api.use('sha');

	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.mainModule('server/loginHandler.js', 'server');
});
