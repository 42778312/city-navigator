import { useAuth, useUser, useSignIn } from "@clerk/clerk-react";

export const useAuthState = () => {
    const { isLoaded, isSignedIn, userId, sessionId, getToken, signOut } = useAuth();
    const { signIn } = useSignIn();

    const signInWithGoogle = async (redirectPath: string = "/") => {
        if (!signIn) return;
        const origin = window.location.origin;
        return signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: `${origin}/sso-callback`,
            redirectUrlComplete: `${origin}${redirectPath}`,
        });
    };

    return {
        isLoaded,
        isSignedIn,
        userId,
        sessionId,
        getToken,
        signOut,
        signInWithGoogle,
    };
};

export const useCurrentUser = () => {
    const { isLoaded, isSignedIn, user } = useUser();

    return {
        isLoaded,
        isSignedIn,
        user,
    };
};
