using System.Text;
using Leggau.App;
using Leggau.Gameplay;
using UnityEngine;

namespace Leggau.UI
{
    public class DashboardTextPresenter : MonoBehaviour
    {
        [SerializeField] private TextValueView statusLabel;
        [SerializeField] private TextValueView parentLabel;
        [SerializeField] private TextValueView childLabel;
        [SerializeField] private TextValueView progressLabel;
        [SerializeField] private TextValueView activitiesLabel;
        [SerializeField] private TextValueView rewardsLabel;
        [SerializeField] private TextValueView gauVariantLabel;
        [SerializeField] private TextValueView catalogLabel;
        [SerializeField] private RewardHudPresenter rewardHudPresenter;
        [SerializeField] private BootstrapRuntimeProbe runtimeProbe;

        public void BindViews(
            TextValueView status,
            TextValueView parent,
            TextValueView child,
            TextValueView progress,
            TextValueView activities,
            TextValueView rewards,
            TextValueView gauVariant,
            TextValueView catalog,
            RewardHudPresenter rewardHud,
            BootstrapRuntimeProbe probe)
        {
            statusLabel = status;
            parentLabel = parent;
            childLabel = child;
            progressLabel = progress;
            activitiesLabel = activities;
            rewardsLabel = rewards;
            gauVariantLabel = gauVariant;
            catalogLabel = catalog;
            rewardHudPresenter = rewardHud;
            runtimeProbe = probe;
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
        }

        public void RenderLoadingState(LeggauSessionState session, string status)
        {
            ApplySessionSnapshot(session);
            runtimeProbe?.ReportSession(session);
            SetStatus(status);
        }

        public void Render(LeggauSessionState session)
        {
            ApplySessionSnapshot(session);
            runtimeProbe?.ReportSession(session);
            SetStatus("Dashboard carregado.");
        }

        private void ApplySessionSnapshot(LeggauSessionState session)
        {
            parentLabel?.SetText(session.Parent != null ? $"Responsavel: {session.Parent.name}" : "Responsavel: -");
            childLabel?.SetText(session.ActiveChild != null ? $"Crianca: {session.ActiveChild.name} ({session.ActiveChild.age} anos)" : "Crianca: -");
            progressLabel?.SetText(BuildProgress(session));
            activitiesLabel?.SetText(BuildActivities(session));
            rewardsLabel?.SetText(BuildRewards(session));
            gauVariantLabel?.SetText(BuildGauVariant(session));
            catalogLabel?.SetText(BuildCatalog(session));

            rewardHudPresenter?.SetPoints(session.AvailablePoints);
        }

        private static string BuildGauVariant(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Mascote ativo:");

            if (session.ActiveGauVariant == null)
            {
                builder.AppendLine("- Nenhuma variante selecionada");
                return builder.ToString();
            }

            builder.AppendLine($"- {session.ActiveGauVariant.displayName}");
            builder.AppendLine($"- Estilo: {session.ActiveGauVariant.styleTag}");
            builder.AppendLine($"- Uso: {session.ActiveGauVariant.recommendedUse}");
            return builder.ToString();
        }

        private static string BuildProgress(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine($"Progresso: {session.CompletedActivities} check-ins e {session.TotalPoints} pontos");

            if (session.LatestEntries == null || session.LatestEntries.Length == 0)
            {
                builder.AppendLine("- Nenhum check-in registrado");
                return builder.ToString();
            }

            builder.AppendLine("Ultimos registros:");

            var limit = Mathf.Min(3, session.LatestEntries.Length);
            for (var index = 0; index < limit; index += 1)
            {
                var item = session.LatestEntries[index];
                var title = item.activity != null ? item.activity.title : item.activityId;
                builder.AppendLine($"- {title}: {item.pointsEarned} pts");
            }

            return builder.ToString();
        }

        private static string BuildActivities(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Atividades:");

            if (session.Activities == null || session.Activities.Length == 0)
            {
                builder.AppendLine("- Nenhuma atividade encontrada");
                return builder.ToString();
            }

            foreach (var item in session.Activities)
            {
                builder.AppendLine($"- {item.title} ({item.points} pts)");
            }

            return builder.ToString();
        }

        private static string BuildRewards(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Recompensas:");

            if (session.Rewards == null || session.Rewards.Length == 0)
            {
                builder.AppendLine("- Nenhuma recompensa encontrada");
                return builder.ToString();
            }

            foreach (var item in session.Rewards)
            {
                var status = item.unlocked ? "liberada" : "bloqueada";
                builder.AppendLine($"- {item.title} ({item.cost} pts, {status})");
            }

            return builder.ToString();
        }

        private static string BuildCatalog(LeggauSessionState session)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Mascote e cenas:");

            if (session.AssetsCatalog?.mascot == null)
            {
                builder.AppendLine("- Catalogo ainda nao carregado");
                return builder.ToString();
            }

            builder.AppendLine($"- Mascote: {session.AssetsCatalog.mascot.name} ({session.AssetsCatalog.mascot.visualStyle})");

            if (session.AssetsCatalog.scenes == null || session.AssetsCatalog.scenes.Length == 0)
            {
                builder.AppendLine("- Nenhuma cena 3D informada");
            }
            else
            {
                foreach (var item in session.AssetsCatalog.scenes)
                {
                    builder.AppendLine($"- {item.key}: {item.objective}");
                }
            }

            if (session.GauVariantsCatalog?.variants == null || session.GauVariantsCatalog.variants.Length == 0)
            {
                builder.AppendLine("- Variantes locais do Gau ainda nao carregadas");
                return builder.ToString();
            }

            builder.AppendLine($"- Variantes locais: {session.GauVariantsCatalog.variants.Length}");

            foreach (var item in session.GauVariantsCatalog.variants)
            {
                var selected = session.ActiveGauVariant == item ? " [ativo]" : string.Empty;
                builder.AppendLine($"- {item.displayName}: {item.styleTag}{selected}");
            }

            return builder.ToString();
        }
    }
}
