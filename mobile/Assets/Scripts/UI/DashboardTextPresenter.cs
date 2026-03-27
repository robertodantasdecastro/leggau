using System.Text;
using Leggau.App;
using Leggau.Gameplay;
using UnityEngine;

namespace Leggau.UI
{
    public class DashboardTextPresenter : MonoBehaviour
    {
        private static readonly string[] FlowOrder =
        {
            "Auth",
            "Familia",
            "Menor",
            "Politica",
            "Atividades",
            "Recompensas",
            "Progresso",
        };

        [SerializeField] private TextValueView statusLabel;
        [SerializeField] private TextValueView heroTitleLabel;
        [SerializeField] private TextValueView heroBodyLabel;
        [SerializeField] private TextValueView onboardingTitleLabel;
        [SerializeField] private TextValueView onboardingBodyLabel;
        [SerializeField] private TextValueView authStepLabel;
        [SerializeField] private TextValueView familyStepLabel;
        [SerializeField] private TextValueView minorStepLabel;
        [SerializeField] private TextValueView homeStepLabel;
        [SerializeField] private TextValueView parentLabel;
        [SerializeField] private TextValueView childLabel;
        [SerializeField] private TextValueView policyLabel;
        [SerializeField] private TextValueView pointsLabel;
        [SerializeField] private TextValueView progressLabel;
        [SerializeField] private TextValueView activitiesLabel;
        [SerializeField] private TextValueView rewardsLabel;
        [SerializeField] private TextValueView gauVariantLabel;
        [SerializeField] private TextValueView catalogLabel;
        [SerializeField] private TextValueView flowLabel;
        [SerializeField] private RewardHudPresenter rewardHudPresenter;
        [SerializeField] private BootstrapRuntimeProbe runtimeProbe;
        [SerializeField] private OnboardingControlView onboardingControls;
        [SerializeField] private GameObject onboardingRoot;
        [SerializeField] private GameObject homeRoot;

        private readonly string[] flowStates = new string[FlowOrder.Length];
        private LeggauSessionState latestSession;
        private string onboardingTitle = "Ative o responsavel";
        private string onboardingBody = "Entre com a conta do responsavel, escolha o menor vinculado e carregue a policy antes de abrir o shell.";

        public void BindViews(
            TextValueView heroTitle,
            TextValueView heroBody,
            TextValueView status,
            TextValueView onboardingTitleView,
            TextValueView onboardingBodyView,
            TextValueView authStep,
            TextValueView familyStep,
            TextValueView minorStep,
            TextValueView homeStep,
            TextValueView parent,
            TextValueView child,
            TextValueView policy,
            TextValueView points,
            TextValueView progress,
            TextValueView activities,
            TextValueView rewards,
            TextValueView gauVariant,
            TextValueView catalog,
            TextValueView flow,
            RewardHudPresenter rewardHud,
            BootstrapRuntimeProbe probe,
            OnboardingControlView controls,
            GameObject onboardingPanel,
            GameObject homePanel)
        {
            heroTitleLabel = heroTitle;
            heroBodyLabel = heroBody;
            statusLabel = status;
            onboardingTitleLabel = onboardingTitleView;
            onboardingBodyLabel = onboardingBodyView;
            authStepLabel = authStep;
            familyStepLabel = familyStep;
            minorStepLabel = minorStep;
            homeStepLabel = homeStep;
            parentLabel = parent;
            childLabel = child;
            policyLabel = policy;
            pointsLabel = points;
            progressLabel = progress;
            activitiesLabel = activities;
            rewardsLabel = rewards;
            gauVariantLabel = gauVariant;
            catalogLabel = catalog;
            flowLabel = flow;
            rewardHudPresenter = rewardHud;
            runtimeProbe = probe;
            onboardingControls = controls;
            onboardingRoot = onboardingPanel;
            homeRoot = homePanel;
            ResetFlow();
        }

        public void ResetFlow()
        {
            for (var index = 0; index < FlowOrder.Length; index += 1)
            {
                flowStates[index] = "[ ] aguardando";
            }

            onboardingTitle = "Ative o responsavel";
            onboardingBody = "Entre com a conta do responsavel, escolha o menor vinculado e carregue a policy antes de abrir o shell.";
            RenderOnboardingSteps();
            SetPanelState(false);
            RenderFlow();
        }

