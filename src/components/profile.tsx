"use client";

import { KeyRound, LogOut, Mail, UserRound } from "lucide-react";
import { useActionState } from "react";
import { signOut } from "@/app/login/actions";
import { profileInitials, type Profile as AccountProfile } from "@/lib/auth";
import { FormError, PageHead } from "./ui";

export function Profile({ profile }: { profile: AccountProfile }) {
  const [error, logout, pending] = useActionState(signOut, "");

  return (
    <>
      <PageHead title="Perfil" />
      <div className="profile-page-grid">
        <section className="panel profile-identity">
          <div className="profile-large-avatar">
            {profileInitials(profile.name)}
          </div>
          <div>
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
          <span className="badge neutral">Acesso ativo</span>
        </section>
        <section className="panel profile-details">
          <div className="panel-heading">
            <h2>Dados de acesso</h2>
          </div>
          <div className="profile-detail-row">
            <UserRound size={17} aria-hidden="true" />
            <div>
              <span>Nome</span>
              <strong>{profile.name}</strong>
            </div>
          </div>
          <div className="profile-detail-row">
            <Mail size={17} aria-hidden="true" />
            <div>
              <span>E-mail</span>
              <strong>{profile.email}</strong>
            </div>
          </div>
          <div className="profile-detail-row">
            <KeyRound size={17} aria-hidden="true" />
            <div>
              <span>Proteção</span>
              <strong>Entrada com senha</strong>
            </div>
          </div>
          {error && <FormError text={error} />}
          <form className="profile-actions" action={logout}>
            <button className="button" disabled={pending}>
              <LogOut size={15} aria-hidden="true" />
              {pending ? "Saindo…" : "Sair do Maney"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
