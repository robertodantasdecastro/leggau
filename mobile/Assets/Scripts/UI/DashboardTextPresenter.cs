using System.Text;
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
        [SerializeField] private TextValueView catalogLabel;
        [SerializeField] private RewardHudPresenter rewardHudPresenter;

        public void BindViews(
            TextValueView status,
            TextValueView parent,
            TextValueView child,
            TextValueView progress,
            TextValueView activities,
            TextValueView rewards,
            TextValueView catalog,
            RewardHudPresenter rewardHud)
        {
            statusLabel = status;
            parentLabel = parent;
            childLabel = child;
            progressLabel = progress;
            activitiesLabel = activities;
            rewardsLabel = rewards;
            catalogLabel = catalog;
            rewardHudPresenter = rewardHud;
        }

        public void SetStatus(string value)
        {
            statusLabel?.SetText(value);
        }

        public void SetError(string value)
        {
            SetStatus($"Erro: {value}");
        }

        public void Render(LeggauSessionState session)
        {
            parentLabel?.SetText(session.Parent != null ? $"Responsavel: {session.Parent.name}" : "Responsavel: -");
            childLabel?.SetText(session.ActiveChild != null ? $"Crianca: {session.ActiveChild.name} ({session.ActiveChild.age} anos)" : "Crianca: -");
            progressLabel?.SetText(BuildProgress(session));
            activitiesLabel?.SetText(BuildActivities(session));
            rewardsLabel?.SetText(BuildRewards(session));
            catalogLabel?.SetText(BuildCatalog(session));

            rewardHudPresenter?.SetPoints(session.AvailablePoints);
            SetStatus("Dashboard carregado.");
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
                return builder.ToString();
            }

            foreach (var item in session.AssetsCatalog.scenes)
            {
                builder.AppendLine($"- {item.key}: {item.objective}");
            }

            return builder.ToString();
        }
    }
}