        public void SyncOnboardingControls(LeggauSessionState session, bool busy)
        {
            latestSession = session;
            onboardingControls?.PopulateFromSession(session);
            onboardingControls?.ApplyState(session, busy);
        }

        public void ReadOnboardingDrafts(LeggauSessionState session)
        {
            onboardingControls?.ReadDrafts(session);
        }

        public void SetConsentAccepted(bool accepted)
        {
        }

        public void SetHero(string title, string body)
        {
            heroTitleLabel?.SetText(title);
            heroBodyLabel?.SetText(body);
            onboardingTitle = title;
            onboardingBody = body;
            onboardingTitleLabel?.SetText(title);
            onboardingBodyLabel?.SetText(body);
        }

        public void MarkFlowLoading(string step, string detail = null)
        {
            SetFlow(step, string.IsNullOrWhiteSpace(detail) ? "[..] em andamento" : $"[..] {detail}");
        }

        public void MarkFlowDone(string step, string detail = null)
        {
            SetFlow(step, string.IsNullOrWhiteSpace(detail) ? "[ok] concluido" : $"[ok] {detail}");
        }

        public void MarkFlowFailed(string step, string detail)
        {
            SetFlow(step, string.IsNullOrWhiteSpace(detail) ? "[x] falhou" : $"[x] {detail}");
        }

        public void SetStatus(string value)
        {
            statusLabel?.SetText(value);
            runtimeProbe?.ReportStatus(value);
        }

        public void SetError(string value)
        {
            runtimeProbe?.ReportError(value);
            SetStatus($"Erro: {value}");
            SetPanelState(false);
        }

        public void RenderLoadingState(LeggauSessionState session, string status)
        {
            latestSession = session;
            ApplySessionSnapshot(session);
            if (session != null && session.HomeReady)
            {
                runtimeProbe?.ReportSession(session);
            }

            SetPanelState(session != null && session.HomeReady);
            SyncOnboardingControls(session, true);
            SetStatus(status);
        }

        public void Render(LeggauSessionState session)
        {
            latestSession = session;
            ApplySessionSnapshot(session);
            runtimeProbe?.ReportSession(session);
            SetPanelState(session != null && session.HomeReady);
            SyncOnboardingControls(session, false);
            SetStatus("Shell carregada.");
        }

        private void SetFlow(string step, string state)
        {
            for (var index = 0; index < FlowOrder.Length; index += 1)
            {
                if (FlowOrder[index] != step)
                {
                    continue;
                }

                flowStates[index] = state;
                RenderFlow();
                return;
            }
        }

        private void RenderFlow()
        {
            if (flowLabel == null)
            {
                return;
            }

            var builder = new StringBuilder();
            for (var index = 0; index < FlowOrder.Length; index += 1)
            {
                builder.Append("- ");
                builder.Append(FlowOrder[index]);
                builder.Append(": ");
                builder.AppendLine(string.IsNullOrWhiteSpace(flowStates[index]) ? "[ ] aguardando" : flowStates[index]);
            }

            flowLabel.SetText(builder.ToString());
            RenderOnboardingSteps();
        }

        private void RenderOnboardingSteps()
        {
            onboardingTitleLabel?.SetText(onboardingTitle);
            onboardingBodyLabel?.SetText(onboardingBody);
            authStepLabel?.SetText(BuildAuthStepLabel(latestSession));
            familyStepLabel?.SetText(BuildFamilyStepLabel(latestSession));
            minorStepLabel?.SetText(BuildMinorStepLabel(latestSession));
            homeStepLabel?.SetText(BuildHomeStepLabel(latestSession));
        }

        private string BuildAuthStepLabel(LeggauSessionState session)
        {
            if (session?.IsAuthenticated == true)
            {
                return $"1. Responsavel ativo\n{session.Parent?.name ?? session.User?.displayName}\n{ResolveFlowState("Auth")}";
            }

            var headline = string.IsNullOrWhiteSpace(session?.DraftParentName)
                ? "1. Ative a conta do responsavel"
                : $"1. Ative a conta do responsavel\nNome pronto: {session.DraftParentName}";
            return $"{headline}\n{ResolveFlowState("Auth")}";
        }

