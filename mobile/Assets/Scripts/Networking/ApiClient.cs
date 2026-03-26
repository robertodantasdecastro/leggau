using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

namespace Leggau.Networking
{
    public class ApiClient : MonoBehaviour
    {
        [SerializeField] private string apiBaseUrl = "http://localhost:8080/api";
        [SerializeField] private string fallbackApiBaseUrl = "";
        [SerializeField] private int requestTimeoutSeconds = 5;
        [SerializeField] private string bearerToken = "";

        public string ActiveBaseUrl => apiBaseUrl;

        public void SetBaseUrl(string baseUrl)
        {
            apiBaseUrl = baseUrl.TrimEnd('/');
        }

        public void SetBaseUrls(string primaryBaseUrl, string secondaryBaseUrl)
        {
            apiBaseUrl = Sanitize(primaryBaseUrl);
            fallbackApiBaseUrl = Sanitize(secondaryBaseUrl);
        }

        public void SetAccessToken(string token)
        {
            bearerToken = token?.Trim() ?? string.Empty;
        }

        public void ClearAccessToken()
        {
            bearerToken = string.Empty;
        }

        public IEnumerator GetJson(string path, System.Action<string> onSuccess, System.Action<string> onError)
        {
            yield return SendWithFallback(
                path,
                null,
                UnityWebRequest.kHttpVerbGET,
                onSuccess,
                onError);
        }

        public IEnumerator PostJson(string path, string jsonPayload, System.Action<string> onSuccess, System.Action<string> onError)
        {
            yield return SendWithFallback(
                path,
                jsonPayload,
                UnityWebRequest.kHttpVerbPOST,
                onSuccess,
                onError);
        }

        private IEnumerator SendWithFallback(
            string path,
            string jsonPayload,
            string method,
            System.Action<string> onSuccess,
            System.Action<string> onError)
        {
            string lastError = null;

            foreach (var baseUrl in EnumerateBaseUrls())
            {
                using var request = BuildRequest(baseUrl, path, jsonPayload, method);
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.Success)
                {
                    apiBaseUrl = baseUrl;
                    onSuccess?.Invoke(request.downloadHandler.text);
                    yield break;
                }

                var body = request.downloadHandler?.text;
                if (request.responseCode > 0)
                {
                    lastError = string.IsNullOrWhiteSpace(body)
                        ? $"[{baseUrl}] HTTP {request.responseCode}: {request.error}"
                        : $"[{baseUrl}] HTTP {request.responseCode}: {body}";
                    continue;
                }

                lastError = string.IsNullOrWhiteSpace(body)
                    ? $"[{baseUrl}] {request.error}"
                    : $"[{baseUrl}] {request.error}: {body}";
            }

            onError?.Invoke(lastError ?? "Falha de conexao com a API.");
        }

        private UnityWebRequest BuildRequest(string baseUrl, string path, string jsonPayload, string method)
        {
            if (method == UnityWebRequest.kHttpVerbGET)
            {
                var getRequest = UnityWebRequest.Get($"{baseUrl}/{path.TrimStart('/')}");
                getRequest.timeout = requestTimeoutSeconds;
                ApplyHeaders(getRequest);
                return getRequest;
            }

            var request = new UnityWebRequest($"{baseUrl}/{path.TrimStart('/')}", method)
            {
                downloadHandler = new DownloadHandlerBuffer(),
                timeout = requestTimeoutSeconds,
            };
            var payloadBytes = System.Text.Encoding.UTF8.GetBytes(jsonPayload ?? "{}");
            request.uploadHandler = new UploadHandlerRaw(payloadBytes);
            request.SetRequestHeader("Content-Type", "application/json");
            ApplyHeaders(request);
            return request;
        }

        private IEnumerable<string> EnumerateBaseUrls()
        {
            if (!string.IsNullOrWhiteSpace(apiBaseUrl))
            {
                yield return apiBaseUrl;
            }

            if (!string.IsNullOrWhiteSpace(fallbackApiBaseUrl) && fallbackApiBaseUrl != apiBaseUrl)
            {
                yield return fallbackApiBaseUrl;
            }
        }

        private static string Sanitize(string baseUrl)
        {
            return string.IsNullOrWhiteSpace(baseUrl) ? string.Empty : baseUrl.TrimEnd('/');
        }

        private void ApplyHeaders(UnityWebRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(bearerToken))
            {
                return;
            }

            request.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
        }
    }
}
