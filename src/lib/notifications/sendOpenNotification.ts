import { Resend } from "resend";
import { isDemoMode } from "@/lib/demo/mode";
import { newDemoId, readDemoStore, updateDemoStore } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, getAppUrl } from "@/lib/utils";

type QuoteNotifyFields = {
  id: string;
  company_id: string;
  created_by: string | null;
  customer_name: string;
  site_address: string | null;
  price_min: number | null;
  price_max: number | null;
  last_notified_at: string | null;
};

type CompanyNotifyFields = {
  notify_on_first_open: boolean;
  notify_on_later_open: boolean;
  notification_cooldown_hours: number;
  notification_email: string | null;
  name: string;
};

function shouldSendNotification(
  company: CompanyNotifyFields,
  quote: QuoteNotifyFields,
  isFirstView: boolean
) {
  if (isFirstView && company.notify_on_first_open) return true;
  if (!isFirstView && company.notify_on_later_open) {
    const cooldownHours = company.notification_cooldown_hours ?? 3;
    if (!quote.last_notified_at) return true;
    const last = new Date(quote.last_notified_at).getTime();
    return Date.now() - last >= cooldownHours * 60 * 60 * 1000;
  }
  return false;
}

async function attemptEmail(params: {
  to: string | null;
  title: string;
  siteAddress: string;
  price: string;
  customerName: string;
  quoteId: string;
}) {
  let emailStatus: "sent" | "failed" | "skipped" = "skipped";
  let emailError: string | null = null;

  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (params.to && from && resendKey) {
    try {
      const resend = new Resend(resendKey);
      const detailUrl = `${getAppUrl()}/dashboard/quotes/${params.quoteId}`;
      await resend.emails.send({
        from,
        to: params.to,
        subject: params.title,
        html: `
          <p>${params.customerName} si práve pozrel cenový odhad dodávky a montáže okien/dverí.</p>
          <p>${params.siteAddress}</p>
          <p><strong>Odhad:</strong> ${params.price}</p>
          <p><a href="${detailUrl}">Otvoriť detail ponuky</a></p>
        `,
      });
      emailStatus = "sent";
    } catch (err) {
      emailStatus = "failed";
      emailError = err instanceof Error ? err.message : "Email send failed";
    }
  } else if (params.to && (!from || !resendKey)) {
    emailStatus = "failed";
    emailError =
      "Resend nie je nakonfigurovaný (chýba RESEND_API_KEY alebo NOTIFICATION_FROM_EMAIL).";
  }

  return { emailStatus, emailError };
}

export async function maybeNotifyQuoteOpened(params: {
  quote: QuoteNotifyFields;
  isFirstView: boolean;
}) {
  const { quote, isFirstView } = params;

  let company: CompanyNotifyFields | null = null;

  if (isDemoMode()) {
    const store = await readDemoStore();
    if (store.company.id !== quote.company_id) return;
    company = store.company;
  } else {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select(
        "notify_on_first_open, notify_on_later_open, notification_cooldown_hours, notification_email, name"
      )
      .eq("id", quote.company_id)
      .single();
    company = data;
  }

  if (!company) return;
  if (!shouldSendNotification(company, quote, isFirstView)) return;

  const siteAddress = quote.site_address || "—";
  const price =
    quote.price_min != null && quote.price_max != null
      ? `${formatCurrency(quote.price_min)} – ${formatCurrency(quote.price_max)}`
      : "—";

  const title = isFirstView
    ? `${quote.customer_name} si práve otvoril cenovú ponuku`
    : `${quote.customer_name} znova otvoril cenovú ponuku`;

  const body = `${quote.customer_name} si práve pozrel cenový odhad dodávky a montáže okien/dverí.\n${siteAddress}\nOdhad: ${price}`;

  const { emailStatus, emailError } = await attemptEmail({
    to: company.notification_email,
    title,
    siteAddress,
    price,
    customerName: quote.customer_name,
    quoteId: quote.id,
  });

  const now = new Date().toISOString();

  if (isDemoMode()) {
    await updateDemoStore((store) => {
      store.notifications.unshift({
        id: newDemoId("notif"),
        company_id: quote.company_id,
        user_id: quote.created_by,
        quote_id: quote.id,
        type: isFirstView ? "quote_first_opened" : "quote_reopened",
        title,
        body,
        email_status: emailStatus,
        email_error: emailError,
        read_at: null,
        created_at: now,
      });

      if (emailStatus === "failed") {
        store.notifications.unshift({
          id: newDemoId("notif"),
          company_id: quote.company_id,
          user_id: quote.created_by,
          quote_id: quote.id,
          type: "email_failed",
          title: "E-mailová notifikácia zlyhala",
          body: emailError,
          email_status: "failed",
          email_error: emailError,
          read_at: null,
          created_at: now,
        });
      }

      const q = store.quotes.find((item) => item.id === quote.id);
      if (q) q.last_notified_at = now;
    });
    return;
  }

  const admin = createAdminClient();
  await admin.from("notifications").insert({
    company_id: quote.company_id,
    user_id: quote.created_by,
    quote_id: quote.id,
    type: isFirstView ? "quote_first_opened" : "quote_reopened",
    title,
    body,
    email_status: emailStatus,
    email_error: emailError,
  });

  if (emailStatus === "failed") {
    await admin.from("notifications").insert({
      company_id: quote.company_id,
      user_id: quote.created_by,
      quote_id: quote.id,
      type: "email_failed",
      title: "E-mailová notifikácia zlyhala",
      body: emailError,
      email_status: "failed",
      email_error: emailError,
    });
  }

  await admin
    .from("quotes")
    .update({ last_notified_at: now })
    .eq("id", quote.id);
}

export async function sendQuoteEmailToCustomer(params: {
  to: string;
  customerName: string;
  companyName: string;
  quoteUrl: string;
  fromEmail?: string | null;
}) {
  if (isDemoMode() && !process.env.RESEND_API_KEY) {
    return {
      ok: false as const,
      error:
        "Demo režim: e-mail sa neodosiela bez RESEND_API_KEY. Link môžete skopírovať.",
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = params.fromEmail || process.env.NOTIFICATION_FROM_EMAIL;

  if (!resendKey || !from) {
    return {
      ok: false as const,
      error:
        "E-mail nie je nakonfigurovaný. Nastavte RESEND_API_KEY a NOTIFICATION_FROM_EMAIL.",
    };
  }

  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from,
      to: params.to,
      subject: `Cenová ponuka od ${params.companyName}`,
      html: `
        <p>Dobrý deň, ${params.customerName},</p>
        <p>pripravili sme pre vás orientačný cenový odhad dodávky a montáže okien/dverí.</p>
        <p><a href="${params.quoteUrl}">Pozrieť cenovú ponuku</a></p>
        <p>S pozdravom<br/>${params.companyName}</p>
      `,
    });
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Odoslanie zlyhalo",
    };
  }
}
