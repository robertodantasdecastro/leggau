using TMPro;
using UnityEngine;

namespace Leggau.UI
{
    public class RewardHudPresenter : MonoBehaviour
    {
        [SerializeField] private TMP_Text pointsLabel;

        public void SetPoints(int points)
        {
            if (pointsLabel != null)
            {
                pointsLabel.text = $"Pontos: {points}";
            }
        }
    }
}
