import _ from 'underscore';
import { HTTP } from 'meteor/http'

const logger = new Logger('PreciseLogin', {});

RocketChat.API.v1.addRoute('preciseLogin', { authRequired: false }, {
    post() {

        check(this.bodyParams, Match.ObjectIncluding({
            precise_uid: Match.Maybe(String),
            precise_token: Match.Maybe(String)
        }));

        result = {};

        precise_uid = this.bodyParams.precise_uid;
        precise_token = this.bodyParams.precise_token;

        let preciseUser;

        try {
            /* Request user information from precise by using token */
            pUrl = 'http://precise.app.99jkom.com/su1/users/' + precise_uid + '/profile/basic';
            pToken = 'Bearer ' + precise_token;

            result = HTTP.call('GET', pUrl, {
                params: {Authorization: pToken}
            });

            preciseUser = result.data;

            /* Invalid userid or token */
            if (preciseUser == null) {
                logger.info(result);
                return RocketChat.API.v1.failure(`Invalid userId or token`);
            } 
        } catch (error) {
            logger.error(error);
            return RocketChat.API.v1.failure(`Exception happened during token confirmation`);
            /*return RocketChat.API.v1.failure(precise_uid);*/
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
                logger.error('Error creating new user for precise user', error);
                return RocketChat.API.v1.failure(`Failed to create new user. `);
            }
        }

        const stampedToken = Accounts._generateStampedLoginToken();

        Meteor.users.update(uid, {
            $push: {
                'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
            }
        });

        return RocketChat.API.v1.success({
            userId: uid,
            token: stampedToken.token
        });
    }
});