        private string BuildFamilyStepLabel(LeggauSessionState session)
        {
            var title = session == null || !session.HasLinkedMinors
                ? "2. Carregue os menores vinculados"
                : $"2. Familia carregada\nPerfis: {session.LinkedMinors.Length}";
            return $"{title}\n{ResolveFlowState("Familia")}";
        }

        private string BuildMinorStepLabel(LeggauSessionState session)
        {
            if (session?.SelectedMinor != null)
            {
                return $"3. Menor selecionado\n{session.SelectedMinor.name} · {ResolveRoleLabel(session.SelectedMinor.role)} · {session.ResolvedAgeBand}\n{ResolveFlowState("Menor")}";
            }

            return $"3. Escolha o menor certo\n{ResolveFlowState("Menor")}";
        }

        private string BuildHomeStepLabel(LeggauSessionState session)
        {
            var shellName = ResolveShellName(session);
            if (session?.HomeReady == true)
            {
                return $"4. {shellName} pronta\nAtividades: {ResolveFlowState("Atividades")}\nRecompensas: {ResolveFlowState("Recompensas")}\nProgresso: {ResolveFlowState("Progresso")}";
            }

            return $"4. Abrir {shellName}\nPolicy: {ResolveFlowState("Politica")}\nProgresso: {ResolveFlowState("Progresso")}";
        }

        private string ResolveFlowState(string step)
        {
            for (var index = 0; index < FlowOrder.Length; index += 1)
            {
                if (FlowOrder[index] == step)
                {
                    return string.IsNullOrWhiteSpace(flowStates[index]) ? "[ ] aguardando" : flowStates[index];
                }
            }

            return "[ ] aguardando";
        }

        private void SetPanelState(bool homeReady)
        {
            if (onboardingRoot != null)
            {
                onboardingRoot.SetActive(true);
            }

            if (homeRoot != null)
            {
                homeRoot.SetActive(homeReady);
            }
        }

        private void ApplySessionSnapshot(LeggauSessionState session)
        {
            parentLabel?.SetText(BuildParent(session));
            childLabel?.SetText(BuildSelectedMinor(session));
            policyLabel?.SetText(BuildPolicy(session));
            pointsLabel?.SetText(BuildShellHeader(session));
            progressLabel?.SetText(BuildProgress(session));
            activitiesLabel?.SetText(BuildActivities(session));
            rewardsLabel?.SetText(BuildRewards(session));
            gauVariantLabel?.SetText(BuildGauVariant(session));
            catalogLabel?.SetText(BuildCatalog(session));
            rewardHudPresenter?.SetPoints(session?.AvailablePoints ?? 0);
        }

        private static string BuildParent(LeggauSessionState session)
        {
            if (session?.Parent == null)
            {
                return "Responsavel\nAtive a sessao principal para liberar o shell do menor.";
            }

            var builder = new StringBuilder();
            builder.AppendLine("Responsavel ativo");
            builder.AppendLine(session.Parent.name);
            builder.AppendLine(session.Parent.email);
            if (session.HasLinkedMinors)
            {
                builder.AppendLine($"{session.LinkedMinors.Length} perfil(is) vinculado(s)");
            }

            return builder.ToString();
        }

        private static string BuildSelectedMinor(LeggauSessionState session)
        {
            if (session?.SelectedMinor == null)
            {
                return "Menor em foco\nEscolha um perfil vinculado para continuar.";
            }

            var builder = new StringBuilder();
            builder.AppendLine("Menor em foco");
            builder.AppendLine(session.SelectedMinor.name);
            builder.AppendLine($"{ResolveRoleLabel(session.SelectedMinor.role)} · {session.SelectedMinor.age} anos · {session.ResolvedAgeBand}");
            builder.AppendLine($"Shell: {ResolveShellName(session)}");
            builder.AppendLine($"Avatar atual: {session.SelectedMinor.avatar}");
            return builder.ToString();
        }

