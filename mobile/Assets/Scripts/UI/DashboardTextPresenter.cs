using System.Text;
using Leggau.App;
using Leggau.Gameplay;
using UnityEngine;
using UnityEngine.UI;

namespace Leggau.UI
{
    public class DashboardTextPresenter : MonoBehaviour
    {
        private static readonly string[] FlowOrder =
        {
            "Auth",
            "Legal",
            "Familia",
            "Crianca",
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
        [SerializeField] private TextValueView legalStepLabel;
        [SerializeField] private TextValueView childStepLabel;
        [SerializeField] private TextValueView homeStepLabel;
        [SerializeField] private TextValueView parentLabel;
        [SerializeField] private TextValueView childLabel;
        [SerializeField] private TextValueView legalLabel;
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
        private string onboardingTitle = "Onboarding do responsavel";
        private string onboardingBody = "Vamos preparar a conta do responsavel, os consentimentos e a primeira crianca.";

        public void BindViews(
            TextValueView heroTitle,
            TextValueView heroBody,
            TextValueView status,
            TextValueView onboardingTitle,
            TextValueView onboardingBody,
            TextValueView authStep,
            TextValueView legalStep,
            TextValueView childStep,
            TextValueView homeStep,
            TextValueView parent,
            TextValueView child,
            TextValueView legal,
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
            onboardingTitleLabel = onboardingTitle;
            onboardingBodyLabel = onboardingBody;
            authStepLabel = authStep;
            legalStepLabel = legalStep;
            childStepLabel = childStep;
            homeStepLabel = homeStep;
            parentLabel = parent;
            childLabel = child;
            legalLabel = legal;
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

            onboardingTitle = "Onboarding do responsavel";
            onboardingBody = "Vamos preparar a conta do responsavel, os consentimentos e a primeira crianca.";
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
            onboardingControls?.SetConsentAccepted(accepted);
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
            legalStepLabel?.SetText(BuildLegalStepLabel(latestSession));
            childStepLabel?.SetText(BuildChildStepLabel(latestSession));
            homeStepLabel?.SetText(BuildHomeStepLabel(latestSession));
        }

        private string BuildStepLabel(string step, string title)
        {
            var state = ResolveFlowState(step);
            return $"{title}\n{state}";
        }

        private string BuildAuthStepLabel(LeggauSessionState session)
        {
            var title = string.IsNullOrWhiteSpace(session?.DraftParentName)
                ? "1. Conta do responsavel"
                : $"1. Conta do responsavel\nNome pronto: {session.DraftParentName}";
            return BuildStepLabel("Auth", title);
        }

        private string BuildLegalStepLabel(LeggauSessionState session)
        {
            if (session?.LegalDocuments == null || session.LegalDocuments.Length == 0)
            {
                return BuildStepLabel("Legal", "2. Consentimentos");
            }

            return BuildStepLabel("Legal", $"2. Consentimentos\n{session.LegalDocuments.Length} documento(s) para revisar");
        }

        private string BuildChildStepLabel(LeggauSessionState session)
        {
            if (session?.ActiveChild != null)
            {
                return $"3. Perfil da crianca\nUsaremos {session.ActiveChild.name} nesta jornada.\n{ResolveFlowState("Crianca")}";
            }

            if (!string.IsNullOrWhiteSpace(session?.DraftChildName))
            {
                return $"3. Perfil da crianca\nNome preparado: {session.DraftChildName}\n{ResolveFlowState("Crianca")}";
            }

            return BuildStepLabel("Crianca", "3. Perfil da crianca");
        }

        private string BuildHomeStepLabel(LeggauSessionState session)
        {
            var progressState = ResolveFlowState("Progresso");
            var rewardsState = ResolveFlowState("Recompensas");
            var activityState = ResolveFlowState("Atividades");
            var headline = session != null && session.HomeReady
                ? "4. Home pronta para continuar"
                : "4. Entrada na home";
            return $"{headline}\nAtividades: {activityState}\nRecompensas: {rewardsState}\nProgresso: {progressState}";
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
            SetStatus("Dashboard carregado.");
        }

        private void ApplySessionSnapshot(LeggauSessionState session)
        {
            parentLabel?.SetText(BuildParent(session));
            childLabel?.SetText(BuildChild(session));
            legalLabel?.SetText(BuildLegal(session));
            pointsLabel?.SetText(BuildPoints(session));
            progressLabel?.SetText(BuildProgress(session));
            activitiesLabel?.SetText(BuildActivities(session));
            rewardsLabel?.SetText(BuildRewards(session));
            gauVariantLabel?.SetText(BuildGauVariant(session));
            catalogLabel?.SetText(BuildCatalog(session));

            rewardHudPresenter?.SetPoints(session.AvailablePoints);
        }

        private static string BuildLegal(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Consentimentos da familia");

            if (session.LegalDocuments == null || session.LegalDocuments.Length == 0)
            {
                builder.AppendLine("Nenhum documento extra foi exigido nesta etapa.");
                return builder.ToString();
            }

            foreach (var document in session.LegalDocuments)
            {
                if (document == null)
                {
                    continue;
                }

                builder.Append("• ");
                builder.Append(document.title);
                builder.Append(" · ");
                builder.AppendLine(session.ConsentsRecorded ? "aceito" : "pendente");
            }

            return builder.ToString();
        }

        private static string BuildGauVariant(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Gau ao seu lado");

            if (session.ActiveGauVariant == null)
            {
                builder.AppendLine("Nenhuma variante selecionada.");
                return builder.ToString();
            }

            builder.AppendLine(session.ActiveGauVariant.displayName);
            builder.AppendLine($"Estilo: {session.ActiveGauVariant.styleTag}");
            builder.AppendLine($"Uso sugerido: {session.ActiveGauVariant.recommendedUse}");
            return builder.ToString();
        }

        private static string BuildProgress(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Resumo do progresso");
            builder.AppendLine($"{session.CompletedActivities} check-ins e {session.TotalPoints} pontos acumulados ate agora");

            if (session.LatestEntries == null || session.LatestEntries.Length == 0)
            {
                builder.AppendLine("Nenhum check-in registrado ainda.");
                return builder.ToString();
            }

            builder.AppendLine("Ultimos registros");

            var limit = Mathf.Min(3, session.LatestEntries.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var item = session.LatestEntries[index];
                var title = item.activity != null ? item.activity.title : item.activityId;
                builder.AppendLine($"• {title}: {item.pointsEarned} pts");
            }

            return builder.ToString();
        }

        private static string BuildActivities(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Atividades de hoje");

            if (session.Activities == null || session.Activities.Length == 0)
            {
                builder.AppendLine("Nenhuma atividade encontrada.");
                return builder.ToString();
            }

            foreach (var item in session.Activities)
            {
                builder.AppendLine($"• {item.title} · {item.points} pts");
            }

            return builder.ToString();
        }

        private static string BuildRewards(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Recompensas da crianca");

            if (session.Rewards == null || session.Rewards.Length == 0)
            {
                builder.AppendLine("Nenhuma recompensa encontrada.");
                return builder.ToString();
            }

            foreach (var item in session.Rewards)
            {
                var status = item.unlocked ? "liberada" : "bloqueada";
                builder.AppendLine($"• {item.title} · {item.cost} pts · {status}");
            }

            return builder.ToString();
        }

        private static string BuildCatalog(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Cenario da experiencia");

            if (session.AssetsCatalog?.mascot == null)
            {
                builder.AppendLine("Catalogo ainda nao carregado.");
                return builder.ToString();
            }

            builder.AppendLine($"Mascote: {session.AssetsCatalog.mascot.name} ({session.AssetsCatalog.mascot.visualStyle})");

            if (session.AssetsCatalog.scenes == null || session.AssetsCatalog.scenes.Length == 0)
            {
                builder.AppendLine("Nenhuma cena 3D informada.");
            }
            else
            {
                foreach (var item in session.AssetsCatalog.scenes)
                {
                    builder.AppendLine($"• {item.key}: {item.objective}");
                }
            }

            if (session.GauVariantsCatalog?.variants == null || session.GauVariantsCatalog.variants.Length == 0)
            {
                builder.AppendLine("Variantes locais do Gau ainda nao carregadas.");
                return builder.ToString();
            }

            builder.AppendLine($"Variantes locais: {session.GauVariantsCatalog.variants.Length}");

            foreach (var item in session.GauVariantsCatalog.variants)
            {
                var selected = session.ActiveGauVariant == item ? " [ativo]" : string.Empty;
                builder.AppendLine($"• {item.displayName}: {item.styleTag}{selected}");
            }

            return builder.ToString();
        }

        private static string BuildParent(LeggauSessionState session)
        {
            if (session.Parent == null)
            {
                return "Responsavel\nAinda vamos identificar quem acompanha esta crianca.";
            }

            return $"Responsavel da jornada\n{session.Parent.name}\n{session.Parent.email}";
        }

        private static string BuildChild(LeggauSessionState session)
        {
            if (session.ActiveChild == null)
            {
                var draftName = string.IsNullOrWhiteSpace(session?.DraftChildName) ? "Nome ainda nao informado" : session.DraftChildName;
                return $"Perfil infantil\n{draftName}\nAguardando confirmacao da etapa da crianca.";
            }

            return $"Crianca ativa\n{session.ActiveChild.name} · {session.ActiveChild.age} anos\nAvatar atual: {session.ActiveChild.avatar}";
        }

        private static string BuildPoints(LeggauSessionState session)
        {
            var headline = session.HomeReady ? "Sua home do dia" : "Destino da home";
            return $"{headline}\nPontos disponiveis: {session.AvailablePoints}\nPontos totais: {session.TotalPoints}\nMascote: {session.ActiveGauVariant?.displayName ?? "-"}";
        }
    }
}
