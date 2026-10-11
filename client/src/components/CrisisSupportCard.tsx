import { AlertTriangle, HeartHandshake, Phone } from "lucide-react";

interface CrisisSupportCardProps {
  riskCategory?: string | null;
  compact?: boolean;
}

export function CrisisSupportCard({ riskCategory, compact = false }: CrisisSupportCardProps) {
  return (
    <section
      role="alert"
      aria-label="危机援助信息"
      className={`rounded-2xl border border-rose-300/35 bg-gradient-to-br from-rose-950/70 via-[#251b42] to-[#171a43] text-white shadow-lg shadow-rose-950/20 ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-rose-300/15 p-2 text-rose-200">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-rose-100">现在，先让现实中的人接住你</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">
            我们注意到这封信里可能有需要马上关注的安全信号。深夜信箱不是急救或医疗服务，请优先联系专业援助、身边可信任的人，或让他们陪着你。
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <a href="tel:12356" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E9B86A] px-3 py-2 text-sm font-semibold text-[#171a43] hover:bg-[#f2c982]">
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              12356 心理援助
            </a>
            <a href="tel:120" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15">
              <Phone className="h-4 w-4" aria-hidden="true" />
              120 急救
            </a>
            <a href="tel:110" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15">
              <Phone className="h-4 w-4" aria-hidden="true" />
              110 警方
            </a>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/55">
            12356 的服务时长和接通情况以当地官方安排为准；如果你正处于即时危险，请立即联系 120/110，并尽量不要独处。
          </p>
          {riskCategory && <p className="sr-only">风险类别：{riskCategory}</p>}
        </div>
      </div>
    </section>
  );
}
