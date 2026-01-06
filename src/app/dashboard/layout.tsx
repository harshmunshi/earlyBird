import { auth, signOut } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Users,
    Settings,
    LogOut,
    Grid,
    Plus
} from "lucide-react";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4 md:px-6">
                    <Link href="/dashboard" className="mr-6 flex items-center space-x-2 font-bold text-lg tracking-tight">
                        <span>Earlybird</span>
                    </Link>
                    <nav className="flex items-center space-x-4 md:space-x-6 text-sm font-medium text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground transition-colors">
                            Projects
                        </Link>
                        <Link href="/dashboard/settings" className="hover:text-foreground transition-colors">
                            Settings
                        </Link>
                    </nav>
                    <div className="ml-auto flex items-center space-x-4">
                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/" });
                            }}
                        >
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <LogOut className="h-4 w-4" />
                                <span className="sr-only">Description</span>
                            </Button>
                        </form>
                        <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden border">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="User" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-medium">U</div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <main className="container py-8 px-4 md:px-6">
                {children}
            </main>
        </div>
    );
}
