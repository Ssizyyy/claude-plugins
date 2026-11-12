import { save } from "@/api"

export default function Login() {
  const input = "mt-[7px] w-full rounded-2xl bg-white/20 px-3 py-2 text-center text-sm text-white outline-none placeholder:text-white/40"

  return (
    <main className="flex min-h-[calc(100vh-45px)] items-center justify-center p-6" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)" }}>
      <div className="w-full max-w-sm rounded-3xl bg-white/20 p-[26px] text-center shadow-2xl backdrop-blur">
        <div className="text-5xl">🚀</div>
        <div className="mt-[6px] text-3xl font-extrabold text-white">Welcome Back!</div>
        <div className="text-3xl font-extrabold text-white">Acme Goods</div>
        <div className="text-xs text-white/50">Unlock the power of seamless commerce ✨</div>
        <form onSubmit={(e) => { e.preventDefault(); save("login") }}>
          <input className={input} placeholder="Email" />
          <input className={input} placeholder="Password" type="password" />
          <div className="mt-[9px] flex gap-[5px]">
            {["Sign in", "Sign up", "Google"].map((b) => (
              <button key={b} className="flex-1 rounded-2xl bg-white py-2 text-sm font-bold shadow-lg outline-none" style={{ color: "#8b5cf6" }}>
                {b}
              </button>
            ))}
          </div>
        </form>
        <a href="#/login" className="text-[9px] text-white/40">forgot password?</a>
      </div>
    </main>
  )
}