        private static string BuildPolicy(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Policy aplicada");

            if (session?.SelectedMinorPolicy == null)
            {
                builder.AppendLine("A policy do menor ainda nao foi carregada.");
                return builder.ToString();
            }

            builder.AppendLine($"Faixa ativa: {session.ResolvedAgeBand}");
            builder.AppendLine(session.SelectedMinorPolicy.roomsEnabled ? "Salas estruturadas visiveis" : "Salas estruturadas ocultas");
            builder.AppendLine(session.SelectedMinorPolicy.presenceEnabled ? "Presenca monitorada ativa" : "Presenca monitorada ocultada");
            builder.AppendLine(session.SelectedMinorPolicy.messagingMode == "none"
                ? "Sem mensageria livre entre menores"
                : $"Mensageria: {session.SelectedMinorPolicy.messagingMode}");
            builder.AppendLine(session.SelectedMinorPolicy.therapistParticipationAllowed
                ? "Acoes clinicas permitidas pela policy"
                : "Acoes clinicas ocultas nesta fase");
            return builder.ToString();
        }

        private static string BuildShellHeader(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            var shellName = ResolveShellName(session);
            builder.AppendLine(shellName);

            switch (ResolveAgeBand(session))
            {
                case "10-12":
                    builder.AppendLine("Mais autonomia, mais densidade e atividades em destaque.");
                    builder.AppendLine($"Pontos disponiveis: {session?.AvailablePoints ?? 0}");
                    builder.AppendLine($"Atividades ativas: {session?.Activities?.Length ?? 0}");
                    break;
                case "13-17":
                    builder.AppendLine("Foco em progresso, rotina e clareza de objetivos.");
                    builder.AppendLine($"Pontos totais: {session?.TotalPoints ?? 0}");
                    builder.AppendLine($"Check-ins concluidos: {session?.CompletedActivities ?? 0}");
                    break;
                default:
                    builder.AppendLine("Gau lidera a jornada com passos curtos e visuais maiores.");
                    builder.AppendLine($"Pontos disponiveis: {session?.AvailablePoints ?? 0}");
                    builder.AppendLine($"Mascote: {session?.ActiveGauVariant?.displayName ?? "Gau"}");
                    break;
            }

            return builder.ToString();
        }

        private static string BuildProgress(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine(ResolveAgeBand(session) == "13-17" ? "Painel de progresso" : "Resumo do progresso");
            builder.AppendLine($"{session?.CompletedActivities ?? 0} check-ins");
            builder.AppendLine($"{session?.TotalPoints ?? 0} pontos acumulados");

            if (session?.LatestEntries == null || session.LatestEntries.Length == 0)
            {
                builder.AppendLine("Nenhum check-in registrado ainda.");
                return builder.ToString();
            }

            builder.AppendLine(ResolveAgeBand(session) == "13-17" ? "Rotina recente" : "Ultimos destaques");

            var limit = Mathf.Min(2, session.LatestEntries.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var item = session.LatestEntries[index];
                var title = item.activity != null ? item.activity.title : item.activityId;
                builder.AppendLine($"• {title}: {item.pointsEarned} pts");
            }

            if (session.LatestEntries.Length > limit)
            {
                builder.AppendLine($"+{session.LatestEntries.Length - limit} registro(s) recente(s)");
            }

            return builder.ToString();
        }

        private static string BuildActivities(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine(ResolveAgeBand(session) == "13-17" ? "Rotinas e atividades" : "Atividades do dia");

            if (session?.Activities == null || session.Activities.Length == 0)
            {
                builder.AppendLine("Nenhuma atividade carregada.");
                return builder.ToString();
            }

            var limit = Mathf.Min(2, session.Activities.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var item = session.Activities[index];
                builder.AppendLine($"• {item.title} · {item.points} pts");
            }

            if (session.Activities.Length > limit)
            {
                builder.AppendLine($"+{session.Activities.Length - limit} atividade(s) disponiveis");
            }

            return builder.ToString();
        }

        private static string BuildRewards(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine(ResolveAgeBand(session) == "13-17" ? "Metas e recompensas" : "Recompensas");

            if (session?.Rewards == null || session.Rewards.Length == 0)
            {
                builder.AppendLine("Nenhuma recompensa carregada.");
                return builder.ToString();
            }

            var limit = Mathf.Min(2, session.Rewards.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var item = session.Rewards[index];
                var status = item.unlocked ? "liberada" : "bloqueada";
                builder.AppendLine($"• {item.title} · {item.cost} pts · {status}");
            }

            if (session.Rewards.Length > limit)
            {
                builder.AppendLine($"+{session.Rewards.Length - limit} recompensa(s) disponiveis");
            }

            return builder.ToString();
        }

