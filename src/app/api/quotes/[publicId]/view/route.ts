import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { hasServiceRole } from "@/lib/supabase/admin";
import { recordQuoteView } from "@/lib/tracking/recordQuoteView";

export async function POST(
  request: Request,
  context: { params: Promise<{ publicId: string }> }
) {
  try {
    if (!isDemoMode() && !hasServiceRole()) {
      return NextResponse.json(
        { ok: false, error: "Service role nie je nakonfigurovaný." },
        { status: 503 }
      );
    }

    const { publicId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
      referrer?: string | null;
    };

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || null;
    const userAgent = request.headers.get("user-agent");

    const result = await recordQuoteView({
      publicId,
      sessionId: body.sessionId,
      referrer: body.referrer,
      userAgent,
      ip,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    return NextResponse.json({ ok: true, isFirstView: result.isFirstView });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
