import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        console.log("Upload request received");
        const session = await auth();
        console.log("Session:", session?.user?.id ? "Authenticated" : "No Session");

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("Missing BLOB_READ_WRITE_TOKEN");
            throw new Error("Server configuration error: Missing Blob Token");
        }

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname: string) => {
                // We already checked session above, but handleUpload callback scope might be different
                // ensuring consistency.
                const session = await auth();
                if (!session?.user) {
                    throw new Error('Unauthorized');
                }

                return {
                    allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
                    tokenPayload: JSON.stringify({
                        userId: session.user.id,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('blob uploaded', blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        );
    }
}
