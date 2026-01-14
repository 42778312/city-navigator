import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

interface GuardProps {
    children: React.ReactNode;
}

/**
 * Only allows authenticated users to access children.
 * Redirects to sign-in if not authenticated.
 */
export const RequireAuth = ({ children }: GuardProps) => {
    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
};

/**
 * Only allows guests (unauthenticated users) to access children.
 * You might want to redirect to a dashboard if they are already signed in,
 * but for now we follow the "GuestOnly" requirement.
 */
export const GuestOnly = ({ children }: GuardProps) => {
    return (
        <SignedOut>
            {children}
        </SignedOut>
    );
};
