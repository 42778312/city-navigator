import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { CLERK_PUBLISHABLE_KEY } from "./clerk";

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    return (
        <ClerkProvider
            publishableKey={CLERK_PUBLISHABLE_KEY}
            localization={{
                signIn: {
                    start: {
                        title: "Sign in to Light Map",
                    }
                },
                signUp: {
                    start: {
                        title: "Create your Light Map account",
                    }
                }
            }}
            appearance={{
                baseTheme: dark,
                variables: {
                    colorPrimary: "#7C3AED",
                    colorBackground: "#0f1115",
                    colorInputBackground: "#1a1d23",
                    colorInputText: "white",
                    colorTextSecondary: "#9ca3af",
                    borderRadius: "1rem",
                },
                elements: {
                    card: {
                        background: "linear-gradient(135deg, #16181d 0%, #0f1115 100%)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    },
                    socialButtonsBlockButton: {
                        backgroundColor: "#1a1d23",
                        border: "1px solid rgba(255,255,255,0.1)",
                        "&:hover": {
                            backgroundColor: "#242830",
                        }
                    },
                    formButtonPrimary: {
                        fontSize: "0.875rem",
                        textTransform: "none",
                        backgroundColor: "#7C3AED",
                        "&:hover": {
                            backgroundColor: "#6D28D9",
                        }
                    },
                    footerActionLink: {
                        color: "#A78BFA",
                        "&:hover": {
                            color: "#C4B5FD",
                        }
                    },
                    identityPreviewText: {
                        color: "white"
                    },
                    userButtonPopoverCard: {
                        background: "#16181d",
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                    userButtonPopoverActionButtonText: {
                        color: "white"
                    },
                    userButtonPopoverActionButtonIcon: {
                        color: "#9ca3af"
                    },
                    userButtonPopoverFooter: {
                        display: "none"
                    }
                }
            }}
        >
            {children}
        </ClerkProvider>
    );
};
