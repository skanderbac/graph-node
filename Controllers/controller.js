const graph = require('./graphController');

exports.getAll = async(req,res) => {
    return res.status(200).json({"key":"value1"});
}

exports.signIn =async  (req, res) => {
    const urlParameters = {
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI
    };

    try {
        const authUrl = await req.app.locals
            .msalClient.getAuthCodeUrl(urlParameters);
        res.redirect(authUrl);
    }
    catch (error) {
        console.log(`Error: ${error}`);
        req.flash('error_msg', {
            message: 'Error getting auth URL',
            debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        res.redirect('/');
    }
}

exports.signOut = async (req, res) => {
    // Sign out
    if (req.session.userId) {
        // Look up the user's account in the cache
        const accounts = await req.app.locals.msalClient
            .getTokenCache()
            .getAllAccounts();

        const userAccount = accounts.find(a => a.homeAccountId === req.session.userId);

        // Remove the account
        if (userAccount) {
            req.app.locals.msalClient
                .getTokenCache()
                .removeAccount(userAccount);
        }
    }

    // Destroy the user's session
    req.session.destroy(function (err) {
        res.redirect('/');
    });
}

exports.callBack = async (req, res) =>{
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

}
