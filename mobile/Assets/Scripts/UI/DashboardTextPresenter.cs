using System.Text;
using Leggau.Gameplay;
using TMPro;
using UnityEngine;

namespace Leggau.UI
{
    public class DashboardTextPresenter : MonoBehaviour
    {
        [SerializeField] private TMP_Text statusLabel;
        [SerializeField] private TMP_Text parentLabel;
        [SerializeField] private TMP_Text childLabel;
        [SerializeField] private TMP_Text activitiesLabel;
        [SerializeField] private TMP_Text rewardsLabel;
        [SerializeField] private RewardHudPresenter rewardHudPresenter;

        public void SetStatus(string value)
        {
            if (statusLabel != null)
            {
                statusLabel.text = value;
            }
        }

        public void SetError(string value)
        {
            SetStatus($"Erro: {value}");
        }

        public void Render(LeggauSessionState session)
        {
            if (parentLabel != null && session.Parent != null)
            {
                parentLabel.text = $"Responsavel: {session.Parent.name}";
            }

            if (childLabel != null && session.ActiveChild != null)
            {
                childLabel.text = $"Crianca: {session.ActiveChild.name} ({session.ActiveChild.age} anos)";
            }

            if (activitiesLabel != null)
            {
                activitiesLabel.text = BuildActivities(session);
            }

            if (rewardsLabel != null)
            {
                rewardsLabel.text = BuildRewards(session);
            }

            rewardHudPresenter?.SetPoints(session.AvailablePoints);
            SetStatus("Dashboard carregado.");
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
    }
