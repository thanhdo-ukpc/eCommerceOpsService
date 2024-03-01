interface IServiceNames {
    accountOps?: {
        userAccounts?: string;
        account?: string;
        loggedInHistory?: string;
        forgetPassword?: string;
    };
}

export const tableNames: IServiceNames = {
    accountOps: {
        userAccounts: 'UserAccounts',
        loggedInHistory: 'LoggedInHistory',
        forgetPassword: 'ForgetPasswords',
    },
};

export const serviceNames: IServiceNames = {
    accountOps: {
        account: 'account',
    },
};