        private static string BuildGauVariant(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine(ResolveAgeBand(session) == "13-17" ? "Companheiro Gau" : "Gau ao seu lado");

            if (session?.ActiveGauVariant == null)
            {
                builder.AppendLine("Nenhuma variante selecionada.");
                return builder.ToString();
            }

            builder.AppendLine(session.ActiveGauVariant.displayName);
            builder.AppendLine($"Estilo: {session.ActiveGauVariant.styleTag}");
            builder.AppendLine($"Uso sugerido: {session.ActiveGauVariant.recommendedUse}");
            return builder.ToString();
        }

        private static string BuildCatalog(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Interacoes monitoradas");

            if (session == null)
            {
                builder.AppendLine("Aguardando a sessao do responsavel.");
                return builder.ToString();
            }

            if (!session.HasLinkedMinors)
            {
                builder.AppendLine("Nenhum menor vinculado. O caminho canonico continua em /pais.");
                builder.AppendLine("No editor, voce ainda pode usar o atalho dev para gerar um perfil de teste.");
                return builder.ToString();
            }

            if (!session.HomeReady)
            {
                builder.AppendLine($"Confirme o perfil {session.SelectedMinor?.name ?? "selecionado"} e carregue a policy antes de abrir o shell.");
                return builder.ToString();
            }

            if (!string.IsNullOrWhiteSpace(session.RoomCatalogMessage))
            {
                builder.AppendLine(session.RoomCatalogMessage);
            }

            if (session.RoomRequirements != null)
            {
                builder.AppendLine($"Gate presence_enabled: {session.RoomRequirements.presenceApprovalStatus}");

                if (!string.IsNullOrWhiteSpace(session.RoomRequirements.therapistLinkingStatus) &&
                    session.RoomRequirements.therapistLinkingStatus != "missing")
                {
                    builder.AppendLine($"Gate therapist_linking: {session.RoomRequirements.therapistLinkingStatus}");
                }

                if (session.RoomRequirements.blockedBy != null &&
                    session.RoomRequirements.blockedBy.Length > 0)
                {
                    builder.AppendLine($"Bloqueios: {string.Join(", ", session.RoomRequirements.blockedBy)}");
                }
            }

            if (session.SelectedMinorPolicy == null)
            {
                return builder.ToString();
            }

            if (!session.SelectedMinorPolicy.roomsEnabled)
            {
                builder.AppendLine("A policy atual esconde qualquer entrada em salas estruturadas.");
                return builder.ToString();
            }

            if (!session.RoomsAllowed && session.RoomRequirements != null)
            {
                builder.AppendLine("O shell continua pronto, mas as salas ficam bloqueadas ate o responsavel liberar o gate em /pais.");
                return builder.ToString();
            }

            if (!session.HasAvailableRooms)
            {
                builder.AppendLine("Nenhuma sala monitorada foi carregada para este shell ainda.");
                builder.AppendLine("Use Atualizar salas para consultar a vm2.");
                return builder.ToString();
            }

            var limit = Mathf.Min(2, session.AvailableRooms.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var room = session.AvailableRooms[index];
                builder.AppendLine($"• {room.title} · {room.presenceMode}");
            }

            if (session.ActiveRoom != null)
            {
                builder.AppendLine($"Sala ativa: {session.ActiveRoom.title}");
            }
            else
            {
                builder.AppendLine("Nenhuma sala ativa no momento.");
            }

            if (session.SelectedMinorPolicy.presenceEnabled)
            {
                builder.AppendLine(session.ActivePresence != null
                    ? $"Presenca monitorada: {session.ActivePresence.participantCount} participante(s)"
                    : "Presenca monitorada pronta para heartbeat.");
            }
            else
            {
                builder.AppendLine("Presenca monitorada permanece oculta pela policy.");
            }

            return builder.ToString();
        }

        private static string ResolveShellName(LeggauSessionState session)
        {
            return session?.ActiveShell == "adolescent" ? "Shell adolescente" : "Shell infantil";
        }

        private static string ResolveAgeBand(LeggauSessionState session)
        {
            return string.IsNullOrWhiteSpace(session?.ResolvedAgeBand) ? "6-9" : session.ResolvedAgeBand;
        }

        private static string ResolveRoleLabel(string role)
        {
            return role == "adolescent" ? "Adolescente" : "Crianca";
        }
    }
}
