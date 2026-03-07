import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const tokenUrl = process.env.OAUTH_TOKEN_URL || "https://auth.sitecorecloud.io/oauth/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OAuth token request failed: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error proxying OAuth token request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}