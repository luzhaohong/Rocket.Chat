/* eslint new-cap: [2, {"capIsNewExceptions": ["SHA256"]}] */

import { HTTP } from 'meteor/http'

const logger = new Logger('PreciseHandler', {});

Accounts.registerLoginHandler(function(loginRequest) {
	logger.info('Entered precise login handler');
	logger.info(loginRequest);

	if (loginRequest == null || loginRequest.precise == undefined || !loginRequest.precise || loginRequest.precise_uid == undefined || loginRequest.precise_token == undefined) {
		logger.info()
		return undefined;
	}

	logger.info('Got Precise uid ', loginRequest.precise_uid);
	logger.info('Got Precise token ', loginRequest.precise_token);

	precise_uid = loginRequest.precise_uid;
	precise_token = loginRequest.precise_token;

	const self = this;
	let preciseUser;
	result = {};

	try {
		/* Request user information from precise by using token */
		pUrl = 'http://precise.app.99jkom.com/su1/users/' + loginRequest.precise_uid + '/profile/basic';
		pToken = 'Bearer ' + loginRequest.precise_token;

		logger.info(pUrl);
		logger.info(pToken);

		result = HTTP.call('GET', pUrl, {
			params: {Authorization: pToken}
		});

		preciseUser = result.data;

        /* Invalid userid or token */
        if (preciseUser == null) {
			logger.info(result);
			return null;
		} 
	} catch (error) {
		logger.info(error);
		return null;
	}

	// Look to see if user already exists
	let userQuery;
	let user;
	let uid;

    userQuery = {
        'services.precise.uid': precise_uid
    };

    logger.info('Querying user', userQuery);

    user = Meteor.users.findOne(userQuery);
    logger.info(user);

	if (user) {
		logger.info('Logging user');
		uid = user._id;

	} else {
		logger.info('User does not exist, creating ', preciseUser.nickname);

		// Prepare data for new user
		const userObject = {
			username: preciseUser.nickname
		};

		// Create new user
		try {
			uid = Accounts.createUser(userObject);

			Meteor.users.update(uid, {
                $push: {
                    'services.precise.uid': precise_uid
                }
            })
		} catch (error) {
			logger.info('Error creating new user for precise user', error);
			return null;
		}
	}

	const stampedToken = Accounts._generateStampedLoginToken();

	Meteor.users.update(uid, {
		$push: {
			'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
		}
	});

	return {
		userId: uid,
		token: stampedToken.token
	};
});
