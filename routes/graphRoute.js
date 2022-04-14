

router.get('/callback',
    async function(req, res) {
        const tokenRequest = {
            code: req.query.code,
            scopes: process.env.OAUTH_SCOPES.split(','),
            redirectUri: process.env.OAUTH_REDIRECT_URI
        };

        try {
            const response = await req.app.locals
                .msalClient.acquireTokenByCode(tokenRequest);

            // Save the user's homeAccountId in their session
            req.session.userId = response.account.homeAccountId;

            const user = await graph.getUserDetails(
                req.app.locals.msalClient,
                req.session.userId
            );

            // Add the user to user storage
            req.app.locals.users[req.session.userId] = {
                displayName: user.displayName,
                email: user.mail || user.userPrincipalName,
                timeZone: user.mailboxSettings.timeZone
            };
        } catch(error) {
            req.flash('error_msg', {
                message: 'Error completing authentication',
                debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
        }

        res.redirect('/');
    }
);
