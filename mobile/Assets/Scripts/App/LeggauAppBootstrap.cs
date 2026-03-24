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
        private bool isBusy;

        public void Configure(TextAsset environment, ApiClient client, DashboardTextPresenter presenter)
        {
            environmentAsset = environment;
            apiClient = client;
            dashboardPresenter = presenter;
        }

        private void Start()
        {
            StartCoroutine(Bootstrap());
        }

        private IEnumerator Bootstrap()
        {
            if (isBusy)
            {
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SetStatus("Carregando ambiente...");

            var environment = AppEnvironmentLoader.Load(environmentAsset);
            apiClient.SetBaseUrls(environment.apiBaseUrl, environment.fallbackApiBaseUrl);

            var loginRequest = new DevLoginRequest
            {
                email = string.IsNullOrWhiteSpace(environment.devLoginEmail) ? "parent@leggau.local" : environment.devLoginEmail,
                name = string.IsNullOrWhiteSpace(environment.devLoginName) ? "Responsavel Demo" : environment.devLoginName,
            };

            var requestFailed = false;

            yield return apiClient.PostJson(
                "auth/dev-login",
                JsonUtility.ToJson(loginRequest),
                response =>
                {
                    var login = JsonUtility.FromJson<DevLoginResponse>(response);
                    sessionState.SetLogin(login);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha no login dev: {error}");
                }
            );

            if (requestFailed || sessionState.Parent == null)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus($"Carregando familia via {apiClient.ActiveBaseUrl}...");

            yield return apiClient.GetJson(
                $"families/overview?email={sessionState.Parent.email}",
                response =>
                {
                    var family = JsonUtility.FromJson<FamilyOverviewResponse>(response);
                    sessionState.SetFamily(family);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar familia: {error}");
                }
            );

            if (requestFailed || sessionState.ActiveChild == null)
            {
                isBusy = false;
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
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar atividades: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando catalogo 3D...");

            yield return apiClient.GetJson(
                "assets-catalog",
                response =>
                {
                    var catalog = JsonUtility.FromJson<AssetsCatalogResponse>(response);
                    sessionState.SetAssetsCatalog(catalog);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar catalogo: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            dashboardPresenter?.SetStatus("Carregando recompensas...");

            yield return apiClient.GetJson(
                $"rewards?childId={sessionState.ActiveChild.id}",
                response =>
                {
                    var rewards = JsonUtility.FromJson<RewardsResponse>(response);
                    sessionState.SetRewards(rewards.items, rewards.availablePoints);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar recompensas: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            yield return LoadProgressSummary();
            dashboardPresenter?.Render(sessionState);
            isBusy = false;
        }

        public void DevCheckinFirstActivity()
        {
            if (isBusy)
            {
                return;
            }

            StartCoroutine(DevCheckinFirstActivityRoutine());
        }

        private IEnumerator DevCheckinFirstActivityRoutine()
        {
            if (sessionState.ActiveChild == null || sessionState.Activities == null || sessionState.Activities.Length == 0)
            {
                dashboardPresenter?.SetError("Nenhuma atividade pronta para check-in.");
                yield break;
            }

            isBusy = true;
            dashboardPresenter?.SetStatus("Registrando check-in de desenvolvimento...");

            var request = new CreateCheckinRequest
            {
                childId = sessionState.ActiveChild.id,
                activityId = sessionState.Activities[0].id,
                notes = "Check-in automatico do dashboard bootstrap",
            };

            var requestFailed = false;

            yield return apiClient.PostJson(
                "progress/checkins",
                JsonUtility.ToJson(request),
                response =>
                {
                    var result = JsonUtility.FromJson<CreateCheckinResponse>(response);
                    sessionState.ApplyCheckin(result);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao registrar check-in: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            yield return apiClient.GetJson(
                $"rewards?childId={sessionState.ActiveChild.id}",
                response =>
                {
                    var rewards = JsonUtility.FromJson<RewardsResponse>(response);
                    sessionState.SetRewards(rewards.items, rewards.availablePoints);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao atualizar recompensas: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
                yield break;
            }

            yield return LoadProgressSummary();
            dashboardPresenter?.Render(sessionState);
            dashboardPresenter?.SetStatus($"Check-in concluido via {apiClient.ActiveBaseUrl}.");
            isBusy = false;
        }

        private IEnumerator LoadProgressSummary()
        {
            var requestFailed = false;
            dashboardPresenter?.SetStatus("Carregando progresso diario...");

            yield return apiClient.GetJson(
                $"progress/summary?childId={sessionState.ActiveChild.id}",
                response =>
                {
                    var summary = JsonUtility.FromJson<ProgressSummaryResponse>(response);
                    sessionState.SetProgressSummary(summary);
                },
                error =>
                {
                    requestFailed = true;
                    dashboardPresenter?.SetError($"Falha ao carregar progresso: {error}");
                }
            );

            if (requestFailed)
            {
                isBusy = false;
            }
        }
    }
}
