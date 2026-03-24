using UnityEngine;

namespace Leggau.UI
{
    public class RewardHudPresenter : MonoBehaviour
    {
        [SerializeField] private TextValueView pointsLabel;

        public void BindPointsLabel(TextValueView value)
        {
            pointsLabel = value;
        }

        public void SetPoints(int points)
        {
            if (pointsLabel != null)
            {
                pointsLabel.SetText($"Pontos: {points}");
            }
        }
    }
}
