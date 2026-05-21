import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "$20 in free credits to start",
    tokens: "~100K tokens",
    features: ["Claude Haiku (fast)", "3 integrations", "App hosting", "Community support"],
    cta: "Get started",
    ctaHref: "/api/auth/signin",
    highlight: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/user/month",
    description: "For individuals and small teams",
    tokens: "2M tokens/month",
    features: ["Claude Sonnet (default)", "All 500+ integrations", "Slack + Telegram bots", "Scheduling", "App hosting", "Email support"],
    cta: "Start free trial",
    ctaHref: "/api/auth/signin",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/user/month",
    description: "For power users and teams",
    tokens: "10M tokens/month",
    features: ["Claude Opus (complex tasks)", "Everything in Starter", "Priority support", "Usage analytics"],
    cta: "Start free trial",
    ctaHref: "/api/auth/signin",
    highlight: false,
  },
  {
    name: "Team",
    price: "$149",
    period: "/month",
    description: "For teams of up to 5",
    tokens: "25M tokens shared",
    features: ["5 seats included", "Everything in Pro", "Centralized billing", "Team memory"],
    cta: "Contact us",
    ctaHref: "mailto:hello@yourdomain.com",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-500">
            Claude tokens passed through at cost — we make money on the platform, not markup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? "border-black bg-black text-white shadow-xl"
                  : "border-gray-200"
              }`}
            >
              <div className="mb-4">
                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${plan.highlight ? "text-gray-300" : "text-gray-400"}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-gray-300" : "text-gray-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${plan.highlight ? "text-gray-300" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <p className={`text-xs font-mono mt-1 ${plan.highlight ? "text-green-400" : "text-green-600"}`}>
                  {plan.tokens}
                </p>
              </div>

              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className={`text-sm flex items-start gap-2 ${plan.highlight ? "text-gray-200" : "text-gray-600"}`}>
                    <span className="mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  plan.highlight
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Enterprise?{" "}
            <a href="mailto:hello@yourdomain.com" className="text-gray-600 underline">
              Contact us
            </a>{" "}
            for dedicated VPS, SSO, and custom SLAs.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
