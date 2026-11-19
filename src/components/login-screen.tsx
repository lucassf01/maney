"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { signIn } from "@/app/login/actions";
import { Brand } from "./brand";

export function LoginScreen({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, submit, busy] = useActionState(signIn, "");

  return (
    <main className="login-screen">
      <section className="login-card" aria-label="Entrar no Maney">
        <div className="login-brand">
          <Brand />
        </div>
        <form className="login-form" action={submit}>
          <div className="login-field">
            <label htmlFor="login-email">E-mail</label>
            <span className="login-input-wrap">
              <Mail size={16} aria-hidden="true" />
              <input
                type="email"
                id="login-email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
              />
            </span>
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Senha</label>
            <span className="login-input-wrap">
              <KeyRound size={16} aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                id="login-password"
                name="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </div>
          {(!configured || error) && (
            <p className="login-error" role="alert">
              {configured ? error : "O login ainda não foi configurado."}
            </p>
          )}
          <button
            className="button primary login-submit"
            disabled={!configured || busy}
          >
            {busy ? "Entrando…" : "Entrar"}
            {!busy && <ArrowRight size={16} aria-hidden="true" />}
          </button>
        </form>
        <p className="login-note">Acesso protegido por senha</p>
      </section>
    </main>
  );
}
