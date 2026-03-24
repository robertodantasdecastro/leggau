using System.Collections;
using Leggau.Config;
using Leggau.Gameplay;
using Leggau.Models;
using Leggau.Networking;
using Leggau.UI;
using UnityEngine;

namespace Leggau.App
{
    public class LeggauAppBootstrap : MonoBehaviour
    {
        [SerializeField] private TextAsset environmentAsset;
        [SerializeField] private ApiClient apiClient;
        [SerializeField] private DashboardTextPresenter dashboardPresenter;

        private readonly LeggauSessionState sessionState = new();

        private void Start()
        {
            StartCoroutine(Bootstrap());
        }

        private IEnumerator Bootstrap()
        {
            dashboardPresenter?.SetStatus("Carregando ambiente...");

            var environment = AppEnvironmentLoader.Load(environmentAsset);
            apiClient.SetBaseUrl(environment.apiBaseUrl);

            var loginRequest = new DevLoginRequest
            {
                email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail,
                name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName,
            };

            yield return apiClient.PostJson(
                "auth/dev-login",
                JsonUtility.ToJson(loginRequest),
                response =>
                {
                    var login = JsonUtility.FromJson<DevLoginResponse>(response);
                    sessionState.SetLogin(login);
                },
                error => dashboardPresenter?.SetError($"Falha no login dev: {error}")
            );

            if (sessionState.Parent == null)
            {
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando familia...");

            yield return apiClient.GetJson(
                $"families/overview?email={sessionState.Parent.email}",
                response =>
                {
                    var family = JsonUtility.FromJson<FamilyOverviewResponse>(response);
                    sessionState.SetFamily(family);
                },
                error => dashboardPresenter?.SetError($"Falha ao carregar familia: {error}")
            );

            if (sessionState.ActiveChild == null)
            {
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando atividades...");

            yield return apiClient.GetJson(
                "activities",
                response =>
                {
                    var activities = JsonUtility.FromJson<ActivitiesResponse>(response);
                    sessionState.SetActivities(activities.items);
                },
                error => dashboardPresenter?.SetError($"Falha ao carregar atividades: {error}")
            );

            dashboardPresenter?.SetStatus("Carregando recompensas...");

            yield return apiClient.GetJson(
                $"rewards?childId={sessionState.ActiveChild.id}",
                response =>
                {
                    var rewards = JsonUtility.FromJson<RewardsResponse>(response);
                    sessionState.SetRewards(rewards.items, rewards.availablePoints);
                },
                error => dashboardPresenter?.SetError($"Falha ao carregar recompensas: {error}")
            );

            dashboardPresenter?.Render(sessionState);
        }
    }
}
