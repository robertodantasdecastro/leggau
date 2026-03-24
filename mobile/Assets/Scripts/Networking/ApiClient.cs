using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace Leggau.Networking
{
    public class ApiClient : MonoBehaviour
    {
        [SerializeField] private string apiBaseUrl = "http://localhost:8080/api";

        public void SetBaseUrl(string baseUrl)
        {
            apiBaseUrl = baseUrl.TrimEnd('/');
        }

        public IEnumerator GetJson(string path, System.Action<string> onSuccess, System.Action<string> onError)
        {
            using var request = UnityWebRequest.Get($"{apiBaseUrl}/{path.TrimStart('/')}");
            request.downloadHandler = new DownloadHandlerBuffer();
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                onSuccess?.Invoke(request.downloadHandler.text);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }

        public IEnumerator PostJson(string path, string jsonPayload, System.Action<string> onSuccess, System.Action<string> onError)
        {
            using var request = new UnityWebRequest($"{apiBaseUrl}/{path.TrimStart('/')}", UnityWebRequest.kHttpVerbPOST);
            var payloadBytes = System.Text.Encoding.UTF8.GetBytes(jsonPayload);
            request.uploadHandler = new UploadHandlerRaw(payloadBytes);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                onSuccess?.Invoke(request.downloadHandler.text);
            }
            else
            {
                onError?.Invoke(request.error);
            }
        }
    }
}
