import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authoringUrl, accessToken, queryPayload } = body;

    if (!authoringUrl || !accessToken || !queryPayload) {
      return NextResponse.json(
        { error: "Missing required parameters: authoringUrl, accessToken, and queryPayload are required" },
        { status: 400 }
      );
    }

    const response = await fetch(authoringUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(queryPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: `Authoring GraphQL request failed: ${response.status} ${response.statusText}`, 
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.errors) {
      return NextResponse.json(
        { error: "GraphQL errors", details: data.errors },
        { status: 200 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error proxying Authoring GraphQL request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
