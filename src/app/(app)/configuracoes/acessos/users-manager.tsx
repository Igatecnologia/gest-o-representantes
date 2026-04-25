"use client";

import { useActionState, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import {
  Plus,
  Users,
  Pencil,
  KeyRound,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  createUserAction,
  updateUserAction,
  resetPasswordAction,
  toggleUserActiveAction,
  deleteUserAction,
} from "@/lib/actions/users";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  repId: string | null;
  repName: string | null;
};

type Rep = { id: string; name: string };

const ROLE_LABELS: Record<string, { label: string; tone: "brand" | "info" | "default" }> = {
  admin: { label: "Administrador", tone: "brand" },
  manager: { label: "Gerente", tone: "info" },
  rep: { label: "Representante", tone: "default" },
};

export function UsersManager({
  users,
  unlinkedReps,
}: {
  users: UserRow[];
  unlinkedReps: Rep[];
}) {
  const [modal, setModal] = useState<"create" | "edit" | "reset" | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);

  function openEdit(u: UserRow) {
    setSelected(u);
    setModal("edit");
  }

  function openReset(u: UserRow) {
    setSelected(u);
    setModal("reset");
  }

  function close() {
    setModal(null);
    setSelected(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Usuários do sistema</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {users.length} usuário(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={() => setModal("create")}>
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="Nenhum usuário"
          hint="Crie o primeiro acesso ao sistema"
          icon={Users}
          action={
            <Button onClick={() => setModal("create")}>
              <Plus className="h-4 w-4" />
              Novo usuário
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>E-mail</TH>
              <TH>Perfil</TH>
              <TH>Representante</TH>
              <TH>Status</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {users.map((u) => {
              const rl = ROLE_LABELS[u.role] ?? ROLE_LABELS.rep;
              return (
                <TR key={u.id}>
                  <TD>
                    <span className="font-medium">{u.name}</span>
                  </TD>
                  <TD>
                    <span className="text-[var(--color-text-muted)]">{u.email}</span>
                  </TD>
                  <TD>
                    <Badge tone={rl.tone}>{rl.label}</Badge>
                  </TD>
                  <TD>
                    {u.repName ? (
                      <span className="text-sm">{u.repName}</span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-dim)]">—</span>
                    )}
                  </TD>
                  <TD>
                    <form action={toggleUserActiveAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="active" value={String(!u.active)} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                        title={u.active ? "Desativar acesso" : "Ativar acesso"}
                      >
                        {u.active ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Ativo</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-red-400">Inativo</span>
                          </>
                        )}
                      </button>
                    </form>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openReset(u)}
                        className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                        title="Redefinir senha"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Excluir"
                          onClick={(e) => {
                            if (!confirm(`Excluir o usuário ${u.name}?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Modals */}
      {modal === "create" && (
        <Modal title="Novo usuário" onClose={close}>
          <CreateUserForm unlinkedReps={unlinkedReps} onDone={close} />
        </Modal>
      )}
      {modal === "edit" && selected && (
        <Modal title="Editar usuário" onClose={close}>
          <EditUserForm
            user={selected}
            unlinkedReps={[
              ...unlinkedReps,
              ...(selected.repId && selected.repName
                ? [{ id: selected.repId, name: selected.repName }]
                : []),
            ]}
            onDone={close}
          />
        </Modal>
      )}
      {modal === "reset" && selected && (
        <Modal title={`Redefinir senha — ${selected.name}`} onClose={close}>
          <ResetPasswordForm userId={selected.id} onDone={close} />
        </Modal>
      )}
    </>
  );
}

/* ============= MODAL ============= */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}

/* ============= CREATE FORM ============= */

const emptyState: { error?: string; success?: string } = {};

function CreateUserForm({
  unlinkedReps,
  onDone,
}: {
  unlinkedReps: Rep[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createUserAction, emptyState);
  const [role, setRole] = useState("rep");
  const [showPw, setShowPw] = useState(false);

  if (state.success) {
    setTimeout(onDone, 600);
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="cu-name">Nome completo</Label>
        <Input id="cu-name" name="name" required placeholder="João Silva" />
      </div>

      <div>
        <Label htmlFor="cu-email">E-mail de login</Label>
        <Input
          id="cu-email"
          name="email"
          type="email"
          required
          placeholder="joao@empresa.com"
        />
      </div>

      <div>
        <Label htmlFor="cu-password">Senha inicial</Label>
        <div className="relative">
          <Input
            id="cu-password"
            name="password"
            type={showPw ? "text" : "password"}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="cu-role">Perfil</Label>
        <Select
          id="cu-role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="rep">Representante</option>
          <option value="manager">Gerente</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>

      {role === "rep" && unlinkedReps.length > 0 && (
        <div>
          <Label htmlFor="cu-rep">Vincular a representante</Label>
          <Select id="cu-rep" name="representativeId">
            <option value="">— Nenhum —</option>
            {unlinkedReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-[10px] text-[var(--color-text-dim)]">
            Vincule a um representante existente para que ele veja seus dados no painel.
          </p>
        </div>
      )}

      {state.error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}

/* ============= EDIT FORM ============= */

function EditUserForm({
  user,
  unlinkedReps,
  onDone,
}: {
  user: UserRow;
  unlinkedReps: Rep[];
  onDone: () => void;
}) {
  const boundAction = updateUserAction.bind(null, user.id);
  const [state, formAction, pending] = useActionState(boundAction, emptyState);
  const [role, setRole] = useState(user.role);

  if (state.success) {
    setTimeout(onDone, 600);
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="eu-name">Nome completo</Label>
        <Input id="eu-name" name="name" required defaultValue={user.name} />
      </div>

      <div>
        <Label htmlFor="eu-email">E-mail de login</Label>
        <Input
          id="eu-email"
          name="email"
          type="email"
          required
          defaultValue={user.email}
        />
      </div>

      <div>
        <Label htmlFor="eu-role">Perfil</Label>
        <Select
          id="eu-role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="rep">Representante</option>
          <option value="manager">Gerente</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>

      {role === "rep" && unlinkedReps.length > 0 && (
        <div>
          <Label htmlFor="eu-rep">Vincular a representante</Label>
          <Select
            id="eu-rep"
            name="representativeId"
            defaultValue={user.repId ?? ""}
          >
            <option value="">— Nenhum —</option>
            {unlinkedReps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="eu-active"
          name="active"
          defaultChecked={user.active}
          className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
        />
        <Label htmlFor="eu-active" className="!mb-0">
          Acesso ativo
        </Label>
      </div>

      {state.error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

/* ============= RESET PASSWORD FORM ============= */

function ResetPasswordForm({
  userId,
  onDone,
}: {
  userId: string;
  onDone: () => void;
}) {
  const boundAction = resetPasswordAction.bind(null, userId);
  const [state, formAction, pending] = useActionState(boundAction, emptyState);
  const [showPw, setShowPw] = useState(false);

  if (state.success) {
    setTimeout(onDone, 600);
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="rp-password">Nova senha</Label>
        <div className="relative">
          <Input
            id="rp-password"
            name="newPassword"
            type={showPw ? "text" : "password"}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)] hover:text-[var(--color-text-muted)]"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {state.success}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Redefinindo..." : "Redefinir senha"}
        </Button>
      </div>
    </form>
  );
}
